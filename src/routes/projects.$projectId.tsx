import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, AlertCircle, AlertTriangle, FileText, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectDetailsRoute,
});

const COLORS = {
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  info: "hsl(var(--primary))",
  muted: "hsl(var(--muted))"
};

function ProjectDetailsRoute() {
  const { projectId } = Route.useParams();
  
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(res => res.data),
  });

  const domain = project?.domain || "Loading...";
  const latestScan = project?.scans?.[0];
  
  const { data: scanDetails } = useQuery({
    queryKey: ['scan', latestScan?.id],
    queryFn: () => api.get(`/scans/${latestScan.id}`).then(res => res.data),
    enabled: !!latestScan?.id,
  });

  const score = scanDetails?.siteScore?.overallScore ?? 0;
  const pagesCrawled = scanDetails?.pagesCrawled ?? 0;
  const issuesFound = scanDetails?.issuesFound ?? 0;
  
  const siteScore = scanDetails?.siteScore || {};
  const pageInventory = scanDetails?.pageInventory || {};
  const topIssues = scanDetails?.topIssues || [];

  const categoryData = [
    { name: 'Technical', score: siteScore.technicalScore || 0 },
    { name: 'Content', score: siteScore.contentScore || 0 },
    { name: 'Performance', score: siteScore.performanceScore || 0 },
    { name: 'Indexability', score: siteScore.indexabilityScore || 0 },
    { name: 'Accessibility', score: siteScore.accessibilityScore || 0 },
    { name: 'Schema', score: siteScore.structuredDataScore || 0 },
  ];

  const issueDistributionData = [
    { name: 'Critical', value: siteScore.criticalCount || 0, color: COLORS.destructive },
    { name: 'Warning', value: siteScore.warningCount || 0, color: COLORS.warning },
    { name: 'Info', value: siteScore.infoCount || 0, color: COLORS.info },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: '200 OK', value: pageInventory.status200 || 0, color: COLORS.success },
    { name: '3xx Redirect', value: pageInventory.status3xx || 0, color: COLORS.info },
    { name: '4xx Error', value: pageInventory.status4xx || 0, color: COLORS.warning },
    { name: '5xx Error', value: pageInventory.status5xx || 0, color: COLORS.destructive },
  ].filter(d => d.value > 0);

  const indexabilityData = [
    { name: 'Indexable', value: pageInventory.indexable || 0, color: COLORS.success },
    { name: 'Non-Indexable', value: pageInventory.nonIndexable || 0, color: COLORS.muted },
  ].filter(d => d.value > 0);

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
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-1 border-primary/20 shadow-sm flex flex-col justify-center items-center text-center">
            <CardHeader className="pb-0 w-full">
              <CardTitle className="text-sm font-medium text-muted-foreground text-left">Overall SEO Score</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center w-full">
              <div className="relative size-32 mb-4">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="3"></circle>
                  <circle cx="18" cy="18" r="16" fill="none" className={score >= 90 ? "stroke-success" : score >= 70 ? "stroke-warning" : "stroke-destructive"} strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - score} strokeLinecap="round"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold font-display tracking-tighter ${score >= 90 ? 'text-success' : score >= 70 ? 'text-warning' : 'text-destructive'}`}>{latestScan ? score : '-'}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                {latestScan ? `${score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}` : 'No scan'}
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
                <div className="mt-2 text-sm text-muted-foreground">
                  {pageInventory.withIssues || 0} pages have issues.
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{issuesFound.toLocaleString()}</div>
                <div className="mt-2 text-sm flex gap-2">
                  <span className="text-destructive font-medium">{siteScore.criticalCount || 0} Critical</span>
                  <span className="text-warning font-medium">{siteScore.warningCount || 0} Warning</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {scanDetails ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4 bg-muted/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="issues">Issues by Category</TabsTrigger>
              <TabsTrigger value="pages">Page Inventory</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart2 className="size-4 text-muted-foreground" /> Category Scores</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => [`${value}/100`, 'Score']} />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.score >= 90 ? COLORS.success : entry.score >= 70 ? COLORS.warning : COLORS.destructive} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PieChartIcon className="size-4 text-muted-foreground" /> Issue Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {issueDistributionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={issueDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {issueDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No issues found!</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Priority Fixes</CardTitle>
                  <CardDescription>Resolve these issues to see the biggest impact on your ranking.</CardDescription>
                </CardHeader>
                <CardContent>
                  {topIssues.length > 0 ? (
                    <div className="space-y-4">
                      {topIssues.slice(0, 5).map((issue: any) => (
                        <div key={issue.ruleCode} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={issue.priority === 'CRITICAL' || issue.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                                {issue.priority} PRIORITY
                              </Badge>
                              <span className="font-semibold text-foreground">{issue.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{issue.affectedPages} pages affected</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/issues">View Issues</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm text-center py-8">No issues to display.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {categoryData.map((category) => (
                  <Card key={category.name}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <span className={`text-lg font-bold ${category.score >= 90 ? 'text-success' : category.score >= 80 ? 'text-warning' : 'text-destructive'}`}>
                        {category.score}
                      </span>
                    </CardHeader>
                    <CardContent>
                      <Progress value={category.score} className="h-1.5 mb-4" />
                      <div className="flex justify-end text-sm">
                        <Link to="/issues" className="text-primary hover:underline text-xs font-medium">View issues</Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="pages" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PieChartIcon className="size-4 text-muted-foreground" /> HTTP Status Codes</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px]">
                    {statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PieChartIcon className="size-4 text-muted-foreground" /> Indexability</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px]">
                    {indexabilityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={indexabilityData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
                            {indexabilityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data available</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Page Inventory</CardTitle>
                  <CardDescription>View all discovered URLs and their health.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <Button asChild>
                      <Link to="/pages">Browse All Pages</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Run a scan to view detailed charts and statistics.
          </div>
        )}
      </div>
    </AppShell>
  );
}

