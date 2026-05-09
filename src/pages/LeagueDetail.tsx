import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import StatusPill from "@/components/leagues/StatusPill";
import StandingsTable, { StandingRow } from "@/components/leagues/StandingsTable";
import MatchCard, { MatchCardData } from "@/components/leagues/MatchCard";
import PlayoffBracket, { PlayoffMatch } from "@/components/leagues/PlayoffBracket";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Calendar, ChevronLeft, Mountain, Plus, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { DISCORD_INVITE } from "@/lib/links";

interface League { id: string; name: string; slug: string; game: string; description: string | null; rules_md: string | null; reward_text: string | null; banner_url: string | null; status: string; max_teams: number; min_roster_size: number; }
interface Season { id: string; name: string; format: string; starts_at: string | null; ends_at: string | null; registration_deadline: string | null; playoff_size: number; status: string; playoffs_started_at: string | null; champion_team_id: string | null; }
interface Division { id: string; name: string; tier: number; capacity: number; }
interface TeamLite { id: string; name: string; tag: string | null; avatar_url: string | null; owner_id: string; game?: string | null; }

export default function LeagueDetailPage() {
  const { leagueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [division, setDivision] = useState<Division | null>(null);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [matches, setMatches] = useState<MatchCardData[]>([]);
  const [playoffMatches, setPlayoffMatches] = useState<PlayoffMatch[]>([]);
  const [teams, setTeams] = useState<TeamLite[]>([]);
  const [myTeams, setMyTeams] = useState<TeamLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const teamMap = useMemo(() => Object.fromEntries(teams.map(t => [t.id, t])), [teams]);

  const load = async () => {
    if (!leagueId) return;
    const { data: l } = await supabase.from("leagues").select("*").eq("id", leagueId).maybeSingle();
    setLeague(l as League);
    const { data: ss } = await supabase
      .from("league_seasons")
      .select("*")
      .eq("league_id", leagueId)
      .order("season_number", { ascending: false })
      .limit(1);
    const s = (ss?.[0] ?? null) as Season | null;
    setSeason(s);
    if (s) {
      const { data: divs } = await supabase.from("league_divisions").select("*").eq("season_id", s.id).order("tier").limit(1);
      const d = (divs?.[0] ?? null) as Division | null;
      setDivision(d);
      // Approved teams
      const { data: regs } = await supabase
        .from("league_registrations")
        .select("team_id")
        .eq("season_id", s.id)
        .eq("status", "approved");
      const teamIds = (regs ?? []).map(r => r.team_id);
      let teamRows: TeamLite[] = [];
      if (teamIds.length) {
        const { data: tdata } = await supabase
          .from("teams")
          .select("id, name, tag, avatar_url, owner_id")
          .in("id", teamIds);
        teamRows = (tdata ?? []) as TeamLite[];
      }
      setTeams(teamRows);
      // Standings
      if (d) {
        const { data: st } = await supabase
          .from("league_standings")
          .select("*")
          .eq("division_id", d.id)
          .order("position", { ascending: true, nullsFirst: false });
        const tMap = Object.fromEntries(teamRows.map(t => [t.id, t]));
        setStandings((st ?? []).map((r: any) => ({
          team_id: r.team_id,
          team_name: tMap[r.team_id]?.name ?? "Unknown",
          team_tag: tMap[r.team_id]?.tag ?? null,
          team_avatar: tMap[r.team_id]?.avatar_url ?? null,
          played: r.played, wins: r.wins, draws: r.draws, losses: r.losses,
          points: r.points, round_diff: r.round_diff,
          form: r.form ?? [], position: r.position,
        })));
      }
      // Matches
      const { data: ms } = await supabase
        .from("matches")
        .select("id, matchday, scheduled_at, team_a_id, team_b_id, score_a, score_b, result_status, map, game, bracket_position, winner_id")
        .eq("season_id", s.id)
        .order("matchday", { ascending: true });
      const tMap2 = Object.fromEntries(teamRows.map(t => [t.id, t]));
      const all = (ms ?? []) as any[];
      const regular = all.filter(m => (m.matchday ?? 0) < 999);
      const playoffs = all.filter(m => (m.matchday ?? 0) >= 999);
      setMatches(regular.map((m: any) => ({
        id: m.id, matchday: m.matchday, scheduled_at: m.scheduled_at,
        team_a: tMap2[m.team_a_id] ?? null, team_b: tMap2[m.team_b_id] ?? null,
        score_a: m.score_a, score_b: m.score_b,
        result_status: m.result_status ?? "scheduled", map: m.map, game: m.game,
      })));
      setPlayoffMatches(playoffs.map((m: any) => ({
        id: m.id, matchday: m.matchday, bracket_position: m.bracket_position,
        team_a_id: m.team_a_id, team_b_id: m.team_b_id,
        score_a: m.score_a, score_b: m.score_b, winner_id: m.winner_id,
        result_status: m.result_status ?? "scheduled", scheduled_at: m.scheduled_at,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [leagueId]);

  useEffect(() => {
    if (!user) { setMyTeams([]); return; }
    (async () => {
      const { data } = await supabase
        .from("teams")
        .select("id, name, tag, avatar_url, owner_id, game")
        .eq("owner_id", user.id);
      setMyTeams((data ?? []) as TeamLite[]);
    })();
  }, [user]);

  // Realtime standings
  useEffect(() => {
    if (!division) return;
    const ch = supabase
      .channel(`standings-${division.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "league_standings", filter: `division_id=eq.${division.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [division?.id]);

  const [allMyRegs, setAllMyRegs] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!season || myTeams.length === 0) { setAllMyRegs(new Set()); return; }
    (async () => {
      const { data } = await supabase
        .from("league_registrations")
        .select("team_id, status")
        .eq("season_id", season.id)
        .in("team_id", myTeams.map(t => t.id));
      setAllMyRegs(new Set((data ?? []).filter((r: any) => ["pending","approved"].includes(r.status)).map((r: any) => r.team_id)));
    })();
  }, [season?.id, myTeams.map(t => t.id).join(",")]);

  const myCaptainTeams = myTeams;
  const canRegister = season?.status === "registration_open" && myCaptainTeams.length > 0;
  // Only teams of the same game that aren't already registered
  const eligible = myCaptainTeams.filter(t => !allMyRegs.has(t.id) && (!league?.game || !t.game || t.game === league.game));
  const myPendingOrApproved = myCaptainTeams.filter(t => allMyRegs.has(t.id));
  const wrongGameTeams = myCaptainTeams.filter(t => !allMyRegs.has(t.id) && league?.game && t.game && t.game !== league.game);

  const handleRegister = async (teamId: string) => {
    if (!season) return;
    setRegistering(true);
    const { error } = await supabase.rpc("register_team_for_season", { _season_id: season.id, _team_id: teamId });
    setRegistering(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Registration submitted — awaiting admin approval");
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background"><Navbar /><div className="container py-10"><Skeleton className="h-64" /></div></div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <h1 className="font-display text-3xl uppercase">League not found</h1>
          <Button asChild variant="outline" className="mt-4"><Link to="/leagues">Back to Leagues</Link></Button>
        </div>
      </div>
    );
  }

  const myCurrentStandingTeam = standings.find(s => myCaptainTeams.some(t => t.id === s.team_id))?.team_id ?? null;
  const matchdayGroups = matches.reduce<Record<number, MatchCardData[]>>((acc, m) => {
    const k = m.matchday ?? 0;
    (acc[k] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={`${league.name} — Peak League | PeakGG`} description={league.description ?? "Compete in Peak League."} />
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-primary/10 to-background relative overflow-hidden">
          {league.banner_url && (
            <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${league.banner_url})` }} />
          )}
          <div className="container py-10 relative">
            <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
              <Link to="/leagues"><ChevronLeft className="h-4 w-4" /> All leagues</Link>
            </Button>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-primary mb-2">
                  <Mountain className="h-4 w-4" /> {league.game} · {season?.name ?? "No season"}
                </div>
                <h1 className="font-display font-bold text-4xl md:text-5xl uppercase tracking-tight">{league.name}</h1>
                {league.description && <p className="mt-3 text-muted-foreground max-w-2xl">{league.description}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusPill status={season?.status ?? league.status} />
                {league.reward_text && (
                  <div className="text-sm flex items-center gap-1.5"><Trophy className="h-4 w-4 text-primary" /> {league.reward_text}</div>
                )}
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {teams.length}/{league.max_teams} teams
                </div>
              </div>
            </div>

            {myPendingOrApproved.length > 0 && (
              <Card className="mt-6 p-4 border-success/40 bg-success/5">
                <p className="text-sm">
                  ✓ {myPendingOrApproved.map(t => t.name).join(", ")} {myPendingOrApproved.length === 1 ? "is" : "are"} already registered for {season?.name}.
                </p>
              </Card>
            )}
            {canRegister && eligible.length > 0 && (
              <Card className="mt-6 p-4 border-primary/40 bg-primary/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display uppercase tracking-wider text-sm">Register your team for {season?.name}</p>
                    <p className="text-xs text-muted-foreground">Min roster: {league.min_roster_size} players · Registration deadline {season?.registration_deadline ? new Date(season.registration_deadline).toLocaleDateString() : "TBD"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {eligible.map(t => (
                      <Button key={t.id} onClick={() => handleRegister(t.id)} disabled={registering}>
                        Register {t.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            )}
            {canRegister && eligible.length === 0 && wrongGameTeams.length > 0 && (
              <Card className="mt-6 p-4 border-amber-500/40 bg-amber-500/5">
                <p className="text-sm">Your team's game doesn't match this league ({league.game}). Create a {league.game} team to register.</p>
              </Card>
            )}
            {!user && season?.status === "registration_open" && (
              <Card className="mt-6 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-sm">Sign in as a team captain to register your team.</p>
                  <Button onClick={() => navigate("/login")}>Sign in</Button>
                </div>
              </Card>
            )}
          </div>
        </section>

        <section className="container py-8">
          <Tabs defaultValue="overview">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="playoffs">Playoffs</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-6">
                  <h2 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-3">About this league</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{league.description ?? "No description provided."}</p>
                </Card>
                {standings.length > 0 && (
                  <Card className="p-4">
                    <h2 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-3 px-2">Top of the table</h2>
                    <StandingsTable rows={standings.slice(0, 5)} playoffSize={season?.playoff_size ?? 4} currentUserTeamId={myCurrentStandingTeam} />
                  </Card>
                )}
              </div>
              <div className="space-y-4">
                <Card className="p-5">
                  <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-3">Season info</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Format</dt><dd className="font-display uppercase">{season?.format?.replace("_", " ") ?? "TBD"}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Teams</dt><dd>{teams.length}/{league.max_teams}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Playoff slots</dt><dd>Top {season?.playoff_size ?? 4}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Min roster</dt><dd>{league.min_roster_size}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Starts</dt><dd>{season?.starts_at ? new Date(season.starts_at).toLocaleDateString() : "TBD"}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Ends</dt><dd>{season?.ends_at ? new Date(season.ends_at).toLocaleDateString() : "TBD"}</dd></div>
                  </dl>
                </Card>
                {league.reward_text && (
                  <Card className="p-5 border-primary/30">
                    <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-primary" /> Rewards</h3>
                    <p className="text-sm">{league.reward_text}</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="standings" className="mt-6">
              <StandingsTable rows={standings} playoffSize={season?.playoff_size ?? 4} currentUserTeamId={myCurrentStandingTeam} />
            </TabsContent>

            <TabsContent value="schedule" className="mt-6 space-y-6">
              {Object.keys(matchdayGroups).length === 0 ? (
                <div className="border border-dashed border-border rounded-md p-12 text-center">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Fixtures will appear once registrations close and the admin generates the schedule.</p>
                </div>
              ) : (
                Object.entries(matchdayGroups)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([md, ms]) => (
                    <div key={md}>
                      <h3 className="font-display uppercase tracking-widest text-xs text-muted-foreground mb-3">Matchday {md}</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {ms.map(m => <MatchCard key={m.id} m={m} />)}
                      </div>
                    </div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="teams" className="mt-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {teams.map(t => (
                    <Link key={t.id} to={`/teams/${t.id}`} className="border border-border rounded-md p-4 bg-card/40 hover:bg-card/60 hover:border-primary/40 transition-colors flex items-center gap-3">
                      {t.avatar_url ? <img src={t.avatar_url} alt="" className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-muted border border-border" />}
                      <div className="min-w-0">
                        <div className="font-display font-bold uppercase truncate">{t.name}</div>
                        {t.tag && <div className="text-[10px] text-muted-foreground">[{t.tag}]</div>}
                      </div>
                    </Link>
                ))}
                {Array.from({ length: Math.max(0, league.max_teams - teams.length) }).map((_, i) => (
                  <div key={`open-${i}`} className="border border-dashed border-primary/30 rounded-md p-4 bg-primary/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold uppercase text-primary text-sm">Open Slot</div>
                      <div className="text-[10px] text-muted-foreground">Founding team slot for Season 0 Beta</div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                      <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5 mr-1" />Apply</a>
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="playoffs" className="mt-6">
              {!season?.playoffs_started_at ? (
                <div className="border border-dashed border-border rounded-md p-12 text-center">
                  <Trophy className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-display uppercase tracking-wider text-sm">Playoffs have not started yet</p>
                  <p className="text-xs text-muted-foreground mt-2">Top {season?.playoff_size ?? 4} teams qualify after the regular season.</p>
                </div>
              ) : (
                <PlayoffBracket
                  matches={playoffMatches}
                  teamMap={teamMap as any}
                  championTeamId={season?.champion_team_id ?? null}
                />
              )}
            </TabsContent>

            <TabsContent value="rules" className="mt-6">
              <Card className="p-6">
                <h2 className="font-display uppercase tracking-wider text-sm text-muted-foreground mb-3">League rules</h2>
                {league.rules_md ? (
                  <pre className="text-sm whitespace-pre-wrap font-body leading-relaxed">{league.rules_md}</pre>
                ) : (
                  <ul className="text-sm space-y-2 list-disc pl-5">
                    <li>Win = 3 points · Draw = 1 point · Loss = 0 points.</li>
                    <li>Round Robin regular season — every team plays every other team once.</li>
                    <li>Top {season?.playoff_size ?? 4} teams advance to single-elimination playoffs.</li>
                    <li>Captains submit the result; the opposing captain confirms or disputes.</li>
                    <li>Disputed matches freeze standings until admin resolution.</li>
                    <li>Minimum roster size: {league.min_roster_size} players.</li>
                  </ul>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
}
