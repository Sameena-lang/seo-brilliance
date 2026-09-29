import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Globe, FileText, Link2, ExternalLink, ShieldAlert, Bot, Sparkles, Check, RefreshCw } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/pages/$pageId")({
  component: PageProfileRoute,
});

function AIGenerator({ type, page }: { type: 'title' | 'description' | 'content', page: any }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const endpoint = type === 'title' ? '/ai/generate-title' : type === 'description' ? '/ai/generate-meta-description' : '/ai/analyze-content';
      const res = await api.post(endpoint, {
        url: page.url,
        title: page.title,
        description: page.metaDescription,
        content: `H1: ${page.h1}\nWord Count: ${page.wordCount}`,
        headings: `H1: ${page.h1}\nH2 Count: ${page.h2Count}`,
        contentSummary: `Word Count: ${page.wordCount}`
      });
      setSuggestions(Array.isArray(res.data?.data) ? res.data.data : [res.data.data]);
    } catch (e) {
      setSuggestions([{ error: "AI analysis is temporarily unavailable." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="mt-4">
      {suggestions.length === 0 && !isGenerating ? (
        <Button variant="outline" onClick={handleGenerate} className="gap-2 bg-muted/50 border-primary/20 text-primary">
          <Sparkles className="size-4" /> Generate with AI
        </Button>
      ) : isGenerating ? (
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse p-2">
          <RefreshCw className="size-4 animate-spin" /> Generating suggestions...
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2"><Bot className="size-4" /> AI Suggestions</h4>
            <Button variant="ghost" size="sm" onClick={handleGenerate} className="h-8 text-xs"><RefreshCw className="size-3 mr-1" /> Regenerate</Button>
          </div>
          {suggestions.map((s, i) => (
            <Card key={i} className="border-primary/20 bg-primary/5">
              <CardContent className="p-3 text-sm">
                {s.error ? (
                  <div className="text-destructive">{s.error}</div>
                ) : type === 'content' ? (
                  <div className="space-y-2 whitespace-pre-wrap">{s}</div>
                ) : (
                  <>
                    <div className="font-medium">{s.title || s.description || s.altText}</div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline">{s.characterCount} chars</Badge>
                        <span className="truncate max-w-[200px]">{s.reason}</span>
                      </div>
                      <Button variant="secondary" size="sm" className="h-7 text-xs gap-1" onClick={() => copyToClipboard(s.title || s.description || s.altText, i)}>
                        {copiedIndex === i ? <Check className="size-3" /> : null}
                        {copiedIndex === i ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PageProfileRoute() {
  const { pageId } = Route.useParams();

  const { data: pageRes, isLoading } = useQuery({
    queryKey: ['page', pageId],
    queryFn: () => api.get(`/pages/${pageId}`).then(res => res.data),
  });

  if (isLoading) {
    return (
      <AppShell title="Page SEO Profile" description="Loading page analysis...">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid md:grid-cols-2 gap-6">
             <Skeleton className="h-64 rounded-xl" />
             <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </AppShell>
    );
  }

  const page = pageRes?.data || pageRes;

  if (!page) {
    return (
      <AppShell title="Page Not Found" description="Could not load page details.">
        <div className="text-center py-16"><p>Page not found</p></div>
      </AppShell>
    );
  }

  // Calculate deterministic page score
  let score = 100;
  const deduct = (amount: number) => { score = Math.max(0, score - amount); return amount; };
  const deductions: any[] = [];

  if (!page.title || page.title.length < 10) deductions.push({ reason: 'Missing or very short title', amount: deduct(10) });
  else if (page.title.length > 60) deductions.push({ reason: 'Title too long (>60 chars)', amount: deduct(5) });
  
  if (!page.metaDescription) deductions.push({ reason: 'Missing meta description', amount: deduct(10) });
  else if (page.metaDescription.length < 50) deductions.push({ reason: 'Meta description too short', amount: deduct(5) });
  else if (page.metaDescription.length > 160) deductions.push({ reason: 'Meta description too long', amount: deduct(5) });
  
  if (!page.h1) deductions.push({ reason: 'Missing H1 tag', amount: deduct(15) });
  else if (page.h1Count > 1) deductions.push({ reason: 'Multiple H1 tags', amount: deduct(5) });

  if (!page.isIndexable) deductions.push({ reason: 'Page is non-indexable', amount: deduct(30) });
  if (page.statusCode && page.statusCode >= 400) deductions.push({ reason: `Status code ${page.statusCode}`, amount: deduct(40) });
  
  if (page.imagesMissingAlt > 0) deductions.push({ reason: `${page.imagesMissingAlt} images missing alt text`, amount: deduct(Math.min(10, page.imagesMissingAlt * 2)) });
  if (page.brokenLinksCount > 0) deductions.push({ reason: `${page.brokenLinksCount} broken links`, amount: deduct(Math.min(15, page.brokenLinksCount * 5)) });

  return (
    <AppShell
      title="Page SEO Profile"
      description={page.url}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/pages">Back to Inventory</Link></Button>
          <Button variant="outline" asChild>
            <a href={page.url} target="_blank" rel="noreferrer" className="gap-2">
              <ExternalLink className="size-4" /> Open URL
            </a>
          </Button>
          <Button 
            className="gap-2"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', { 
              detail: { scanId: page.scanId, pageId: page.id, initialMessage: "Tell me about this page and how to improve it." } 
            }))}
          >
            <Bot className="size-4" /> Ask AI
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto pb-12">
        
        {/* Top Summary */}
        <Card className="md:col-span-3 border-border shadow-sm">
          <CardHeader className="bg-muted/20 border-b border-border pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <CardTitle className="text-xl break-all"><a href={page.url} target="_blank" rel="noreferrer" className="hover:underline hover:text-primary">{page.url}</a></CardTitle>
                 <div className="flex items-center gap-3 mt-2">
                   <Badge variant={page.statusCode === 200 ? "outline" : "destructive"} className={page.statusCode === 200 ? "text-success border-success/30" : ""}>
                     {page.statusCode || 'Unknown'}
                   </Badge>
                   {page.isIndexable ? (
                     <Badge variant="outline" className="text-success border-success/30">Indexable</Badge>
                   ) : (
                     <Badge variant="destructive">Non-Indexable</Badge>
                   )}
                   <span className="text-xs text-muted-foreground">{page.contentType || 'text/html'}</span>
                 </div>
              </div>
              <div className="flex items-center gap-4 bg-background p-3 rounded-lg border border-border">
                 <div className="text-center px-4 border-r border-border">
                   <div className="text-xs text-muted-foreground font-semibold uppercase">Page Score</div>
                   <div className={`text-3xl font-bold ${score >= 90 ? 'text-success' : score >= 70 ? 'text-warning' : 'text-destructive'}`}>{score}</div>
                 </div>
                 <div className="text-center px-2">
                   <div className="text-xs text-muted-foreground font-semibold uppercase">Issues</div>
                   <div className="text-2xl font-bold text-destructive">{page.issues?.length || 0}</div>
                 </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Google SERP Preview */}
        <Card className="md:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="size-5 text-muted-foreground" /> Google Search Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background border border-border rounded-lg p-5 max-w-xl">
              <div className="text-[14px] text-[#202124] dark:text-[#dadce0] flex items-center gap-2 mb-1 truncate">
                 <span className="bg-muted size-6 rounded-full inline-block shrink-0"></span>
                 <div className="flex flex-col leading-tight truncate">
                   <span className="truncate max-w-[300px]">{page.url.split('/')[2]}</span>
                   <span className="text-[12px] truncate text-[#4d5156] dark:text-[#bdc1c6] max-w-[300px]">{page.url}</span>
                 </div>
              </div>
              <div className="text-[20px] text-[#1a0dab] dark:text-[#8ab4f8] cursor-pointer hover:underline truncate mb-1">
                {page.title || page.url}
              </div>
              <div className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-snug">
                {page.metaDescription || "No meta description provided for this page."}
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
               <div>
                 <span className="block text-muted-foreground mb-1 text-xs font-semibold uppercase">Title Length</span>
                 <div className="flex items-center gap-2">
                   <span className="font-mono bg-muted px-2 py-0.5 rounded">{page.title?.length || 0}</span>
                   {page.title?.length >= 50 && page.title?.length <= 60 ? (
                     <Badge variant="outline" className="text-success border-success/30">Optimal</Badge>
                   ) : page.title?.length > 60 ? (
                     <Badge variant="outline" className="text-warning border-warning/30">Too Long</Badge>
                   ) : (
                     <Badge variant="outline" className="text-warning border-warning/30">Too Short</Badge>
                   )}
                   </div>
                   <AIGenerator type="title" page={page} />
                 </div>
                 <div>
                   <span className="block text-muted-foreground mb-1 text-xs font-semibold uppercase">Description Length</span>
                   <div className="flex items-center gap-2">
                     <span className="font-mono bg-muted px-2 py-0.5 rounded">{page.metaDescription?.length || 0}</span>
                     {page.metaDescription?.length >= 120 && page.metaDescription?.length <= 160 ? (
                       <Badge variant="outline" className="text-success border-success/30">Optimal</Badge>
                     ) : page.metaDescription?.length > 160 ? (
                       <Badge variant="outline" className="text-warning border-warning/30">Too Long</Badge>
                     ) : (
                       <Badge variant="outline" className="text-warning border-warning/30">Too Short</Badge>
                     )}
                   </div>
                   <AIGenerator type="description" page={page} />
                 </div>
              </div>
          </CardContent>
        </Card>

        {/* Deductions / Score Factors */}
        <Card className="md:col-span-1 shadow-sm border-border">
          <CardHeader>
            <CardTitle>Score Factors</CardTitle>
            <CardDescription>What impacted this page's score.</CardDescription>
          </CardHeader>
          <CardContent>
            {deductions.length === 0 ? (
              <div className="text-success text-sm flex items-center gap-2">
                <span className="bg-success/20 p-1 rounded-full"><ShieldAlert className="size-4" /></span> Perfect optimization detected.
              </div>
            ) : (
              <ul className="space-y-3">
                {deductions.map((d, i) => (
                  <li key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0">
                    <span className="text-muted-foreground">{d.reason}</span>
                    <span className="text-destructive font-mono font-medium">-{d.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Content & Links */}
        <Card className="md:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="size-5 text-muted-foreground" /> On-Page Elements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-3 border-b border-border pb-3">
               <div className="text-muted-foreground">H1 Tag</div>
               <div className="col-span-2 font-medium">{page.h1 || <span className="text-destructive">Missing</span>}</div>
            </div>
            <div className="grid grid-cols-3 border-b border-border pb-3">
               <div className="text-muted-foreground">Headings Count</div>
               <div className="col-span-2 font-medium">{page.headingsCount} total</div>
            </div>
            <div className="grid grid-cols-3 border-b border-border pb-3">
               <div className="text-muted-foreground">Images</div>
               <div className="col-span-2 font-medium">
                 {page.imagesTotal} total 
                 {page.imagesMissingAlt > 0 && <span className="text-destructive ml-2">({page.imagesMissingAlt} missing alt text)</span>}
               </div>
            </div>
            <div className="grid grid-cols-3 pb-2">
               <div className="text-muted-foreground">Robots Directives</div>
               <div className="col-span-2 font-mono text-xs">{page.robotsDirectives || 'None'}</div>
            </div>
            <div className="pt-4 border-t border-border">
              <span className="block text-muted-foreground mb-1 text-xs font-semibold uppercase">Content Recommendations</span>
              <AIGenerator type="content" page={page} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 shadow-sm border-border">
          <CardHeader>
             <CardTitle className="flex items-center gap-2"><Link2 className="size-5 text-muted-foreground" /> Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
             <div className="flex justify-between items-center border-b border-border pb-3">
               <span className="text-muted-foreground">Internal Links</span>
               <span className="font-semibold">{page.internalLinksCount}</span>
             </div>
             <div className="flex justify-between items-center border-b border-border pb-3">
               <span className="text-muted-foreground">External Links</span>
               <span className="font-semibold">{page.externalLinksCount}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-muted-foreground">Broken Links</span>
               <span className={`font-semibold ${page.brokenLinksCount > 0 ? 'text-destructive' : 'text-success'}`}>{page.brokenLinksCount}</span>
             </div>
          </CardContent>
        </Card>

        {/* Issues List */}
        {page.issues && page.issues.length > 0 && (
          <Card className="md:col-span-3 shadow-sm border-destructive/20 mt-4">
            <CardHeader className="bg-destructive/5">
              <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert className="size-5" /> Detected Issues</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <tbody className="divide-y divide-border">
                     {page.issues.map((issue: any) => (
                       <tr key={issue.id} className="hover:bg-muted/30">
                         <td className="p-4">
                           <div className="flex items-center gap-2 mb-1">
                             <Badge variant={issue.severity === 'CRITICAL' ? 'destructive' : issue.severity === 'WARNING' ? 'secondary' : 'outline'} className={issue.severity === 'WARNING' ? 'bg-warning/20 text-warning-foreground' : ''}>
                               {issue.severity}
                             </Badge>
                             <span className="font-semibold text-foreground">{issue.title}</span>
                           </div>
                           {issue.recommendation && <div className="text-muted-foreground mt-2 bg-muted/50 p-2 rounded text-xs"><strong>Recommendation:</strong> {issue.recommendation}</div>}
                         </td>
                         <td className="p-4 text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link to="/issues/$issueId" params={{ issueId: issue.id }}>View Details</Link>
                            </Button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
