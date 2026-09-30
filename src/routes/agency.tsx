import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building, Activity, LineChart, FileText, Radar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/agency")({
  component: AgencyDashboard,
});

function AgencyDashboard() {
  const { data: projectsRes, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data),
  });

  const projects = projectsRes || [];
  
  // Calculate stats from real data
  const totalProjects = projects.length;
  // Calculate average score if projects have recent scans
  const projectsWithScores = projects.filter((p: any) => p.latestScan?.siteScore?.overallScore > 0);
  const avgScore = projectsWithScores.length > 0
    ? Math.round(projectsWithScores.reduce((sum: number, p: any) => sum + p.latestScan.siteScore.overallScore, 0) / projectsWithScores.length)
    : 0;

  return (
    <AppShell title="Agency Dashboard" description="Manage your client workspaces and overall agency performance.">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">1</div>
              )}
              <p className="text-xs text-muted-foreground">Your workspace</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{totalProjects}</div>
              )}
              <p className="text-xs text-muted-foreground">Active tracked projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg SEO Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className={`text-2xl font-bold ${avgScore >= 80 ? 'text-emerald-500' : avgScore >= 50 ? 'text-amber-500' : avgScore > 0 ? 'text-destructive' : ''}`}>
                  {avgScore > 0 ? avgScore : 'N/A'}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Across all scanned projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">White-label Reports</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">0</div>
              )}
              <p className="text-xs text-muted-foreground">Generated this week</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Workspaces</CardTitle>
            <CardDescription>Select a client to manage their specific projects and configurations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Project Name</th>
                    <th className="px-4 py-3 font-medium">Domain</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Latest Score</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                      </tr>
                    ))
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <Radar className="size-8 text-muted-foreground/50 mb-3" />
                          <p className="font-medium text-foreground">No projects found</p>
                          <p className="text-xs mt-1">Create your first project to see it here.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    projects.map((project: any) => (
                      <tr key={project.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{project.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{project.domain}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {project.latestScan?.siteScore?.overallScore ? (
                            <span className={project.latestScan.siteScore.overallScore >= 80 ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                              {project.latestScan.siteScore.overallScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to="/projects/$projectId" params={{ projectId: project.id }} className="text-primary hover:underline">
                            Open Workspace
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
