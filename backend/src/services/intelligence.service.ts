import prisma from '../config/db';

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
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId }
  });

  if (!project) throw new Error('Project not found');

  return prisma.competitor.create({
    data: {
      projectId,
      domain
    }
  });
};
