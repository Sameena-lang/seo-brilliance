import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveProject } from "@/hooks/use-active-project";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Plus, Trash2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/competitors")({
  component: CompetitorsRoute,
});

function CompetitorsRoute() {
  const { activeProjectId } = useActiveProject();
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState("");

  const { data: compRes, isLoading } = useQuery({
    queryKey: ['project-competitors', activeProjectId],
    queryFn: () => api.get(`/projects/${activeProjectId}/competitors`).then(res => res.data),
    enabled: !!activeProjectId,
  });

  const addMutation = useMutation({
    mutationFn: (d: string) => api.post(`/projects/${activeProjectId}/competitors`, { domain: d }),
    onSuccess: () => {
      setDomain("");
      toast.success("Competitor added successfully");
      queryClient.invalidateQueries({ queryKey: ['project-competitors', activeProjectId] });
    },
    onError: () => toast.error("Failed to add competitor")
  });

  const competitors = Array.isArray(compRes) ? compRes : (compRes?.data || []);

  return (
    <AppShell
      title="Competitor Analysis"
      description="Track and compare your technical SEO against competitors."
    >
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <Card className="border-border shadow-sm">
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border"><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          ) : competitors.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-card border border-border rounded-xl">
              <Users className="size-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">No competitors added</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Add competitor domains above to begin technical SEO comparison.
              </p>
            </div>
          ) : (
            competitors.map((comp: any) => (
              <Card key={comp.id} className="border-border shadow-sm group">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-muted-foreground" />
                    <CardTitle className="text-lg">{comp.domain}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="size-4 hover:text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Technical SEO comparison data will be available after the next competitor scan phase.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="w-full" disabled>Compare</Button>
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
