import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const getScanIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId } = req.params;
    const { page = 1, limit = 50, severity, status } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { page: { scanId } };
    if (severity) where.severity = String(severity);
    if (status) where.status = String(status);

    const issues = await prisma.issue.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        page: { select: { url: true } }
      }
    });

    const total = await prisma.issue.count({ where });

    res.status(200).json({
      success: true,
      data: {
        issues,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllIssues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user.organizationId;
    const { page = 1, limit = 50, severity, status, projectId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { page: { scan: { project: { organizationId: orgId } } } };
    if (projectId) where.page.scan.project.id = String(projectId);
    if (severity) where.severity = String(severity);
    if (status) where.status = String(status);
    
    require('fs').appendFileSync('debug-issues.log', JSON.stringify({time: new Date(), where, projectId, url: req.originalUrl}) + '\\n');

    const issues = await prisma.issue.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        page: { select: { url: true, scan: { select: { project: { select: { domain: true } } } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.issue.count({ where });

    res.status(200).json({
      success: true,
      data: {
        issues,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateIssueStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = String(req.params.issueId);
    const { status } = req.body; // OPEN, FIXED, IGNORED

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { status: status as any }
    });

    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

export const getIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = String(req.params.issueId);
    
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        page: { select: { url: true, title: true, id: true } }
      }
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const { rules } = require('../seo/rules');
    const rule = rules.find((r: any) => r.code === issue.ruleCode);

    const issueWithRuleDetails = {
      ...issue,
      whyItMatters: rule?.whyItMatters || '',
      howToFix: rule?.howToFix || '',
      example: rule?.example || ''
    };

    res.status(200).json({ success: true, data: issueWithRuleDetails });
  } catch (error) {
    next(error);
  }
};
