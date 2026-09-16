import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Loader2, Crown, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Either userId or signupIds (for team page) */
  userId?: string;
  signupIds?: string[];
}

interface Row {
  signup_id: string;
  team_name: string;
  team_tag: string | null;
  tournament_id: string;
  tournament_name: string;
  status: string;
  role: string;
  played: number;
  wins: number;
  losses: number;
}

export default function CommunityCupHistory({ userId, signupIds }: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let sigs: string[] = signupIds ?? [];
      let memberRoles: Record<string, string> = {};
      if (userId) {
        const { data: mems } = await supabase
          .from("tournament_roster_members")
          .select("signup_id, role, status")
          .eq("user_id", userId)
          .in("status", ["accepted", "locked"]);
        sigs = (mems ?? []).map((m: any) => m.signup_id);
        memberRoles = Object.fromEntries((mems ?? []).map((m: any) => [m.signup_id, m.role]));
      }
      if (!sigs.length) { if (!cancelled) setRows([]); return; }
      const { data: signups } = await supabase
        .from("tournament_team_signups")
        .select("id, team_name, team_tag, status, tournament_id")
        .in("id", sigs);
      const tids = Array.from(new Set((signups ?? []).map((s: any) => s.tournament_id)));
      const { data: tournaments } = await supabase
        .from("tournaments").select("id, name").in("id", tids);
      const tmap = Object.fromEntries((tournaments ?? []).map((t: any) => [t.id, t.name]));
      const { data: matches } = await supabase
        .from("matches")
        .select("signup_a_id, signup_b_id, winner_id, team_a_id, team_b_id, status")
        .or(`signup_a_id.in.(${sigs.join(",")}),signup_b_id.in.(${sigs.join(",")})`);
      const stats: Record<string, { played: number; wins: number; losses: number }> = {};
      sigs.forEach(s => stats[s] = { played: 0, wins: 0, losses: 0 });
      (matches ?? []).forEach((m: any) => {
        if (m.status !== "completed") return;
        const isA = sigs.includes(m.signup_a_id);
        const isB = sigs.includes(m.signup_b_id);
        const sid = isA ? m.signup_a_id : isB ? m.signup_b_id : null;
        if (!sid) return;
        stats[sid].played += 1;
        // winner_id references team_id which may be null for cup; fallback compare via signup tracking
        // Conservative: only count wins/losses if winner_id is set and matches one of the team_ids
        if (m.winner_id) {
          if ((isA && m.team_a_id === m.winner_id) || (isB && m.team_b_id === m.winner_id)) stats[sid].wins += 1;
          else stats[sid].losses += 1;
        }
      });
      const out: Row[] = (signups ?? []).map((s: any) => ({
        signup_id: s.id,
        team_name: s.team_name,
        team_tag: s.team_tag,
        tournament_id: s.tournament_id,
        tournament_name: tmap[s.tournament_id] ?? "Community Cup",
        status: s.status,
        role: memberRoles[s.id] ?? "player",
        played: stats[s.id]?.played ?? 0,
        wins: stats[s.id]?.wins ?? 0,
        losses: stats[s.id]?.losses ?? 0,
      }));
      if (!cancelled) setRows(out);
    })();
    return () => { cancelled = true; };
  }, [userId, signupIds?.join(",")]);

  if (rows === null) {
    return <Card className="p-4 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Loading…</span></Card>;
  }
  if (rows.length === 0) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h3 className="font-display uppercase tracking-wider text-sm">Community Cup History</h3>
        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px]">No ELO · Community Event</Badge>
      </div>
      <ul className="space-y-2">
        {rows.map(r => (
          <li key={r.signup_id} className="flex items-center gap-3 rounded border border-border bg-background/40 p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-display truncate">
                  {r.team_tag && <span className="text-muted-foreground mr-1">[{r.team_tag}]</span>}
                  {r.team_name}
                </p>
                {r.role === "captain" && <Crown className="h-3 w-3 text-primary" />}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{r.tournament_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-display flex items-center gap-1 justify-end">
                <Swords className="h-3 w-3" /> {r.played} · {r.wins}W / {r.losses}L
              </p>
              {r.status === "champion" && <Badge variant="outline" className="border-accent text-accent text-[10px] mt-1"><Trophy className="h-2.5 w-2.5 mr-0.5" />Champion</Badge>}
              {r.status === "eliminated" && <Badge variant="outline" className="text-[10px] mt-1 text-muted-foreground">Eliminated</Badge>}
            </div>
            <Link
              to={`/tournaments/community-cup-1`}
              className="text-[11px] text-primary hover:underline font-display"
            >View</Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}