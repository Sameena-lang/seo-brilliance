import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Radar, ArrowRight, Server, Globe } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useActiveProject } from "@/hooks/use-active-project";

export const Route = createFileRoute("/scan/")({
  component: ScanRoute,
});

function ScanRoute() {
  const [scope, setScope] = useState("subdomains");
  const [enteredUrl, setEnteredUrl] = useState("");
  const navigate = useNavigate();
  const search: any = Route.useSearch();
  
  const { activeProjectId, setProject } = useActiveProject();
  
  // Explicitly passed projectId from search params overrides active
  const projectId = search?.projectId || activeProjectId;

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(res => res.data),
    enabled: !!projectId,
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: any) => api.post(`/projects`, data),
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: any) => api.put(`/projects/${projectId}`, data),
  });

  const startScanMutation = useMutation({
    mutationFn: (targetProjectId: string) => api.post(`/projects/${targetProjectId}/scans`),
    onSuccess: (data: any, targetProjectId: string) => {
      toast.success("Scan started successfully");
      navigate({ to: "/scan/live", search: { scanId: data.data.id, projectId: targetProjectId } });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to start scan");
    }
  });

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let targetProjectId = projectId;
      
      // If we don't have a project context, create one from the entered URL
      if (!targetProjectId) {
        if (!enteredUrl) {
          toast.error("Please enter a website URL.");
          return;
        }
        
        let domain = enteredUrl.replace(/^https?:\/\//i, '').split('/')[0];
        
        const newProjectRes = await createProjectMutation.mutateAsync({
          name: domain,
          domain: domain,
        });
        
        targetProjectId = newProjectRes.data.id;
        setProject(targetProjectId);
      }
      
      // Update settings
      await api.put(`/projects/${targetProjectId}`, {
        includeSubdomains: scope === "subdomains",
      });
      
      // Then start the scan
      startScanMutation.mutate(targetProjectId);
    } catch (err: any) {
      toast.error(err?.message || "An error occurred");
    }
  };

  return (
    <AppShell
      title="New Audit"
      description="Configure and start a new SEO crawl for your website."
    >
      <div className="mx-auto max-w-3xl">
        <form onSubmit={handleStartScan}>
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Radar className="size-4 text-primary" />
                </div>
                Scan Configuration
              </CardTitle>
              <CardDescription>
                {projectId 
                  ? `Configure crawl settings for ${project?.domain || 'Loading...'}. We'll crawl the site and generate a comprehensive SEO report.`
                  : `Enter a website URL to create a new project and start an audit immediately.`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="url" className="text-base">Website URL</Label>
                <div className="flex gap-2">
                  <Input 
                    id="url" 
                    className="h-11 bg-background" 
                    placeholder="e.g. example.com"
                    value={projectId ? `https://${project?.domain || ''}` : enteredUrl}
                    onChange={(e) => setEnteredUrl(e.target.value)}
                    disabled={!!projectId || isLoading} 
                    required 
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {projectId ? 'The domain is locked to the project settings.' : 'We will automatically extract the domain to create your project.'}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <Label className="text-base">Crawl Scope</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    onClick={() => setScope("subdomains")}
                    className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${scope === 'subdomains' ? 'border-primary bg-primary/5' : 'border-muted bg-popover'}`}
                  >
                    <Globe className="mb-3 size-6" />
                    <span className="font-semibold">All Subdomains</span>
                    <span className="mt-1 text-center text-xs font-normal text-muted-foreground">
                      Crawl everything under the main domain.
                    </span>
                  </div>
                  <div
                    onClick={() => setScope("exact")}
                    className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${scope === 'exact' ? 'border-primary bg-primary/5' : 'border-muted bg-popover'}`}
                  >
                    <Server className="mb-3 size-6" />
                    <span className="font-semibold">Exact Match</span>
                    <span className="mt-1 text-center text-xs font-normal text-muted-foreground">
                      Only crawl the exact URL path provided.
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <Label className="text-base">Advanced Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="js" defaultChecked />
                    <label htmlFor="js" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Execute JavaScript
                    </label>
                  </div>
                  <p className="pl-6 text-xs text-muted-foreground">Required for SPA/React/Vue websites.</p>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox id="mobile" defaultChecked />
                    <label htmlFor="mobile" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Simulate Mobile Device
                    </label>
                  </div>
                  <p className="pl-6 text-xs text-muted-foreground">Crawl using a mobile user-agent (Google Smartphone crawler).</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border bg-muted/20 px-6 py-4">
              <Button variant="ghost" type="button" asChild>
                <Link to="/projects">Cancel</Link>
              </Button>
              <Button type="submit" disabled={startScanMutation.isPending || createProjectMutation.isPending || isLoading} className="gap-2 shadow-md shadow-primary/20">
                {(startScanMutation.isPending || createProjectMutation.isPending) ? 'Starting...' : 'Start Audit'} <ArrowRight className="size-4" />
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}
