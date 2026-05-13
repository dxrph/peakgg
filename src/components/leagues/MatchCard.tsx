import { Link } from "react-router-dom";
import { buildMatchUrl } from "@/lib/match-url";
import StatusPill from "./StatusPill";
import TeamLogo from "@/components/teams/TeamLogo";

export interface MatchCardData {
  id: string;
  matchday?: number | null;
  scheduled_at?: string | null;
  team_a?: { id: string; name: string; tag?: string | null; avatar_url?: string | null } | null;
  team_b?: { id: string; name: string; tag?: string | null; avatar_url?: string | null } | null;
  score_a?: number | null;
  score_b?: number | null;
  result_status: string;
  map?: string | null;
  game?: string | null;
}

function TeamBlock({ t, side }: { t: MatchCardData["team_a"]; side: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-2 ${side === "right" ? "flex-row-reverse text-right" : ""} flex-1 min-w-0`}>
      <TeamLogo name={t?.name} tag={t?.tag} avatarUrl={t?.avatar_url} size={32} rounded="md" />
      <div className="min-w-0">
        <div className="font-display font-bold uppercase truncate text-sm">{t?.name ?? "TBD"}</div>
        {t?.tag && <div className="text-[10px] text-muted-foreground">[{t.tag}]</div>}
      </div>
    </div>
  );
}

export default function MatchCard({ m }: { m: MatchCardData }) {
  const showScore = ["confirmed", "admin_resolved", "pending_confirmation", "live"].includes(m.result_status);
  return (
    <Link
      to={(buildMatchUrl(m.id) ?? "#")}
      className="block border border-border rounded-md p-4 bg-card/40 hover:bg-card/60 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
          {m.matchday ? `Matchday ${m.matchday}` : "Match"}
          {m.scheduled_at && ` · ${new Date(m.scheduled_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
        </div>
        <StatusPill status={m.result_status} />
      </div>
      <div className="flex items-center gap-3">
        <TeamBlock t={m.team_a} side="left" />
        <div className="text-center px-3 shrink-0">
          {showScore ? (
            <div className="font-display font-bold text-xl">
              <span className={(m.score_a ?? 0) > (m.score_b ?? 0) ? "text-primary" : ""}>{m.score_a ?? 0}</span>
              <span className="text-muted-foreground mx-1">:</span>
              <span className={(m.score_b ?? 0) > (m.score_a ?? 0) ? "text-primary" : ""}>{m.score_b ?? 0}</span>
            </div>
          ) : (
            <div className="font-display text-muted-foreground">VS</div>
          )}
          {m.map && <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{m.map}</div>}
        </div>
        <TeamBlock t={m.team_b} side="right" />
      </div>
    </Link>
  );
}
