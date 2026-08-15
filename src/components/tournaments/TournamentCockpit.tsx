import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Check, CircleDot, Clock3, Flag, Map, Radio, ShieldCheck, Swords, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type TournamentLike = {
  id: string;
  name: string;
  status: string;
  registration_open_at: string | null;
  registration_close_at: string | null;
  checkin_open_at: string | null;
  checkin_close_at: string | null;
  start_date: string | null;
  end_date: string | null;
  bracket_type: string;
  seeding_enabled: boolean;
  map_selection_mode: string;
  match_format_default: string;
  match_format_final: string;
  forfeit_grace_minutes: number;
  game: string;
};

type TeamState = { id: string; name: string } | null;

function phaseState(date: string | null, fallback: "done" | "active" | "next") {
  if (!date) return fallback;
  return new Date(date).getTime() < Date.now() ? "done" : "next";
}

export default function TournamentCockpit({ tournament, participants }: { tournament: TournamentLike; participants: number }) {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamState>(null);
  const [registration, setRegistration] = useState<{ registered_at: string } | null>(null);
  const [nextMatch, setNextMatch] = useState<{ id: string; scheduled_at: string | null; result_status: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data: owned } = await supabase.from("teams").select("id, name").eq("owner_id", user.id).limit(1).maybeSingle();
      let current = owned as TeamState;
      if (!current) {
        const { data: membership } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).limit(1).maybeSingle();
        if (membership?.team_id) {
          const { data: joined } = await supabase.from("teams").select("id, name").eq("id", membership.team_id).maybeSingle();
          current = joined as TeamState;
        }
      }
      if (!active || !current) return;
      setTeam(current);
      const [{ data: reg }, { data: matches }] = await Promise.all([
        supabase.from("tournament_registrations").select("registered_at").eq("tournament_id", tournament.id).eq("team_id", current.id).maybeSingle(),
        supabase.from("matches").select("id, scheduled_at, result_status").eq("tournament_id", tournament.id).or(`team_a_id.eq.${current.id},team_b_id.eq.${current.id}`).in("result_status", ["scheduled", "live", "awaiting_result"]).order("scheduled_at", { ascending: true }).limit(1),
      ]);
      if (!active) return;
      setRegistration(reg as { registered_at: string } | null);
      setNextMatch((matches?.[0] as typeof nextMatch) ?? null);
    })();
    return () => { active = false; };
  }, [tournament.id, user]);

  const phases = useMemo(() => {
    const live = ["live", "active"].includes(tournament.status);
    const completed = tournament.status === "completed";
    return [
      { label: "Registrazione", detail: participants ? `${participants} confermati` : "Aperta", icon: Users, state: completed || live ? "done" : phaseState(tournament.registration_close_at, "active") },
      { label: "Check-in", detail: tournament.checkin_open_at ? new Date(tournament.checkin_open_at).toLocaleString() : "Pre-match", icon: CalendarCheck, state: completed || live ? "done" : "next" },
      { label: "Seeding", detail: tournament.seeding_enabled ? "Ranking-based" : "Manuale", icon: Flag, state: completed || live ? "done" : "next" },
      { label: "Live bracket", detail: tournament.bracket_type.replace(/_/g, " "), icon: Swords, state: completed ? "done" : live ? "active" : "next" },
      { label: "Finali", detail: tournament.match_format_final.toUpperCase(), icon: ShieldCheck, state: completed ? "done" : "next" },
    ];
  }, [participants, tournament]);

  return (
    <section className="tournament-cockpit tactical-panel mb-8 overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.24em] font-display text-primary"><Radio className="h-3.5 w-3.5 animate-pulse" />Tournament Cockpit</div>
          <h2 className="font-display uppercase text-2xl font-bold mt-1">Mission timeline</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <Badge variant="outline"><Map className="h-3 w-3 mr-1" />{tournament.map_selection_mode.replace(/_/g, " ")}</Badge>
          <Badge variant="outline"><Clock3 className="h-3 w-3 mr-1" />Grace {tournament.forfeit_grace_minutes}m</Badge>
          <Badge variant="outline"><Swords className="h-3 w-3 mr-1" />{tournament.match_format_default.toUpperCase()}</Badge>
        </div>
      </div>
      <div className="grid md:grid-cols-5 bg-border/70 gap-px">
        {phases.map(({ label, detail, icon: Icon, state }, index) => (
          <div key={label} className={`bg-card/95 p-4 min-h-28 relative ${state === "active" ? "cockpit-phase-active" : ""}`}>
            <div className="flex items-center justify-between"><span className="text-[9px] font-mono text-muted-foreground">0{index + 1}</span>{state === "done" ? <Check className="h-4 w-4 text-success" /> : state === "active" ? <Radio className="h-4 w-4 text-primary animate-pulse" /> : <CircleDot className="h-4 w-4 text-muted-foreground" />}</div>
            <Icon className={`h-5 w-5 mt-4 ${state === "active" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="font-display uppercase font-bold text-xs mt-2">{label}</div>
            <div className="text-[10px] text-muted-foreground mt-1 truncate">{detail}</div>
          </div>
        ))}
      </div>
      {user && (
        <div className="p-4 md:p-5 bg-primary/[0.035] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-[9px] uppercase tracking-[.24em] text-muted-foreground font-display">Your command</div>
            <div className="text-sm mt-1">
              {!team ? "Crea una squadra per entrare nella competizione." : !registration ? `${team.name} non è ancora registrato.` : nextMatch ? `${team.name}: prossima partita pronta nel cockpit.` : `${team.name}: registrazione confermata.`}
            </div>
          </div>
          <Button asChild size="sm" className="signal-button shrink-0">
            <Link to={!team ? "/teams" : nextMatch ? `/matches/${nextMatch.id}` : `/teams/${team.id}/dashboard`}>
              {!team ? "Crea squadra" : nextMatch ? "Apri match room" : "Apri Club HQ"}
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}

