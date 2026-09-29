import { Request, Response, NextFunction } from 'express';
import { integrationManager } from '../integrations/IntegrationManager';
import prisma from '../config/db';

export const getStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providerName = req.params.provider;
    const provider = integrationManager.getProvider(providerName);
    const status = await provider.getStatus(req.params.projectId);
    res.status(200).json({ success: true, data: status });
  } catch (error: any) {
    next(error);
  }
};

export const connect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providerName = req.params.provider;
    const provider = integrationManager.getProvider(providerName);
    const authUrl = provider.getAuthUrl(req.params.projectId, req.user.organizationId);
    res.status(200).json({ success: true, data: { authUrl } });
  } catch (error: any) {
    next(error);
  }
};

export const getProperties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providerName = req.params.provider;
    const provider = integrationManager.getProvider(providerName);
    const properties = await provider.getProperties(req.params.projectId);
    res.status(200).json({ success: true, data: properties });
  } catch (error: any) {
    next(error);
  }
};

export const selectProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providerName = req.params.provider;
    const { propertyId, propertyName } = req.body;
    
    if (!propertyId || !propertyName) {
      return res.status(400).json({ success: false, error: 'Property ID and name are required' });
    }

    const provider = integrationManager.getProvider(providerName);
    await provider.selectProperty(req.params.projectId, propertyId, propertyName);
    res.status(200).json({ success: true });
  } catch (error: any) {
    next(error);
  }
};

export const syncData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providerName = req.params.provider;
    const provider = integrationManager.getProvider(providerName);
    
    // Non-blocking background sync triggered here conceptually
    // We await it here for simplicity but it could be dispatched to BullMQ
    const result = await provider.syncData(req.params.projectId);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    next(error);
  }
};

export const disconnect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providerName = req.params.provider;
    const provider = integrationManager.getProvider(providerName);
    await provider.disconnect(req.params.projectId);
    res.status(200).json({ success: true });
  } catch (error: any) {
    next(error);
  }
};

export const handleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, code, state } = req.query;
    if (!provider || !code || !state) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const integrationProvider = integrationManager.getProvider(provider as string);
    
    await integrationProvider.handleAuthCallback(code as string, decodedState.projectId, decodedState.organizationId);
    
    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/integrations?success=true`);
  } catch (error: any) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/integrations?error=${encodeURIComponent(error.message)}`);
  }
};
