import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveProject } from "@/hooks/use-active-project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, MousePointerClick, Eye, Percent, ArrowUpRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/search-console")({
  component: SearchConsoleRoute,
});

function SearchConsoleRoute() {
  const { activeProjectId } = useActiveProject();

  const { data: statusRes, isLoading: statusLoading } = useQuery({
    queryKey: ['integration-status', activeProjectId, 'search-console'],
    queryFn: () => api.get(`/integrations/${activeProjectId}/search-console/status`).then(res => res.data),
    enabled: !!activeProjectId,
  });

  const { data: metricsRes, isLoading: metricsLoading } = useQuery({
    queryKey: ['integration-metrics', activeProjectId, 'search-console'],
    queryFn: () => api.get(`/projects/${activeProjectId}/search-console`).then(res => res.data),
    enabled: !!activeProjectId && statusRes?.data?.status === 'CONNECTED',
  });

  if (!activeProjectId) {
    return (
      <AppShell title="Search Console" description="View Google Search Console data.">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Please select a project first.</p>
        </div>
      </AppShell>
    );
  }

  if (statusLoading) {
    return <AppShell title="Search Console" description="Loading..."><Skeleton className="h-[400px] rounded-xl" /></AppShell>;
  }

  const status = statusRes?.data || statusRes;
  if (status?.status !== 'CONNECTED') {
    return (
      <AppShell title="Search Console" description="Google Search Console is not connected.">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Google Search Console is not connected</h2>
          <p className="text-muted-foreground mb-6">
            Connect your Google Search Console account to view live clicks, impressions, CTR, and search queries for this project.
          </p>
          <Button asChild>
            <Link to="/integrations">Go to Integrations</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const metrics = metricsRes?.data || metricsRes || [];
  const latestMetric = metrics[0] ? (typeof metrics[0].metrics === 'string' ? JSON.parse(metrics[0].metrics) : metrics[0].metrics) : null;

  return (
    <AppShell
      title="Search Console"
      description="Performance on Google Search."
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">Data source: Google Search Console</span>
        <span className="text-xs text-muted-foreground">Last synchronized: {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never'}</span>
      </div>

      {!latestMetric ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            Synchronization completed, but no data was returned from Google Search Console for this property. 
            Ensure the property has active traffic in Google Search Console.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
              <MousePointerClick className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric.clicks?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Impressions</CardTitle>
              <Eye className="size-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric.impressions?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average CTR</CardTitle>
              <Percent className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric.ctr || 0}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Position</CardTitle>
              <ArrowUpRight className="size-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric.position || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}
      
    </AppShell>
  );
}
