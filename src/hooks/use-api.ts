import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/query-keys';
import { toast } from 'sonner';

// ─── Auth ───────────────────────────────────────────────────────────────────

export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => api.get('/auth/me').then((res: any) => res.data?.user ?? res.data),
    retry: false,
    staleTime: Infinity,
  });
};

// ─── Public ─────────────────────────────────────────────────────────────────

export const usePublicAnalyze = () => {
  return useMutation({
    mutationFn: (url: string) => api.post('/public/analyze', { url }).then((res: any) => res.data),
    onError: (err: any) => toast.error(err?.message ?? 'Failed to analyze URL'),
  });
};

// ─── Projects ────────────────────────────────────────────────────────────────

export const useProjects = () => {
  return useQuery({
    queryKey: queryKeys.projects.all(),
    queryFn: () => api.get('/projects').then((res: any) => res.data ?? []),
  });
};

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => api.get(`/projects/${projectId}`).then((res: any) => res.data),
    enabled: !!projectId,
  });
};

// ─── Scans ───────────────────────────────────────────────────────────────────

export const useScanProgress = (scanId: string | null, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.scans.progress(scanId ?? ''),
    queryFn: () => api.get(`/scans/${scanId}/progress`).then((res: any) => res.data),
    enabled: !!scanId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') return false;
      return 2000;
    },
  });
};

export const useScanResults = (scanId: string) => {
  return useQuery({
    queryKey: queryKeys.scans.results(scanId),
    queryFn: () => api.get(`/scans/${scanId}`).then((res: any) => res.data),
    enabled: !!scanId,
  });
};

// ─── Issues ──────────────────────────────────────────────────────────────────

export const useIssues = (scanId?: string) => {
  const url = scanId ? `/scans/${scanId}/issues` : '/issues';
  return useQuery({
    queryKey: scanId ? queryKeys.issues.byScan(scanId) : queryKeys.issues.all(),
    queryFn: () => api.get(url).then((res: any) => res.data?.issues ?? []),
  });
};

export const useIssue = (issueId: string) => {
  return useQuery({
    queryKey: queryKeys.issues.detail(issueId),
    queryFn: () => api.get(`/issues/${issueId}`).then((res: any) => res.data),
    enabled: !!issueId,
  });
};

export const useUpdateIssueStatus = (issueId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => api.patch(`/issues/${issueId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) });
      qc.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue status updated');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to update issue'),
  });
};

// ─── Pages ───────────────────────────────────────────────────────────────────

export const usePages = (scanId?: string, search = '') => {
  const url = scanId ? `/scans/${scanId}/pages` : '/pages';
  return useQuery({
    queryKey: scanId ? queryKeys.pages.byScan(scanId) : queryKeys.pages.all({ search }),
    queryFn: () => api.get(url, { params: { search } }).then((res: any) => res.data?.pages ?? []),
  });
};

// ─── Reports ─────────────────────────────────────────────────────────────────

export const useReports = () => {
  return useQuery({
    queryKey: queryKeys.reports.all(),
    queryFn: () => api.get('/reports').then((res: any) => res.data ?? []),
  });
};

export const useGenerateReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scanId: string) => api.post(`/scans/${scanId}/reports`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reports.all() });
      toast.success('Report generation started! Refresh in a moment.');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to generate report'),
  });
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const useDashboardOverview = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: () => api.get('/dashboard/overview').then((res: any) => res.data),
  });
};

export const useDashboardRecentScans = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.recentScans(),
    queryFn: () => api.get('/dashboard/recent-scans').then((res: any) => res.data ?? []),
  });
};

// ─── User Profile ─────────────────────────────────────────────────────────────

export const useUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => api.get('/users/profile').then((res: any) => res.data),
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { fullName: string; email: string }) =>
      api.put('/users/profile', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.user.profile() });
      qc.invalidateQueries({ queryKey: queryKeys.auth.me() });
      toast.success('Profile updated successfully');
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to update profile'),
  });
};
