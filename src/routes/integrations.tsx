import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveProject } from "@/hooks/use-active-project";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BarChart3, Zap, Globe, Blocks, RefreshCw, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/integrations")({
  component: IntegrationsRoute,
});

const PROVIDERS = [
  {
    id: "search-console",
    name: "Google Search Console",
    description: "Connect to import verified clicks, impressions, CTR, and search queries.",
    icon: Search,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "analytics",
    name: "Google Analytics 4",
    description: "Import real user traffic, engagement metrics, and session data.",
    icon: BarChart3,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    id: "pagespeed",
    name: "PageSpeed Insights",
    description: "Analyze Core Web Vitals and real-world performance metrics.",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "seo-provider",
    name: "SEO Data Provider",
    description: "Connect external tools (Ahrefs, Semrush, etc.) for backlinks and authority.",
    icon: Globe,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "mcp",
    name: "MCP Tools",
    description: "Connect external tools to the AI Copilot via Model Context Protocol.",
    icon: Blocks,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  }
];

function IntegrationsRoute() {
  const { activeProjectId } = useActiveProject();
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: (providerId: string) => api.post(`/integrations/${activeProjectId}/${providerId}/connect`),
    onSuccess: (data: any) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: (err: any) => toast.error(`Failed to connect: ${err.message}`)
  });

  const disconnectMutation = useMutation({
    mutationFn: (providerId: string) => api.delete(`/integrations/${activeProjectId}/${providerId}`),
    onSuccess: (_, providerId) => {
      queryClient.invalidateQueries({ queryKey: ['integration-status', activeProjectId, providerId] });
      toast.success("Provider disconnected.");
    },
    onError: (err: any) => toast.error(`Failed to disconnect: ${err.message}`)
  });

  const syncMutation = useMutation({
    mutationFn: (providerId: string) => api.post(`/integrations/${activeProjectId}/${providerId}/sync`),
    onSuccess: (_, providerId) => {
      queryClient.invalidateQueries({ queryKey: ['integration-status', activeProjectId, providerId] });
      toast.success("Synchronization triggered.");
    },
    onError: (err: any) => toast.error(`Failed to sync: ${err.response?.data?.error || err.message}`)
  });

  if (!activeProjectId) {
    return (
      <AppShell title="Integrations" description="Manage external data sources.">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Please select a project first.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Integration Center"
      description="Connect external tools to enrich your SEO intelligence."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
        {PROVIDERS.map(provider => (
          <ProviderCard 
            key={provider.id} 
            provider={provider} 
            projectId={activeProjectId}
            onConnect={() => connectMutation.mutate(provider.id)}
            onDisconnect={() => disconnectMutation.mutate(provider.id)}
            onSync={() => syncMutation.mutate(provider.id)}
            isConnecting={connectMutation.isPending && connectMutation.variables === provider.id}
            isDisconnecting={disconnectMutation.isPending && disconnectMutation.variables === provider.id}
            isSyncing={syncMutation.isPending && syncMutation.variables === provider.id}
          />
        ))}
      </div>
    </AppShell>
  );
}

function ProviderCard({ provider, projectId, onConnect, onDisconnect, onSync, isConnecting, isDisconnecting, isSyncing }: any) {
  const { data: statusRes, isLoading } = useQuery({
    queryKey: ['integration-status', projectId, provider.id],
    queryFn: () => api.get(`/integrations/${projectId}/${provider.id}/status`).then(res => res.data),
    retry: false
  });

  const status = statusRes?.data || statusRes; // handle unwrapping
  const Icon = provider.icon;

  if (isLoading) {
    return <Skeleton className="h-[250px] rounded-xl" />;
  }

  const isConnected = status?.status === 'CONNECTED';

  return (
    <Card className="flex flex-col border-border/50 shadow-sm transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${provider.bg}`}>
            <Icon className={`size-5 ${provider.color}`} />
          </div>
          {isConnected ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1.5">
              <CheckCircle2 className="size-3" /> Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1.5">
              Not Connected
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{provider.name}</CardTitle>
        <CardDescription>{provider.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        {isConnected && status?.lastSyncAt && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Last synced: {new Date(status.lastSyncAt).toLocaleString()}</p>
          </div>
        )}
        {isConnected && status?.errorMessage && (
          <div className="mt-2 text-xs text-destructive flex items-start gap-1.5 p-2 bg-destructive/10 rounded-md">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            <p>{status.errorMessage}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t border-border/50 gap-2">
        {!isConnected ? (
          <Button 
            className="w-full" 
            onClick={onConnect} 
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="flex-1 gap-2" 
              onClick={onSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              Sync
            </Button>
            <Button 
              variant="outline" 
              className="flex-none text-destructive hover:bg-destructive hover:text-destructive-foreground" 
              onClick={onDisconnect}
              disabled={isDisconnecting}
            >
              <LogOut className="size-3.5" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
