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

export const Route = createFileRoute("/pages")({
  component: PagesRoute,
});

function PagesRoute() {
  const searchParams: any = Route.useSearch();
  const scanId = searchParams?.scanId;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: pagesRes, isLoading } = useQuery({
    queryKey: ['pages', scanId, searchTerm],
    queryFn: () => {
      const url = scanId ? `/scans/${scanId}/pages` : `/pages`;
      return api.get(url, { params: { search: searchTerm } }).then(res => res.data);
    },
  });

  const pages = pagesRes?.data?.pages || [];
  
  const filteredPages = pages.filter((page: any) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "200" && page.statusCode === 200) return true;
    if (statusFilter === "301" && page.statusCode >= 300 && page.statusCode < 400) return true;
    if (statusFilter === "404" && page.statusCode >= 400) return true;
    return false;
  });

  return (
    <AppShell
      title="Page Inventory"
      description={scanId ? "Pages crawled in the selected scan." : "Detailed analysis of every crawled page across your projects."}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export CSV
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
             <Select value={statusFilter} onValueChange={setStatusFilter}>
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
             <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              More Filters
            </Button>
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
                ) : filteredPages.map((page: any) => (
                  <tr key={page.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-[200px] sm:max-w-[300px]">
                      <a href={page.url} target="_blank" rel="noreferrer" className="hover:underline text-primary">{page.url}</a>
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
                {!isLoading && filteredPages.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">No pages found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
             <div>Showing {filteredPages.length} results</div>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
             </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
