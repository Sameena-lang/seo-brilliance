export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  organizationId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  domain: string;
  crawlMaxPages: number;
  crawlMaxDepth: number;
  respectRobots: boolean;
  crawlSitemap: boolean;
  checkBrokenLinks: boolean;
  analyzeImages: boolean;
  analyzeSchema: boolean;
  measurePerformance: boolean;
  includeSubdomains: boolean;
  excludePatterns: string | null;
  createdAt: string;
  updatedAt: string;
  
  _count?: { scans: number };
  scans?: Scan[];
}

export interface SiteScore {
  id: string;
  scanId: string;
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  performanceScore: number;
  indexabilityScore: number;
  accessibilityScore: number;
  structuredDataScore: number;
}

export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Scan {
  id: string;
  projectId: string;
  status: ScanStatus;
  pagesDiscovered: number;
  pagesCrawled: number;
  pagesFailed: number;
  issuesFound: number;
  progressPercentage: number;
  currentUrl: string | null;
  logs: any;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  
  project?: Project;
  siteScore?: SiteScore;
}

export type IssueSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type IssueStatus = 'OPEN' | 'FIXED' | 'IGNORED';

export interface Issue {
  id: string;
  pageId: string;
  ruleCode: string;
  severity: IssueSeverity;
  status: IssueStatus;
  title: string;
  evidence: any;
  recommendation: string | null;
  createdAt: string;
  updatedAt: string;
  
  page?: Page;
}

export interface Page {
  id: string;
  scanId: string;
  url: string;
  statusCode: number | null;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  wordCount: number;
  imagesTotal: number;
  imagesMissingAlt: number;
  internalLinks: number;
  externalLinks: number;
  isIndexable: boolean;
  hasSchema: boolean;
  createdAt: string;
  
  _count?: { issues: number };
}

export interface Report {
  id: string;
  scanId: string;
  pdfUrl: string | null;
  csvUrl: string | null;
  createdAt: string;
  
  scan?: Scan;
}

export interface DashboardOverview {
  totalProjects: number;
  totalScans: number;
  averageSeoScore: number;
  criticalIssues: number;
  warningIssues: number;
  pagesCrawled: number;
}

export interface AiSummary {
  id: string;
  scanId: string;
  summary: string;
  whyItMatters: string;
  recommendation: string;
  priority: string;
}

export interface AuditResults {
  score: SiteScore | null;
  aiSummary: AiSummary | null;
  topIssues: Issue[];
}
