// Centralized query key factory for TanStack Query
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  projects: {
    all: () => ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  scans: {
    byProject: (projectId: string) => ['scans', 'project', projectId] as const,
    detail: (scanId: string) => ['scans', scanId] as const,
    progress: (scanId: string) => ['scans', scanId, 'progress'] as const,
    results: (scanId: string) => ['scans', scanId, 'results'] as const,
    logs: (scanId: string) => ['scans', scanId, 'logs'] as const,
  },
  issues: {
    all: (params?: Record<string, string>) => ['issues', params] as const,
    byScan: (scanId: string) => ['issues', 'scan', scanId] as const,
    detail: (id: string) => ['issues', id] as const,
  },
  pages: {
    all: (params?: Record<string, string>) => ['pages', params] as const,
    byScan: (scanId: string) => ['pages', 'scan', scanId] as const,
    detail: (id: string) => ['pages', id] as const,
  },
  reports: {
    all: () => ['reports'] as const,
    detail: (id: string) => ['reports', id] as const,
  },
  dashboard: {
    overview: () => ['dashboard', 'overview'] as const,
    recentScans: () => ['dashboard', 'recent-scans'] as const,
  },
  user: {
    profile: () => ['user', 'profile'] as const,
  },
};
