import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Server, Globe, FileText, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEffect } from "react";

export const Route = createFileRoute("/scan/live")({
  component: LiveScanRoute,
});

function LiveScanRoute() {
  const navigate = useNavigate();
  const search: any = Route.useSearch();
  const scanId = search?.scanId;
  const projectId = search?.projectId;

  const { data, error } = useQuery({
    queryKey: ['scan-progress', scanId],
    queryFn: () => api.get(`/scans/${scanId}/progress`).then(res => res.data),
    enabled: !!scanId,
    refetchInterval: (query) => {
      // Stop polling if completed or failed
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        return false;
      }
      return 2000;
    },
  });

  const progressData = data || {
    status: 'PENDING',
    progressPercentage: 0,
    pagesDiscovered: 0,
    pagesCrawled: 0,
    pagesFailed: 0,
    issuesFound: 0,
    currentUrl: null
  };

  useEffect(() => {
    if (data?.status === 'COMPLETED') {
      navigate({ to: "/scan/results", search: { scanId, projectId } });
    }
  }, [data?.status, navigate, scanId, projectId]);

  if (!scanId) {
    return (
      <AppShell title="Audit in Progress" description="Scanning your website">
        <div className="p-12 text-center text-muted-foreground">
          No active scan found. <Link to="/projects" className="text-primary hover:underline">Go to Projects</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Audit in Progress"
      description="Scanning website"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>Crawl Status</CardTitle>
            <CardDescription>Our bots are currently analyzing your website.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-foreground">Progress</span>
                <span className="text-primary">{progressData.progressPercentage}%</span>
              </div>
              <Progress value={progressData.progressPercentage} className="h-3" />
              <p className="text-xs text-muted-foreground text-center mt-2 animate-pulse">
                {progressData.currentUrl ? `Crawling ${progressData.currentUrl}...` : 'Initializing crawl...'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 pt-6 border-t border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="size-4" />
                  <span className="text-sm font-medium">Pages Found</span>
                </div>
                <div className="text-2xl font-bold">{progressData.pagesDiscovered}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="size-4" />
                  <span className="text-sm font-medium">Pages Crawled</span>
                </div>
                <div className="text-2xl font-bold">{progressData.pagesCrawled}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="size-4" />
                  <span className="text-sm font-medium">Issues Found</span>
                </div>
                <div className="text-2xl font-bold text-warning">{progressData.issuesFound}</div>
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-4">
              <h4 className="text-sm font-semibold">Audit Steps</h4>
              <ul className="space-y-3">
                 <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className={`size-5 ${progressData.status !== 'PENDING' ? 'text-success' : 'text-muted'}`} />
                    <span className="text-foreground">Initialize crawler</span>
                 </li>
                 <li className="flex items-center gap-3 text-sm">
                    {progressData.status === 'RUNNING' ? (
                      <Loader2 className="size-5 text-primary animate-spin" />
                    ) : (
                      <CheckCircle2 className={`size-5 ${progressData.status === 'COMPLETED' ? 'text-success' : 'text-muted'}`} />
                    )}
                    <span className={`text-foreground ${progressData.status === 'RUNNING' ? 'font-medium' : ''}`}>Analyze page content and links</span>
                 </li>
                 <li className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="size-5 rounded-full border-2 border-muted"></div>
                    <span>Generate AI recommendations</span>
                 </li>
              </ul>
            </div>
            
            {progressData.status === 'FAILED' && (
              <div className="mt-4 p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
                The scan failed to complete. Please try again or check your project settings.
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-center">
          <Button variant="ghost" asChild>
            <Link to="/scan/results" search={{ scanId, projectId }}>View Partial Results</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
