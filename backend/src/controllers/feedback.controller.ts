import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export const submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, message, context } = req.body;

    if (!category || !message) {
      return res.status(400).json({ success: false, error: 'Category and message are required' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        category,
        message,
        context,
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
      }
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error: any) {
    next(error);
  }
};
