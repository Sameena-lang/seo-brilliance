import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useUserProfile } from "@/hooks/use-api";
import { Users, Building, Folder, Activity, Server, Shield, FileText } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: profile, isLoading } = useUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && profile && profile.systemRole !== 'SUPER_ADMIN' && profile.systemRole !== 'ADMIN') {
      navigate({ to: '/dashboard' });
    }
  }, [profile, isLoading, navigate]);

  if (isLoading) return <div className="p-8">Loading admin...</div>;
  if (profile && profile.systemRole !== 'SUPER_ADMIN' && profile.systemRole !== 'ADMIN') return null;

  const links = [
    { to: "/admin", icon: <Activity className="w-4 h-4 mr-2" />, label: "Overview" },
    { to: "/admin/users", icon: <Users className="w-4 h-4 mr-2" />, label: "Users" },
    { to: "/admin/organizations", icon: <Building className="w-4 h-4 mr-2" />, label: "Organizations" },
    { to: "/admin/projects", icon: <Folder className="w-4 h-4 mr-2" />, label: "Projects" },
    { to: "/admin/system", icon: <Server className="w-4 h-4 mr-2" />, label: "System Health" },
    { to: "/admin/audit", icon: <Shield className="w-4 h-4 mr-2" />, label: "Audit Logs" },
  ];

  return (
    <AppShell title="Admin Dashboard" description="System management and oversight.">
      <div className="flex gap-6 items-start h-[calc(100vh-140px)]">
        <div className="w-64 shrink-0 bg-card border rounded-lg overflow-hidden flex flex-col h-full sticky top-4">
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-semibold flex items-center">
              <Shield className="w-4 h-4 mr-2 text-primary" />
              Admin Center
            </h3>
          </div>
          <nav className="p-2 space-y-1 overflow-y-auto flex-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-1 min-w-0 bg-card border rounded-lg p-6 min-h-full">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
