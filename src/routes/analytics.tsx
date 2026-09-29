import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveProject } from "@/hooks/use-active-project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users, Clock, Activity, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsRoute,
});

function AnalyticsRoute() {
  const { activeProjectId } = useActiveProject();

  const { data: statusRes, isLoading: statusLoading } = useQuery({
    queryKey: ['integration-status', activeProjectId, 'analytics'],
    queryFn: () => api.get(`/integrations/${activeProjectId}/analytics/status`).then(res => res.data),
    enabled: !!activeProjectId,
  });

  const { data: metricsRes, isLoading: metricsLoading } = useQuery({
    queryKey: ['integration-metrics', activeProjectId, 'analytics'],
    queryFn: () => api.get(`/projects/${activeProjectId}/analytics`).then(res => res.data),
    enabled: !!activeProjectId && statusRes?.data?.status === 'CONNECTED',
  });

  if (!activeProjectId) {
    return (
      <AppShell title="Analytics" description="View Google Analytics data.">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Please select a project first.</p>
        </div>
      </AppShell>
    );
  }

  if (statusLoading) {
    return <AppShell title="Analytics" description="Loading..."><Skeleton className="h-[400px] rounded-xl" /></AppShell>;
  }

  const status = statusRes?.data || statusRes;
  if (status?.status !== 'CONNECTED') {
    return (
      <AppShell title="Analytics" description="Google Analytics is not connected.">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Google Analytics is not connected</h2>
          <p className="text-muted-foreground mb-6">
            Connect your Google Analytics 4 property to view real user traffic, engagement, and conversion metrics.
          </p>
          <Button asChild>
            <Link to="/integrations">Go to Integrations</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const metrics = metricsRes?.data || metricsRes || [];
  const latestMetric = metrics[0] ? JSON.parse(metrics[0].metrics) : null;

  return (
    <AppShell
      title="Analytics"
      description="Website traffic and user engagement."
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">Data source: Google Analytics</span>
        <span className="text-xs text-muted-foreground">Last synchronized: {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never'}</span>
      </div>

      {!latestMetric ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            Synchronization completed, but no data was returned from Google Analytics for this property.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric.users?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
              <Activity className="size-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric.sessions?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
              <Clock className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric.engagementRate || 0}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversions</CardTitle>
              <Target className="size-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestMetric.conversions || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
