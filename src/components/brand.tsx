import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Brand({
  className,
  compact = false,
  to = "/",
}: {
  className?: string;
  compact?: boolean;
  to?: "/" | "/dashboard";
}) {
  return (
    <Link to={to} className={cn("flex items-center gap-3 group", className)}>
      <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-600 shadow-md shadow-primary/20 overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-primary/30">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-50 mix-blend-overlay"></div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 text-white absolute z-10"
        >
          {/* SEO/Growth AI Concept */}
          <path d="M4 19L10 13L14 17L20 9" strokeWidth="2.5" />
          <path d="M20 9V14" strokeWidth="2.5" />
          <path d="M15 9H20" strokeWidth="2.5" />
          <circle cx="10" cy="13" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="14" cy="17" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="20" cy="9" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="19" r="1.5" fill="currentColor" stroke="none" />
          <path d="M12 4a8 8 0 0 1 8 8" strokeWidth="1.5" strokeDasharray="2 2" className="opacity-70" />
        </svg>
      </div>
      {!compact && (
        <div className="flex flex-col">
          <span className="font-display text-lg font-bold leading-none tracking-tight text-foreground transition-colors group-hover:text-primary">
            SEO Brilliance
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/80 mt-0.5">
            Intelligence
          </span>
        </div>
      )}
    </Link>
  );
}
