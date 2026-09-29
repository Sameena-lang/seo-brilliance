import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveProject } from "@/hooks/use-active-project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/keywords")({
  component: KeywordsRoute,
});

function KeywordsRoute() {
  const { activeProjectId } = useActiveProject();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  const { data: kwRes, isLoading } = useQuery({
    queryKey: ['project-keywords', activeProjectId],
    queryFn: () => api.get(`/projects/${activeProjectId}/keywords`).then(res => res.data),
    enabled: !!activeProjectId,
  });

  const addKeyword = useMutation({
    mutationFn: (term: string) => api.post(`/projects/${activeProjectId}/keywords`, { term }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-keywords', activeProjectId] });
      setIsAddOpen(false);
      setNewKeyword("");
      toast.success("Keyword added successfully");
    },
    onError: () => toast.error("Failed to add keyword")
  });

  const keywords = Array.isArray(kwRes) ? kwRes : (kwRes?.data || []);

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    addKeyword.mutate(newKeyword);
  };

  return (
    <AppShell
      title="Keyword Intelligence"
      description="Track and monitor your target keywords."
      actions={
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="gap-2 shadow-sm">
              <Plus className="size-4" /> Add Keyword
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Keyword</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="Enter a target keyword (e.g. 'seo tools')"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddKeyword} disabled={addKeyword.isPending || !newKeyword.trim()}>
                {addKeyword.isPending ? "Adding..." : "Add Keyword"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Search keywords..." className="pl-9 bg-background" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-left text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Keyword</th>
                  <th className="px-6 py-4 font-medium text-right">Position</th>
                  <th className="px-6 py-4 font-medium text-right">Volume</th>
                  <th className="px-6 py-4 font-medium text-right">Difficulty</th>
                  <th className="px-6 py-4 font-medium hidden md:table-cell">Target URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-8 ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12 ml-auto" /></td>
                      <td className="px-6 py-4 hidden md:table-cell"><Skeleton className="h-4 w-48" /></td>
                    </tr>
                  ))
                ) : keywords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <TrendingUp className="size-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">No keyword data yet</h3>
                        <p className="text-muted-foreground text-sm">
                          Connect Google Search Console or a supported SEO data provider to start tracking keyword performance.
                        </p>
                        <Button variant="outline" className="mt-6" disabled>Connect Provider (Coming Soon)</Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  keywords.map((kw: any) => (
                    <tr key={kw.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium text-foreground">{kw.term}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">{kw.position || '-'}</span>
                          {kw.change > 0 ? <TrendingUp className="size-3 text-success" /> : kw.change < 0 ? <TrendingDown className="size-3 text-destructive" /> : <Minus className="size-3 text-muted-foreground" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{kw.searchVolume?.toLocaleString() || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-semibold">
                          {kw.difficulty || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-muted-foreground truncate max-w-[200px]">
                        {kw.url || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
