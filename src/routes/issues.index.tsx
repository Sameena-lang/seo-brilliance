import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, Filter, Info, Search, Sparkles, FileText, ArrowRight, BookOpen, Lightbulb } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

import { useActiveProject } from "@/hooks/use-active-project";

export const Route = createFileRoute("/issues/")({
  component: IssuesRoute,
});

function IssuesRoute() {
  const search: any = Route.useSearch();
  const scanId = search?.scanId;
  const { activeProject } = useActiveProject();

  const { data: issuesRes, isLoading } = useQuery({
    queryKey: ['issues', scanId, activeProject?.id],
    queryFn: () => {
      const url = scanId ? `/scans/${scanId}/issues` : `/issues?projectId=${activeProject?.id || ''}`;
      return api.get(url).then(res => res.data);
    },
    refetchInterval: 5000,
  });

  let issues = issuesRes?.issues || [];

  if (search?.category) {
    const targetCat = search.category.toLowerCase();
    issues = issues.filter((issue: any) => {
      let catKey = 'Technical';
      if (!issue.ruleCode) return true;
      if (issue.ruleCode.includes('TITLE') || issue.ruleCode.includes('META') || issue.ruleCode.includes('H1') || issue.ruleCode.includes('WORD_COUNT')) catKey = 'Content';
      else if (issue.ruleCode.includes('INDEX') || issue.ruleCode.includes('CANONICAL') || issue.ruleCode.includes('ROBOTS')) catKey = 'Indexability';
      
      return catKey.toLowerCase() === targetCat;
    });
  }

  return (
    <AppShell
      title="Issues Center"
      description={scanId ? "Issues from the selected scan." : "All discovered SEO issues across your monitored projects."}
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative w-full max-w-md flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search issues by name or URL..."
                className="pl-9 bg-background"
              />
            </div>
            <Button variant="outline" className="gap-2 shrink-0">
              <Filter className="size-4" />
              Filters
            </Button>
          </div>
          <div className="flex gap-2">
             <Badge variant="outline" className="px-3 py-1 text-sm bg-destructive/10 text-destructive border-destructive/20 cursor-pointer hover:bg-destructive/20">Critical</Badge>
             <Badge variant="outline" className="px-3 py-1 text-sm bg-warning/10 text-warning-foreground border-warning/20 cursor-pointer hover:bg-warning/20">Warnings</Badge>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border shadow-sm">
                <CardHeader className="pb-3">
                   <div className="flex justify-between"><Skeleton className="h-5 w-40" /><Skeleton className="h-5 w-20" /></div>
                   <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent><Skeleton className="h-16 w-full" /></CardContent>
              </Card>
            ))
          ) : issues.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                 <Sparkles className="size-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">No issues found</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Great job! We couldn't find any SEO issues matching your current filters.</p>
            </div>
          ) : (
            issues.map((issue: any) => (
              <Card key={issue.id} className="group overflow-hidden border-border/60 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className={`h-1 w-full ${issue.severity === 'CRITICAL' ? 'bg-destructive' : issue.severity === 'WARNING' ? 'bg-warning' : 'bg-blue-500'}`} />
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {issue.severity === "CRITICAL" ? (
                        <AlertCircle className="size-5 text-destructive shrink-0" />
                      ) : issue.severity === "WARNING" ? (
                        <AlertTriangle className="size-5 text-warning shrink-0" />
                      ) : (
                        <Info className="size-5 text-blue-500 shrink-0" />
                      )}
                      <h3 className="text-lg font-semibold text-foreground leading-none">{issue.title}</h3>
                      <Badge variant="outline" className="ml-2 bg-muted text-xs font-mono">{issue.ruleCode || 'SEO'}</Badge>
                    </div>
                  </div>
                  <Badge variant={issue.severity === "CRITICAL" ? "destructive" : issue.severity === "WARNING" ? "secondary" : "outline"} className={issue.severity === "WARNING" ? "bg-warning/20 text-warning-foreground hover:bg-warning/30" : "shrink-0"}>
                    {issue.severity}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {issue.whyItMatters && (
                    <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground border border-border/50 flex gap-3 items-start">
                      <BookOpen className="size-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground block mb-1">Description</span>
                        {issue.whyItMatters}
                      </div>
                    </div>
                  )}
                  {issue.howToFix && (
                    <div className="bg-primary/5 rounded-lg p-3 text-sm text-foreground/90 border border-primary/10 flex gap-3 items-start">
                      <Lightbulb className="size-4 text-warning shrink-0 mt-0.5" />
                      <div>
                         <span className="font-semibold text-primary block mb-1">Recommendation</span>
                         {issue.howToFix}
                      </div>
                    </div>
                  )}
                  
                  {!issue.howToFix && issue.recommendation && (
                     <div className="bg-primary/5 rounded-lg p-3 text-sm text-foreground/90 border border-primary/10 flex gap-3 items-start">
                      <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                      <div>
                         <span className="font-semibold text-primary block mb-1">AI Insight</span>
                         {issue.recommendation}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    <FileText className="size-4 shrink-0" />
                    <span className="font-medium">Affected Page:</span>
                    <a href={issue.page?.url} target="_blank" rel="noreferrer" className="truncate hover:text-primary hover:underline max-w-[300px] sm:max-w-md">
                      {issue.page?.url}
                    </a>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t border-border/50 py-3 flex justify-between items-center">
                   <div className="text-xs text-muted-foreground font-medium">
                     {issue.status === 'OPEN' ? 'Needs Attention' : 'Resolved'}
                   </div>
                   <Button size="sm" variant={issue.status === 'OPEN' ? 'default' : 'outline'} className={issue.status === 'OPEN' ? "shadow-sm" : ""} asChild>
                     <Link to="/issues/$issueId" params={{ issueId: issue.id }} className="gap-2">
                       {issue.status === 'OPEN' ? 'Review & Fix' : 'View Details'} <ArrowRight className="size-3.5" />
                     </Link>
                   </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
