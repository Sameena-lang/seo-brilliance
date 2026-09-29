import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export function ProjectIntegrations({ projectId }: { projectId: string }) {
  const providers = [
    { id: 'search-console', name: 'Google Search Console' },
    { id: 'analytics', name: 'Google Analytics' },
    { id: 'pagespeed', name: 'PageSpeed Insights' },
    { id: 'seo-provider', name: 'SEO Provider' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Active Integrations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md border border-border">
            <CheckCircle2 className="size-4 text-success" />
            <span className="text-sm font-medium">SEO Brilliance Crawler</span>
          </div>
          {providers.map(provider => (
            <IntegrationStatusBadge key={provider.id} projectId={projectId} provider={provider} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function IntegrationStatusBadge({ projectId, provider }: { projectId: string, provider: any }) {
  const { data: statusRes } = useQuery({
    queryKey: ['integration-status', projectId, provider.id],
    queryFn: () => api.get(`/integrations/${projectId}/${provider.id}/status`).then(res => res.data),
  });

  const status = statusRes?.data || statusRes;
  const isConnected = status?.status === 'CONNECTED';

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${isConnected ? 'bg-success/5 border-success/20' : 'bg-muted border-border'}`}>
      {isConnected ? (
        <CheckCircle2 className="size-4 text-success" />
      ) : (
        <XCircle className="size-4 text-muted-foreground" />
      )}
      <span className={`text-sm font-medium ${!isConnected ? 'text-muted-foreground' : ''}`}>{provider.name}</span>
    </div>
  );
}
