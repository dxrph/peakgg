import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, Swords, ArrowRight, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompetitiveSession } from "@/hooks/useCompetitiveSession";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/**
 * Persistent bar shown across the site whenever the user has an active
 * competitive session (queued, match found, in-match, pending confirmation,
 * or disputed). Hidden inside the Match Room itself to avoid duplication.
 */
export default function GlobalActiveBar() {
  const { user } = useAuth();
  const location = useLocation();
  const session = useCompetitiveSession();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (session.status !== "queued") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session.status]);

  if (!user) return null;
  if (session.status === "idle" || session.loading) return null;
  // Defensive: a non-idle status with no activeMatchId should never render a
  // link to /matches/undefined. Suppress the bar entirely until the next poll
  // resolves a real match id.
  const needsMatchId =
    session.status === "match_found" ||
    session.status === "in_match" ||
    session.status === "pending_confirmation" ||
    session.status === "disputed";
  if (needsMatchId && !session.activeMatchId) return null;

  // Don't duplicate inside Match Room or login/register
  const path = location.pathname;
  if (path.startsWith("/matches/")) return null;
  if (path === "/login" || path === "/register") return null;

  const elapsed = session.joinedAt
    ? Math.max(0, Math.floor((now - new Date(session.joinedAt).getTime()) / 1000))
    : 0;

  const modeLabel = session.mode === "ranked" ? "Ranked Beta" : "Open Cup";
  const gameLabel = (session.game ?? "").toUpperCase();

  let body: JSX.Element;
  let tone = "border-primary/40 bg-primary/10";

  if (session.status === "queued") {
    body = (
      <>
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
        <span className="font-display uppercase tracking-wider text-xs text-primary">
          {modeLabel} Queue
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline">·</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">{gameLabel}</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs font-mono tabular-nums text-foreground">{fmt(elapsed)}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm" variant="outline"
            onClick={async () => {
              await session.cancelQueue();
              toast.success("Queue cancelled");
            }}
          >
            <X className="h-3 w-3 mr-1" />Cancel
          </Button>
        </div>
      </>
    );
  } else if (session.status === "match_found") {
    tone = "border-success/40 bg-success/10";
    body = (
      <>
        <Swords className="h-4 w-4 text-success shrink-0 animate-pulse" />
        <span className="font-display uppercase tracking-wider text-xs text-success">Match Found</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">· {modeLabel}</span>
        <div className="ml-auto">
          <Button size="sm" variant="neon" asChild>
            <Link to={`/matches/${session.activeMatchId}`}>Open Match<ArrowRight className="ml-1.5 h-3 w-3" /></Link>
          </Button>
        </div>
      </>
    );
  } else if (session.status === "disputed") {
    tone = "border-destructive/40 bg-destructive/10";
    body = (
      <>
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <span className="font-display uppercase tracking-wider text-xs text-destructive">Match Disputed</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">· Awaiting admin review</span>
        <div className="ml-auto">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/matches/${session.activeMatchId}`}>Open Match<ArrowRight className="ml-1.5 h-3 w-3" /></Link>
          </Button>
        </div>
      </>
    );
  } else {
    // in_match | pending_confirmation
    const label = session.status === "pending_confirmation" ? "Result Pending" : "Match Active";
    body = (
      <>
        <Swords className="h-4 w-4 text-primary shrink-0" />
        <span className="font-display uppercase tracking-wider text-xs text-primary">{modeLabel} · {label}</span>
        <div className="ml-auto">
          <Button size="sm" variant="neon" asChild>
            <Link to={`/matches/${session.activeMatchId}`}>Open Match<ArrowRight className="ml-1.5 h-3 w-3" /></Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className={`sticky top-16 z-40 border-b backdrop-blur-md ${tone}`}>
      <div className="container flex items-center gap-2 py-2 flex-wrap">
        {body}
      </div>
    </div>
  );
}