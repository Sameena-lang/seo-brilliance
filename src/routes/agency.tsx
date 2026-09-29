import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building, Activity, LineChart, FileText } from "lucide-react";

export const Route = createFileRoute("/agency")({
  component: AgencyDashboard,
});

function AgencyDashboard() {
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
              <div className="text-2xl font-bold">14</div>
              <p className="text-xs text-muted-foreground">+2 this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">+8 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg SEO Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">86</div>
              <p className="text-xs text-muted-foreground">+4 points globally</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">White-label Reports</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
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
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Projects</th>
                    <th className="px-4 py-3 font-medium">Last Audit</th>
                    <th className="px-4 py-3 font-medium">SEO Score</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">Acme Corp</td>
                    <td className="px-4 py-3">3</td>
                    <td className="px-4 py-3 text-muted-foreground">2 hours ago</td>
                    <td className="px-4 py-3"><span className="text-emerald-500 font-medium">92</span></td>
                    <td className="px-4 py-3 text-right"><a href="#" className="text-primary hover:underline">Open Workspace</a></td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">Globex Inc</td>
                    <td className="px-4 py-3">1</td>
                    <td className="px-4 py-3 text-muted-foreground">Yesterday</td>
                    <td className="px-4 py-3"><span className="text-amber-500 font-medium">74</span></td>
                    <td className="px-4 py-3 text-right"><a href="#" className="text-primary hover:underline">Open Workspace</a></td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">Initech</td>
                    <td className="px-4 py-3">8</td>
                    <td className="px-4 py-3 text-muted-foreground">3 days ago</td>
                    <td className="px-4 py-3"><span className="text-emerald-500 font-medium">88</span></td>
                    <td className="px-4 py-3 text-right"><a href="#" className="text-primary hover:underline">Open Workspace</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
