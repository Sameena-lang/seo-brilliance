# SEO Intelligence Backend

This is the production-ready Node.js backend for SEO Intelligence.

## Stack
- Node.js & Express (TypeScript)
- PostgreSQL (Prisma ORM)
- Redis & BullMQ (Background Jobs)
- OpenAI API (AI Summaries)
- PDFKit & json2csv (Reporting)

## Prerequisites
- Docker & Docker Compose
- Node.js 18+

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Start the database and Redis:
   ```bash
   docker-compose up -d db redis
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Push schema and seed data:
   ```bash
   npx prisma migrate dev --name init
   npm run prisma:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Using with Frontend
Ensure your frontend `.env` contains:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

The backend allows CORS from `http://localhost:5173`.

## API Documentation
The API provides the following core endpoints:
- `POST /api/v1/auth/login`
- `GET /api/v1/projects`
- `POST /api/v1/projects/:projectId/scans`
- `GET /api/v1/dashboard/overview`
- `GET /api/v1/reports`

For complete parameter details, refer to the schema implementations in `src/schemas/`.
