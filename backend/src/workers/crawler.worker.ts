import { Worker, Job } from '../queues';
import axios from 'axios';
import prisma from '../config/db';
import { seoQueue } from '../queues';
import { normalizeUrl, isAllowedDomain, isSafeUrl } from '../crawler/utils';
import { extractPageData } from '../crawler/parser';
import http from 'http';
import https from 'https';

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const axiosClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 10000,
  headers: { 'User-Agent': 'SEO-Intelligence-Bot/1.0' },
  maxRedirects: 0,
  maxContentLength: 5 * 1024 * 1024,
  validateStatus: () => true
});

// In-memory cache for deduplication to prevent DB roundtrips for pageExists
const visitedCache = new Map<string, Set<string>>();

export const crawlerWorker = new Worker('crawlQueue', async (job: Job) => {
  console.log(`[Worker] Started job ${job.id} for scan ${job.data.scanId}`);
  const { scanId, projectId, url, settings, currentDepth = 0 } = job.data;
  
  const scan = await prisma.scan.findUnique({ 
    where: { id: scanId },
    include: {
      project: {
        include: { organization: true }
      }
    }
  });
  if (!scan) {
    console.log(`[Worker] Scan ${scanId} not found!`);
    return;
  }
  if (scan.status === 'CANCELLED' || scan.status === 'FAILED') {
    console.log(`[Worker] Scan ${scanId} aborted (status: ${scan.status})`);
    return; // Stop if scan is aborted
  }

  console.log(`[Worker] Scan ${scanId} found. Depth: ${currentDepth}`);
  if (currentDepth === 0) {
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'RUNNING', startedAt: new Date(), pagesDiscovered: { increment: 2 } }
    });
    console.log(`[Worker] Updated scan ${scanId} to RUNNING`);
    
    try {
      const rootUrlObj = new URL(url);
      const rootOrigin = rootUrlObj.origin;
      import('../queues').then(q => {
        q.crawlQueue.add('startCrawl', { scanId, projectId, url: `${rootOrigin}/robots.txt`, settings, currentDepth: 1 });
        q.crawlQueue.add('startCrawl', { scanId, projectId, url: `${rootOrigin}/sitemap.xml`, settings, currentDepth: 1 });
      });
    } catch (e) {
      console.error('Failed to queue robots/sitemap', e);
    }
  }

  // Ensure URL is safe
  if (!(await isSafeUrl(url))) {
    await prisma.crawlLog.create({
      data: { scanId, url, message: 'Unsafe URL detected and skipped', level: 'WARNING' }
    });
    // It's unsafe, so it won't be crawled. Correct the pagesDiscovered count.
    await prisma.scan.update({
      where: { id: scanId },
      data: { pagesDiscovered: { decrement: 1 } }
    });
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }

  const normUrl = normalizeUrl(url, url);
  if (!normUrl) {
    await prisma.scan.update({ where: { id: scanId }, data: { pagesDiscovered: { decrement: 1 } } });
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }

  const isPro = scan.project?.organization?.tier === 'PRO';
  const defaultMaxDepth = isPro ? 6 : 3;
  const maxDepth = settings?.maxDepth || defaultMaxDepth;

  // Check max depth
  if (currentDepth > maxDepth) {
    await prisma.scan.update({ where: { id: scanId }, data: { pagesDiscovered: { decrement: 1 } } });
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }

  // In-memory deduplication first
  let scanCache = visitedCache.get(scanId);
  if (!scanCache) {
    scanCache = new Set<string>();
    visitedCache.set(scanId, scanCache);
  }
  
  if (scanCache.has(normUrl)) {
    // Already crawled or queued
    await prisma.scan.update({ where: { id: scanId }, data: { pagesDiscovered: { decrement: 1 } } });
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }
  scanCache.add(normUrl);

  // Still check DB in case of process restart, but cache handles 99% of dupes
  const pageExists = await prisma.page.findFirst({
    where: { scanId, normalizedUrl: normUrl }
  });

  if (pageExists) {
    await prisma.scan.update({ where: { id: scanId }, data: { pagesDiscovered: { decrement: 1 } } });
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }

  const defaultMaxPages = isPro ? 500 : 100;
  const maxPages = settings?.maxPages || defaultMaxPages;
  const reservedCount = await prisma.page.count({ where: { scanId } });

  if (reservedCount > maxPages) {
    await prisma.scan.update({ where: { id: scanId }, data: { pagesDiscovered: { decrement: 1 } } });
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }

  try {
    const startTime = Date.now();
    const response = await axiosClient.get(normUrl);
    const loadTimeMs = Date.now() - startTime;

    if (response.status >= 300 && response.status < 400) {
       const location = response.headers.location;
       const page = await prisma.page.create({
         data: {
           scanId,
           url,
           normalizedUrl: normUrl,
           statusCode: response.status,
           isIndexable: false, // Redirects aren't directly indexable
         }
       });
       
       await seoQueue.add('analyzeSeo', { scanId, pageId: page.id });

       if (location) {
         // Queue the redirect target
         const targetUrl = new URL(location, normUrl).href;
         await prisma.scan.update({
           where: { id: scanId },
           data: {
             pagesCrawled: { increment: 1 },
             pagesDiscovered: { increment: 1 },
           }
         });
         import('../queues').then(q => {
           q.crawlQueue.add('startCrawl', { 
             scanId, projectId, url: targetUrl, settings, currentDepth: currentDepth + 1 
           });
         });
       } else {
         await prisma.scan.update({
           where: { id: scanId },
           data: { pagesCrawled: { increment: 1 } }
         });
       }
       return;
    }

    const contentType = String(response.headers['content-type'] || '');
    if (!contentType.includes('text/html')) {
      // Store non-HTML pages as well but don't parse
      const page = await prisma.page.create({
        data: {
           scanId,
           url,
           normalizedUrl: normUrl,
           statusCode: response.status,
           contentType,
           loadTimeMs,
        }
      });
      await seoQueue.add('analyzeSeo', { scanId, pageId: page.id });
      await prisma.scan.update({
        where: { id: scanId },
        data: { pagesCrawled: { increment: 1 } }
      });
      return;
    }

    const html = response.data;
    const extracted = extractPageData(html, normUrl);

    const isIndexable = !(extracted.robotsDirectives && (
      extracted.robotsDirectives.toLowerCase().includes('noindex')
    ));

    const page = await prisma.page.create({
      data: {
        scanId,
        url,
        normalizedUrl: normUrl,
        statusCode: response.status,
        contentType,
        title: extracted.title,
        metaDescription: extracted.metaDescription,
        canonicalUrl: extracted.canonicalUrl,
        robotsDirectives: extracted.robotsDirectives,
        h1: extracted.h1,
        h1Count: extracted.h1Count,
        headingsCount: extracted.headingsCount,
        imagesTotal: extracted.imagesTotal,
        imagesMissingAlt: extracted.imagesMissingAlt,
        internalLinksCount: extracted.internalLinks.length,
        externalLinksCount: extracted.externalLinks.length,
        brokenLinksCount: 0, // Would need separate check
        loadTimeMs,
        schemaTypes: extracted.schemaTypes,
        schemaErrors: extracted.schemaErrors,
        isIndexable,
      }
    });

    // Queue for SEO analysis
    await seoQueue.add('analyzeSeo', { scanId, pageId: page.id });

    // Queue internal links
    const rootUrlStr = scan.project?.rootUrl || normUrl;
    const includeSubdomains = settings?.includeSubdomains === true;
    
    let newlyDiscovered = 0;
    const q = await import('../queues');

    for (const link of extracted.internalLinks) {
       if (!isAllowedDomain(link, rootUrlStr, includeSubdomains)) {
         continue;
       }
       
       const normLink = normalizeUrl(link, url);
       if (normLink && !scanCache.has(normLink)) {
         scanCache.add(normLink); // Mark as queued
         newlyDiscovered++;
         q.crawlQueue.add('startCrawl', { 
           scanId, projectId, url: link, settings, currentDepth: currentDepth + 1 
         });
       }
    }

    // Update stats with ONLY newly discovered links to avoid +/- thrashing
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        pagesCrawled: { increment: 1 },
        pagesDiscovered: { increment: newlyDiscovered - extracted.internalLinks.length }, 
      }
    });

  } catch (error: any) {
    const status = error.response?.status || 0;
    const page = await prisma.page.create({
      data: {
        scanId,
        url,
        normalizedUrl: normUrl,
        statusCode: status,
        isIndexable: false,
      }
    });

    await prisma.scan.update({
      where: { id: scanId },
      data: { pagesFailed: { increment: 1 } }
    });

    await prisma.crawlLog.create({
      data: { scanId, url, message: `Failed to crawl: ${error.message}`, level: 'ERROR' }
    });

    await seoQueue.add('analyzeSeo', { scanId, pageId: page.id });
  }
});

crawlerWorker.on('failed', (job, err) => {
  console.error(`Crawl job ${job?.id} failed:`, err);
});
crawlerWorker.on('completed', (job) => {
  console.log(`Crawl job ${job?.id} completed successfully`);
});
