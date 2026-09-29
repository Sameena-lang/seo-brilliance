import * as React from "react"
import { useNavigate, useRouter } from "@tanstack/react-router"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  Folder,
  Radar,
  TriangleAlert,
  FileText,
  FileBarChart,
  Search
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative hidden w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:flex md:w-40 lg:w-64 border border-input px-4 py-2 hover:bg-muted/80 transition-colors"
      >
        <span className="hidden lg:inline-flex items-center gap-2">
          <Search className="size-4" />
          Search...
        </span>
        <span className="inline-flex lg:hidden items-center gap-2">
          <Search className="size-4" />
          Search...
        </span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/dashboard" }))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/projects" }))}>
              <Folder className="mr-2 h-4 w-4" />
              <span>Projects</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/scan" }))}>
              <Radar className="mr-2 h-4 w-4" />
              <span>Start Scan</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/issues" }))}>
              <TriangleAlert className="mr-2 h-4 w-4" />
              <span>Issues</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/pages" }))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Pages</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/reports" }))}>
              <FileBarChart className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="System">
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/settings" }))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
