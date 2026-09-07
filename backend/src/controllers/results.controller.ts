import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const getAuditResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scanId = String(req.params.scanId);

    const score = await prisma.siteScore.findUnique({
      where: { scanId }
    });

    const aiSummary = await prisma.aiSummary.findUnique({
      where: { scanId }
    });

    const topIssues = await prisma.issue.findMany({
      where: { page: { scanId: String(scanId) }, status: 'OPEN' },
      take: 10,
      orderBy: { severity: 'asc' }, // CRITICAL before WARNING
    });

    res.status(200).json({
      success: true,
      data: {
        score,
        aiSummary,
        topIssues
      }
    });
  } catch (error) {
    next(error);
  }
};
