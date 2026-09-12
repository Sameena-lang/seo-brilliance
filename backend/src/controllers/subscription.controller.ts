import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const upgradeToPro = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user.organizationId;
    
    // In a real app, this would involve Stripe checkout and webhooks.
    // Here we just instantly upgrade the user's organization to PRO.
    const org = await prisma.organization.update({
      where: { id: orgId },
      data: { tier: 'PRO' }
    });

    res.status(200).json({ success: true, data: { tier: org.tier } });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user.organizationId;
    
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { tier: true }
    });

    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.status(200).json({ success: true, data: { tier: org.tier } });
  } catch (error) {
    next(error);
  }
};
