import { Link } from "react-router-dom";
import StatusPill from "./StatusPill";
import { Crown, Trophy } from "lucide-react";
import TeamLogo from "@/components/teams/TeamLogo";

export interface PlayoffMatch {
  id: string;
  matchday: number | null;
  bracket_position: number | null;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  winner_id: string | null;
  result_status: string;
  scheduled_at: string | null;
}

export interface TeamLite {
  id: string;
  name: string;
  tag: string | null;
  avatar_url: string | null;
}

export default function PlayoffBracket({
  matches,
  teamMap,
  championTeamId,
}: {
  matches: PlayoffMatch[];
  teamMap: Record<string, TeamLite>;
  championTeamId: string | null;
}) {
  const semis = matches.filter((m) => (m.matchday ?? 0) === 999).sort((a, b) => (a.bracket_position ?? 0) - (b.bracket_position ?? 0));
  const final = matches.find((m) => (m.matchday ?? 0) >= 1000);

  if (semis.length === 0 && !final) {
    return (
      <div className="border border-dashed border-border rounded-md p-12 text-center">
        <Trophy className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-display uppercase tracking-wider text-sm">Playoffs not started yet</p>
        <p className="text-xs text-muted-foreground mt-2">When the regular season ends, an admin will start the playoffs and the top 4 teams will advance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {championTeamId && teamMap[championTeamId] && (
        <div className="rounded-md border border-primary/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 text-center">
          <Crown className="h-10 w-10 mx-auto text-primary mb-2" />
          <p className="font-display uppercase tracking-widest text-xs text-muted-foreground">Champion</p>
          <Link to={`/teams/${championTeamId}`} className="font-display font-bold text-3xl uppercase hover:text-primary">
            {teamMap[championTeamId].name}
          </Link>
        </div>
      )}
      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center">
        <div className="space-y-3 min-w-0">
          <h4 className="font-display uppercase tracking-wider text-xs text-muted-foreground">Semifinals</h4>
          {semis.map((m) => (
            <BracketMatch key={m.id} m={m} teamMap={teamMap} />
          ))}
        </div>
        <div className="hidden sm:block text-muted-foreground text-2xl text-center">→</div>
        <div className="space-y-3 min-w-0">
          <h4 className="font-display uppercase tracking-wider text-xs text-muted-foreground">Grand Final</h4>
          {final && <BracketMatch m={final} teamMap={teamMap} highlight />}
        </div>
      </div>
    </div>
  );
}

function BracketMatch({ m, teamMap, highlight }: { m: PlayoffMatch; teamMap: Record<string, TeamLite>; highlight?: boolean }) {
  const tA = m.team_a_id ? teamMap[m.team_a_id] : null;
  const tB = m.team_b_id ? teamMap[m.team_b_id] : null;
  const aWin = m.winner_id && m.winner_id === m.team_a_id;
  const bWin = m.winner_id && m.winner_id === m.team_b_id;
  return (
    <Link
      to={`/matches/${m.id}`}
      className={`block rounded-md border p-3 hover:border-primary/60 transition-colors ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card/40"}`}
    >
      <div className="flex items-center justify-between mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString() : "TBD"}</span>
        <StatusPill status={m.result_status} />
      </div>
      <Row team={tA} score={m.score_a} winner={!!aWin} />
      <Row team={tB} score={m.score_b} winner={!!bWin} />
    </Link>
  );
}

function Row({ team, score, winner }: { team: TeamLite | null; score: number | null; winner: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${winner ? "text-primary font-bold" : ""}`}>
      <div className="flex items-center gap-2 min-w-0">
        <TeamLogo name={team?.name} tag={team?.tag} avatarUrl={team?.avatar_url} size={20} rounded="md" />
        <span className="font-display uppercase truncate">{team?.name ?? "TBD"}</span>
      </div>
      <span className="font-display tabular-nums">{score ?? "-"}</span>
    </div>
  );
}