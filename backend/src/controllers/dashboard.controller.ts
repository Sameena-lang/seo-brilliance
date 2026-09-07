import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user.organizationId;

    const totalProjects = await prisma.project.count({ where: { organizationId: orgId } });
    
    // Scans in this org
    const scans = await prisma.scan.findMany({
      where: { project: { organizationId: orgId }, status: 'COMPLETED' },
      include: { siteScore: true }
    });

    const totalScans = scans.length;
    
    let averageSeoScore = 0;
    if (totalScans > 0) {
      const totalScore = scans.reduce((acc, scan) => acc + (scan.siteScore?.overallScore || 0), 0);
      averageSeoScore = Math.round(totalScore / totalScans);
    }

    const pagesCrawled = scans.reduce((acc, scan) => acc + scan.pagesCrawled, 0);

    const issues = await prisma.issue.groupBy({
      by: ['severity'],
      where: { page: { scan: { project: { organizationId: orgId } } }, status: 'OPEN' },
      _count: true
    });

    const criticalIssues = issues.find(i => i.severity === 'CRITICAL')?._count || 0;
    const warningIssues = issues.find(i => i.severity === 'WARNING')?._count || 0;

    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalScans,
        averageSeoScore,
        criticalIssues,
        warningIssues,
        pagesCrawled
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentScans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user.organizationId;
    
    const recentScans = await prisma.scan.findMany({
      where: { project: { organizationId: orgId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        project: { select: { name: true, domain: true } },
        siteScore: { select: { overallScore: true } }
      }
    });

    res.status(200).json({ success: true, data: recentScans });
  } catch (error) {
    next(error);
  }
};
