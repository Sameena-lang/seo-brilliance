import prisma from '../config/db';
import { crawlQueue } from '../queues';
import { getProjectById } from './project.service';

export const createScan = async (projectId: string, organizationId: string) => {
  // Ensure project exists and belongs to the user's org
  const project = await getProjectById(projectId, organizationId);

  // Check if a scan is already running for this project
  const runningScan = await prisma.scan.findFirst({
    where: {
      projectId,
      status: { in: ['PENDING', 'RUNNING'] }
    }
  });

  if (runningScan) {
    throw new Error('A scan is already running for this project');
  }

  const scan = await prisma.scan.create({
    data: {
      projectId,
      status: 'PENDING',
      pagesDiscovered: 1,
    },
  });

  // Add to BullMQ crawl queue
  await crawlQueue.add('startCrawl', { scanId: scan.id, projectId: project.id, url: project.rootUrl, settings: project.crawlSettings });

  return scan;
};

export const getScan = async (scanId: string, organizationId: string) => {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      project: true,
      siteScore: true,
      aiSummary: true,
    }
  });

  if (!scan || scan.project.organizationId !== organizationId) {
    throw new Error('Scan not found');
  }

  // Calculate page inventory stats
  const pages = await prisma.page.findMany({
    where: { scanId },
    select: { statusCode: true, isIndexable: true, issues: { select: { id: true } } }
  });

  const pageInventory = {
    total: pages.length,
    indexable: pages.filter(p => p.isIndexable).length,
    nonIndexable: pages.filter(p => !p.isIndexable).length,
    status200: pages.filter(p => p.statusCode && p.statusCode >= 200 && p.statusCode < 300).length,
    status3xx: pages.filter(p => p.statusCode && p.statusCode >= 300 && p.statusCode < 400).length,
    status4xx: pages.filter(p => p.statusCode && p.statusCode >= 400 && p.statusCode < 500).length,
    status5xx: pages.filter(p => p.statusCode && p.statusCode >= 500).length,
    withIssues: pages.filter(p => p.issues.length > 0).length,
    withoutIssues: pages.filter(p => p.issues.length === 0).length,
  };

  // Get top priority issues
  const rawIssues = await prisma.issue.findMany({
    where: { page: { scanId } },
    include: { page: { select: { url: true } } },
    orderBy: { severity: 'asc' } // CRITICAL, then WARNING, then INFO (based on enum order in Prisma? Actually CRITICAL is first in enum, but let's sort in JS to be safe)
  });

  const { rules } = require('../seo/rules');
  const ruleMap = new Map();
  for (const r of rules) ruleMap.set(r.code, r);

  const groupedIssues = new Map();
  for (const issue of rawIssues) {
    if (!groupedIssues.has(issue.ruleCode)) {
      groupedIssues.set(issue.ruleCode, {
        ruleCode: issue.ruleCode,
        title: issue.title,
        severity: issue.severity,
        affectedPages: 0,
        sampleUrl: issue.page.url,
        whyItMatters: ruleMap.get(issue.ruleCode)?.whyItMatters || '',
        howToFix: ruleMap.get(issue.ruleCode)?.howToFix || '',
        example: ruleMap.get(issue.ruleCode)?.example || ''
      });
    }
    groupedIssues.get(issue.ruleCode).affectedPages++;
  }

  const topIssues = Array.from(groupedIssues.values()).map(issue => {
    let priority = 'LOW';
    if (issue.severity === 'CRITICAL') priority = 'HIGH';
    if (issue.severity === 'CRITICAL' && issue.affectedPages > 5) priority = 'CRITICAL';
    if (issue.severity === 'WARNING' && issue.affectedPages > 10) priority = 'HIGH';
    if (issue.severity === 'WARNING' && issue.affectedPages <= 10) priority = 'MEDIUM';
    
    return { ...issue, priority };
  }).sort((a, b) => {
    const pScores = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return pScores[b.priority as keyof typeof pScores] - pScores[a.priority as keyof typeof pScores];
  });

  const canonicalResult = {
    ...scan,
    scanId: scan.id,
    projectId: scan.projectId,
    website: scan.project.domain,
    pagesCrawled: scan.pagesCrawled,
    pagesFailed: scan.pagesFailed,
    overallScore: scan.siteScore?.overallScore || 0,
    categoryScores: {
      technical: scan.siteScore?.technicalScore || 0,
      content: scan.siteScore?.contentScore || 0,
      indexability: scan.siteScore?.indexabilityScore || 0,
      performance: scan.siteScore?.performanceScore || 0,
      accessibility: scan.siteScore?.accessibilityScore || 0,
      structuredData: scan.siteScore?.structuredDataScore || 0
    },
    issueCounts: {
      critical: scan.siteScore?.criticalCount || 0,
      warning: scan.siteScore?.warningCount || 0,
      info: scan.siteScore?.infoCount || 0
    },
    issues: rawIssues,
    topPriorityIssues: topIssues,
    recommendations: topIssues.map(i => ({ ruleCode: i.ruleCode, howToFix: i.howToFix })),
    aiSummary: scan.aiSummary,
    pageInventory,
    topIssues // Kept for backwards compatibility
  };

  return canonicalResult;
};

export const cancelScan = async (scanId: string, organizationId: string) => {
  const scan = await getScan(scanId, organizationId);

  if (scan.status === 'COMPLETED' || scan.status === 'FAILED' || scan.status === 'CANCELLED') {
    throw new Error('Cannot cancel a scan that has already finished');
  }

  return prisma.scan.update({
    where: { id: scanId },
    data: { status: 'CANCELLED', finishedAt: new Date() }
  });
};

export const getScanLogs = async (scanId: string, organizationId: string) => {
  await getScan(scanId, organizationId); // Validates existence and ownership

  return prisma.crawlLog.findMany({
    where: { scanId },
    orderBy: { createdAt: 'desc' },
    take: 100, // Just return latest 100 for live view
  });
};
