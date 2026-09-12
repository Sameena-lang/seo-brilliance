# SEO Brilliance

SEO Brilliance (or SEO Intelligence) is a professional, premium SaaS AI SEO Website Analyzer.

## System Architecture

The project is divided into a robust Node.js backend and a modern React frontend:

### Frontend
- **Framework**: React 19 powered by Vite for fast development and building.
- **Routing**: `@tanstack/react-router` for type-safe routing.
- **Styling**: Tailwind CSS combined with Radix UI for accessible, unstyled components.
- **State & Data Fetching**: `@tanstack/react-query` for server state and data fetching via `axios`.
- **Forms & Validation**: `react-hook-form` coupled with `zod`.
- **UI Assets**: `lucide-react` for icons and `recharts` for data visualization.

### Backend
- **Server**: Node.js & Express (TypeScript).
- **Database**: PostgreSQL managed via Prisma ORM.
- **Caching & Queues**: Redis & BullMQ for asynchronous background jobs (e.g., website crawling and AI processing).
- **External APIs**: OpenAI for intelligent SEO recommendations and summaries.
- **Utilities**: Cheerio for web scraping, PDFKit and json2csv for generating exportable reports.

## Workflow & Local Setup

### 1. Backend Setup
Navigate to the `backend` directory and set up the required services:
```bash
cd backend
npm install
cp .env.example .env
# Start PostgreSQL and Redis containers
docker-compose up -d db redis
# Run migrations and seed data
npx prisma migrate dev
npm run prisma:seed
# Start the development server
npm run dev
```
*(Note: You may also need to run `npm run start:worker` to process background jobs like crawling).*

### 2. Frontend Setup
Navigate to the root directory:
```bash
npm install
npm run dev
```
Access the frontend application at `http://localhost:5173`. The frontend is configured to communicate with the backend running on `http://localhost:5000/api/v1`.

---

Create a professional, premium SaaS UI/UX for an AI SEO Website Analyzer called SEO Intelligence.

Build the frontend only. Do not implement backend, database, authentication logic, crawler logic, or APIs yet.

Design Style

Modern premium SaaS

Clean and minimal

Professional analytics dashboard

Elegant typography

Excellent spacing

Rounded cards

Subtle shadows and borders

Smooth micro-animations

Responsive desktop, tablet, and mobile design

Light and dark mode

Use a sophisticated blue/indigo-based visual identity

Make it look like a real commercial SEO platform, not a college project

Pages

Create these complete UI screens:

Landing Page

Navbar with logo, Features, Pricing, About, Login

Hero section with headline:
"AI-Powered SEO Audits That Tell You What to Fix"

Website URL input with "Analyze Website" button

SEO score preview

Feature cards

How it works

AI recommendations section

Dashboard preview

Pricing

FAQ

CTA

Footer

Login Page

Email

Password

Remember me

Forgot password

Login button

Create account link

Register Page

Full name

Email

Password

Confirm password

Create account

Dashboard

Left sidebar navigation

Top header with search, notifications, profile

Project selector

"Start New Audit" button

KPI cards:
SEO Score, Projects, Pages Crawled, Critical Issues, Warnings

SEO score chart

Issue distribution chart

Technical SEO score

Content score

Performance score

Recent scans table

Priority issues panel

Projects Page

Project cards/table

Website domain

SEO score

Last scan

Pages

Issues

"New Project" button

Search and filters

Project Details

Website overview

SEO health score

Latest scan

Pages crawled

Critical issues

Warnings

"Start Scan" button

Scan history

Score trend

Scan Page

Scan configuration UI

Maximum pages

Crawl depth

Robots.txt toggle

Sitemap toggle

Broken links toggle

Images toggle

Schema toggle

Performance toggle

"Start SEO Audit" button

Live Scan Progress

Large progress indicator

Pages discovered

Pages crawled

Errors

Issues found

Current URL

Activity log

Scanning status

SEO Audit Results

Large SEO score: 82/100

Technical SEO score

Content score

Performance score

Indexability score

Accessibility score

Critical / Warning / Info counters

SEO health chart

Top priority recommendations

Affected pages table

Issues Page

Search

Filters

Critical / Warning / Info tabs

Issue table

Issue title

Severity

Category

Affected pages

Status

Priority

Issue Details

Issue title

Severity badge

Description

Why it matters

Evidence

Affected URLs

Recommended fix

AI explanation

"Explain with AI" button

"Generate Fix" button

Pages Page

Searchable SEO page inventory

URL

Status code

Indexable

Title

Meta description

H1

Images

Links

Performance

SEO score

Issues

Reports Page

Report cards

SEO Audit Report

AI Recommendation Report

Technical SEO Report

PDF download button

CSV export button

Generate report button

Settings Page

Profile

Account

Appearance

Notifications

Security

Important UX Requirements

Use realistic sample data for the UI.

Make all navigation elements visually connected.

Use reusable components.

Add loading skeletons, empty states, error states, hover states, and confirmation dialogs.

Use charts and tables professionally.

Make the dashboard the strongest and most polished screen.

Keep the interface clean and avoid unnecessary decoration.

Use consistent spacing, typography, icons, colors, buttons, cards, and badges throughout.

Ensure excellent accessibility and responsive behavior.

Goal

Create a high-end, production-style AI SEO analytics dashboard UI that looks ready for a real SaaS product launch.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e686de0f-debf-4fa1-ade0-33e381185978).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
