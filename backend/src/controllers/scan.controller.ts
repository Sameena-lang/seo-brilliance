import { Request, Response, NextFunction } from 'express';
import * as scanService from '../services/scan.service';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scan = await scanService.createScan(String(req.params.projectId), req.user.organizationId);
    res.status(201).json({ success: true, data: scan });
  } catch (error: any) {
    if (error.message === 'A scan is already running for this project') {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: error.message } });
    }
    next(error);
  }
};

export const getScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scan = await scanService.getScan(String(req.params.scanId), req.user.organizationId);
    res.status(200).json({ success: true, data: scan });
  } catch (error: any) {
    if (error.message === 'Scan not found') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Scan not found' } });
    }
    next(error);
  }
};

export const cancelScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scan = await scanService.cancelScan(String(req.params.scanId), req.user.organizationId);
    res.status(200).json({ success: true, data: scan });
  } catch (error: any) {
    if (error.message === 'Scan not found') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Scan not found' } });
    }
    if (error.message.includes('already finished')) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: error.message } });
    }
    next(error);
  }
};

export const getProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scan = await scanService.getScan(String(req.params.scanId), req.user.organizationId);
    res.status(200).json({
      success: true,
      data: {
        status: scan.status,
        progressPercentage: scan.progressPercentage,
        pagesDiscovered: scan.pagesDiscovered,
        pagesCrawled: scan.pagesCrawled,
        pagesFailed: scan.pagesFailed,
        issuesFound: scan.issuesFound,
      }
    });
  } catch (error: any) {
    if (error.message === 'Scan not found') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Scan not found' } });
    }
    next(error);
  }
};

export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await scanService.getScanLogs(String(req.params.scanId), req.user.organizationId);
    res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    if (error.message === 'Scan not found') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Scan not found' } });
    }
    next(error);
  }
};
