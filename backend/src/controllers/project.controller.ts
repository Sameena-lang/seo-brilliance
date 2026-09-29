import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/project.service';
import * as intelligenceService from '../services/intelligence.service';
import prisma from '../config/db';

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.createProject(req.body, req.user.id, req.user.organizationId);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await projectService.getProjects(req.user.organizationId);
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.getProjectById(String(req.params.id), req.user.organizationId);
    res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    if (error.message === 'Project not found') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.updateProject(String(req.params.id), req.body, req.user.organizationId);
    res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    if (error.message === 'Project not found') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await projectService.deleteProject(String(req.params.id), req.user.organizationId);
    res.status(200).json({ success: true, data: { message: 'Project deleted successfully' } });
  } catch (error: any) {
    if (error.message === 'Project not found') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }
    next(error);
  }
};

export const getHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await intelligenceService.getHealth(String(req.params.id), req.user.organizationId);
    res.status(200).json({ success: true, data: health });
  } catch (error: any) {
    next(error);
  }
};

export const getOpportunities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const opportunities = await intelligenceService.getOpportunities(String(req.params.id), req.user.organizationId);
    res.status(200).json({ success: true, data: opportunities });
  } catch (error: any) {
    next(error);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await intelligenceService.getHistory(String(req.params.id), req.user.organizationId);
    res.status(200).json({ success: true, data: history });
  } catch (error: any) {
    next(error);
  }
};

export const getKeywords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keywords = await intelligenceService.getKeywords(String(req.params.id), req.user.organizationId);
    res.status(200).json({ success: true, data: keywords });
  } catch (error: any) {
    next(error);
  }
};

export const addKeyword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { term } = req.body;
    if (!term) return res.status(400).json({ success: false, error: 'Term is required' });
    
    const keyword = await intelligenceService.addKeyword(String(req.params.id), term, req.user.organizationId);
    res.status(201).json({ success: true, data: keyword });
  } catch (error: any) {
    next(error);
  }
};

export const getCompetitors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const competitors = await intelligenceService.getCompetitors(String(req.params.id), req.user.organizationId);
    res.status(200).json({ success: true, data: competitors });
  } catch (error: any) {
    next(error);
  }
};

export const addCompetitor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const competitor = await intelligenceService.addCompetitor(String(req.params.id), req.body.domain, req.user.organizationId);
    res.status(201).json({ success: true, data: competitor });
  } catch (error: any) {
    next(error);
  }
};

export const getSearchConsoleMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await prisma.externalMetricSnapshot.findMany({
      where: {
        projectId: String(req.params.id),
        provider: 'search-console',
      },
      orderBy: { date: 'desc' },
      take: 30
    });
    res.status(200).json({ success: true, data: metrics });
  } catch (error: any) {
    next(error);
  }
};

export const getAnalyticsMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await prisma.externalMetricSnapshot.findMany({
      where: {
        projectId: String(req.params.id),
        provider: 'analytics',
      },
      orderBy: { date: 'desc' },
      take: 30
    });
    res.status(200).json({ success: true, data: metrics });
  } catch (error: any) {
    next(error);
  }
};
