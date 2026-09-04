import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/#about" },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Brand />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-primary">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="shadow-md shadow-primary/25">
            <Link to="/register">Start free</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-6">
              <SheetTitle className="font-display">Menu</SheetTitle>
              <nav className="mt-6 flex flex-col gap-4 text-sm font-medium">
                {links.map((l) => (
                  <a key={l.label} href={l.href} className="hover:text-primary">
                    {l.label}
                  </a>
                ))}
                <Link to="/login" className="hover:text-primary">
                  Login
                </Link>
                <Link to="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <Brand />
        <div className="flex gap-6">
          <a href="/#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
          <Link to="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <a href="/#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
        </div>
        <p>© 2026 SEO Intelligence. All rights reserved.</p>
      </div>
    </footer>
  );
}
