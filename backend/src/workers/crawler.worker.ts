import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import prisma from '../config/db';
import { seoQueue } from '../queues';
import { normalizeUrl, isAllowedDomain, isSafeUrl } from '../crawler/utils';
import { extractPageData } from '../crawler/parser';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const crawlerWorker = new Worker('crawlQueue', async (job: Job) => {
  const { scanId, projectId, url, settings, currentDepth = 0 } = job.data;
  
  const scan = await prisma.scan.findUnique({ where: { id: scanId } });
  if (!scan || scan.status === 'CANCELLED' || scan.status === 'FAILED') {
    return; // Stop if scan is aborted
  }

  if (currentDepth === 0) {
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'RUNNING', startedAt: new Date() }
    });
  }

  // Ensure URL is safe
  if (!isSafeUrl(url)) {
    await prisma.crawlLog.create({
      data: { scanId, url, message: 'Unsafe URL detected and skipped', level: 'WARNING' }
    });
    // It's unsafe, so it won't be crawled. Correct the pagesDiscovered count.
    await prisma.scan.update({
      where: { id: scanId },
      data: { pagesDiscovered: { decrement: 1 } }
    });
    return;
  }

  const normUrl = normalizeUrl(url, url);
  if (!normUrl) {
    await prisma.scan.update({ where: { id: scanId }, data: { pagesDiscovered: { decrement: 1 } } });
    return;
  }

  // Check max depth
  if (currentDepth > (settings?.maxDepth || 3)) {
    await prisma.scan.update({ where: { id: scanId }, data: { pagesDiscovered: { decrement: 1 } } });
    return;
  }

  // Check if we've already crawled or reached max pages limits
  const pageExists = await prisma.page.findFirst({
    where: { scanId, normalizedUrl: normUrl }
  });

  if (pageExists) {
    await prisma.scan.update({ where: { id: scanId }, data: { pagesDiscovered: { decrement: 1 } } });
    return;
  }

  // Use Redis atomic increment to guarantee strict limits under concurrency
  const maxPages = settings?.maxPages || 100;
  const reserveKey = `scan:${scanId}:reserved`;
  const reservedCount = await connection.incr(reserveKey);
  
  if (reservedCount === 1) {
    // Ensure the key expires to avoid memory leaks
    await connection.expire(reserveKey, 24 * 3600);
  }

  if (reservedCount > maxPages) {
    // Limit exceeded, give the slot back and abort
    await connection.decr(reserveKey);
    await prisma.scan.update({ where: { id: scanId }, data: { pagesDiscovered: { decrement: 1 } } });
    return;
  }

  try {
    const startTime = Date.now();
    const response = await axios.get(normUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'SEO-Intelligence-Bot/1.0' },
      maxRedirects: 0,
      maxContentLength: 5 * 1024 * 1024, // 5MB limit
      validateStatus: (status) => true
    });
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

    // Update stats
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        pagesCrawled: { increment: 1 },
        pagesDiscovered: { increment: extracted.internalLinks.length },
      }
    });

    // Queue for SEO analysis
    await seoQueue.add('analyzeSeo', { scanId, pageId: page.id });

    // Queue internal links
    for (const link of extracted.internalLinks) {
       // Fire and forget - add to crawl queue directly
       import('../queues').then(q => {
          q.crawlQueue.add('startCrawl', { 
            scanId, projectId, url: link, settings, currentDepth: currentDepth + 1 
          });
       });
    }

  } catch (error: any) {
    const status = error.response?.status || 0;
    await prisma.page.create({
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
  }
}, { connection, concurrency: 5 });

crawlerWorker.on('failed', (job, err) => {
  console.error(`Crawl job ${job?.id} failed:`, err);
});
