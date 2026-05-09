import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TeamLogoProps {
  name?: string | null;
  tag?: string | null;
  avatarUrl?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
  rounded?: "md" | "lg" | "xl" | "full";
}

/**
 * Unified team logo renderer.
 * Shows the uploaded avatar_url when present and loads successfully,
 * falls back to initials (tag, then first 2 chars of name) otherwise.
 */
export function TeamLogo({
  name,
  tag,
  avatarUrl,
  color,
  size = 48,
  className,
  rounded = "lg",
}: TeamLogoProps) {
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    setErrored(false);
  }, [avatarUrl]);

  const initials = (tag?.trim() || name?.trim() || "?").slice(0, 3).toUpperCase();
  const radius =
    rounded === "full" ? "rounded-full" : rounded === "xl" ? "rounded-xl" : rounded === "lg" ? "rounded-lg" : "rounded-md";
  const showImage = !!avatarUrl && !errored;

  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center font-display font-bold text-white overflow-hidden border border-border/40",
        radius,
        className,
      )}
      style={{
        width: size,
        height: size,
        background: showImage ? "transparent" : color ?? "hsl(var(--primary))",
        fontSize: Math.max(10, Math.round(size * 0.32)),
      }}
      aria-label={name ?? tag ?? "Team logo"}
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={name ?? tag ?? "Team logo"}
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
          loading="lazy"
        />
      ) : (
        <span className="leading-none">{initials}</span>
      )}
    </div>
  );
}

export default TeamLogo;