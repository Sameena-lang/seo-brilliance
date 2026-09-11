import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Globe, ShieldAlert, ShieldCheck, Zap, FileText as FileTextIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

const seoData = [
  { date: "Jan", score: 72 },
  { date: "Feb", score: 75 },
  { date: "Mar", score: 79 },
  { date: "Apr", score: 85 },
  { date: "May", score: 84 },
  { date: "Jun", score: 89 },
  { date: "Jul", score: 92 },
];

function DashboardRoute() {
  const { data: overviewRes, isLoading: loadingOverview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.get('/dashboard/overview').then(res => res.data),
  });

  const { data: recentScansRes, isLoading: loadingScans } = useQuery({
    queryKey: ['dashboard-recent-scans'],
    queryFn: () => api.get('/dashboard/recent-scans').then(res => res.data),
  });

  const overview = overviewRes || {
    totalProjects: 0,
    totalScans: 0,
    averageSeoScore: 0,
    criticalIssues: 0,
    warningIssues: 0,
    pagesCrawled: 0,
  };

  const recentScans = recentScansRes || [];

  return (
    <AppShell
      title="Dashboard"
      description="Overview of your workspace SEO performance."
      actions={
        <Button asChild className="shadow-md shadow-primary/20">
          <Link to="/scan">Start New Audit</Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pb-8">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg SEO Score</CardTitle>
              <BarChart3 className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{overview.averageSeoScore}/100</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Globe className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{overview.totalProjects}</div>
              <p className="text-xs text-muted-foreground mt-1 text-muted-foreground">
                Total projects monitored
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pages Crawled</CardTitle>
              <FileTextIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{overview.pagesCrawled.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 text-muted-foreground">
                In completed scans
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <ShieldAlert className="size-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{overview.criticalIssues}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center text-muted-foreground">
                Require immediate action
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <ShieldAlert className="size-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{overview.warningIssues}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center text-muted-foreground">
                Should be reviewed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Scores */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>Average SEO Score Over Time</CardTitle>
              <CardDescription>Track the health of all your projects across the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={seoData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} dx={-10} domain={[50, 100]} />
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      itemStyle={{ color: "var(--color-foreground)" }}
                    />
                    <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle>Health Breakdown</CardTitle>
              <CardDescription>Average scores across all categories.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-primary" />
                    <span className="text-sm font-medium">Technical SEO</span>
                  </div>
                  <span className="text-sm font-bold">96/100</span>
                </div>
                <Progress value={96} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="size-4 text-primary" />
                    <span className="text-sm font-medium">Content Quality</span>
                  </div>
                  <span className="text-sm font-bold">88/100</span>
                </div>
                <Progress value={88} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span className="text-sm font-medium">Performance</span>
                  </div>
                  <span className="text-sm font-bold">92/100</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-primary" />
                    <span className="text-sm font-medium">Indexability</span>
                  </div>
                  <span className="text-sm font-bold">74/100</span>
                </div>
                <Progress value={74} className="h-2" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full text-xs" asChild>
                 <Link to="/reports">View Detailed Reports</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Priority Issues & Recent Scans */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-3 flex flex-col">
            <CardHeader>
              <CardTitle>Priority Issues</CardTitle>
              <CardDescription>Top issues to fix across all projects.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">Go to the Issues page to view all critical issues and warnings.</div>
              </div>
            </CardContent>
            <CardFooter>
               <Button variant="ghost" size="sm" className="w-full" asChild>
                 <Link to="/issues">View All Issues</Link>
               </Button>
            </CardFooter>
          </Card>
          
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>Status of the latest website audits.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-3 font-medium">Project</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Pages</th>
                      <th className="pb-3 font-medium">Score</th>
                      <th className="pb-3 font-medium text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loadingScans ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-muted-foreground">Loading scans...</td>
                      </tr>
                    ) : recentScans.map((scan: any) => (
                      <tr key={scan.id} className="group transition-colors hover:bg-muted/50">
                        <td className="py-3 font-medium">
                           <Link to="/projects/$projectId" params={{ projectId: scan.projectId }} className="hover:underline">
                             {scan.project.domain}
                           </Link>
                        </td>
                        <td className="py-3">
                          <Badge variant={scan.status === "COMPLETED" ? "default" : scan.status === "RUNNING" || scan.status === "PENDING" ? "secondary" : "destructive"} className="text-[10px] uppercase">
                            {scan.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">{scan.pagesCrawled}</td>
                        <td className="py-3 font-medium text-foreground">{scan.siteScore?.overallScore || '-'}</td>
                        <td className="py-3 text-right text-muted-foreground">
                           {new Date(scan.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {!loadingScans && recentScans.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-muted-foreground">No scans completed yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}


