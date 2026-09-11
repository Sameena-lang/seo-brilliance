import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/query-keys';

export function useLatestScan(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.scans.byProject(projectId ?? ''),
    queryFn: async () => {
      // First get all scans for the project
      const res = await api.get(`/projects/${projectId}/scans`);
      const scans = res.data?.scans || [];
      
      // Find the latest completed scan
      const completedScans = scans.filter((s: any) => s.status === 'COMPLETED');
      if (completedScans.length > 0) {
        // Assuming they are sorted by createdAt desc from backend
        return completedScans[0];
      }
      return null;
    },
    enabled: !!projectId,
  });
}
