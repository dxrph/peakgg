import { useEffect, useState } from "react";
import { buildMatchUrl } from "@/lib/match-url";
import { Link } from "react-router-dom";
import { Loader2, X, ArrowRight, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RankBadge from "@/components/RankBadge";

interface Props {
  mode: "open_cup" | "ranked";
  game: string;
  teamSize: number;
  joinedAt?: string | null;
  myElo?: number | null;
  onCancel: () => void;
  cancelling?: boolean;
  activeMatchId?: string | null;
}

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function QueueLobby({
  mode, game, teamSize, joinedAt, myElo, onCancel, cancelling, activeMatchId,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = joinedAt ? Math.max(0, Math.floor((now - new Date(joinedAt).getTime()) / 1000)) : 0;
  const modeLabel = mode === "open_cup" ? "Open Cup Beta" : "Ranked Beta";

  if (activeMatchId) {
    return (
      <div className="rounded-xl border border-success/40 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="outline" className="border-success/40 text-success font-display uppercase text-[10px] mb-1">Match Found</Badge>
            <h3 className="font-display font-bold text-lg uppercase">You have an active match</h3>
            <p className="text-sm text-muted-foreground font-body">{modeLabel} · {teamSize}v{teamSize} · {game.toUpperCase()}</p>
          </div>
          <Button asChild variant="neon" className="uppercase tracking-wider">
            <Link to={(buildMatchUrl(activeMatchId) ?? "#")}>Open Match<ArrowRight className="ml-2 h-3 w-3" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <Swords className="absolute inset-0 m-auto h-3 w-3 text-primary" />
          </div>
          <div className="min-w-0">
            <Badge variant="outline" className="border-primary/40 text-primary font-display uppercase text-[10px]">{modeLabel}</Badge>
            <h3 className="font-display font-bold text-lg uppercase mt-1">Searching for opponents…</h3>
            <p className="text-xs text-muted-foreground font-body">{teamSize}v{teamSize} {teamSize === 1 ? "Test Queue" : "Beta"} · {game.toUpperCase()}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={cancelling}>
          <X className="h-3 w-3 mr-1.5" />Cancel Queue
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t border-border/60 pt-3">
        <span className="font-mono tabular-nums text-foreground">{fmt(elapsed)}</span>
        {myElo != null && (
          <span className="flex items-center gap-1.5"><RankBadge elo={myElo} size="sm" /><span>{myElo} ELO</span></span>
        )}
        <span className="ml-auto">Don't close the page — we'll open your match automatically.</span>
      </div>
      {teamSize === 1 && (
        <p className="text-[10px] text-muted-foreground/70 mt-2 italic">
          Final Open Cup format will be 5v5 solo queue. This is a small-size test.
        </p>
      )}
    </div>
  );
}