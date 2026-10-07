import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/query-keys';

export function useLatestScan(projectId: string | null) {
  return useQuery({
    queryKey: queryKeys.scans.byProject(projectId ?? ''),
    queryFn: async () => {
      // Get scan history for the project
      const history = await api.get(`/projects/${projectId}/history`);
      const scans = history.data || [];
      
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
