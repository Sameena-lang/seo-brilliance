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
    <Link to={to} className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25">
        S
      </span>
      {!compact && (
        <span className="font-display text-[17px] font-bold tracking-tight">SEO Intelligence</span>
      )}
    </Link>
  );
}
