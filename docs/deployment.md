# Production Deployment Guide

This document outlines the recommended architecture and steps to deploy the SEO Intelligence application to production.

## 1. Recommended Architecture

For a scalable and reliable setup, we recommend decoupling the following components:

- **Frontend Hosting:** Vercel, Netlify, or Cloudflare Pages
- **Backend API Hosting:** Render, Railway, AWS ECS, or DigitalOcean App Platform
- **Worker Hosting:** A separate background worker process running on Render, Railway, or AWS ECS
- **Database:** Managed PostgreSQL (e.g., Supabase, Neon, AWS RDS, DigitalOcean Managed DB)
- **Redis:** Managed Redis (e.g., Upstash, Redis Labs, AWS ElastiCache)

## 2. Environment Variables

Create a secure `.env` file in your backend deployment environment. See `backend/.env.example` for reference.
Crucially, ensure:
- `NODE_ENV=production`
- `JWT_SECRET` is a long, cryptographically secure random string.
- `FRONTEND_URL` exactly matches your deployed frontend URL (for CORS protection).

For the frontend, set the environment variable during your build step:
- `VITE_API_URL=https://api.your-production-domain.com/api/v1`

## 3. Database Migration

Before starting the API or Worker, you must push the Prisma schema to your production database.

Run the following command from your CI/CD pipeline or deployment shell (inside the `backend` folder):
```bash
npx prisma migrate deploy
```

*(Do not use `migrate dev` in production as it may reset your database).*

## 4. Backend & Worker Deployment

The repository uses a single codebase for both the API and the background worker, but they must be run as separate processes.

- **API Process Start Command:** `npm start` (Runs `node dist/server.js`)
- **Worker Process Start Command:** `npm run start:worker` (Runs `node dist/worker.js`)

If using Docker, the provided `backend/docker-compose.yml` serves as a blueprint for this separation.

## 5. Health Checks

The backend provides a health check endpoint at `GET /health`. 
In production, configuring your load balancer or uptime monitor to hit `https://api.your-production-domain.com/health` will verify that:
1. The Express API is responding.
2. The PostgreSQL database is reachable.
3. The Redis broker is reachable.

## 6. AI Key Configuration

To enable AI summaries, you must provide a valid OpenAI API key to the backend environment variables:
- `AI_API_KEY=sk-your-secure-key`
- `AI_MODEL=gpt-4o`

If omitted, the system gracefully falls back to a deterministic stub.

## 7. Graceful Shutdown & Rollbacks

The API and Worker processes listen for `SIGTERM` and `SIGINT` signals. Upon receiving a shutdown signal (e.g., during a deployment rollout), they will wait for active HTTP requests and active BullMQ jobs to finish before disconnecting from the database and exiting. Ensure your hosting provider allows a shutdown grace period of at least 10 seconds.

If a deployment fails, use your hosting provider's rollback feature. Since Prisma migrations are versioned, ensure that any rolled-back application code is compatible with the current database schema state.
