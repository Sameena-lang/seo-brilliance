import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Globe, ShieldAlert, ShieldCheck, Zap, FileText as FileTextIcon, Activity, Radar } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

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
  
  // Create chart data from real recent scans (reverse to show chronological order)
  const chartData = [...recentScans].reverse().map((scan: any) => ({
    name: scan.project?.domain || 'Unknown',
    date: new Date(scan.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: scan.siteScore?.overallScore || 0,
  })).filter(d => d.score > 0);

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
          {[
            { title: "Avg SEO Score", icon: BarChart3, value: overview.averageSeoScore ? `${overview.averageSeoScore}/100` : "0", desc: "Across all projects", color: "text-primary", bg: "bg-primary/10" },
            { title: "Active Projects", icon: Globe, value: overview.totalProjects, desc: "Total projects monitored", color: "text-blue-500", bg: "bg-blue-500/10" },
            { title: "Pages Crawled", icon: FileTextIcon, value: overview.pagesCrawled.toLocaleString(), desc: "In completed scans", color: "text-indigo-500", bg: "bg-indigo-500/10" },
            { title: "Critical Issues", icon: ShieldAlert, value: overview.criticalIssues, desc: "Require immediate action", color: "text-destructive", bg: "bg-destructive/10" },
            { title: "Warnings", icon: ShieldAlert, value: overview.warningIssues, desc: "Should be reviewed", color: "text-warning", bg: "bg-warning/10" },
          ].map((kpi, i) => (
            <Card key={i} className="group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <div className={`flex size-8 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`size-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loadingOverview ? (
                  <Skeleton className="h-8 w-20 mb-2" />
                ) : (
                  <div className="text-3xl font-bold tracking-tight text-foreground">{kpi.value}</div>
                )}
                {loadingOverview ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    {kpi.desc}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts & Scores */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4 border-muted/60 shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="size-5 text-primary" />
                Recent Scans Performance
              </CardTitle>
              <CardDescription>Scores from your latest website audits.</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 flex-1 min-h-[300px]">
              {loadingScans ? (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-[250px] w-full rounded-xl" />
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} dx={-10} domain={[0, 100]} />
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "12px", boxShadow: "var(--shadow-card)" }}
                        itemStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
                        cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '5 5' }}
                        labelStyle={{ color: "var(--color-muted-foreground)", marginBottom: 4 }}
                        formatter={(value: any, name: any, props: any) => [value, props.payload.name]}
                      />
                      <Area type="monotone" dataKey="score" name="SEO Score" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-muted/50 p-4 mb-4">
                    <BarChart3 className="size-8 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No chart data available</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete a scan to see your performance over time.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-3 border-muted/60 shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Issues Overview</CardTitle>
              <CardDescription>Current status of issues across your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1">
              {[
                { label: "Critical Issues", icon: ShieldAlert, value: overview.criticalIssues, color: "bg-destructive", textColor: "text-destructive" },
                { label: "Warnings", icon: ShieldAlert, value: overview.warningIssues, color: "bg-warning", textColor: "text-warning" },
                { label: "Pages Crawled", icon: Globe, value: overview.pagesCrawled, color: "bg-primary", textColor: "text-primary" },
              ].map((metric, i) => (
                <div key={i} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex size-7 items-center justify-center rounded-md ${metric.textColor.replace('text-', 'bg-')}/10`}>
                        <metric.icon className={`size-3.5 ${metric.textColor}`} />
                      </div>
                      <span className="text-sm font-semibold">{metric.label}</span>
                    </div>
                    <span className="text-sm font-bold tracking-tight">{metric.value.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              
              <div className="mt-8 rounded-xl bg-muted/40 p-4 border border-border/50">
                <h4 className="text-sm font-semibold mb-2">Workspace Health</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  {overview.averageSeoScore >= 80 ? "Your overall workspace SEO health is excellent. Keep up the good work!" : 
                   overview.averageSeoScore >= 60 ? "Your workspace has fair SEO health. Focus on fixing critical issues." : 
                   overview.averageSeoScore > 0 ? "Your workspace needs immediate attention to improve SEO health." :
                   "Run your first audit to see your workspace health."}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Score</span>
                  <span className={`text-sm font-bold ${overview.averageSeoScore >= 80 ? 'text-success' : overview.averageSeoScore >= 60 ? 'text-warning' : 'text-destructive'}`}>
                    {overview.averageSeoScore > 0 ? `${overview.averageSeoScore}/100` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-6 px-6 border-t border-border/50">
              <Button variant="ghost" className="w-full text-xs font-semibold text-primary hover:text-primary hover:bg-primary/5 transition-colors" asChild>
                 <Link to="/issues">View All Issues <ArrowRight className="ml-1.5 size-3.5" /></Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Recent Scans Table */}
        <Card className="border-muted/60 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg">Recent Audits</CardTitle>
            <CardDescription>Status of the latest website audits in your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Pages</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-background">
                  {loadingScans ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                        <td className="px-6 py-4 hidden sm:table-cell"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : recentScans.map((scan: any) => (
                    <tr key={scan.id} className="group transition-colors hover:bg-muted/40">
                      <td className="px-6 py-4 font-medium">
                         <Link to="/projects/$projectId" params={{ projectId: scan.projectId }} className="hover:text-primary hover:underline transition-colors">
                           {scan.project.domain}
                         </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={scan.status === "COMPLETED" ? "default" : scan.status === "RUNNING" || scan.status === "PENDING" ? "secondary" : "destructive"} 
                          className="text-[10px] uppercase tracking-wide font-semibold"
                        >
                          {scan.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">{scan.pagesCrawled.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        <span className={scan.siteScore?.overallScore >= 80 ? 'text-success' : scan.siteScore?.overallScore >= 60 ? 'text-warning' : scan.siteScore?.overallScore ? 'text-destructive' : 'text-muted-foreground'}>
                          {scan.siteScore?.overallScore || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted-foreground font-medium">
                         {new Date(scan.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {!loadingScans && recentScans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <Radar className="size-8 text-muted-foreground/50 mb-3" />
                          <p className="font-medium text-foreground">No scans completed yet</p>
                          <p className="text-xs mt-1">Run your first audit to see data here.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}


