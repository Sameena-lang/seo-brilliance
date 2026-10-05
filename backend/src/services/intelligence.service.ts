import prisma from '../config/db';
import { crawlQueue } from '../queues';

export const getHealth = async (projectId: string, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId }
  });

  if (!project) throw new Error('Project not found');

  const latestScan = await prisma.scan.findFirst({
    where: { projectId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    include: {
      siteScore: true,
    }
  });

  if (!latestScan) {
    return {
      status: 'no_data',
      message: 'No completed scans found for this project.'
    };
  }

  const issuesCount = await prisma.issue.groupBy({
    by: ['severity'],
    where: {
      page: { scanId: latestScan.id },
      status: 'OPEN'
    },
    _count: { id: true }
  });

  const severityDistribution = {
    CRITICAL: 0,
    WARNING: 0,
    INFO: 0
  };

  issuesCount.forEach(i => {
    severityDistribution[i.severity] = i._count.id;
  });

  // Calculate explanations (simple heuristics based on actual data)
  const technicalScore = latestScan.siteScore?.technicalScore || 0;
  const contentScore = latestScan.siteScore?.contentScore || 0;

  const technicalExplanation: { problems: string[], strengths: string[] } = {
    problems: [],
    strengths: []
  };

  if (severityDistribution.CRITICAL > 0) technicalExplanation.problems.push(`${severityDistribution.CRITICAL} critical issues found`);
  if (technicalScore > 80) technicalExplanation.strengths.push('Good overall technical health');

  return {
    scanId: latestScan.id,
    score: latestScan.siteScore,
    severityDistribution,
    explanations: {
      technical: technicalExplanation,
      content: { problems: [] as string[], strengths: [contentScore > 80 ? 'Good content quality' : ''] }
    }
  };
};

export const getHistory = async (projectId: string, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId }
  });

  if (!project) throw new Error('Project not found');

  const scans = await prisma.scan.findMany({
    where: { projectId, status: 'COMPLETED' },
    orderBy: { createdAt: 'asc' },
    include: {
      siteScore: true
    }
  });

  return scans.map(scan => ({
    id: scan.id,
    date: scan.createdAt,
    score: scan.siteScore?.overallScore || 0,
    issues: scan.issuesFound || 0,
    pages: scan.pagesCrawled || 0
  }));
};

export const getOpportunities = async (projectId: string, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId }
  });

  if (!project) throw new Error('Project not found');

  const latestScan = await prisma.scan.findFirst({
    where: { projectId, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
  });

  if (!latestScan) return [];

  // Group issues by ruleCode to find opportunities
  const groupedIssues = await prisma.issue.groupBy({
    by: ['ruleCode', 'title', 'severity'],
    where: {
      page: { scanId: latestScan.id },
      status: 'OPEN'
    },
    _count: { id: true }
  });

  return groupedIssues.map(issue => {
    // Priority logic
    let priorityScore = issue._count.id;
    if (issue.severity === 'CRITICAL') priorityScore += 100;
    else if (issue.severity === 'WARNING') priorityScore += 50;

    return {
      ruleCode: issue.ruleCode,
      title: issue.title,
      severity: issue.severity,
      affectedPages: issue._count.id,
      priorityScore,
      priority: issue.severity === 'CRITICAL' ? 'High' : issue.severity === 'WARNING' ? 'Medium' : 'Low'
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
};

export const getKeywords = async (projectId: string, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId }
  });

  if (!project) throw new Error('Project not found');

  return prisma.keyword.findMany({
    where: { projectId },
    orderBy: { searchVolume: 'desc' }
  });
};

export const addKeyword = async (projectId: string, term: string, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId }
  });

  if (!project) throw new Error('Project not found');

  return prisma.keyword.create({
    data: {
      projectId,
      term,
      // Default placeholder values until integration
      searchVolume: Math.floor(Math.random() * 5000) + 100,
      difficulty: Math.floor(Math.random() * 100),
      position: Math.floor(Math.random() * 50) + 1,
      change: Math.floor(Math.random() * 5) - 2
    }
  });
};

export const getCompetitors = async (projectId: string, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId }
  });

  if (!project) throw new Error('Project not found');

  return prisma.competitor.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' }
  });
};

export const addCompetitor = async (projectId: string, domain: string, organizationId: string) => {
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim();
  const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  
  if (!domainRegex.test(cleanDomain)) {
    throw new Error('Invalid domain format. Please enter a valid website domain (e.g. apple.com). Do not enter company names.');
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId }
  });

  if (!project) throw new Error('Project not found');

  const competitor = await prisma.competitor.create({
    data: {
      projectId,
      domain: cleanDomain,
      normalizedDomain: cleanDomain,
      status: 'ACTIVE'
    }
  });

  // Automatically start a scan
  try {
    await scanCompetitor(projectId, competitor.id, organizationId);
  } catch (error) {
    console.error('Failed to auto-start scan for competitor:', error);
  }

  return competitor;
};

export const scanCompetitor = async (projectId: string, competitorId: string, organizationId: string) => {
  const competitor = await prisma.competitor.findFirst({
    where: { id: competitorId, projectId, project: { organizationId } }
  });
  if (!competitor) throw new Error('Competitor not found');

  // Cancel running scans for this competitor
  await prisma.scan.updateMany({
    where: { competitorId, status: { in: ['PENDING', 'RUNNING'] } },
    data: { status: 'CANCELLED' }
  });

  const scan = await prisma.scan.create({
    data: {
      projectId,
      competitorId,
      scanType: 'COMPETITOR',
      status: 'PENDING'
    }
  });

  await prisma.competitor.update({
    where: { id: competitorId },
    data: { 
      status: 'SCANNING', 
      lastScanId: scan.id,
      lastScannedAt: new Date()
    }
  });

  await crawlQueue.add('startCrawl', {
    scanId: scan.id,
    projectId,
    url: `https://${competitor.domain}`,
    settings: {
      maxPages: 25,
      maxDepth: 2
    },
    currentDepth: 0
  });

  return scan;
};

export const getCompetitorComparison = async (projectId: string, organizationId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId }
  });
  if (!project) throw new Error('Project not found');

  const latestProjectScan = await prisma.scan.findFirst({
    where: { projectId, scanType: 'PROJECT', status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    include: { siteScore: true }
  });

  const competitors = await prisma.competitor.findMany({
    where: { projectId },
    include: {
      scans: {
        where: { scanType: 'COMPETITOR', status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { siteScore: true }
      }
    }
  });

  // Re-fetch project scan if scanType was missing previously (backwards compat)
  const projectScan = latestProjectScan || await prisma.scan.findFirst({
    where: { projectId, status: 'COMPLETED', competitorId: null },
    orderBy: { createdAt: 'desc' },
    include: { siteScore: true }
  });

  return {
    project: {
      domain: project.domain,
      score: projectScan?.siteScore?.overallScore || null,
      pages: projectScan?.pagesCrawled || 0,
      issues: projectScan?.issuesFound || 0,
      critical: projectScan?.siteScore?.criticalCount || 0,
      technical: projectScan?.siteScore?.technicalScore || null
    },
    competitors: competitors.map(c => {
      const scan = c.scans[0];
      return {
        id: c.id,
        domain: c.domain,
        score: scan?.siteScore?.overallScore || null,
        pages: scan?.pagesCrawled || 0,
        issues: scan?.issuesFound || 0,
        critical: scan?.siteScore?.criticalCount || 0,
        technical: scan?.siteScore?.technicalScore || null,
        status: c.status
      };
    })
  };
};

export const deleteCompetitor = async (projectId: string, competitorId: string, organizationId: string) => {
  const competitor = await prisma.competitor.findFirst({
    where: { id: competitorId, projectId, project: { organizationId } }
  });
  if (!competitor) throw new Error('Competitor not found');
  
  await prisma.competitor.delete({ where: { id: competitorId } });
  return true;
};

