import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const getScanPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId } = req.params;
    const { page = 1, limit = 50, search = '' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { scanId };
    if (search) {
      where.url = { contains: String(search), mode: 'insensitive' };
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
    const { page = 1, limit = 50, search = '' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { scan: { project: { organizationId: orgId } } };
    if (search) {
      where.url = { contains: String(search), mode: 'insensitive' };
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
