import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveProject } from "@/hooks/use-active-project";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Plus, Trash2, Users, Activity, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/competitors")({
  component: CompetitorsRoute,
});

function CompetitorsRoute() {
  const { activeProjectId } = useActiveProject();
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState("");

  const { data: comparisonRes, isLoading: isLoadingComparison } = useQuery({
    queryKey: ['project-competitor-comparison', activeProjectId],
    queryFn: () => api.get(`/projects/${activeProjectId}/competitors/compare`),
    enabled: !!activeProjectId,
    refetchInterval: 5000,
  });

  const addMutation = useMutation({
    mutationFn: (d: string) => api.post(`/projects/${activeProjectId}/competitors`, { domain: d }),
    onSuccess: () => {
      setDomain("");
      toast.success("Competitor added successfully");
      queryClient.invalidateQueries({ queryKey: ['project-competitor-comparison', activeProjectId] });
    },
    onError: (error: any) => toast.error(error?.message || "Failed to add competitor")
  });

  const scanMutation = useMutation({
    mutationFn: (competitorId: string) => api.post(`/projects/${activeProjectId}/competitors/${competitorId}/scan`),
    onSuccess: () => {
      toast.success("Competitor scan started");
      queryClient.invalidateQueries({ queryKey: ['project-competitor-comparison', activeProjectId] });
    },
    onError: () => toast.error("Failed to start scan")
  });

  const deleteMutation = useMutation({
    mutationFn: (competitorId: string) => api.delete(`/projects/${activeProjectId}/competitors/${competitorId}`),
    onSuccess: () => {
      toast.success("Competitor deleted");
      queryClient.invalidateQueries({ queryKey: ['project-competitor-comparison', activeProjectId] });
    },
    onError: () => toast.error("Failed to delete competitor")
  });

  const comparisonData = comparisonRes?.data || comparisonRes; // Handle both `{ data: ... }` and direct data just in case
  const competitors = comparisonData?.competitors || [];

  return (
    <AppShell
      title="Competitor Analysis"
      description="Track and compare your technical SEO against competitors."
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          <Card className="border-border shadow-sm flex-1">
            <CardHeader>
              <CardTitle>Add Competitor</CardTitle>
              <CardDescription>Enter a competitor's domain to begin tracking their performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <form 
                className="flex gap-4 max-w-md" 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  if (domain) addMutation.mutate(domain); 
                }}
              >
                <Input 
                  placeholder="e.g. competitor.com" 
                  value={domain} 
                  onChange={(e) => setDomain(e.target.value)} 
                  disabled={addMutation.isPending || !activeProjectId}
                />
                <Button type="submit" disabled={!domain || addMutation.isPending || !activeProjectId}>
                  {addMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {isLoadingComparison ? (
          <Card className="border-border shadow-sm"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        ) : competitors.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-card border border-border rounded-xl">
            <Users className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No competitors added</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Add competitor domains above to begin technical SEO comparison.
            </p>
          </div>
        ) : (
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Technical SEO Comparison</CardTitle>
                <CardDescription>Compare your project's latest scan with your competitors.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['project-competitor-comparison', activeProjectId] })}>
                <RefreshCw className="size-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Metric</TableHead>
                      <TableHead className="min-w-[150px] font-bold bg-primary/5">
                        <div className="flex flex-col gap-2">
                          <span className="text-base text-primary">Your Site</span>
                        </div>
                      </TableHead>
                      {competitors.map((comp: any) => (
                        <TableHead key={comp.id} className="min-w-[200px]">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-base">{comp.domain}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteMutation.mutate(comp.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                            <div className="flex gap-2 items-center">
                              {comp.status === 'SCANNING' ? (
                                <Badge variant="secondary" className="flex gap-1 animate-pulse"><Activity className="size-3" /> Scanning</Badge>
                              ) : comp.status === 'COMPLETED' ? (
                                <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex gap-1"><CheckCircle className="size-3" /> Ready</Badge>
                              ) : comp.status === 'FAILED' ? (
                                <Badge variant="destructive" className="flex gap-1"><XCircle className="size-3" /> Failed</Badge>
                              ) : (
                                <Badge variant="outline" className="flex gap-1"><Clock className="size-3" /> Pending</Badge>
                              )}
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6 text-xs px-2"
                                onClick={() => scanMutation.mutate(comp.id)}
                                disabled={comp.status === 'SCANNING' || scanMutation.isPending}
                              >
                                Scan
                              </Button>
                            </div>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Overall SEO Score</TableCell>
                      <TableCell className="bg-primary/5 font-bold text-2xl text-primary">
                        {comparisonData?.project?.score ?? '-'}
                      </TableCell>
                      {competitors.map((comp: any) => (
                        <TableCell key={comp.id} className="font-semibold text-2xl">
                          {comp.status !== 'COMPLETED' ? '-' : (comp.score ?? '-')}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Technical Score</TableCell>
                      <TableCell className="bg-primary/5 font-semibold">
                        {comparisonData?.project?.technical ?? '-'}
                      </TableCell>
                      {competitors.map((comp: any) => (
                        <TableCell key={comp.id} className="font-semibold">
                          {comp.status !== 'COMPLETED' ? '-' : (comp.technical ?? '-')}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Pages Crawled</TableCell>
                      <TableCell className="bg-primary/5 font-medium">{comparisonData?.project?.pages ?? '-'}</TableCell>
                      {competitors.map((comp: any) => (
                        <TableCell key={comp.id} className="font-medium">{comp.status !== 'COMPLETED' ? '-' : (comp.pages ?? '-')}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Total Issues</TableCell>
                      <TableCell className="bg-primary/5 font-medium">{comparisonData?.project?.issues ?? '-'}</TableCell>
                      {competitors.map((comp: any) => (
                        <TableCell key={comp.id} className="font-medium">{comp.status !== 'COMPLETED' ? '-' : (comp.issues ?? '-')}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium text-muted-foreground">Critical Issues</TableCell>
                      <TableCell className="bg-primary/5 text-destructive font-bold">
                        {comparisonData?.project?.critical ?? '-'}
                      </TableCell>
                      {competitors.map((comp: any) => (
                        <TableCell key={comp.id} className={comp.critical > 0 ? "text-destructive font-bold" : "font-medium"}>
                          {comp.status !== 'COMPLETED' ? '-' : (comp.critical ?? '-')}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

