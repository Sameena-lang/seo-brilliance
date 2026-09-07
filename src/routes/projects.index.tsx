import { createFileRoute, Link } from "@tanstack/react-router";
import { Folder, MoreHorizontal, Plus, Search, Filter } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Project } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/")({
  component: ProjectsListRoute,
});

function ProjectsListRoute() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: any) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsDialogOpen(false);
      toast.success('Project created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create project');
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => api.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete project');
    }
  });

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    const domain = formData.get('domain');
    
    if (name && domain) {
      createProjectMutation.mutate({ name, domain });
    }
  };

  return (
    <AppShell
      title="Projects"
      description="Manage all your SEO monitored websites."
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md shadow-primary/20">
              <Plus className="mr-2 size-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" name="name" placeholder="Acme Store" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input id="domain" name="domain" placeholder="acme-store.com" required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-9 bg-background"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="size-4" />
            Filter
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-left text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Domain</th>
                  <th className="px-6 py-4 font-medium">SEO Score</th>
                  <th className="px-6 py-4 font-medium hidden md:table-cell">Pages Crawled</th>
                  <th className="px-6 py-4 font-medium hidden sm:table-cell">Issues</th>
                  <th className="px-6 py-4 font-medium">Last Scan</th>
                  <th className="px-6 py-4 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Loading projects...
                    </td>
                  </tr>
                ) : projects.map((project: any) => {
                  const lastScan = project.scans?.[0];
                  const score = lastScan?.siteScore?.overallScore || '-';
                  const pages = lastScan?.pagesCrawled || '-';
                  const issues = lastScan?.issuesFound || '-';
                  const scanDate = lastScan ? new Date(lastScan.createdAt).toLocaleDateString() : 'Never';

                  return (
                  <tr key={project.id} className="group transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Folder className="size-5" />
                        </div>
                        <div>
                          <Link to="/projects/$projectId" params={{ projectId: project.id }} className="font-semibold text-foreground hover:underline">
                            {project.domain}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-success"></span>
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${typeof score === 'number' && score >= 90 ? 'text-success' : typeof score === 'number' && score >= 70 ? 'text-warning' : typeof score === 'number' ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {score}
                        </span>
                        {typeof score === 'number' && <span className="text-xs text-muted-foreground">/100</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">
                      {pages}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex gap-2">
                        {issues !== '-' && <Badge variant="destructive" className="px-1.5 py-0">{issues}</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {scanDate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/projects/$projectId" params={{ projectId: project.id }}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/scan" search={{ projectId: project.id }}>Re-scan now</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/settings">Project settings</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this project?')) {
                                deleteProjectMutation.mutate(project.id);
                              }
                            }}
                          >
                            Delete project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          {!isLoading && projects.length === 0 && (
            <div className="p-12 text-center">
              <Folder className="mx-auto size-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Get started by adding your first website to monitor.</p>
              <Button className="mt-6 shadow-md shadow-primary/20" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 size-4" />
                Add your first project
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
