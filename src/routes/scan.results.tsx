import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronRight, FileText, Globe, Search, ShieldAlert, ShieldCheck, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveProject } from "@/hooks/use-active-project";
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

export const Route = createFileRoute("/scan/results")({
  component: ScanResultsRoute,
});

const COLORS = {
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  info: "hsl(var(--primary))",
  muted: "hsl(var(--muted))"
};

function ScanResultsRoute() {
  const search: any = Route.useSearch();
  const urlScanId = search?.scanId;
  const urlProjectId = search?.projectId;

  const { activeProject } = useActiveProject();
  const effectiveProjectId = urlProjectId || activeProject?.id;

  // If no scanId in URL, fetch the project to get its latest scan
  const { data: projectData } = useQuery({
    queryKey: ['project', effectiveProjectId],
    queryFn: () => api.get(`/projects/${effectiveProjectId}`).then(res => res.data),
    enabled: !urlScanId && !!effectiveProjectId,
  });

  const scanId = urlScanId || (projectData?.scans?.[0]?.id);

  const { data: scanRes, isLoading } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => api.get(`/scans/${scanId}`).then(res => res.data),
    enabled: !!scanId,
  });

  const scan = scanRes || {};
  const score = scan.siteScore?.overallScore || 0;
  
  const siteScore = scan?.siteScore || {};
  const pageInventory = scan?.pageInventory || {};
  const topIssues = scan?.topIssues || [];
  
  const pagesCrawled = scan.pagesCrawled || 0;
  const issuesFound = scan.issuesFound || 0;

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

  return (
    <AppShell
      title={!scanId ? "No Audit" : pagesCrawled === 0 ? "Audit Failed" : "Audit Complete"}
      description={!scanId ? "No scan data available" : pagesCrawled === 0 ? "Crawler could not access the site" : "Scan finished successfully"}
      actions={
        <div className="flex gap-2">
           <Button variant="outline" asChild>
             <Link to="/projects/$projectId" params={{ projectId: effectiveProjectId || "p1" }}>View Project</Link>
           </Button>
           <Button className="gap-2 shadow-md shadow-primary/20 bg-gradient-to-r from-primary to-primary/80" asChild>
             <Link to="/issues">
               Review Issues <ArrowRight className="size-4" />
             </Link>
           </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
        <div className="text-center py-8">
          {!scanId ? (
            <>
               <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                  <Search className="size-16 text-muted-foreground" />
               </div>
               <h2 className="text-3xl font-display font-bold">No Audit Data</h2>
               <p className="text-muted-foreground mt-2">Run a new scan to see the results here.</p>
               <Button className="mt-6" asChild>
                 <Link to="/scan">Run New Scan</Link>
               </Button>
            </>
          ) : pagesCrawled === 0 ? (
            <>
               <div className="inline-flex items-center justify-center p-4 bg-destructive/20 rounded-full mb-4">
                  <ShieldAlert className="size-16 text-destructive" />
               </div>
               <h2 className="text-3xl font-display font-bold text-destructive">Audit Failed</h2>
               <p className="text-muted-foreground mt-2">We couldn't crawl any pages on this website. The site might be blocking bots or is unreachable.</p>
            </>
          ) : (
            <>
               <div className="inline-flex items-center justify-center p-4 bg-success/20 rounded-full mb-4">
                  <CheckCircle2 className="size-16 text-success" />
               </div>
               <h2 className="text-3xl font-display font-bold">Audit Completed Successfully</h2>
               <p className="text-muted-foreground mt-2">We crawled {pagesCrawled.toLocaleString()} pages and found {issuesFound.toLocaleString()} issues.</p>
            </>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-primary/20 shadow-lg flex flex-col justify-center items-center text-center md:col-span-1">
            <CardHeader className="pb-0 w-full">
              <CardTitle className="text-lg font-medium text-foreground/80">Overall SEO Score</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center w-full">
              <div className="relative size-40 mb-4">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="3"></circle>
                  <circle cx="18" cy="18" r="16" fill="none" className={score >= 90 ? "stroke-success" : score >= 70 ? "stroke-warning" : "stroke-destructive"} strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - score} strokeLinecap="round"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-bold font-display tracking-tighter ${score >= 90 ? 'text-success' : score >= 70 ? 'text-warning' : 'text-destructive'}`}>{score}</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-foreground/90 bg-muted rounded-full px-3 py-1 inline-block">
                {score >= 90 ? 'Excellent Health' : score >= 70 ? 'Good Health' : 'Needs Improvement'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart2 className="size-4 text-muted-foreground" /> Category Scores</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
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
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-4">
           <Card className="border-destructive/20 shadow-sm">
             <CardHeader className="pb-3 border-b border-border bg-destructive/5 rounded-t-xl">
               <div className="flex items-center gap-2">
                 <ShieldAlert className="size-5 text-destructive" />
                 <CardTitle className="text-lg">Issues Distribution</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-4 h-[250px]">
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
             <CardFooter className="pt-2">
               <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" asChild>
                 <Link to="/issues">Review and Fix</Link>
               </Button>
             </CardFooter>
           </Card>

           <Card className="border-success/20 shadow-sm">
             <CardHeader className="pb-3 border-b border-border bg-success/5 rounded-t-xl">
               <div className="flex items-center gap-2">
                 <ShieldCheck className="size-5 text-success" />
                 <CardTitle className="text-lg">Page Inventory Highlights</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-4">
               <div className="text-4xl font-bold mb-4">Good</div>
               <ul className="space-y-4">
                 <li className="flex items-center justify-between text-sm">
                   <span className="font-medium text-muted-foreground">Indexable Pages</span>
                   <span className="font-bold">{pageInventory.indexable || 0}</span>
                 </li>
                 <li className="flex items-center justify-between text-sm">
                   <span className="font-medium text-muted-foreground">Non-Indexable Pages</span>
                   <span className="font-bold">{pageInventory.nonIndexable || 0}</span>
                 </li>
                 <li className="flex items-center justify-between text-sm">
                   <span className="font-medium text-muted-foreground">Healthy Pages (200 OK)</span>
                   <span className="font-bold text-success">{pageInventory.status200 || 0}</span>
                 </li>
               </ul>
             </CardContent>
             <CardFooter className="pt-2 mt-auto">
               <Button variant="ghost" className="w-full text-success hover:text-success hover:bg-success/10" asChild>
                 <Link to="/reports">View Full Audit Report</Link>
               </Button>
             </CardFooter>
           </Card>
        </div>
      </div>
    </AppShell>
  );
}
