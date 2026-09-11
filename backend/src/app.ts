import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app: Express = express();

// Middleware
app.use(helmet());

import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests from this IP, please try again after 15 minutes' } }
});

// Apply rate limiter to all API routes
app.use('/api/', apiLimiter);
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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

import prisma from './config/db';
import { redisConnection } from './queues/index';

// Health check route
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisPing = await redisConnection.ping();
    if (redisPing !== 'PONG') throw new Error('Redis ping failed');

    res.status(200).json({ success: true, message: 'Server is running, Database and Redis are healthy.' });
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
