import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: string;
  ctaOnClick?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;
  secondaryOnClick?: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * Friendly empty state. Replaces blank lists/tables with an illustrated
 * call-to-action so new users always know what to do next.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaTo,
  ctaOnClick,
  secondaryLabel,
  secondaryTo,
  secondaryOnClick,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center text-center gap-5 px-6 py-14 rounded-xl border border-border bg-card overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative w-16 h-16 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.35)]">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <div className="relative max-w-md">
        <h3 className="text-xl md:text-2xl font-display font-bold tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground font-body">
            {description}
          </p>
        )}
      </div>
      {(ctaLabel || secondaryLabel) && (
        <div className="relative flex flex-col sm:flex-row gap-3 mt-1">
          {ctaLabel && ctaTo && (
            <Link to={ctaTo}>
              <Button variant="neon" size="lg">{ctaLabel}</Button>
            </Link>
          )}
          {ctaLabel && !ctaTo && (
            <Button variant="neon" size="lg" onClick={ctaOnClick}>{ctaLabel}</Button>
          )}
          {secondaryLabel && secondaryTo && (
            <Link to={secondaryTo}>
              <Button variant="neonOutline" size="lg">{secondaryLabel}</Button>
            </Link>
          )}
          {secondaryLabel && !secondaryTo && (
            <Button variant="neonOutline" size="lg" onClick={secondaryOnClick}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
      {children && <div className="relative">{children}</div>}
    </div>
  );
}