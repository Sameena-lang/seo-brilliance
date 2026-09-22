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

  // Start the in-process crawl pipeline.
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

  // Calculate page inventory stats via aggregations
  const [
    total, indexable, nonIndexable,
    status200, status3xx, status4xx, status5xx,
    withIssues, withoutIssues
  ] = await Promise.all([
    prisma.page.count({ where: { scanId } }),
    prisma.page.count({ where: { scanId, isIndexable: true } }),
    prisma.page.count({ where: { scanId, isIndexable: false } }),
    prisma.page.count({ where: { scanId, statusCode: { gte: 200, lt: 300 } } }),
    prisma.page.count({ where: { scanId, statusCode: { gte: 300, lt: 400 } } }),
    prisma.page.count({ where: { scanId, statusCode: { gte: 400, lt: 500 } } }),
    prisma.page.count({ where: { scanId, statusCode: { gte: 500 } } }),
    prisma.page.count({ where: { scanId, issues: { some: {} } } }),
    prisma.page.count({ where: { scanId, issues: { none: {} } } }),
  ]);

  const pageInventory = {
    total,
    indexable,
    nonIndexable,
    status200,
    status3xx,
    status4xx,
    status5xx,
    withIssues,
    withoutIssues,
  };

  // Get grouped issues using Prisma groupBy
  const groupedRaw = await prisma.issue.groupBy({
    by: ['ruleCode', 'severity', 'title'],
    where: { page: { scanId } },
    _count: { id: true },
    _max: { url: true }
  });

  const { rules } = require('../seo/rules');
  const ruleMap = new Map();
  for (const r of rules) ruleMap.set(r.code, r);

  const topIssues = groupedRaw.map(issue => {
    let priority = 'LOW';
    const affectedPages = issue._count.id;
    if (issue.severity === 'CRITICAL') priority = 'HIGH';
    if (issue.severity === 'CRITICAL' && affectedPages > 5) priority = 'CRITICAL';
    if (issue.severity === 'WARNING' && affectedPages > 10) priority = 'HIGH';
    if (issue.severity === 'WARNING' && affectedPages <= 10) priority = 'MEDIUM';
    
    return {
      ruleCode: issue.ruleCode,
      title: issue.title,
      severity: issue.severity,
      affectedPages,
      sampleUrl: issue._max.url || '',
      whyItMatters: ruleMap.get(issue.ruleCode)?.whyItMatters || '',
      howToFix: ruleMap.get(issue.ruleCode)?.howToFix || '',
      example: ruleMap.get(issue.ruleCode)?.example || '',
      priority
    };
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
    issues: [], // Not returned in bulk to improve performance
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
