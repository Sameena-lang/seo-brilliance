import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Bot, Calendar, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/ai-action-plan")({
  component: AIActionPlanRoute,
});

function AIActionPlanRoute() {
  const [actionPlan, setActionPlan] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const { data: projectsRes } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data),
  });

  const latestProject = Array.isArray(projectsRes) ? projectsRes[0] : projectsRes?.data?.[0];
  const latestScanId = latestProject?.scans?.[0]?.id;

  const { data: issuesRes } = useQuery({
    queryKey: ['issues', latestScanId],
    queryFn: () => api.get(`/issues/${latestScanId}?limit=50`).then(res => res.data),
    enabled: !!latestScanId,
  });

  const issues = Array.isArray(issuesRes) ? issuesRes : (issuesRes?.data?.issues || issuesRes?.issues || []);

  const handleGenerate = async () => {
    if (!issues.length) return;
    
    setIsGenerating(true);
    setHasGenerated(true);

    try {
      const issuesContext = issues.slice(0, 20).map((i: any) => `- [${i.severity}] ${i.title} (${i.ruleCode}) on ${i.page?.url}`).join('\n');
      
      const response = await api.post('/ai/action-plan', { issuesContext });
      setActionPlan(response.data?.data || "Failed to generate action plan.");
    } catch (error) {
      console.error(error);
      setActionPlan("AI analysis is temporarily unavailable.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="size-8 text-primary" />
          AI SEO Action Plan
        </h1>
        <p className="text-muted-foreground mt-2">
          Your prioritized roadmap for SEO success, generated automatically from your latest audit.
        </p>
      </div>

      {!hasGenerated ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Bot className="size-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Ready to create your plan?</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              I will analyze your {issues.length} current open issues and organize them into a step-by-step prioritized roadmap.
            </p>
            <Button size="lg" onClick={handleGenerate} disabled={!issues.length} className="gap-2">
              <Sparkles className="size-4" />
              Generate Action Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="bg-primary/5 border-b pb-6">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Your Customized SEO Roadmap
            </CardTitle>
            <CardDescription>
              Based on {issues.length} issues found in the latest scan for {latestProject?.domain}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isGenerating ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ) : (
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-h3:text-primary prose-li:marker:text-primary">
                <ReactMarkdown>{actionPlan}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
