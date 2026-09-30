import { createFileRoute } from "@tanstack/react-router";
import { Download, FileBarChart, FilePieChart, FileText, Settings as SettingsIcon, Clock, FileType, Sparkles, Bot, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { VoicePlayer } from "@/components/voice-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useReports, useGenerateReport, useDashboardRecentScans } from "@/hooks/use-api";
import { format } from "date-fns";
import { useState } from "react";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/reports")({
  component: ReportsRoute,
});

function AIExecutiveSummaryDialog({ scanId }: { scanId: string }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !summary) {
      setIsGenerating(true);
      try {
        const res = await api.post('/ai/report-summary', { scanId });
        setSummary(res.data?.data || "Failed to generate summary.");
      } catch (e) {
        setSummary("AI analysis is temporarily unavailable.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleGenerate}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 w-full mt-2 bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary">
          <Sparkles className="size-4" /> Generate AI Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="size-5 text-primary" /> AI Executive Summary
          </DialogTitle>
          <DialogDescription>
            An intelligent summary of your latest scan.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-muted-foreground">
              <RefreshCw className="size-8 animate-spin text-primary" />
              <p>Analyzing scan data and writing summary...</p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-primary prose-li:marker:text-primary">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportsRoute() {
  const { data: reports = [], isLoading } = useReports();
  const { data: recentScans = [] } = useDashboardRecentScans();
  const generateReport = useGenerateReport();

  const handleGenerate = () => {
    const latestCompletedScan = recentScans.find((s: any) => s.status === "COMPLETED");
    if (!latestCompletedScan) {
      toast.error("No completed scans found to generate a report from.");
      return;
    }
    generateReport.mutate(latestCompletedScan.id);
  };

  const handleDownload = (report: any, type: 'pdf' | 'csv') => {
    if ((type === 'pdf' && !report.pdfUrl) || (type === 'csv' && !report.csvUrl)) {
      toast.error(`The ${type.toUpperCase()} file is not available for this report yet.`);
      return;
    }
    
    // In a real app, we might use a dedicated download function from API client, 
    // but a direct window.open or hidden iframe works if auth is handled via cookies.
    // For JWT in header, we'd need to fetch as blob and createObjectURL.
    // Let's do the fetch blob approach:
    const token = localStorage.getItem('token');
    toast.promise(
      fetch(`${import.meta.env['VITE_API_URL'] || 'https://seo-brilliance-api.onrender.com/api/v1'}/reports/${report.id}/download?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${report.id}.${type}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }),
      {
        loading: `Downloading ${type.toUpperCase()}...`,
        success: 'Download started!',
        error: 'Failed to download file'
      }
    );
  };

  return (
    <AppShell
      title="Reports"
      description="Generate and download comprehensive SEO reports."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col border-border shadow-sm">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
              <FileBarChart className="size-5 text-primary" />
            </div>
            <CardTitle>Executive SEO Summary</CardTitle>
            <CardDescription>
              High-level overview of your website's SEO health, suitable for stakeholders and clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-sm text-muted-foreground flex flex-col gap-4">
            <p>Includes overall score, trend analysis, top critical issues, and high-level progress since last month.</p>
            {recentScans.length > 0 && <AIExecutiveSummaryDialog scanId={recentScans[0].id} />}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button 
               className="gap-2 shadow-sm flex-1"
               onClick={handleGenerate}
               disabled={generateReport.isPending}
            >
               {generateReport.isPending ? "Generating..." : "Generate"}
            </Button>
            <Button 
               variant="outline" 
               size="icon"
               onClick={() => {
                 const latestReport = reports[0];
                 if (latestReport) handleDownload(latestReport, 'csv');
                 else toast.error("No reports available to download. Please generate one first.");
               }}
            >
               <Download className="size-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col border-border shadow-sm">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 mb-4">
              <FileText className="size-5 text-blue-500" />
            </div>
            <CardTitle>Full Technical Audit</CardTitle>
            <CardDescription>
              Detailed breakdown of every technical issue found during the crawl.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-sm text-muted-foreground">
            Includes all URLs crawled, indexability status, response codes, and a full issue inventory.
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 border-t border-border pt-4">
             <Button 
               className="gap-2 shadow-sm flex-1"
               onClick={handleGenerate}
               disabled={generateReport.isPending}
             >
               {generateReport.isPending ? "Generating..." : "Generate"}
            </Button>
            <Button 
               variant="outline" 
               size="icon"
               onClick={() => {
                 const latestReport = reports[0];
                 if (latestReport) handleDownload(latestReport, 'pdf');
                 else toast.error("No reports available to download. Please generate one first.");
               }}
            >
               <Download className="size-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col border-border shadow-sm">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 mb-4">
              <FilePieChart className="size-5 text-purple-500" />
            </div>
            <CardTitle>AI Action Plan</CardTitle>
            <CardDescription>
              Prioritized list of fixes with AI-generated step-by-step instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-sm text-muted-foreground">
            Groups issues by effort and impact, providing actionable steps for your development team.
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button 
               className="gap-2 shadow-sm flex-1"
               onClick={handleGenerate}
               disabled={generateReport.isPending}
            >
               {generateReport.isPending ? "Generating..." : "Generate"}
            </Button>
            <Button 
               variant="outline" 
               size="icon"
               onClick={() => {
                 const latestReport = reports[0];
                 if (latestReport) handleDownload(latestReport, 'pdf');
                 else toast.error("No reports available to download. Please generate one first.");
               }}
            >
               <Download className="size-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col border-border shadow-sm col-span-full md:col-span-2 lg:col-span-3 mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              Generated Reports
            </CardTitle>
            <CardDescription>View and download previously generated reports for your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="rounded-md border border-border">
                 <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Project</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">SEO Score</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Format</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                          <td className="px-4 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                          <td className="px-4 py-4"><Skeleton className="h-5 w-16" /></td>
                          <td className="px-4 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                        </tr>
                      ))
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className="size-8 text-muted-foreground/50 mb-3" />
                            <p className="font-medium text-foreground">No reports generated yet</p>
                            <p className="text-xs mt-1">Generate your first SEO report above.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      reports.map((report: any) => {
                        const score = report.scan?.siteScore?.overallScore;
                        return (
                        <tr key={report.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">
                            {report.scan?.project?.name || report.scan?.project?.domain || "Unknown Project"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                          </td>
                          <td className="px-4 py-3">
                            {score ? (
                              <span className={score >= 80 ? 'text-success font-semibold' : score >= 60 ? 'text-warning font-semibold' : 'text-destructive font-semibold'}>
                                {score}/100
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${report.status === 'COMPLETED' ? 'bg-success/10 text-success' : report.status === 'FAILED' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}`}>
                              {report.status || 'READY'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                             <div className="flex gap-2">
                               {report.pdfUrl && <span className="text-xs bg-red-500/10 text-red-600 px-2 py-1 rounded">PDF</span>}
                               {report.csvUrl && <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">CSV</span>}
                               {!report.pdfUrl && !report.csvUrl && <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">Processing</span>}
                             </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                             <div className="flex justify-end gap-2">
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-8 gap-1"
                                 disabled={!report.pdfUrl}
                                 onClick={() => handleDownload(report, 'pdf')}
                               >
                                 <Download className="size-3" /> PDF
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="h-8 gap-1"
                                 disabled={!report.csvUrl}
                                 onClick={() => handleDownload(report, 'csv')}
                               >
                                 <Download className="size-3" /> CSV
                               </Button>
                             </div>
                          </td>
                        </tr>
                      )})
                    )}
                  </tbody>
                </table>
             </div>
          </CardContent>
           <CardFooter className="flex items-center gap-4">
             <Button 
               variant="outline"
               onClick={handleGenerate}
               disabled={generateReport.isPending}
             >
               Generate New Report
             </Button>
             
             {reports.length > 0 && reports[0].scanId && (
               <VoicePlayer scanId={reports[0].scanId} label="Listen to Latest Report Summary" />
             )}
           </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}
