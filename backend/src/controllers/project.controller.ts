import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/project.service';

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
