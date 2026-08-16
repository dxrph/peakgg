import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small uppercase caption that titles every broadcast module. */
export function Rail({ children, className, muted }: { children: ReactNode; className?: string; muted?: boolean }) {
  return <span className={cn("bc-rail", muted && "bc-rail--muted", className)}>{children}</span>;
}

/** Matte studio panel with a single cut corner. */
export function Panel({
  children,
  className,
  flat,
  accent,
}: {
  children: ReactNode;
  className?: string;
  flat?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={cn("bc-panel", flat && "bc-panel--flat", accent && "bc-panel--accent", className)}>
      {children}
    </div>
  );
}

export function LiveTag({ label = "Live" }: { label?: string }) {
  return (
    <span className="bc-live">
      <span className="bc-live-dot" />
      {label}
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("bc-chip", className)}>{children}</span>;
}

/** Poster-scale condensed headline. */
export function Display({
  children,
  className,
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}) {
  return <Tag className={cn("bc-display", className)}>{children}</Tag>;
}

/** Data readout: giant condensed number + caption. */
export function StatBlock({
  value,
  label,
  hint,
  className,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-4 md:px-5 md:py-5", className)}>
      <div className="bc-num text-4xl md:text-5xl text-foreground">{value}</div>
      <div className="mt-2 text-[10px] uppercase tracking-[0.24em] font-display font-bold text-muted-foreground">
        {label}
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground/70 font-body">{hint}</div>}
    </div>
  );
}

/** Section header: rail + display title + optional right-side slot. */
export function SectionHead({
  rail,
  title,
  copy,
  aside,
  className,
}: {
  rail: string;
  title: ReactNode;
  copy?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-5 mb-8 md:mb-10", className)}>
      <div className="max-w-2xl">
        <Rail className="mb-3">{rail}</Rail>
        <Display className="text-3xl md:text-5xl">{title}</Display>
        {copy && <p className="mt-3 text-sm md:text-base text-muted-foreground font-body max-w-xl">{copy}</p>}
      </div>
      {aside}
    </div>
  );
}

/** Straight studio ticker. */
export function Ticker({ items }: { items: ReactNode[] }) {
  const row = (
    <>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2.5 whitespace-nowrap">
          <span className="w-1 h-1 bg-primary" />
          {it}
        </span>
      ))}
    </>
  );
  return (
    <div className="bc-ticker" aria-hidden>
      <div className="bc-ticker__track">
        {row}
        {row}
      </div>
    </div>
  );
}
