import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveProject } from "@/hooks/use-active-project";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ShieldAlert, ShieldCheck, Activity, LineChart, TrendingUp, ArrowRight } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from "recharts";

export const Route = createFileRoute("/seo-health")({
  component: SeoHealthRoute,
});

const COLORS = {
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  info: "hsl(var(--primary))",
  muted: "hsl(var(--muted))"
};

function SeoHealthRoute() {
  const { activeProjectId } = useActiveProject();

  const { data: healthData, isLoading } = useQuery({
    queryKey: ['project-health', activeProjectId],
    queryFn: () => api.get(`/projects/${activeProjectId}/health`).then(res => res.data),
    enabled: !!activeProjectId,
  });

  const { data: gscStatus } = useQuery({
    queryKey: ['integration-status', activeProjectId, 'search-console'],
    queryFn: () => api.get(`/integrations/${activeProjectId}/search-console/status`).then(res => res.data),
    enabled: !!activeProjectId,
  });

  const { data: gaStatus } = useQuery({
    queryKey: ['integration-status', activeProjectId, 'analytics'],
    queryFn: () => api.get(`/integrations/${activeProjectId}/analytics/status`).then(res => res.data),
    enabled: !!activeProjectId,
  });

  const { data: psStatus } = useQuery({
    queryKey: ['integration-status', activeProjectId, 'pagespeed'],
    queryFn: () => api.get(`/integrations/${activeProjectId}/pagespeed/status`).then(res => res.data),
    enabled: !!activeProjectId,
  });

  if (!activeProjectId) {
    return (
      <AppShell title="SEO Health Center" description="Select a project to view its SEO health.">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Activity className="size-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
          <p className="text-muted-foreground mb-6">Please select or create a project to view its health metrics.</p>
          <Button asChild><Link to="/projects">View Projects</Link></Button>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell title="SEO Health Center" description="Loading comprehensive health overview...">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-80 rounded-xl md:col-span-2 lg:col-span-3" />
        </div>
      </AppShell>
    );
  }

  const health = healthData?.data || healthData;

  if (!health || health.status === 'no_data') {
    return (
      <AppShell title="SEO Health Center" description="No health data available.">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-card rounded-xl border border-border shadow-sm p-8">
          <ShieldAlert className="size-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Scan Data</h2>
          <p className="text-muted-foreground mb-6 max-w-md">We need to run a crawl of your website before we can generate the SEO Health profile.</p>
          <Button asChild className="gap-2 shadow-sm"><Link to="/scan">Start New Audit</Link></Button>
        </div>
      </AppShell>
    );
  }

  const score = health.score?.overallScore || 0;
  
  const issueDistributionData = [
    { name: 'Critical', value: health.severityDistribution?.CRITICAL || 0, color: COLORS.destructive },
    { name: 'Warning', value: health.severityDistribution?.WARNING || 0, color: COLORS.warning },
    { name: 'Info', value: health.severityDistribution?.INFO || 0, color: COLORS.info },
  ].filter(d => d.value > 0);

  return (
    <AppShell
      title="SEO Health Center"
      description="Complete overview of your website's search engine optimization status."
      actions={
        <Button variant="outline" className="gap-2" asChild>
          <Link to="/issues">View All Issues</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overall Score */}
        <Card className="flex flex-col items-center justify-center text-center shadow-md border-primary/20 bg-gradient-to-br from-card to-primary/5 lg:col-span-1">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-bold">Overall SEO Health</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-8">
            <div className="relative size-48 mb-4 mx-auto">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted/50" strokeWidth="3"></circle>
                <circle cx="18" cy="18" r="16" fill="none" className={score >= 90 ? "stroke-success" : score >= 70 ? "stroke-warning" : "stroke-destructive"} strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - score} strokeLinecap="round"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-6xl font-bold font-display tracking-tighter ${score >= 90 ? 'text-success' : score >= 70 ? 'text-warning' : 'text-destructive'}`}>{score}</span>
                <span className="text-sm font-medium text-muted-foreground mt-1">/ 100</span>
              </div>
            </div>
            <p className="text-sm text-foreground/90 font-medium">
              {score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Improvement'}
            </p>
          </CardContent>
        </Card>

        {/* Categories Breakdown */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
             <CardTitle className="flex items-center gap-2"><Activity className="size-5 text-primary" /> Category Breakdown</CardTitle>
             <CardDescription>Detailed SEO performance by technical and content categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               <CategoryScoreCard 
                 title="Technical SEO" 
                 score={health.score?.technicalScore || 0} 
                 explanation={health.explanations?.technical}
                 href={`/issues?category=Technical`}
                 source={{ name: "SEO Brilliance Crawler", status: "CONNECTED" }}
               />
               <CategoryScoreCard 
                 title="Content SEO" 
                 score={health.score?.contentScore || 0} 
                 explanation={health.explanations?.content}
                 href={`/issues?category=Content`}
                 source={{ name: "SEO Brilliance Crawler", status: "CONNECTED" }}
               />
               <CategoryScoreCard 
                 title="Performance" 
                 score={(psStatus?.data?.status || psStatus?.status) === 'CONNECTED' ? (health.score?.performanceScore || 'No data') : 'Locked'} 
                 explanation={{ problems: [], strengths: [] }}
                 href={`/projects`}
                 source={{ name: "PageSpeed Insights", status: (psStatus?.data?.status || psStatus?.status) as any }}
               />
               <CategoryScoreCard 
                 title="Search Visibility" 
                 score={(gscStatus?.data?.status || gscStatus?.status) === 'CONNECTED' ? 'Active' : 'Locked'} 
                 explanation={{ problems: [], strengths: [] }}
                 href={`/search-console`}
                 source={{ name: "Google Search Console", status: (gscStatus?.data?.status || gscStatus?.status) as any }}
               />
               <CategoryScoreCard 
                 title="Traffic" 
                 score={(gaStatus?.data?.status || gaStatus?.status) === 'CONNECTED' ? 'Active' : 'Locked'} 
                 explanation={{ problems: [], strengths: [] }}
                 href={`/analytics`}
                 source={{ name: "Google Analytics", status: (gaStatus?.data?.status || gaStatus?.status) as any }}
               />
               <CategoryScoreCard 
                 title="Authority" 
                 score={'Locked'} 
                 explanation={{ problems: [], strengths: [] }}
                 href={`/integrations`}
                 source={{ name: "SEO Provider", status: 'DISCONNECTED' }}
               />
            </div>
          </CardContent>
        </Card>
        
        {/* Severity Distribution */}
        <Card className="lg:col-span-1 shadow-sm border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Issues Severity</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            {issueDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={issueDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {issueDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No issues found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function CategoryScoreCard({ title, score, explanation, href, source }: { title: string, score: number | string, explanation: any, href: string, source?: { name: string, status: 'CONNECTED'|'DISCONNECTED', connectHref?: string } }) {
  const getScoreColor = (s: number | string) => {
    if (typeof s === 'string') return 'text-muted-foreground';
    return s >= 90 ? 'text-success' : s >= 70 ? 'text-warning' : 'text-destructive';
  };
  
  return (
    <div className="border border-border rounded-lg p-4 bg-muted/20 flex flex-col h-full hover:border-primary/30 transition-colors">
       <div className="flex justify-between items-start mb-2">
         <h3 className="font-semibold text-foreground">{title}</h3>
         <div className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</div>
       </div>
       
       {source && (
         <div className="mb-4">
           {source.status === 'CONNECTED' ? (
             <Badge variant="outline" className="text-[10px] py-0 h-5 bg-background font-normal text-muted-foreground border-border gap-1">
               <CheckCircle2 className="size-3 text-success" />
               Source: {source.name}
             </Badge>
           ) : (
             <Link to={source.connectHref || "/integrations"} className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline">
               Connect {source.name} to unlock <ArrowRight className="size-3" />
             </Link>
           )}
         </div>
       )}
       
       <div className="flex-1 space-y-3 text-sm">
         {explanation?.problems?.length > 0 && (
           <div>
             <span className="text-xs font-semibold text-destructive uppercase tracking-wider">Problems</span>
             <ul className="mt-1 space-y-1">
               {explanation.problems.map((p: string, i: number) => (
                 <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                   <span className="text-destructive font-bold mt-0.5">•</span> {p}
                 </li>
               ))}
             </ul>
           </div>
         )}
         
         {explanation?.strengths?.length > 0 && (
           <div>
             <span className="text-xs font-semibold text-success uppercase tracking-wider">Strengths</span>
             <ul className="mt-1 space-y-1">
               {explanation.strengths.map((s: string, i: number) => s ? (
                 <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                   <CheckCircle2 className="size-3.5 text-success mt-0.5 shrink-0" /> {s}
                 </li>
               ) : null)}
             </ul>
           </div>
         )}
         
         {(!explanation?.problems?.length && !explanation?.strengths?.length) && (
           <p className="text-muted-foreground text-xs italic">No specific insights available.</p>
         )}
       </div>
       
       <div className="mt-4 pt-3 border-t border-border">
         <Link to={href} className="text-primary hover:underline text-xs font-medium flex items-center gap-1">
           View Issues &rarr;
         </Link>
       </div>
    </div>
  );
}
