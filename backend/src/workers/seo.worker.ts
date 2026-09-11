import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../config/db';
import { evaluatePage } from '../seo/rules';
import { aiQueue } from '../queues';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const seoWorker = new Worker('seoQueue', async (job: Job) => {
  const { scanId, pageId } = job.data;

  let issues = [];
  if (pageId) {
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (page) {
      // Only evaluate SEO rules if we successfully fetched and parsed the HTML page
      if (page.statusCode && page.statusCode >= 200 && page.statusCode < 300 && page.contentType?.includes('text/html')) {
        issues = await evaluatePage(page);
        if (issues.length > 0) {
          await prisma.issue.createMany({
            data: issues.map(issue => ({
              pageId: page.id,
              ruleCode: issue.ruleCode,
              severity: issue.severity,
              title: issue.title,
              url: page.url,
              evidence: issue.evidence,
              recommendation: issue.recommendation
            }))
          });
          await prisma.scan.update({
            where: { id: scanId },
            data: { issuesFound: { increment: issues.length } }
          });
        }
      }
    }
  }

  // Check if all pages for this scan are processed
  const scan = await prisma.scan.findUnique({ 
    where: { id: scanId },
    include: { project: true }
  });
  
  if (scan) {
    const maxPages = (scan.project.crawlSettings as any)?.maxPages || 100;
    const isDone = scan.pagesDiscovered === 0 || (
      scan.pagesCrawled + scan.pagesFailed >= scan.pagesDiscovered ||
      scan.pagesCrawled + scan.pagesFailed >= maxPages
    );

    if (isDone) {
      if (scan.status !== 'COMPLETED') {
         await prisma.scan.update({
           where: { id: scanId },
           data: { status: 'COMPLETED', progressPercentage: 100, finishedAt: new Date() }
         });
       
         const pages = await prisma.page.findMany({ where: { scanId }, include: { issues: true } });
         let totalScore = 0;
         const catScores = { Technical: { total: 0, count: 0 }, Content: { total: 0, count: 0 }, Performance: { total: 0, count: 0 }, Indexability: { total: 0, count: 0 }, Accessibility: { total: 0, count: 0 }, StructuredData: { total: 0, count: 0 } };

         const { rules } = require('../seo/rules');
         const ruleCategoryMap = new Map();
         const ruleMap = new Map();
         for (const r of rules) {
           ruleCategoryMap.set(r.code, r.category);
           ruleMap.set(r.code, r);
         }

         for (const page of pages) {
           let pageCrit = 0;
           let pageWarn = 0;
           let pageInfo = 0;
           
           const pageCatScores = { Technical: 100, Content: 100, Performance: 100, Indexability: 100, Accessibility: 100, StructuredData: 100 };

           for (const issue of page.issues) {
             if (issue.severity === 'CRITICAL') pageCrit++;
             if (issue.severity === 'WARNING') pageWarn++;
             if (issue.severity === 'INFO') pageInfo++;
             
             const cat = ruleCategoryMap.get(issue.ruleCode) || 'Technical';
             const catKey = cat.replace(/\s+/g, '');
             if (pageCatScores[catKey as keyof typeof pageCatScores] !== undefined) {
               if (issue.severity === 'CRITICAL') pageCatScores[catKey as keyof typeof pageCatScores] -= 10;
               if (issue.severity === 'WARNING') pageCatScores[catKey as keyof typeof pageCatScores] -= 3;
               if (issue.severity === 'INFO') pageCatScores[catKey as keyof typeof pageCatScores] -= 1;
             }
             
             // Optionally assign deterministic priority if not already assigned
             // But we don't store priority on the Issue model in Prisma.
             // We will calculate priority on the fly in the API response or when returning data.
           }
           
           const pageScore = Math.max(0, 100 - (pageCrit * 10) - (pageWarn * 3) - (pageInfo * 1));
           totalScore += pageScore;
           
           for (const k of Object.keys(catScores)) {
             catScores[k as keyof typeof catScores].total += Math.max(0, pageCatScores[k as keyof typeof pageCatScores]);
             catScores[k as keyof typeof catScores].count++;
           }
         }

         const overallScore = pages.length > 0 ? Math.round(totalScore / pages.length) : 0;
         const technicalScore = catScores.Technical.count > 0 ? Math.round(catScores.Technical.total / catScores.Technical.count) : 0;
         const contentScore = catScores.Content.count > 0 ? Math.round(catScores.Content.total / catScores.Content.count) : 0;
         const indexabilityScore = catScores.Indexability.count > 0 ? Math.round(catScores.Indexability.total / catScores.Indexability.count) : 0;
         const performanceScore = catScores.Performance.count > 0 ? Math.round(catScores.Performance.total / catScores.Performance.count) : 0;
         const accessibilityScore = catScores.Accessibility.count > 0 ? Math.round(catScores.Accessibility.total / catScores.Accessibility.count) : 0;
         const structuredDataScore = catScores.StructuredData.count > 0 ? Math.round(catScores.StructuredData.total / catScores.StructuredData.count) : 0;

         const criticals = await prisma.issue.count({ where: { page: { scanId }, severity: 'CRITICAL' } });
         const warnings = await prisma.issue.count({ where: { page: { scanId }, severity: 'WARNING' } });
         const infos = await prisma.issue.count({ where: { page: { scanId }, severity: 'INFO' } });

         await prisma.siteScore.upsert({
           where: { scanId },
           update: { overallScore, technicalScore, contentScore, indexabilityScore, performanceScore, accessibilityScore, structuredDataScore, criticalCount: criticals, warningCount: warnings, infoCount: infos },
           create: { scanId, overallScore, technicalScore, contentScore, indexabilityScore, performanceScore, accessibilityScore, structuredDataScore, criticalCount: criticals, warningCount: warnings, infoCount: infos }
         });

         await aiQueue.add('generateSummary', { scanId });
      }
    } else {
      const total = Math.min(scan.pagesDiscovered || 1, maxPages);
      const done = scan.pagesCrawled + scan.pagesFailed;
      const progress = Math.min(Math.floor((done / total) * 100), 99);
      
      await prisma.scan.update({
        where: { id: scanId },
        data: { progressPercentage: progress }
      });
    }
  }

}, { connection, concurrency: 5 });

seoWorker.on('failed', (job, err) => {
  console.error(`SEO job ${job?.id} failed:`, err);
});
