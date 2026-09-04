import { cn } from "@/lib/utils";

export function scoreTone(score: number) {
  if (score >= 85) return "var(--success)";
  if (score >= 70) return "var(--primary)";
  if (score >= 50) return "var(--warning)";
  return "var(--destructive)";
}

export function scoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "At risk";
}

export function ScoreRing({
  score,
  size = 144,
  stroke = 12,
  caption = "/ 100",
  className,
}: {
  score: number;
  size?: number;
  stroke?: number;
  caption?: string;
  className?: string;
}) {
  const r = 50 - stroke / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`SEO score ${score} out of 100`}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={scoreTone(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.32,0.72,0,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p
            className="font-display font-bold leading-none"
            style={{ fontSize: Math.max(20, size * 0.26) }}
          >
            {score}
          </p>
          <p className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground">
            {caption}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{score}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${score}%`, backgroundColor: scoreTone(score) }}
        />
      </div>
    </div>
  );
}
