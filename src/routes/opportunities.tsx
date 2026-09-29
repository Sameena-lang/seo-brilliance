import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveProject } from "@/hooks/use-active-project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, ArrowRight, TrendingUp, Target, Bot, Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';

export const Route = createFileRoute("/opportunities")({
  component: OpportunitiesRoute,
});

function AIOpportunityExplanation({ opp }: { opp: any }) {
  const [explanation, setExplanation] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExplain = async () => {
    setIsGenerating(true);
    try {
      const issueContext = `Opportunity: ${opp.title}\nAffected Pages: ${opp.affectedPages}\nSeverity: ${opp.severity}`;
      const res = await api.post('/ai/explain-issue', { issueContext });
      setExplanation(res.data?.data || "Failed to analyze.");
    } catch (e) {
      setExplanation("AI analysis is temporarily unavailable.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!explanation && !isGenerating) {
    return (
      <Button variant="ghost" size="sm" onClick={handleExplain} className="gap-2 text-primary hover:text-primary hover:bg-primary/10">
        <Sparkles className="size-4" /> Explain Opportunity
      </Button>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 w-full">
      <div className="flex items-center gap-2 text-primary font-medium mb-2">
        <Bot className="size-4" /> AI Explanation
      </div>
      {isGenerating ? (
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse text-sm">
          <RefreshCw className="size-4 animate-spin" /> Analyzing opportunity...
        </div>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
          <ReactMarkdown>{explanation}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function OpportunitiesRoute() {
  const { activeProjectId } = useActiveProject();

  const { data: oppsRes, isLoading } = useQuery({
    queryKey: ['project-opportunities', activeProjectId],
    queryFn: () => api.get(`/projects/${activeProjectId}/opportunities`).then(res => res.data),
    enabled: !!activeProjectId,
  });

  const opportunities = Array.isArray(oppsRes) ? oppsRes : (oppsRes?.data || []);

  return (
    <AppShell
      title="SEO Opportunities"
      description="Actionable improvements prioritized by impact."
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Target className="size-5 text-primary" />
            <span>Found <strong>{opportunities.length}</strong> distinct opportunity areas.</span>
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardHeader className="pb-3"><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
              </Card>
            ))
          ) : opportunities.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Lightbulb className="size-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground">No opportunities found</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                {activeProjectId ? "Your site is well optimized or no scan has been run yet." : "Please select a project."}
              </p>
            </div>
          ) : (
            opportunities.map((opp: any, idx: number) => (
              <Card key={idx} className="group overflow-hidden border-border/60 hover:border-primary/30 transition-all shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 bg-muted/20">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Lightbulb className={`size-5 ${opp.priority === 'High' ? 'text-destructive' : opp.priority === 'Medium' ? 'text-warning' : 'text-blue-500'}`} />
                      <CardTitle className="text-lg">{opp.title}</CardTitle>
                    </div>
                  </div>
                  <Badge variant={opp.priority === 'High' ? 'destructive' : opp.priority === 'Medium' ? 'secondary' : 'outline'} className={opp.priority === 'Medium' ? 'bg-warning/20 text-warning-foreground' : ''}>
                    {opp.priority} Priority
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full">
                    <div className="text-sm text-muted-foreground max-w-2xl w-full">
                      <p className="mb-2"><strong>Problem:</strong> {opp.affectedPages} pages are affected by this issue.</p>
                      <p><strong>Action:</strong> Fix these issues to improve {opp.severity === 'CRITICAL' ? 'critical technical health' : 'on-page optimization'}.</p>
                      <AIOpportunityExplanation opp={opp} />
                    </div>
                    <div className="flex shrink-0">
                      <Button variant="outline" className="gap-2" asChild>
                        <Link to="/issues" search={{ category: opp.ruleCode?.split('-')[0] }}>
                          View Issues <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
