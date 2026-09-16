import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Radio, ShieldCheck, Swords } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";

type Match = {
  id: string;
  game: string;
  map: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  player_a_id: string | null;
  player_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  status: string;
  result_status: string;
  matchday: number | null;
  scheduled_at: string | null;
};

export default function BroadcastMatchPage() {
  const { matchId } = useParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [sideA, setSideA] = useState("SIDE A");
  const [sideB, setSideB] = useState("SIDE B");

  const load = useCallback(async () => {
    if (!matchId) return;
    const { data } = await supabase.from("matches").select("id, game, map, team_a_id, team_b_id, player_a_id, player_b_id, score_a, score_b, status, result_status, matchday, scheduled_at").eq("id", matchId).maybeSingle();
    if (!data) return;
    const row = data as Match;
    setMatch(row);
    if (row.team_a_id || row.team_b_id) {
      const ids = [row.team_a_id, row.team_b_id].filter(Boolean) as string[];
      const { data: teams } = await supabase.from("teams").select("id, name, tag").in("id", ids);
      const byId = new Map((teams ?? []).map((team) => [team.id, team]));
      const a = row.team_a_id ? byId.get(row.team_a_id) : null;
      const b = row.team_b_id ? byId.get(row.team_b_id) : null;
      setSideA(a ? `${a.name}${a.tag ? ` [${a.tag}]` : ""}` : "SIDE A");
      setSideB(b ? `${b.name}${b.tag ? ` [${b.tag}]` : ""}` : "SIDE B");
    } else {
      const ids = [row.player_a_id, row.player_b_id].filter(Boolean) as string[];
      const { data: players } = await supabase.from("profiles").select("id, username, display_name").in("id", ids);
      const byId = new Map((players ?? []).map((player) => [player.id, player]));
      const a = row.player_a_id ? byId.get(row.player_a_id) : null;
      const b = row.player_b_id ? byId.get(row.player_b_id) : null;
      setSideA(a?.display_name ?? a?.username ?? "PLAYER A");
      setSideB(b?.display_name ?? b?.username ?? "PLAYER B");
    }
  }, [matchId]);

  useEffect(() => {
    load();
    if (!matchId) return;
    const channel = supabase.channel(`broadcast-${matchId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, matchId]);

  if (!match) return <main className="broadcast-arena grid place-items-center"><div className="font-display uppercase tracking-[.3em] text-primary animate-pulse">Connecting broadcast signal…</div></main>;

  const isLive = match.status === "live" || match.result_status === "live";
  const finished = ["confirmed", "admin_resolved", "completed"].includes(match.result_status) || match.status === "completed";

  return (
    <main className="broadcast-arena">
      <div className="broadcast-grid" />
      <div className="broadcast-slash" />
      <header className="relative z-[1] flex items-center justify-between p-8 md:p-12">
        <div className="flex items-center gap-3"><BrandLogo className="h-9 w-9" /><div><div className="font-display font-bold text-2xl tracking-tight">PEAKGG</div><div className="text-[9px] uppercase tracking-[.32em] text-primary">Broadcast mode</div></div></div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[.2em] font-display ${isLive ? "border-primary/50 text-primary bg-primary/10" : "border-border text-muted-foreground"}`}><Radio className={`h-3.5 w-3.5 ${isLive ? "animate-pulse" : ""}`} />{isLive ? "Live" : finished ? "Final" : "Scheduled"}</div>
      </header>
      <section className="relative z-[1] min-h-[calc(100vh-160px)] grid place-items-center px-8 pb-16">
        <div className="w-full max-w-6xl">
          <div className="text-center text-[11px] uppercase tracking-[.35em] text-muted-foreground font-display mb-10">{match.game.toUpperCase()} {match.map ? `// ${match.map}` : ""} {match.matchday ? `// Matchday ${match.matchday}` : ""}</div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-14">
            <div className="text-right"><div className="text-[10px] uppercase tracking-[.25em] text-muted-foreground">Challenger A</div><h1 className="font-display uppercase font-bold text-2xl sm:text-4xl md:text-6xl mt-3 leading-none break-words">{sideA}</h1></div>
            <div className="broadcast-score"><span className={(match.score_a ?? 0) > (match.score_b ?? 0) ? "text-primary" : ""}>{match.score_a ?? 0}</span><span className="opacity-25 mx-3">:</span><span className={(match.score_b ?? 0) > (match.score_a ?? 0) ? "text-primary" : ""}>{match.score_b ?? 0}</span></div>
            <div><div className="text-[10px] uppercase tracking-[.25em] text-muted-foreground">Challenger B</div><h1 className="font-display uppercase font-bold text-2xl sm:text-4xl md:text-6xl mt-3 leading-none break-words">{sideB}</h1></div>
          </div>
          <div className="mt-16 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.25em] text-muted-foreground"><ShieldCheck className="h-4 w-4 text-success" /><Swords className="h-4 w-4 text-primary" />Official PeakGG competitive match</div>
        </div>
      </section>
    </main>
  );
}

