import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/db';
import { reportQueue } from '../queues';

const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

export const generateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scanId } = req.params;
    
    // Add to queue to force regeneration
    await reportQueue.add('generateReport', { scanId });

    res.status(202).json({ success: true, message: 'Report generation started' });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.report.findMany({
      where: { scan: { project: { organizationId: req.user.organizationId } } },
      include: { scan: { include: { project: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

export const getReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportId = String(req.params.reportId);
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { scan: { include: { project: true } } }
    });

    if (!report || (report as any).scan.project.organizationId !== req.user.organizationId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

export const downloadReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportId = String(req.params.reportId);
    const type = String(req.query.type); // 'pdf' or 'csv'
    
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { scan: { include: { project: true } } }
    });

    if (!report || (report as any).scan.project.organizationId !== req.user.organizationId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } });
    }

    const fileUrl = type === 'csv' ? report.csvUrl : report.pdfUrl;
    if (!fileUrl) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'File not generated yet' } });
    }

    // extract filename from /storage/filename
    const fileName = fileUrl.split('/').pop();
    if (!fileName) {
      return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Invalid file url' } });
    }

    const filePath = path.join(STORAGE_PATH, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'File not found on disk' } });
    }

    res.download(filePath);
  } catch (error) {
    next(error);
  }
};
