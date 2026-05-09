import { Link } from "react-router-dom";
import FormDots from "./FormDots";
import { cn } from "@/lib/utils";
import TeamLogo from "@/components/teams/TeamLogo";

export interface StandingRow {
  team_id: string;
  team_name: string;
  team_tag?: string | null;
  team_avatar?: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  round_diff: number;
  form: string[];
  position: number | null;
}

export default function StandingsTable({
  rows, playoffSize = 4, currentUserTeamId,
}: { rows: StandingRow[]; playoffSize?: number; currentUserTeamId?: string | null }) {
  if (!rows.length) {
    return (
      <div className="border border-border rounded-md p-8 text-center text-sm text-muted-foreground">
        No standings yet. Standings appear once teams are approved and matches are confirmed.
      </div>
    );
  }
  const total = rows.length;
  return (
    <div className="overflow-x-auto border border-border rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-card/60 border-b border-border">
          <tr className="text-left text-[10px] font-display uppercase tracking-widest text-muted-foreground">
            <th className="px-3 py-2 w-10">#</th>
            <th className="px-3 py-2 sticky left-10 bg-card/60">Team</th>
            <th className="px-2 py-2 text-center">P</th>
            <th className="px-2 py-2 text-center">W</th>
            <th className="px-2 py-2 text-center">D</th>
            <th className="px-2 py-2 text-center">L</th>
            <th className="px-2 py-2 text-center">RD</th>
            <th className="px-2 py-2 text-center text-primary">Pts</th>
            <th className="px-3 py-2">Form</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const pos = r.position ?? idx + 1;
            const inPlayoff = pos <= playoffSize;
            const inRelegation = total >= 6 && pos > total - 2;
            const isMe = currentUserTeamId && r.team_id === currentUserTeamId;
            return (
              <tr
                key={r.team_id}
                className={cn(
                  "border-b border-border/50 hover:bg-muted/20 transition-colors",
                  isMe && "bg-primary/5 ring-1 ring-primary/30",
                )}
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-1 h-6 rounded-sm",
                      inPlayoff ? "bg-primary" : inRelegation ? "bg-destructive/60" : "bg-transparent",
                    )} />
                    <span className="font-display font-bold">{pos}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <Link to={`/teams/${r.team_id}`} className="flex items-center gap-2 hover:text-primary">
                    <TeamLogo name={r.team_name} tag={r.team_tag} avatarUrl={r.team_avatar} size={24} rounded="md" />
                    <span className="font-display font-bold uppercase tracking-wide truncate max-w-[180px]">
                      {r.team_name}
                    </span>
                    {r.team_tag && <span className="text-[10px] text-muted-foreground">[{r.team_tag}]</span>}
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-center">{r.played}</td>
                <td className="px-2 py-2.5 text-center text-success">{r.wins}</td>
                <td className="px-2 py-2.5 text-center">{r.draws}</td>
                <td className="px-2 py-2.5 text-center text-destructive">{r.losses}</td>
                <td className="px-2 py-2.5 text-center">{r.round_diff > 0 ? `+${r.round_diff}` : r.round_diff}</td>
                <td className="px-2 py-2.5 text-center font-display font-bold text-primary">{r.points}</td>
                <td className="px-3 py-2.5"><FormDots form={r.form ?? []} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-4 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-t border-border bg-card/30">
        <span className="flex items-center gap-1.5"><span className="w-1 h-3 bg-primary rounded-sm" /> Playoff zone</span>
        {total >= 6 && <span className="flex items-center gap-1.5"><span className="w-1 h-3 bg-destructive/60 rounded-sm" /> Relegation zone</span>}
      </div>
    </div>
  );
}
