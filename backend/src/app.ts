import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app: Express = express();

// Enable trust proxy for Render / reverse proxies (fixes rate limiting IP detection)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

import rateLimit from 'express-rate-limit';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://seo-brilliance.vercel.app',
  'https://zany-space-trout-69j9jw65pq4724jjp-5173.app.github.dev',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
      /^https:\/\/[a-zA-Z0-9-]+(-[a-zA-Z0-9]+)*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));

// Generous general API rate limiter to prevent 429 errors during dashboard usage and scans
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // 2000 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again after a short while.',
    },
  },
});

// Dedicated rate limiter for auth routes to protect against brute force while avoiding false 429s
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts, please try again in a few minutes.',
    },
  },
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/api/v1/auth', authLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import userRoutes from './routes/user.routes';
import scanRoutes from './routes/scan.routes';
import dashboardRoutes from './routes/dashboard.routes';
import pageRoutes from './routes/page.routes';
import issueRoutes from './routes/issue.routes';
import reportRoutes from './routes/report.routes';
import publicRoutes from './routes/public.routes';
import subscriptionRoutes from './routes/subscription.routes';
import aiRoutes from './routes/ai.routes';

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/projects/:projectId/scans', scanRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/scans', scanRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/pages', pageRoutes);
app.use('/api/v1/issues', issueRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/ai', aiRoutes);

import prisma from './config/db';
import './workers';

// Health check route
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, message: 'Server is running and the database is healthy.' });
  } catch (error) {
    res.status(503).json({ success: false, message: 'Service Unavailable' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
});

export default app;
