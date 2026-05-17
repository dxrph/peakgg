import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Trophy, Check, X, RefreshCw, Sparkles, Trash, Swords, Wand2, Lock } from "lucide-react";
import { toast } from "sonner";
import StatusPill from "@/components/leagues/StatusPill";

interface League { id: string; name: string; slug: string; game: string; status: string; max_teams: number; min_roster_size: number; description: string | null; reward_text: string | null; }
interface Season { id: string; league_id: string; name: string; status: string; format: string; starts_at: string | null; ends_at: string | null; registration_deadline: string | null; playoff_size: number; season_number: number; playoffs_started_at: string | null; }
interface Registration { id: string; team_id: string; status: string; created_at: string; }

export default function AdminLeagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [teamMap, setTeamMap] = useState<Record<string, { name: string; tag: string | null }>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [seasonOpen, setSeasonOpen] = useState(false);
  const [seedOpen, setSeedOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [lForm, setLForm] = useState({ name: "", slug: "", game: "valorant", description: "", reward_text: "", max_teams: 8, min_roster_size: 5 });
  const [sForm, setSForm] = useState({ name: "Season 0 Beta", season_number: 0, format: "round_robin", starts_at: "", ends_at: "", registration_deadline: "", playoff_size: 4, status: "draft" });
  const [fixtureStart, setFixtureStart] = useState("");
  const [generatedFormat, setGeneratedFormat] = useState<any>(null);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const loadLeagues = async () => {
    const { data } = await supabase.from("leagues").select("*").order("created_at", { ascending: false });
    setLeagues((data ?? []) as League[]);
  };
  const loadSeasons = async (leagueId: string) => {
    const { data } = await supabase.from("league_seasons").select("*").eq("league_id", leagueId).order("season_number", { ascending: false });
    setSeasons((data ?? []) as Season[]);
    if (data?.[0]) setActiveSeason(data[0] as Season);
  };
  const loadRegs = async (seasonId: string) => {
    const { data } = await supabase.from("league_registrations").select("*").eq("season_id", seasonId).order("created_at", { ascending: false });
    const regs = (data ?? []) as Registration[];
    setRegistrations(regs);
    const ids = [...new Set(regs.map(r => r.team_id))];
    if (ids.length) {
      const { data: ts } = await supabase.from("teams").select("id, name, tag").in("id", ids);
      const map: Record<string, { name: string; tag: string | null }> = {};
      for (const t of ts ?? []) map[t.id] = { name: t.name, tag: t.tag };
      setTeamMap(map);
    }
  };

  useEffect(() => { loadLeagues(); }, []);
  useEffect(() => { if (activeLeague) loadSeasons(activeLeague.id); else { setSeasons([]); setActiveSeason(null); } }, [activeLeague]);
  useEffect(() => { if (activeSeason) loadRegs(activeSeason.id); else setRegistrations([]); }, [activeSeason]);

  useEffect(() => {
    setGeneratedFormat((activeSeason as any)?.generated_format ?? null);
    setApprovedCount(registrations.filter(r => r.status === "approved").length);
    setPendingCount(registrations.filter(r => r.status === "pending").length);
  }, [activeSeason, registrations]);

  const buildFormat = async () => {
    if (!activeSeason) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("generate_league_format", { _season_id: activeSeason.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    setGeneratedFormat(data);
    toast.success("Format generated");
    if (activeLeague) loadSeasons(activeLeague.id);
  };

  const buildSchedule = async () => {
    if (!activeSeason) return;
    if (!confirm("Generate the full schedule from approved teams? Existing non-completed matches will be cleared.")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("generate_league_schedule", { _season_id: activeSeason.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Generated ${data} matches`);
    if (activeLeague) loadSeasons(activeLeague.id);
  };

  const buildPlayoffs = async () => {
    if (!activeSeason) return;
    if (!confirm("Generate the playoff bracket from current standings?")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("generate_league_playoffs", { _season_id: activeSeason.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Playoffs created (${data} matches)`);
    if (activeLeague) loadSeasons(activeLeague.id);
  };

  const createLeague = async () => {
    if (!lForm.name || !lForm.slug) return toast.error("Name and slug required");
    setBusy(true);
    const { error, data } = await supabase.from("leagues").insert({ ...lForm, status: "draft" }).select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("League created");
    setCreateOpen(false);
    setLForm({ name: "", slug: "", game: "valorant", description: "", reward_text: "", max_teams: 8, min_roster_size: 5 });
    loadLeagues();
    if (data) setActiveLeague(data as League);
  };

  const createSeason = async () => {
    if (!activeLeague) return;
    setBusy(true);
    const payload: any = { ...sForm, league_id: activeLeague.id };
    ["starts_at", "ends_at", "registration_deadline"].forEach(k => { if (!payload[k]) payload[k] = null; else payload[k] = new Date(payload[k]).toISOString(); });
    const { error, data } = await supabase.from("league_seasons").insert(payload).select().single();
    if (error) { setBusy(false); return toast.error(error.message); }
    // create default division
    if (data) await supabase.from("league_divisions").insert({ season_id: data.id, name: "Premier", tier: 1, capacity: activeLeague.max_teams });
    setBusy(false);
    toast.success("Season created");
    setSeasonOpen(false);
    loadSeasons(activeLeague.id);
  };

  const setLeagueStatus = async (status: string) => {
    if (!activeLeague) return;
    const { error } = await supabase.from("leagues").update({ status }).eq("id", activeLeague.id);
    if (error) return toast.error(error.message);
    toast.success(`League → ${status}`); loadLeagues();
    setActiveLeague({ ...activeLeague, status });
  };
  const setSeasonStatus = async (status: string) => {
    if (!activeSeason) return;
    const { error } = await supabase.from("league_seasons").update({ status }).eq("id", activeSeason.id);
    if (error) return toast.error(error.message);
    toast.success(`Season → ${status}`); loadSeasons(activeLeague!.id);
  };

  const decide = async (reg: Registration, ok: boolean) => {
    const fn = ok ? "approve_league_registration" : "reject_league_registration";
    const { error } = await supabase.rpc(fn, { _registration_id: reg.id });
    if (error) return toast.error(error.message);
    toast.success(ok ? "Approved" : "Rejected");
    if (activeSeason) loadRegs(activeSeason.id);
  };

  const generateFixtures = async () => {
    if (!activeSeason || !fixtureStart) return toast.error("Pick a start date");
    setBusy(true);
    const { data, error } = await supabase.rpc("generate_round_robin_fixtures", {
      _season_id: activeSeason.id, _start_date: new Date(fixtureStart).toISOString(), _days_between: 7,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Generated ${data} matches`);
  };

  const recompute = async () => {
    if (!activeSeason) return;
    const { data: divs } = await supabase.from("league_divisions").select("id").eq("season_id", activeSeason.id);
    for (const d of divs ?? []) await supabase.rpc("recompute_standings_for_division", { _division_id: d.id });
    toast.success("Standings recomputed");
  };

  const closeSeason = async () => {
    if (!activeSeason) return;
    if (!confirm("Close season and award trophies?")) return;
    const { error } = await supabase.rpc("award_season_trophies", { _season_id: activeSeason.id });
    if (error) return toast.error(error.message);
    toast.success("Season closed, trophies awarded");
    if (activeLeague) loadSeasons(activeLeague.id);
  };

  const startPlayoffs = async () => {
    if (!activeSeason) return;
    if (activeSeason.playoffs_started_at) return toast.error("Playoffs already started");
    // Sanity: require >= 4 teams in standings
    const { data: divs } = await supabase.from("league_divisions").select("id").eq("season_id", activeSeason.id);
    if (!divs?.length) return toast.error("No division for this season");
    const { count } = await supabase.from("league_standings").select("*", { count: "exact", head: true }).eq("division_id", divs[0].id);
    if ((count ?? 0) < 4) return toast.error(`Need at least 4 teams in standings (have ${count ?? 0})`);
    const pendingMatches = await supabase
      .from("matches").select("id", { count: "exact", head: true })
      .eq("season_id", activeSeason.id).lt("matchday", 999).neq("result_status", "confirmed").neq("result_status", "admin_resolved");
    if ((pendingMatches.count ?? 0) > 0) {
      if (!confirm(`Regular season has ${pendingMatches.count} unfinished matches. Start playoffs anyway?`)) return;
    } else {
      if (!confirm("Start playoffs? Top 4 teams will be seeded into semifinals.")) return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("start_playoffs", { _season_id: activeSeason.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Playoffs started — bracket generated");
    if (activeLeague) loadSeasons(activeLeague.id);
  };

  const seedDemo = async () => {
    setBusy(true);
    // Idempotent: reuse the first existing demo Peak League if present.
    let { data: existing } = await supabase
      .from("leagues").select("*")
      .eq("is_demo", true).eq("name", "Peak League")
      .order("created_at", { ascending: true }).limit(1).maybeSingle();
    let l: any = existing;
    if (!l) {
      const { data, error } = await supabase.from("leagues").insert({
        name: "Peak League", slug: `peak-league-${Date.now().toString(36)}`, game: "valorant",
        description: "The flagship competitive league of PeakGG. Climb the standings, fight for playoffs, lift the trophy.",
        reward_text: "€2,000 prize pool · Champion trophy · Peak Coins",
        max_teams: 8, min_roster_size: 5, status: "registration_open", is_demo: true,
      }).select().single();
      if (error || !data) { setBusy(false); return toast.error(error?.message || "Failed"); }
      l = data;
    }
    let { data: s } = await supabase.from("league_seasons").select("*").eq("league_id", l.id).order("season_number", { ascending: false }).limit(1).maybeSingle();
    if (!s) {
      const { data: ns } = await supabase.from("league_seasons").insert({
        league_id: l.id, name: "Season 0 Beta", season_number: 0, format: "round_robin",
        playoff_size: 4, status: "registration_open", is_demo: true,
        registration_deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      }).select().single();
      s = ns;
    }
    if (s) {
      const { data: div } = await supabase.from("league_divisions").select("id").eq("season_id", s.id).limit(1).maybeSingle();
      if (!div) await supabase.from("league_divisions").insert({ season_id: s.id, name: "Premier", tier: 1, capacity: 8 });
    }
    setBusy(false);
    toast.success("Peak League Season 0 Beta ready");
    setSeedOpen(false); loadLeagues();
    setActiveLeague(l);
  };

  const seedDemoTeams = async () => {
    if (!activeLeague) return toast.error("Select a league first");
    setBusy(true);
    const { data, error } = await supabase.rpc("seed_demo_teams_for_league", { _league_id: activeLeague.id, _count: 8 });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Created ${data ?? 0} demo teams (approved)`);
    if (activeSeason) loadRegs(activeSeason.id);
  };

  const wipeDemo = async () => {
    if (!confirm("Delete all demo leagues AND your [DEMO] teams? This cannot be undone.")) return;
    const { error: tErr } = await supabase.rpc("wipe_demo_teams");
    if (tErr) return toast.error(tErr.message);
    const { error } = await supabase.from("leagues").delete().eq("is_demo", true);
    if (error) return toast.error(error.message);
    toast.success("Demo data wiped"); loadLeagues();
    setActiveLeague(null);
  };

  return (
    <AdminLayout
      title="Peak League"
      description="Create leagues, manage seasons, registrations, fixtures and disputes"
      actions={
        <div className="flex gap-2">
          <Dialog open={seedOpen} onOpenChange={setSeedOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Sparkles className="h-4 w-4 mr-1" /> Seed demo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Seed Peak League Season 0 Beta</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Creates (or reuses) the flagship demo league with an open Season 0. Idempotent — running twice will not duplicate it. Use "Seed 8 demo teams" inside the league to populate standings for QA.</p>
              <DialogFooter>
                <Button variant="outline" onClick={wipeDemo}><Trash className="h-4 w-4 mr-1" /> Wipe demo</Button>
                <Button onClick={seedDemo} disabled={busy}>Seed</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New league</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create league</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><Input value={lForm.name} onChange={e => setLForm({ ...lForm, name: e.target.value })} /></div>
                  <div><Label>Slug</Label><Input value={lForm.slug} onChange={e => setLForm({ ...lForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Game</Label>
                    <Select value={lForm.game} onValueChange={v => setLForm({ ...lForm, game: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="valorant">Valorant</SelectItem><SelectItem value="cs2">CS2</SelectItem><SelectItem value="r6s">R6 Siege</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Max teams</Label><Input type="number" value={lForm.max_teams} onChange={e => setLForm({ ...lForm, max_teams: parseInt(e.target.value || "8") })} /></div>
                  <div><Label>Min roster</Label><Input type="number" value={lForm.min_roster_size} onChange={e => setLForm({ ...lForm, min_roster_size: parseInt(e.target.value || "5") })} /></div>
                </div>
                <div><Label>Description</Label><Textarea rows={3} value={lForm.description} onChange={e => setLForm({ ...lForm, description: e.target.value })} /></div>
                <div><Label>Reward</Label><Input value={lForm.reward_text} onChange={e => setLForm({ ...lForm, reward_text: e.target.value })} placeholder="€2,000 + trophy" /></div>
              </div>
              <DialogFooter><Button onClick={createLeague} disabled={busy}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <Card className="p-3">
          <h2 className="font-display uppercase tracking-widest text-xs text-muted-foreground mb-2 px-2">Leagues</h2>
          {leagues.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">No leagues yet.</p>
          ) : (
            <div className="space-y-1">
              {leagues.map(l => (
                <button key={l.id} onClick={() => setActiveLeague(l)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${activeLeague?.id === l.id ? "bg-primary/10 border border-primary/40" : "hover:bg-muted/30 border border-transparent"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display uppercase truncate">{l.name}</span>
                    <StatusPill status={l.status} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{l.game}</div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 min-h-[400px]">
          {!activeLeague ? (
            <div className="text-center text-muted-foreground py-12">Select a league to manage</div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                <div>
                  <h2 className="font-display text-xl uppercase">{activeLeague.name}</h2>
                  <p className="text-xs text-muted-foreground">{activeLeague.game} · /{activeLeague.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Select value={activeLeague.status} onValueChange={setLeagueStatus}>
                    <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="registration_open">Registration Open</SelectItem>
                      <SelectItem value="registration_closed">Registration Closed</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="playoffs">Playoffs</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button asChild size="sm" variant="outline"><Link to={`/leagues/${activeLeague.id}`}>View public</Link></Button>
                  {activeLeague.status === "registration_open" && (
                    <Button size="sm" variant="outline" onClick={seedDemoTeams} disabled={busy}>
                      <Sparkles className="h-3 w-3 mr-1" /> Seed 8 demo teams
                    </Button>
                  )}
                </div>
              </div>

              <Tabs defaultValue="seasons">
                <TabsList>
                  <TabsTrigger value="seasons">Seasons</TabsTrigger>
                  <TabsTrigger value="registrations">Registrations</TabsTrigger>
                  <TabsTrigger value="format">Format</TabsTrigger>
                  <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
                  <TabsTrigger value="standings">Standings</TabsTrigger>
                </TabsList>

                <TabsContent value="seasons" className="mt-4 space-y-3">
                  <div className="flex justify-end">
                    <Dialog open={seasonOpen} onOpenChange={setSeasonOpen}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New season</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Create season</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div><Label>Name</Label><Input value={sForm.name} onChange={e => setSForm({ ...sForm, name: e.target.value })} /></div>
                            <div><Label>Number</Label><Input type="number" value={sForm.season_number} onChange={e => setSForm({ ...sForm, season_number: parseInt(e.target.value || "0") })} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><Label>Starts</Label><Input type="datetime-local" value={sForm.starts_at} onChange={e => setSForm({ ...sForm, starts_at: e.target.value })} /></div>
                            <div><Label>Ends</Label><Input type="datetime-local" value={sForm.ends_at} onChange={e => setSForm({ ...sForm, ends_at: e.target.value })} /></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><Label>Registration deadline</Label><Input type="datetime-local" value={sForm.registration_deadline} onChange={e => setSForm({ ...sForm, registration_deadline: e.target.value })} /></div>
                            <div><Label>Playoff size</Label><Input type="number" value={sForm.playoff_size} onChange={e => setSForm({ ...sForm, playoff_size: parseInt(e.target.value || "4") })} /></div>
                          </div>
                        </div>
                        <DialogFooter><Button onClick={createSeason} disabled={busy}>Create</Button></DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {seasons.length === 0 ? <p className="text-sm text-muted-foreground">No seasons yet.</p> : seasons.map(s => (
                    <div key={s.id} className={`border rounded p-3 cursor-pointer ${activeSeason?.id === s.id ? "border-primary/50 bg-primary/5" : "border-border"}`} onClick={() => setActiveSeason(s)}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-display uppercase">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.format.replace("_", " ")} · Top {s.playoff_size} playoffs</div>
                        </div>
                        <StatusPill status={s.status} />
                      </div>
                      {activeSeason?.id === s.id && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                          <Select value={s.status} onValueChange={setSeasonStatus}>
                            <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="registration_open">Registration Open</SelectItem>
                              <SelectItem value="registration_closed">Registration Closed</SelectItem>
                              <SelectItem value="ongoing">Ongoing</SelectItem>
                              <SelectItem value="playoffs">Playoffs</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" onClick={recompute}><RefreshCw className="h-3 w-3 mr-1" /> Recompute standings</Button>
                          <Button size="sm" variant="outline" onClick={startPlayoffs} disabled={busy || !!s.playoffs_started_at}>
                            <Swords className="h-3 w-3 mr-1" /> {s.playoffs_started_at ? "Playoffs started" : "Start playoffs"}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={closeSeason}><Trophy className="h-3 w-3 mr-1" /> Close & award trophies</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="registrations" className="mt-4">
                  {!activeSeason ? <p className="text-sm text-muted-foreground">Select a season.</p> : registrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No registrations yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {registrations.map(r => (
                        <div key={r.id} className="flex items-center justify-between border border-border rounded p-3">
                          <div>
                            <div className="font-display uppercase">{teamMap[r.team_id]?.name ?? r.team_id.slice(0, 8)}</div>
                            <div className="text-xs text-muted-foreground">Submitted {new Date(r.created_at).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusPill status={r.status} />
                            {r.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => decide(r, true)}><Check className="h-3 w-3" /></Button>
                                <Button size="sm" variant="outline" onClick={() => decide(r, false)}><X className="h-3 w-3" /></Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="fixtures" className="mt-4 space-y-3">
                  {!activeSeason ? <p className="text-sm text-muted-foreground">Select a season.</p> : (
                    <Card className="p-4">
                      <h3 className="font-display uppercase tracking-wider text-sm mb-3">Generate Round Robin</h3>
                      <div className="flex gap-2 flex-wrap items-end">
                        <div><Label>Start date</Label><Input type="datetime-local" value={fixtureStart} onChange={e => setFixtureStart(e.target.value)} /></div>
                        <Button onClick={generateFixtures} disabled={busy}><Calendar className="h-4 w-4 mr-1" /> Generate</Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">Every approved team will play every other team once, one matchday per week. Existing scheduled matches will be cleared.</p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="standings" className="mt-4">
                  <Button size="sm" variant="outline" onClick={recompute}><RefreshCw className="h-3 w-3 mr-1" /> Force recompute</Button>
                  <p className="text-xs text-muted-foreground mt-3">Standings auto-update on confirmed matches. Use this if anything looks off.</p>
                </TabsContent>
              </Tabs>
            </>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
