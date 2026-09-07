import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronRight, FileText, Globe, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/scan/results")({
  component: ScanResultsRoute,
});

function ScanResultsRoute() {
  const search: any = Route.useSearch();
  const scanId = search?.scanId;
  const projectId = search?.projectId;

  const { data: scanRes, isLoading } = useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => api.get(`/scans/${scanId}`).then(res => res.data),
    enabled: !!scanId,
  });

  const scan = scanRes || {};
  const score = scan.siteScore?.overallScore || 0;
  const techScore = scan.siteScore?.technicalScore || 0;
  const contentScore = scan.siteScore?.contentScore || 0;
  const perfScore = scan.siteScore?.performanceScore || 0;
  
  const pagesCrawled = scan.pagesCrawled || 0;
  const issuesFound = scan.issuesFound || 0;

  return (
    <AppShell
      title="Audit Complete"
      description={`Scan finished for project`}
      actions={
        <div className="flex gap-2">
           <Button variant="outline" asChild>
             <Link to="/projects/$projectId" params={{ projectId: projectId || "p1" }}>View Project Details</Link>
           </Button>
           <Button className="gap-2 shadow-md shadow-primary/20 bg-gradient-to-r from-primary to-primary/80" asChild>
             <Link to="/issues">
               Review Issues <ArrowRight className="size-4" />
             </Link>
           </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
        <div className="text-center py-8">
           <div className="inline-flex items-center justify-center p-4 bg-success/20 rounded-full mb-4">
              <CheckCircle2 className="size-16 text-success" />
           </div>
           <h2 className="text-3xl font-display font-bold">Audit Completed Successfully</h2>
           <p className="text-muted-foreground mt-2">We crawled {pagesCrawled.toLocaleString()} pages.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-primary text-primary-foreground md:col-span-1 shadow-lg flex flex-col justify-center text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-primary-foreground/80">Overall SEO Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-center gap-1">
                <span className="text-7xl font-bold font-display tracking-tighter">{score}</span>
                <span className="text-2xl pb-2 text-primary-foreground/80">/100</span>
              </div>
              <p className="mt-4 text-sm text-primary-foreground/90 bg-black/10 rounded-full px-3 py-1 inline-block">
                {score >= 90 ? 'Excellent Health' : score >= 70 ? 'Good Health' : 'Needs Improvement'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Health by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Technical SEO</span>
                  <span className={`text-sm font-bold ${techScore >= 90 ? 'text-success' : techScore >= 70 ? 'text-warning' : 'text-destructive'}`}>{techScore}/100</span>
                </div>
                <Progress value={techScore} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Content Quality</span>
                  <span className={`text-sm font-bold ${contentScore >= 90 ? 'text-success' : contentScore >= 70 ? 'text-warning' : 'text-destructive'}`}>{contentScore}/100</span>
                </div>
                <Progress value={contentScore} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Performance</span>
                  <span className={`text-sm font-bold ${perfScore >= 90 ? 'text-success' : perfScore >= 70 ? 'text-warning' : 'text-destructive'}`}>{perfScore}/100</span>
                </div>
                <Progress value={perfScore} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-4">
           <Card className="border-destructive/20 shadow-sm">
             <CardHeader className="pb-3 border-b border-border bg-destructive/5 rounded-t-xl">
               <div className="flex items-center gap-2">
                 <ShieldAlert className="size-5 text-destructive" />
                 <CardTitle className="text-lg">Issues Found</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-4">
               <div className="text-4xl font-bold mb-4">{issuesFound}</div>
               <div className="text-sm text-muted-foreground">
                 Click below to review all the issues we discovered during the scan.
               </div>
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
                 <CardTitle className="text-lg">Passed Checks</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="pt-4">
               <div className="text-4xl font-bold mb-4">Good</div>
               <ul className="space-y-3">
                 <li className="flex items-center justify-between text-sm">
                   <span className="font-medium">HTTPS Status</span>
                   <span className="text-success text-xs font-semibold uppercase tracking-wider">Passed</span>
                 </li>
                 <li className="flex items-center justify-between text-sm">
                   <span className="font-medium">Robots.txt Format</span>
                   <span className="text-success text-xs font-semibold uppercase tracking-wider">Passed</span>
                 </li>
                 <li className="flex items-center justify-between text-sm">
                   <span className="font-medium">Mobile Responsiveness</span>
                   <span className="text-success text-xs font-semibold uppercase tracking-wider">Passed</span>
                 </li>
               </ul>
             </CardContent>
             <CardFooter className="pt-2">
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
