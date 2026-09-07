import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, ChevronRight, Filter, Info, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/issues")({
  component: IssuesRoute,
});

function IssuesRoute() {
  const search: any = Route.useSearch();
  const scanId = search?.scanId;

  const { data: issuesRes, isLoading } = useQuery({
    queryKey: ['issues', scanId],
    queryFn: () => {
      const url = scanId ? `/scans/${scanId}/issues` : `/issues`;
      return api.get(url).then(res => res.data);
    },
  });

  const issues = issuesRes?.data?.issues || [];

  return (
    <AppShell
      title="Issues Tracker"
      description={scanId ? "Issues from the selected scan." : "All discovered SEO issues across your monitored projects."}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search issues..."
                className="pl-9 bg-background"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              Filter
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-left text-muted-foreground">
                  <th className="px-6 py-4 font-medium w-[40%]">Issue</th>
                  <th className="px-6 py-4 font-medium hidden md:table-cell">Category</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium hidden sm:table-cell">Affected URL</th>
                  <th className="px-6 py-4 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">Loading issues...</td>
                  </tr>
                ) : issues.map((issue: any) => (
                  <tr key={issue.id} className="group transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {issue.severity === "CRITICAL" ? (
                          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                        ) : issue.severity === "WARNING" ? (
                          <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
                        ) : (
                          <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{issue.title}</p>
                          <div className="text-xs text-muted-foreground mt-1 md:hidden">
                            {issue.ruleId} • {issue.page?.url}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">
                      {issue.ruleId}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={issue.severity === "CRITICAL" ? "destructive" : issue.severity === "WARNING" ? "secondary" : "outline"} className={issue.severity === "WARNING" ? "bg-warning/20 text-warning-foreground hover:bg-warning/30" : ""}>
                        {issue.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">
                      <span className="truncate block w-full" title={issue.page?.url}>{issue.page?.url}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {issue.status === 'OPEN' ? (
                        <Button size="sm" variant="outline" className="gap-1 shadow-sm border-primary/20 text-primary hover:bg-primary/5 hover:text-primary" asChild>
                           <Link to="/issues/$issueId" params={{ issueId: issue.id }}>
                             <Sparkles className="size-3.5 text-primary" />
                             Fix Issue
                           </Link>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="bg-success/10 text-success">{issue.status}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && issues.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No issues found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
