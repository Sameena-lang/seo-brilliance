import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Bot, Check, ChevronDown, FileCode2, ExternalLink, Sparkles, Terminal, BookOpen, Lightbulb, Code } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/issues/$issueId")({
  component: IssueDetailsRoute,
});

function IssueDetailsRoute() {
  const { issueId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: issueRes, isLoading } = useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => api.get(`/issues/${issueId}`).then(res => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/issues/${issueId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    }
  });

  if (isLoading) {
    return (
      <AppShell title="Loading Issue..." description="Please wait">
        <div className="flex justify-center py-12"><div className="animate-spin text-primary">...</div></div>
      </AppShell>
    );
  }

  const issue = issueRes;
  
  if (!issue) {
    return (
      <AppShell title="Issue Not Found" description="The issue you requested does not exist.">
        <div className="text-center py-8">
          <Button asChild><Link to="/issues">Back to Issues</Link></Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={issue.title}
      description={`Found on ${issue.page?.url || 'a page'}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate({ to: '/issues' })}>
            <ArrowLeft className="size-4" />
            All Issues
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={issue.severity === 'CRITICAL' ? 'destructive' : issue.severity === 'WARNING' ? 'secondary' : 'outline'} className={issue.severity === 'WARNING' ? 'bg-warning/20 text-warning-foreground' : ''}>
                  {issue.severity} Severity
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">ID: {issue.ruleCode}</span>
              </div>
              <CardTitle className="text-xl">What is the issue?</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                {issue.title} was detected on your website. 
              </p>
              {issue.evidence && (
                <>
                  <h4 className="font-semibold text-foreground text-base mt-6">Evidence</h4>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs border border-border">
                    {JSON.stringify(issue.evidence, null, 2)}
                  </pre>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {issue.whyItMatters && (
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <BookOpen className="size-4 text-primary" />
                    <CardTitle className="text-lg">Why it Matters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {issue.whyItMatters}
                  </p>
                </CardContent>
              </Card>
            )}

            {issue.howToFix && (
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <Lightbulb className="size-4 text-warning" />
                    <CardTitle className="text-lg">How to Fix</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {issue.howToFix}
                  </p>
                </CardContent>
              </Card>
            )}

            {issue.example && (
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <Code className="size-4 text-success" />
                    <CardTitle className="text-lg">Example</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono text-muted-foreground border border-border">
                    {issue.example}
                  </pre>
                </CardContent>
              </Card>
            )}
            
            {/* Fallback for AI recommendation if the others are missing */}
            {!issue.whyItMatters && !issue.howToFix && issue.recommendation && (
              <Card className="border-primary/20 shadow-md">
                <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                  <div className="flex items-center gap-2">
                    <Bot className="size-5 text-primary" />
                    <CardTitle className="text-lg text-primary">AI Recommendation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-foreground">
                      {issue.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Affected URL</CardTitle>
              <CardDescription>Page where this issue was detected.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">URL</th>
                      <th className="px-4 py-3 font-medium w-[100px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-foreground truncate max-w-[200px] sm:max-w-[400px]">
                        {issue.page?.url}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                          <a href={issue.page?.url} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4 text-muted-foreground" />
                          </a>
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issue Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{issue.ruleCode?.split('-')[0] || 'SEO'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">First Detected</span>
                <span className="font-medium">{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={issue.status === 'OPEN' ? "text-destructive border-destructive/20 bg-destructive/10" : "text-success border-success/20 bg-success/10"}>{issue.status}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Issue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Change the status of this issue if you have resolved it or wish to ignore it.</p>
              
              {issue.status === 'OPEN' ? (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 gap-2 border-success/50 text-success hover:bg-success/10"
                    onClick={() => updateStatusMutation.mutate('FIXED')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Check className="size-4" />
                    Mark as Fixed
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full gap-2 text-muted-foreground"
                    onClick={() => updateStatusMutation.mutate('IGNORED')}
                    disabled={updateStatusMutation.isPending}
                  >
                    Ignore Issue
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full mt-4 gap-2"
                  onClick={() => updateStatusMutation.mutate('OPEN')}
                  disabled={updateStatusMutation.isPending}
                >
                  Reopen Issue
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
