import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ success: false, error: { code: 'USER_EXISTS', message: error.message } });
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: error.message } });
    }
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user is set by auth middleware
    res.status(200).json({ success: true, data: { user: req.user } });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a stateless JWT setup, the client just discards the token.
    // If using cookies, we would clear the cookie here.
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
