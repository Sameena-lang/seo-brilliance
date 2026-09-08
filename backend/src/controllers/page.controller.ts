import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { Parser } from 'json2csv';

export const getScanPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId } = req.params;
    const { page = 1, limit = 50, search = '', status, indexable, hasIssues } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { scanId };
    
    if (search) {
      where.url = { contains: String(search), mode: 'insensitive' };
    }
    
    if (status && status !== 'all') {
      if (status === '200') where.statusCode = 200;
      else if (status === '301') where.statusCode = { gte: 300, lt: 400 };
      else if (status === '404') where.statusCode = { gte: 400 };
    }
    
    if (indexable === 'true') where.isIndexable = true;
    if (indexable === 'false') where.isIndexable = false;
    
    if (hasIssues === 'true') {
      where.issues = { some: {} };
    } else if (hasIssues === 'false') {
      where.issues = { none: {} };
    }

    const pages = await prisma.page.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        _count: { select: { issues: true } }
      }
    });

    const total = await prisma.page.count({ where });

    res.status(200).json({
      success: true,
      data: {
        pages,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user.organizationId;
    const { page = 1, limit = 50, search = '', status, indexable, hasIssues } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { scan: { project: { organizationId: orgId } } };
    if (search) {
      where.url = { contains: String(search), mode: 'insensitive' };
    }
    if (status && status !== 'all') {
      if (status === '200') where.statusCode = 200;
      else if (status === '301') where.statusCode = { gte: 300, lt: 400 };
      else if (status === '404') where.statusCode = { gte: 400 };
    }
    if (indexable === 'true') where.isIndexable = true;
    if (indexable === 'false') where.isIndexable = false;
    
    if (hasIssues === 'true') {
      where.issues = { some: {} };
    } else if (hasIssues === 'false') {
      where.issues = { none: {} };
    }

    const pages = await prisma.page.findMany({
      where,
      skip,
      take: Number(limit),
      include: {
        _count: { select: { issues: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.page.count({ where });

    res.status(200).json({
      success: true,
      data: {
        pages,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPageDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageId = String(req.params.pageId);
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { issues: true, coreWebVitals: true }
    });

    if (!page) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } });
    }

    res.status(200).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

export const exportScanPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId } = req.params;
    const { search = '', status, indexable, hasIssues } = req.query;

    const where: any = { scanId };
    if (search) where.url = { contains: String(search), mode: 'insensitive' };
    
    if (status && status !== 'all') {
      if (status === '200') where.statusCode = 200;
      else if (status === '301') where.statusCode = { gte: 300, lt: 400 };
      else if (status === '404') where.statusCode = { gte: 400 };
    }
    if (indexable === 'true') where.isIndexable = true;
    if (indexable === 'false') where.isIndexable = false;
    if (hasIssues === 'true') where.issues = { some: {} };
    else if (hasIssues === 'false') where.issues = { none: {} };

    const pages = await prisma.page.findMany({
      where,
      include: { _count: { select: { issues: true, internalLinks: true, externalLinks: true } } },
    });

    const mappedData = pages.map((p) => ({
      URL: p.url,
      'Status Code': p.statusCode,
      Indexable: p.isIndexable ? 'Yes' : 'No',
      Title: p.title || '',
      'Meta Description': p.metaDescription || '',
      H1: p.h1 || '',
      'Word Count': p.wordCount || 0,
      Issues: p._count.issues,
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(mappedData);

    res.header('Content-Type', 'text/csv');
    res.attachment(`scan-${scanId}-pages.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};
