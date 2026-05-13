import { useEffect, useState } from "react";
import { buildMatchUrl, buildTournamentMatchUrl } from "@/lib/match-url";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Match = {
  id: string;
  round: number;
  bracket_position: number;
  team_a_id: string | null;
  team_b_id: string | null;
  signup_a_id?: string | null;
  signup_b_id?: string | null;
  selected_map?: string | null;
  score_a: number | null;
  score_b: number | null;
  winner_id: string | null;
  status: string;
};

interface Props { tournamentId: string; tournamentSlug?: string }

export default function BracketView({ tournamentId, tournamentSlug }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Record<string, { name: string; tag: string }>>({});
  const [signups, setSignups] = useState<Record<string, { name: string; tag: string | null }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase
        .from("matches")
        .select("*") as any)
        .eq("tournament_id", tournamentId)
        .not("round", "is", null)
        .order("round", { ascending: true })
        .order("bracket_position", { ascending: true });
      if (!active) return;
      const rows = (data ?? []) as Match[];
      setMatches(rows);
      const ids = [...new Set(rows.flatMap(m => [m.team_a_id, m.team_b_id]).filter(Boolean) as string[])];
      if (ids.length) {
        const { data: ts } = await supabase.from("teams").select("id, name, tag").in("id", ids);
        const map: Record<string, { name: string; tag: string }> = {};
        for (const t of ts ?? []) map[t.id] = { name: t.name, tag: t.tag };
        setTeams(map);
      }
      const sids = [...new Set(rows.flatMap(m => [m.signup_a_id, m.signup_b_id]).filter(Boolean) as string[])];
      if (sids.length) {
        const { data: ss } = await supabase.from("tournament_team_signups_public").select("id, team_name, team_tag").in("id", sids);
        const sm: Record<string, { name: string; tag: string | null }> = {};
        for (const s of (ss ?? []) as any[]) sm[s.id] = { name: s.team_name, tag: s.team_tag };
        setSignups(sm);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [tournamentId]);

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (matches.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">Bracket non ancora generato</p>;

  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

  const sideLabel = (m: Match, side: "a" | "b") => {
    const sid = side === "a" ? m.signup_a_id : m.signup_b_id;
    const tid = side === "a" ? m.team_a_id : m.team_b_id;
    if (sid && signups[sid]) {
      const s = signups[sid];
      return <span className="font-display">{s.tag ?? ""}<span className="text-muted-foreground"> · {s.name}</span></span>;
    }
    if (tid && teams[tid]) {
      const t = teams[tid];
      return <span className="font-display">{t.tag}<span className="text-muted-foreground"> · {t.name}</span></span>;
    }
    return <span className="text-muted-foreground italic">TBD</span>;
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {rounds.map(r => {
          const ms = matches.filter(m => m.round === r);
          const isFinal = r === rounds[rounds.length - 1];
          return (
            <div key={r} className="flex flex-col gap-4 min-w-[220px]">
              <h4 className="font-display uppercase tracking-widest text-xs text-muted-foreground">
                {isFinal ? "Finale" : r === rounds[rounds.length - 2] ? "Semifinali" : `Round ${r}`}
              </h4>
              <div className={cn("flex flex-col", ms.length <= 2 ? "gap-12" : "gap-3")}>
                {ms.map(m => (
                  <div key={m.id} className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className={cn("flex items-center justify-between px-3 py-2 border-b border-border",
                      m.winner_id && m.winner_id === m.team_a_id && "bg-primary/10")}>
                      <span className="text-sm">{sideLabel(m, "a")}</span>
                      <span className="font-mono text-sm">{m.score_a ?? "—"}</span>
                    </div>
                    <div className={cn("flex items-center justify-between px-3 py-2",
                      m.winner_id && m.winner_id === m.team_b_id && "bg-primary/10")}>
                      <span className="text-sm">{sideLabel(m, "b")}</span>
                      <span className="font-mono text-sm">{m.score_b ?? "—"}</span>
                    </div>
                    {m.selected_map && (
                      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border-t border-border">Map: {m.selected_map}</div>
                    )}
                    {tournamentSlug && (
                      <div className="px-2 py-2 border-t border-border">
                        <Button asChild size="sm" variant="outline" className="w-full h-7 text-xs">
                          <Link to={(buildTournamentMatchUrl(tournamentSlug, m.id) ?? "#")}>
                            <ExternalLink className="h-3 w-3 mr-1" /> View Match
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}