import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Filter, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useActiveProject } from "@/hooks/use-active-project";
import { useLatestScan } from "@/hooks/use-latest-scan";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/pages")({
  component: PagesRoute,
});

function PagesRoute() {
  const searchParams: any = Route.useSearch();
  const { activeProjectId } = useActiveProject();
  
  // Use passed scanId or default to latest scan of active project
  const { data: latestScan } = useLatestScan(activeProjectId);
  const scanId = searchParams?.scanId || latestScan?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [indexableFilter, setIndexableFilter] = useState("all");
  const [issuesFilter, setIssuesFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 50;
  
  const [isExporting, setIsExporting] = useState(false);

  const { data: pagesRes, isLoading, error } = useQuery({
    queryKey: ['pages', scanId, activeProjectId, debouncedSearch, statusFilter, indexableFilter, issuesFilter, page],
    queryFn: () => {
      // If we don't have a scan context, query all pages for the org
      const url = scanId ? `/scans/${scanId}/pages` : `/pages`;
      return api.get(url, { 
        params: { 
          search: debouncedSearch,
          status: statusFilter,
          indexable: indexableFilter !== 'all' ? indexableFilter : undefined,
          hasIssues: issuesFilter !== 'all' ? issuesFilter : undefined,
          page,
          limit
        } 
      }).then(res => res.data);
    },
    // Don't query if we don't even have an active project
    enabled: !!activeProjectId || !!scanId,
  });

  const pages = pagesRes?.data?.pages || [];
  const totalPagesCount = pagesRes?.data?.total || 0;
  
  const handleExportCsv = async () => {
    if (!scanId) {
      toast.error("Please select a project with a completed scan first.");
      return;
    }
    
    try {
      setIsExporting(true);
      const url = `/scans/${scanId}/pages/export`;
      const response = await api.get(url, {
        responseType: 'blob',
        params: {
          search: debouncedSearch,
          status: statusFilter,
          indexable: indexableFilter !== 'all' ? indexableFilter : undefined,
          hasIssues: issuesFilter !== 'all' ? issuesFilter : undefined,
        }
      });
      
      const blob = new Blob([response.data as any], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `scan-${scanId}-pages.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV exported successfully");
    } catch (err) {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell
      title="Page Inventory"
      description={scanId ? `Displaying pages from the active scan.` : "Select a project to view its crawled pages."}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportCsv} disabled={isExporting || !scanId}>
            <Download className="size-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search URLs..."
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // reset to first page on new search
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
             <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
               <SelectTrigger className="w-[140px] bg-background">
                 <SelectValue placeholder="Status Code" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Statuses</SelectItem>
                 <SelectItem value="200">200 OK</SelectItem>
                 <SelectItem value="301">3xx Redirects</SelectItem>
                 <SelectItem value="404">4xx Errors</SelectItem>
               </SelectContent>
             </Select>
             
             <Popover>
               <PopoverTrigger asChild>
                 <Button variant="outline" className="gap-2">
                  <Filter className="size-4" />
                  More Filters
                </Button>
               </PopoverTrigger>
               <PopoverContent align="end" className="w-64 space-y-4">
                  <div className="space-y-2">
                    <Label>Indexability</Label>
                    <Select value={indexableFilter} onValueChange={(val) => { setIndexableFilter(val); setPage(1); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="true">Indexable</SelectItem>
                        <SelectItem value="false">Not Indexable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Issues</Label>
                    <Select value={issuesFilter} onValueChange={(val) => { setIssuesFilter(val); setPage(1); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="true">Has Issues</SelectItem>
                        <SelectItem value="false">No Issues</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </PopoverContent>
             </Popover>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">URL</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Indexable</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Title</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">H1</th>
                  <th className="px-4 py-3 font-medium text-right">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">Loading pages...</td>
                  </tr>
                ) : !activeProjectId && !scanId ? (
                   <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">Select a project to view crawled pages.</td>
                  </tr>
                ) : error ? (
                   <tr>
                    <td colSpan={6} className="py-8 text-center text-destructive">Unable to load pages. Try again.</td>
                  </tr>
                ) : pages.map((page: any) => (
                  <tr key={page.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-[200px] sm:max-w-[300px]">
                      <Link to="/pages" search={{ scanId }} className="hover:underline text-primary" onClick={(e) => {
                         // Temporary fake click to show details
                         e.preventDefault();
                         window.open(`/pages/${page.id}?scanId=${scanId}`, '_blank');
                      }}>{page.url}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={page.statusCode === 200 ? "outline" : (page.statusCode >= 400 || !page.statusCode) ? "destructive" : "secondary"} className={page.statusCode === 200 ? "text-success border-success/30 bg-success/10" : ""}>
                        {page.statusCode || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {page.isIndexable ? (
                        <span className="text-success flex items-center gap-1"><span className="size-2 rounded-full bg-success"></span> Yes</span>
                      ) : (
                        <span className="text-destructive flex items-center gap-1"><span className="size-2 rounded-full bg-destructive"></span> No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell max-w-[150px] truncate">
                      {page.title ? (
                        <span className="text-muted-foreground" title={page.title}>{page.title}</span>
                      ) : (
                        <Badge variant="destructive" className="px-1.5 text-[10px]">Missing</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-[150px] truncate">
                      {page.h1 ? (
                        <span className="text-muted-foreground" title={page.h1}>{page.h1}</span>
                      ) : (
                        <Badge variant="destructive" className="px-1.5 text-[10px]">Missing</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {page._count?.issues > 0 ? (
                        <span className="text-destructive font-medium">{page._count.issues}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && pages.length === 0 && (activeProjectId || scanId) && !error && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">No pages were discovered in this scan matching your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
             <div>Showing {Math.min(totalPagesCount, (page - 1) * limit + 1)}–{Math.min(totalPagesCount, page * limit)} of {totalPagesCount} results</div>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page * limit >= totalPagesCount} onClick={() => setPage(p => p + 1)}>Next</Button>
             </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
