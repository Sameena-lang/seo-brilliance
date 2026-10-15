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
  timeout: 30000, // Increased timeout to 30s to handle slow sites without exhausting queue
  headers: { 'User-Agent': 'SEO-Intelligence-Bot/1.0' },
  maxRedirects: 0,
  maxContentLength: 5 * 1024 * 1024,
  validateStatus: () => true
});

// In-memory tracking for deduplication:
// - queuedUrls: prevents queueing duplicate jobs
// - crawledUrls: prevents crawling the same page multiple times
interface ScanTracking {
  queuedUrls: Set<string>;
  crawledUrls: Set<string>;
}
const scanTracking = new Map<string, ScanTracking>();

export const getScanTracking = (scanId: string): ScanTracking => {
  let tracking = scanTracking.get(scanId);
  if (!tracking) {
    tracking = {
      queuedUrls: new Set<string>(),
      crawledUrls: new Set<string>(),
    };
    scanTracking.set(scanId, tracking);
  }
  return tracking;
};

export const clearScanTracking = (scanId: string) => {
  scanTracking.delete(scanId);
};

// Safely decrement pagesDiscovered without dropping below pagesCrawled + pagesFailed or negative
const safeDecrementDiscovered = async (scanId: string) => {
  try {
    const s = await prisma.scan.findUnique({
      where: { id: scanId },
      select: { pagesDiscovered: true, pagesCrawled: true, pagesFailed: true }
    });
    if (s && s.pagesDiscovered > (s.pagesCrawled + s.pagesFailed) && s.pagesDiscovered > 0) {
      await prisma.scan.update({
        where: { id: scanId },
        data: { pagesDiscovered: { decrement: 1 } }
      });
    }
  } catch (err) {
    // Ignore concurrency conflicts
  }
};

export const crawlerWorker = new Worker('crawlQueue', async (job: Job) => {
  console.log(`[Worker] Started job ${job.id} for scan ${job.data.scanId}`);
  const { scanId, projectId, url, settings, currentDepth = 0 } = job.data;
  
  const scan = await prisma.scan.findUnique({ 
    where: { id: scanId },
    include: {
      project: {
        include: { organization: true }
      },
      competitor: true
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

  const tracking = getScanTracking(scanId);
  const normUrl = normalizeUrl(url, url);

  console.log(`[Worker] Scan ${scanId} found. Depth: ${currentDepth}`);
  if (currentDepth === 0) {
    if (normUrl) tracking.queuedUrls.add(normUrl);
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'RUNNING', startedAt: new Date() }
    });
    console.log(`[Worker] Updated scan ${scanId} to RUNNING`);
    
    try {
      const rootUrlObj = new URL(url);
      const rootOrigin = rootUrlObj.origin;
      const robotsUrl = normalizeUrl(`${rootOrigin}/robots.txt`, url) || `${rootOrigin}/robots.txt`;
      const sitemapUrl = normalizeUrl(`${rootOrigin}/sitemap.xml`, url) || `${rootOrigin}/sitemap.xml`;
      
      let initDiscovered = 0;
      const q = await import('../queues');
      if (!tracking.queuedUrls.has(robotsUrl)) {
        tracking.queuedUrls.add(robotsUrl);
        initDiscovered++;
        q.crawlQueue.add('startCrawl', { scanId, projectId, url: robotsUrl, settings, currentDepth: 1 });
      }
      if (!tracking.queuedUrls.has(sitemapUrl)) {
        tracking.queuedUrls.add(sitemapUrl);
        initDiscovered++;
        q.crawlQueue.add('startCrawl', { scanId, projectId, url: sitemapUrl, settings, currentDepth: 1 });
      }
      if (initDiscovered > 0) {
        await prisma.scan.update({
          where: { id: scanId },
          data: { pagesDiscovered: { increment: initDiscovered } }
        });
      }
    } catch (e) {
      console.error('Failed to queue robots/sitemap', e);
    }
  }

  // Ensure URL is safe
  if (!(await isSafeUrl(url))) {
    await prisma.crawlLog.create({
      data: { scanId, url, message: 'Unsafe URL detected and skipped', level: 'WARNING' }
    });
    await safeDecrementDiscovered(scanId);
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }

  if (!normUrl) {
    await safeDecrementDiscovered(scanId);
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }

  const isPro = scan.project?.organization?.tier === 'PRO';
  const defaultMaxDepth = isPro ? 6 : 3;
  const maxDepth = settings?.maxDepth || defaultMaxDepth;

  // Check max depth
  if (currentDepth > maxDepth) {
    await safeDecrementDiscovered(scanId);
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }

  // In-memory deduplication: prevent crawling if already crawled in this scan
  if (tracking.crawledUrls.has(normUrl)) {
    await safeDecrementDiscovered(scanId);
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }
  tracking.crawledUrls.add(normUrl);

  // Still check DB in case of process restart or multi-worker concurrency
  const pageExists = await prisma.page.findFirst({
    where: { scanId, normalizedUrl: normUrl }
  });

  if (pageExists) {
    await safeDecrementDiscovered(scanId);
    await seoQueue.add('analyzeSeo', { scanId });
    return;
  }

  const defaultMaxPages = isPro ? 500 : 100;
  const maxPages = settings?.maxPages || defaultMaxPages;
  const reservedCount = await prisma.page.count({ where: { scanId } });

  if (reservedCount >= maxPages) {
    await safeDecrementDiscovered(scanId);
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
         const normTarget = normalizeUrl(targetUrl, normUrl) || targetUrl;
         let redirectDiscovered = 0;
         if (!tracking.queuedUrls.has(normTarget) && !tracking.crawledUrls.has(normTarget)) {
           tracking.queuedUrls.add(normTarget);
           redirectDiscovered = 1;
           const q = await import('../queues');
           q.crawlQueue.add('startCrawl', { 
             scanId, projectId, url: normTarget, settings, currentDepth: currentDepth + 1 
           });
         }
         await prisma.scan.update({
           where: { id: scanId },
           data: {
             pagesCrawled: { increment: 1 },
             ...(redirectDiscovered > 0 ? { pagesDiscovered: { increment: 1 } } : {})
           }
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
    const rootUrlStr = scan.scanType === 'COMPETITOR' && scan.competitor 
      ? `https://${scan.competitor.domain}` 
      : (scan.project?.rootUrl || normUrl);
    const includeSubdomains = settings?.includeSubdomains === true;
    
    let newlyDiscovered = 0;
    const q = await import('../queues');

    for (const link of extracted.internalLinks) {
       if (!isAllowedDomain(link, rootUrlStr, includeSubdomains)) {
         continue;
       }
       
       if (currentDepth + 1 > maxDepth) {
         continue;
       }
       
       const normLink = normalizeUrl(link, url);
       if (normLink && !tracking.queuedUrls.has(normLink) && !tracking.crawledUrls.has(normLink)) {
         tracking.queuedUrls.add(normLink); // Mark as queued
         newlyDiscovered++;
         q.crawlQueue.add('startCrawl', { 
           scanId, projectId, url: normLink, settings, currentDepth: currentDepth + 1 
         });
       }
    }

    // Update stats with newly discovered links
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        pagesCrawled: { increment: 1 },
        ...(newlyDiscovered > 0 ? { pagesDiscovered: { increment: newlyDiscovered } } : {})
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

// Helper to determine if a domain is allowed (already exists in crawler/utils but needs rootUrl check)

crawlerWorker.on('failed', (job, err) => {
  console.error(`Crawl job ${job?.id} failed:`, err);
});
crawlerWorker.on('completed', (job) => {
  console.log(`Crawl job ${job?.id} completed successfully`);
});
