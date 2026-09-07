import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle, Info, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetailsRoute,
});

function ProjectDetailsRoute() {
  const { projectId } = Route.useParams();
  
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(res => res.data),
  });

  const domain = project?.domain || "Loading...";
  
  // Get the most recent scan if it exists
  const latestScan = project?.scans?.[0];
  const score = latestScan?.siteScore?.overallScore || 0;
  const pagesCrawled = latestScan?.pagesCrawled || 0;
  const issuesFound = latestScan?.issuesFound || 0;

  return (
    <AppShell
      title={domain}
      description="Detailed overview of the website's SEO health."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/projects">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <Button className="gap-2 shadow-md shadow-primary/20" asChild>
            <Link to="/scan" search={{ projectId }}>
              <RefreshCw className="size-4" />
              Re-crawl
            </Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-8">
        {/* Top Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-1 bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/80">Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-6xl font-bold font-display tracking-tighter">{latestScan ? score : '-'}</span>
                {latestScan && <span className="text-xl pb-1.5 text-primary-foreground/80">/100</span>}
              </div>
              <p className="mt-4 text-sm text-primary-foreground/90">
                {latestScan ? `${issuesFound} issues found.` : 'No scans completed yet.'}
              </p>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4 md:col-span-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pages Crawled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagesCrawled.toLocaleString()}</div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-full bg-success rounded-full"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{issuesFound}</div>
                <div className="mt-2 flex h-1.5 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-warning"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="mb-4 bg-muted/50">
            <TabsTrigger value="issues">Issues by Category</TabsTrigger>
            <TabsTrigger value="pages">Crawled Pages</TabsTrigger>
            <TabsTrigger value="settings">Project Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="issues" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { title: "Technical SEO", score: latestScan?.siteScore?.technicalScore || 0, errors: '-', warnings: '-' },
                { title: "On-Page Content", score: latestScan?.siteScore?.contentScore || 0, errors: '-', warnings: '-' },
                { title: "Indexability", score: latestScan?.siteScore?.indexabilityScore || 0, errors: '-', warnings: '-' },
                { title: "Performance", score: latestScan?.siteScore?.performanceScore || 0, errors: '-', warnings: '-' },
              ].map((category) => (
                <Card key={category.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">{category.title}</CardTitle>
                    <span className={`text-lg font-bold ${category.score >= 90 ? 'text-success' : category.score >= 80 ? 'text-warning' : 'text-destructive'}`}>
                      {category.score}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <Progress value={category.score} className="h-1.5 mb-4" />
                    <div className="flex justify-between text-sm">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="size-3.5" /> {category.errors}
                        </span>
                        <span className="flex items-center gap-1 text-warning">
                          <AlertTriangle className="size-3.5" /> {category.warnings}
                        </span>
                      </div>
                      <Link to="/issues" className="text-primary hover:underline text-xs font-medium">View issues</Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Priority Fixes</CardTitle>
                <CardDescription>Resolve these issues to see the biggest impact on your ranking.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   <div className="text-muted-foreground text-sm">Run a scan and navigate to the Issues page to view full details.</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle>Page Inventory</CardTitle>
                <CardDescription>All crawled pages and their individual SEO health.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Pages list will appear here</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                    The full inventory of crawled pages will be available in the Pages section.
                  </p>
                  <Button className="mt-6" asChild>
                    <Link to="/pages">Go to Pages Database</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>Manage domain configuration and crawl settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">Settings</h3>
                  <Button className="mt-4" asChild>
                    <Link to="/settings">Go to Global Settings</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
