import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  FileBarChart,
  FileText,
  Folder,
  LayoutDashboard,
  Menu,
  Radar,
  Search,
  Settings,
  TriangleAlert,
  Bot,
  Activity,
  Target,
  Users,
  Sparkles,
  BarChart3,
  Building
} from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useProjects } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { AiChatAssistant } from "./ai-chat-assistant";
import { useActiveProject } from "@/hooks/use-active-project";
import { useLatestScan } from "@/hooks/use-latest-scan";
import { CommandPalette } from "@/components/command-palette";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/agency", label: "Agency", icon: Building },
    ],
  },
  {
    label: "SEO Intelligence",
    items: [
      { to: "/seo-health", label: "Health Center", icon: Activity },
      { to: "/opportunities", label: "Opportunities", icon: Target },
      { to: "/keywords", label: "Keywords", icon: Search },
      { to: "/competitors", label: "Competitors", icon: Users },
    ],
  },
  {
    label: "AI Assistant",
    items: [
      { to: "/ai-copilot", label: "AI Copilot", icon: Bot },
      { to: "/ai-action-plan", label: "AI Action Plan", icon: Sparkles },
    ],
  },
  {
    label: "SEO Management",
    items: [
      { to: "/projects", label: "Projects", icon: Folder },
      { to: "/scan", label: "New Scan", icon: Radar },
      { to: "/scan/results", label: "Audit Results", icon: FileBarChart },
      { to: "/issues", label: "Issues", icon: TriangleAlert },
      { to: "/pages", label: "Pages", icon: FileText },
    ],
  },
  {
    label: "Reporting",
    items: [
      { to: "/reports", label: "Reports", icon: FileBarChart },
      { to: "/search-console", label: "Search Console", icon: Search },
      { to: "/analytics", label: "Analytics", icon: BarChart3 }
    ],
  },
  {
    label: "System",
    items: [
      { to: "/integrations", label: "Integrations", icon: Settings },
      { to: "/settings", label: "Settings", icon: Settings }
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { activeProject } = useActiveProject();
  const { data: latestScan } = useLatestScan(activeProject?.id || null);
  
  const openChat = () => {
    // Pass the latest scan context if available
    window.dispatchEvent(new CustomEvent('open-ai-chat', { 
      detail: { scanId: latestScan?.id } 
    }));
  };

  return (
    <nav className="flex flex-col gap-6" aria-label="Main">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {group.label}
          </p>
          {group.items.map((item) => {
            const isScanPage = item.to === "/scan";
            const active = pathname === item.to || (!isScanPage && pathname.startsWith(`${item.to}/`));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className={cn(
                  "size-4 transition-colors", 
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
      
      <div className="mt-4 px-3">
        <Button 
          variant="secondary" 
          className="w-full justify-start gap-3 bg-primary/10 text-primary hover:bg-primary/20 shadow-sm"
          onClick={openChat}
        >
          <Bot className="size-4" />
          AI Assistant
        </Button>
      </div>
    </nav>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Clean empty state for notifications since backend doesn't support it yet
  const unread = 0;
  const notifications: any[] = [];

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar/50 backdrop-blur-xl p-4 lg:flex">
        <Brand to="/" className="px-2 py-3 mb-4" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <SidebarNav />
        </div>
        <div className="mt-4 rounded-xl border border-border bg-background p-4 shadow-sm">
          <p className="text-sm font-semibold flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary animate-pulse-dot" />
            Growth plan
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            18,240 of 25,000 pages used this month.
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[73%] rounded-full bg-primary transition-all duration-1000" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand to="/" className="px-1 py-2" />
                <div className="mt-6">
                  <SidebarNav />
                </div>
              </SheetContent>
            </Sheet>

            <ProjectSelector />

            <div className="relative ml-auto hidden max-w-xs flex-1 md:flex md:justify-end">
              <CommandPalette />
            </div>

            <div className="ml-auto flex items-center gap-1 md:ml-0">
              <ThemeToggle />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                    <Bell className="size-4" />
                    {unread > 0 && (
                      <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <p className="border-b border-border px-4 py-3 text-sm font-semibold">
                    Notifications
                  </p>
                  <ul className="divide-y divide-border">
                    {notifications.length === 0 ? (
                      <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No new notifications
                      </li>
                    ) : (
                      notifications.map((n) => (
                        <li key={n.title} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{n.title}</p>
                            <span className="text-[11px] text-muted-foreground">{n.time}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                        </li>
                      ))
                    )}
                  </ul>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted"
                    aria-label="Account menu"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary uppercase">
                        {user?.fullName?.substring(0, 2) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{user?.fullName || "User"}</p>
                    <p className="text-xs font-normal text-muted-foreground">{user?.email || ""}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/reports">Reports</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
      <AiChatAssistant />
    </div>
  );
}

// useActiveProject already imported above
import { useNavigate, useRouter } from "@tanstack/react-router";

function ProjectSelector() {
  const { activeProject, setProject, projects } = useActiveProject();
  const router = useRouter();

  const handleSelect = (id: string) => {
    setProject(id);
    // Clear project-specific params when switching projects globally
    router.navigate({
      to: router.state.location.pathname as any,
      search: ((prev: any) => {
        const newSearch = { ...prev };
        delete newSearch.scanId;
        delete newSearch.projectId;
        return newSearch;
      }) as any
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {activeProject ? (
            <>
              <span className="size-2 rounded-full bg-success" />
              <span className="max-w-[140px] truncate">{activeProject.domain || activeProject.name}</span>
            </>
          ) : (
            <span className="max-w-[140px] truncate">Select Project</span>
          )}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Switch project</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.length === 0 ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">No projects found</div>
        ) : (
          projects.slice(0, 5).map((p: any) => (
            <DropdownMenuItem key={p.id} onClick={() => handleSelect(p.id)} className="cursor-pointer">
              <span className="flex-1 truncate">{p.domain || p.name}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/projects">View all projects</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
