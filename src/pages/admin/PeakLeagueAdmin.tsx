import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Activity, AlertCircle, Award, Calendar, Check, Crown, Gavel, Lock, Mountain,
  RefreshCw, Save, Settings, Shield, ShieldAlert, Sparkles, Swords, Trash2, Trophy,
  Users, Wand2, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StatusPill from "@/components/leagues/StatusPill";

interface League {
  id: string; name: string; slug: string; game: string; status: string;
  max_teams: number; min_roster_size: number; description: string | null;
  reward_text: string | null; is_demo: boolean;
}
interface Season {
  id: string; league_id: string; name: string; season_number: number;
  status: string; format: string; match_format: string; playoff_match_format: string;
  region: string; visibility: string;
  min_team_count: number; recommended_min_teams: number; recommended_max_teams: number;
  max_team_count: number | null; registration_status: string; registration_deadline: string | null;
  starts_at: string | null; ends_at: string | null;
  schedule_status: string; format_status: string; generated_format: any;
  playoff_size: number; playoffs_started_at: string | null;
  champion_team_id: string | null; is_founding_season: boolean;
}
interface Registration {
  id: string; team_id: string; status: string; created_at: string;
  is_founding_team: boolean; submitted_by: string;
}
interface Team { id: string; name: string; tag: string | null; captain_id: string | null; }
interface MatchRow {
  id: string; matchday: number | null; stage: string;
  team_a_id: string | null; team_b_id: string | null;
  scheduled_at: string | null; status: string; result_status: string | null;
  score_a: number | null; score_b: number | null; winner_id: string | null;
  proof_url: string | null; bo_format: string | null;
}
interface Dispute {
  id: string; match_id: string; opened_by_team_id: string; reason: string;
  evidence_url: string | null; status: string; created_at: string;
  resolution_note: string | null;
}
interface HofEntry {
  id: string; season_id: string;
  champion_team_id: string | null; runner_up_team_id: string | null;
  mvp_user_id: string | null; notes: string | null;
}

function Kpi({ label, value, hint, icon: Icon, tone = "default" }: {
  label: string; value: React.ReactNode; hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  const toneCls = tone === "ok" ? "text-emerald-400"
    : tone === "warn" ? "text-amber-400"
    : tone === "danger" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className={`text-2xl font-display font-bold ${toneCls}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function DisabledHint({ reason, children }: { reason?: string; children: React.ReactNode }) {
  if (!reason) return <>{children}</>;
  return <span title={reason} className="inline-flex">{children}</span>;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function recommendFormat(n: number) {
  if (n < 4) return { label: "Not enough teams (min 4)", playoff: "—", regBo: "—", playoffBo: "—", warn: true };
  if (n <= 7) return { label: "Single Round-Robin · Top 2 Final", playoff: "Top 2 Final", regBo: "BO1", playoffBo: "BO3", warn: false };
  if (n <= 10) return { label: "Single Round-Robin · Top 4 Playoffs", playoff: "Top 4 Playoffs", regBo: "BO1", playoffBo: "BO3", warn: false };
  if (n <= 14) return { label: "Single Round-Robin · Top 6 Playoffs", playoff: "Top 6 Playoffs (top 2 bye)", regBo: "BO1", playoffBo: "BO3", warn: false };
  return { label: "Groups / Divisions recommended", playoff: "Groups then Playoffs", regBo: "BO1", playoffBo: "BO3", warn: false };
}

export default function PeakLeagueAdmin() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueId, setLeagueId] = useState<string>("");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const league = leagues.find(l => l.id === leagueId) || null;
  const season = seasons.find(s => s.id === seasonId) || null;

  const [regs, setRegs] = useState<Registration[]>([]);
  const [teamMap, setTeamMap] = useState<Record<string, Team>>({});
  const [profileMap, setProfileMap] = useState<Record<string, { username: string | null; display_name: string | null }>>({});
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [hof, setHof] = useState<HofEntry | null>(null);

  const loadLeagues = async () => {
    const { data } = await supabase.from("leagues").select("*").eq("is_demo", false).order("created_at", { ascending: false });
    const list = (data ?? []) as League[];
    setLeagues(list);
    if (!leagueId && list[0]) setLeagueId(list[0].id);
  };
  const loadSeasons = async (lid: string) => {
    const { data } = await supabase.from("league_seasons").select("*").eq("league_id", lid).order("season_number", { ascending: false });
    const list = (data ?? []) as unknown as Season[];
    setSeasons(list);
    if (list[0]) setSeasonId(list[0].id); else setSeasonId("");
  };
  const loadRegs = async (sid: string) => {
    const { data } = await supabase.from("league_registrations").select("*").eq("season_id", sid).order("created_at", { ascending: false });
    const rs = (data ?? []) as Registration[];
    setRegs(rs);
    const teamIds = [...new Set(rs.map(r => r.team_id))];
    if (teamIds.length) {
      const { data: ts } = await supabase.from("teams").select("id, name, tag, captain_id").in("id", teamIds);
      const m: Record<string, Team> = {};
      for (const t of ts ?? []) m[t.id] = t as Team;
      setTeamMap(prev => ({ ...prev, ...m }));
      const capIds = (ts ?? []).map(t => t.captain_id).filter(Boolean) as string[];
      if (capIds.length) {
        const { data: ps } = await supabase.from("profiles").select("id, username, display_name").in("id", capIds);
        const pm: Record<string, { username: string | null; display_name: string | null }> = {};
        for (const p of ps ?? []) pm[p.id] = { username: p.username, display_name: p.display_name };
        setProfileMap(prev => ({ ...prev, ...pm }));
      }
    }
  };
  const loadMatches = async (sid: string) => {
    const { data } = await supabase.from("matches").select(
      "id, matchday, stage, team_a_id, team_b_id, scheduled_at, status, result_status, score_a, score_b, winner_id, proof_url, bo_format"
    ).eq("season_id", sid).order("matchday", { ascending: true }).order("scheduled_at", { ascending: true });
    const list = (data ?? []) as MatchRow[];
    setMatches(list);
    const ids = [...new Set(list.flatMap(m => [m.team_a_id, m.team_b_id]).filter(Boolean))] as string[];
    const missing = ids.filter(id => !teamMap[id]);
    if (missing.length) {
      const { data: ts } = await supabase.from("teams").select("id, name, tag, captain_id").in("id", missing);
      const m: Record<string, Team> = {};
      for (const t of ts ?? []) m[t.id] = t as Team;
      setTeamMap(prev => ({ ...prev, ...m }));
    }
  };
  const loadDisputes = async (sid: string) => {
    const { data: ms } = await supabase.from("matches").select("id").eq("season_id", sid);
    const ids = (ms ?? []).map(m => m.id);
    if (!ids.length) { setDisputes([]); return; }
    const { data } = await supabase.from("match_disputes").select("*").in("match_id", ids).order("created_at", { ascending: false });
    setDisputes((data ?? []) as Dispute[]);
  };
  const loadHof = async (sid: string) => {
    const { data } = await supabase.from("league_hall_of_fame").select("*").eq("season_id", sid).maybeSingle();
    setHof((data ?? null) as HofEntry | null);
  };

  useEffect(() => { loadLeagues(); }, []);
  useEffect(() => { if (leagueId) loadSeasons(leagueId); }, [leagueId]);
  useEffect(() => {
    if (!seasonId) return;
    loadRegs(seasonId);
    loadMatches(seasonId);
    loadDisputes(seasonId);
    loadHof(seasonId);
  }, [seasonId]);

  const approved = regs.filter(r => r.status === "approved");
  const pending = regs.filter(r => r.status === "pending");
  const rejected = regs.filter(r => r.status === "rejected" || r.status === "waitlisted");
  const completedMatches = matches.filter(m => m.result_status === "completed" || m.status === "completed").length;
  const pendingConfirm = matches.filter(m => m.result_status === "pending_confirmation");
  const scheduledMatches = matches.filter(m => m.status === "scheduled" || m.status === "pending");
  const openDisputes = disputes.filter(d => d.status === "open");
  const recommend = useMemo(() => recommendFormat(approved.length), [approved.length]);
  const allRegularDone = matches.length > 0 && matches.filter(m => m.stage === "regular_season").every(m => m.result_status === "completed");

  const wrap = async (label: string, fn: () => Promise<any>) => {
    setBusy(true);
    try {
      const res: any = await fn();
      if (res?.error) throw res.error;
      toast.success(label);
      return res;
    } catch (e: any) {
      toast.error(e?.message || `${label} failed`);
    } finally { setBusy(false); }
  };

  const updateSeason = (patch: Partial<Season>) =>
    wrap("Season saved", async () => {
      if (!season) return { error: new Error("No season") };
      const r = await supabase.from("league_seasons").update(patch as any).eq("id", season.id);
      if (!r.error) await loadSeasons(season.league_id);
      return r;
    });

  const decideReg = (reg: Registration, action: "approve" | "reject" | "waitlist") =>
    wrap(action === "approve" ? "Application approved" : action === "reject" ? "Application rejected" : "Application waitlisted", async () => {
      if (action === "approve") {
        const r = await supabase.rpc("approve_league_registration", { _registration_id: reg.id });
        if (!r.error) await loadRegs(seasonId);
        return r;
      }
      if (action === "reject") {
        const r = await supabase.rpc("reject_league_registration", { _registration_id: reg.id });
        if (!r.error) await loadRegs(seasonId);
        return r;
      }
      const r = await supabase.from("league_registrations").update({ status: "waitlisted" } as any).eq("id", reg.id);
      if (!r.error) await loadRegs(seasonId);
      return r;
    });

  const toggleFounding = (reg: Registration) =>
    wrap("Founding badge updated", async () => {
      const r = await supabase.from("league_registrations").update({ is_founding_team: !reg.is_founding_team }).eq("id", reg.id);
      if (!r.error) await loadRegs(seasonId);
      return r;
    });

  const generateFormat = () => wrap("Format generated", async () => {
    const r = await supabase.rpc("generate_league_format", { _season_id: seasonId });
    if (!r.error) await loadSeasons(leagueId);
    return r;
  });
  const generateSchedule = () => wrap("Schedule generated", async () => {
    const r = await supabase.rpc("generate_league_schedule", { _season_id: seasonId });
    if (!r.error) { await loadSeasons(leagueId); await loadMatches(seasonId); }
    return r;
  });
  const lockSchedule = () => updateSeason({ schedule_status: "locked" } as any);
  const startSeason = () => updateSeason({ status: "ongoing" } as any);
  const generatePlayoffs = () => wrap("Playoffs generated", async () => {
    const r = await supabase.rpc("generate_league_playoffs", { _season_id: seasonId });
    if (!r.error) { await loadSeasons(leagueId); await loadMatches(seasonId); }
    return r;
  });
  const recompute = () => wrap("Standings recomputed", async () => {
    return await supabase.rpc("recalculate_league_standings", { _season_id: seasonId });
  });

  return (
    <AdminLayout
      title="Peak League"
      description="Full lifecycle control: seasons, applications, format, schedule, results, disputes, playoffs and Hall of Fame."
      actions={
        <div className="flex items-center gap-2">
          <Select value={leagueId} onValueChange={setLeagueId}>
            <SelectTrigger className="w-56 h-9"><SelectValue placeholder="Select league" /></SelectTrigger>
            <SelectContent>
              {leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={seasonId} onValueChange={setSeasonId} disabled={!seasons.length}>
            <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Season" /></SelectTrigger>
            <SelectContent>
              {seasons.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {league && <Button asChild size="sm" variant="outline"><Link to={`/leagues/${league.slug}`}>View public</Link></Button>}
        </div>
      }
    >
      {!league || !season ? (
        <Card className="p-10 text-center text-muted-foreground">
          {leagues.length === 0
            ? "No leagues found. Create one from Admin → Leagues."
            : "Select a league and season to continue."}
        </Card>
      ) : (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="flex flex-wrap h-auto justify-start">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="season">Season</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="playoffs">Playoffs</TabsTrigger>
            <TabsTrigger value="hof">Hall of Fame</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <Kpi label="Season" value={season.name} hint={`#${season.season_number} · ${season.status}`} icon={Mountain} />
              <Kpi label="Registration" value={season.registration_status} icon={Users}
                   tone={season.registration_status === "open" ? "ok" : "default"} />
              <Kpi label="Approved teams" value={approved.length} hint={`min ${season.min_team_count}`} icon={Shield}
                   tone={approved.length >= season.min_team_count ? "ok" : "warn"} />
              <Kpi label="Pending apps" value={pending.length} icon={AlertCircle} tone={pending.length ? "warn" : "default"} />
              <Kpi label="Rejected / waitlist" value={rejected.length} icon={X} />
              <Kpi label="Format" value={season.format_status} icon={Wand2}
                   tone={season.format_status === "generated" || season.format_status === "locked" ? "ok" : "default"} />
              <Kpi label="Schedule" value={season.schedule_status} icon={Calendar}
                   tone={season.schedule_status === "locked" ? "ok" : season.schedule_status === "generated" ? "warn" : "default"} />
              <Kpi label="Matches scheduled" value={scheduledMatches.length} icon={Swords} />
              <Kpi label="Results pending" value={pendingConfirm.length} icon={Activity} tone={pendingConfirm.length ? "warn" : "default"} />
              <Kpi label="Open disputes" value={openDisputes.length} icon={Gavel} tone={openDisputes.length ? "danger" : "default"} />
              <Kpi label="Playoffs" value={season.playoffs_started_at ? "started" : "locked"} icon={Trophy} />
              <Kpi label="Champion" value={hof?.champion_team_id ? (teamMap[hof.champion_team_id]?.name ?? "set") : "—"} icon={Crown} />
            </div>

            <Card className="p-4">
              <div className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-3">Quick actions</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={season.registration_status === "open" ? "outline" : "default"}
                        onClick={() => updateSeason({ registration_status: season.registration_status === "open" ? "closed" : "open" } as any)}
                        disabled={busy}>
                  {season.registration_status === "open" ? <Lock className="h-3 w-3 mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                  {season.registration_status === "open" ? "Close registrations" : "Open registrations"}
                </Button>
                <DisabledHint reason={approved.length < season.min_team_count ? `Need at least ${season.min_team_count} approved teams` : undefined}>
                  <Button size="sm" variant="outline" onClick={generateFormat} disabled={busy || approved.length < season.min_team_count}>
                    <Wand2 className="h-3 w-3 mr-1" /> Generate format
                  </Button>
                </DisabledHint>
                <DisabledHint reason={season.format_status === "not_generated" ? "Generate format first" : completedMatches > 0 ? "Matches already completed" : undefined}>
                  <Button size="sm" variant="outline" onClick={generateSchedule} disabled={busy || season.format_status === "not_generated" || completedMatches > 0}>
                    <Calendar className="h-3 w-3 mr-1" /> Generate schedule
                  </Button>
                </DisabledHint>
                <DisabledHint reason={season.schedule_status !== "generated" ? "No draft schedule to lock" : undefined}>
                  <Button size="sm" variant="outline" onClick={lockSchedule} disabled={busy || season.schedule_status !== "generated"}>
                    <Lock className="h-3 w-3 mr-1" /> Lock schedule
                  </Button>
                </DisabledHint>
                <DisabledHint reason={season.schedule_status !== "locked" ? "Lock schedule first" : undefined}>
                  <Button size="sm" onClick={startSeason} disabled={busy || season.schedule_status !== "locked" || season.status === "ongoing"}>
                    <Activity className="h-3 w-3 mr-1" /> Start season
                  </Button>
                </DisabledHint>
                <DisabledHint reason={!allRegularDone ? "Complete all regular-season matches first" : undefined}>
                  <Button size="sm" variant="outline" onClick={generatePlayoffs} disabled={busy || !allRegularDone || !!season.playoffs_started_at}>
                    <Swords className="h-3 w-3 mr-1" /> Generate playoffs
                  </Button>
                </DisabledHint>
                <Button size="sm" variant="outline" onClick={recompute} disabled={busy}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Recompute standings
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="season" className="mt-4">
            <SeasonForm season={season} onSave={updateSeason} busy={busy} />
          </TabsContent>

          <TabsContent value="applications" className="mt-4">
            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Captain</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Founding</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regs.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No applications yet.</TableCell></TableRow>
                  )}
                  {regs.map(r => {
                    const t = teamMap[r.team_id];
                    const captain = t?.captain_id ? profileMap[t.captain_id] : null;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-display uppercase">{t?.name ?? r.team_id.slice(0, 8)}</div>
                          {t?.tag && <div className="text-xs text-muted-foreground">[{t.tag}]</div>}
                        </TableCell>
                        <TableCell className="text-sm">{captain?.display_name ?? captain?.username ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</TableCell>
                        <TableCell><StatusPill status={r.status} /></TableCell>
                        <TableCell>
                          <Button size="sm" variant={r.is_founding_team ? "default" : "outline"} onClick={() => toggleFounding(r)} disabled={busy}>
                            <Sparkles className="h-3 w-3 mr-1" /> {r.is_founding_team ? "Founding" : "Mark"}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {t && <Button asChild size="sm" variant="ghost"><Link to={`/teams/${t.id}`}>View</Link></Button>}
                            {r.status !== "approved" && <Button size="sm" onClick={() => decideReg(r, "approve")} disabled={busy}><Check className="h-3 w-3" /></Button>}
                            {r.status !== "waitlisted" && <Button size="sm" variant="outline" onClick={() => decideReg(r, "waitlist")} disabled={busy}>Wait</Button>}
                            {r.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => decideReg(r, "reject")} disabled={busy}><X className="h-3 w-3" /></Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="mt-4">
            <TeamsTab
              approved={approved} teamMap={teamMap} matches={matches} seasonId={seasonId}
              onChange={() => { loadRegs(seasonId); loadMatches(seasonId); }}
              busy={busy} setBusy={setBusy}
            />
          </TabsContent>

          <TabsContent value="format" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Approved" value={approved.length} tone={approved.length >= season.min_team_count ? "ok" : "warn"} />
              <Kpi label="Pending" value={pending.length} />
              <Kpi label="Min required" value={season.min_team_count} />
              <Kpi label="Recommended range" value={`${season.recommended_min_teams}–${season.recommended_max_teams}`} />
            </div>

            {approved.length < season.min_team_count && (
              <Card className="p-4 border-amber-500/40 bg-amber-500/5">
                <div className="flex items-center gap-2 text-amber-400 font-display uppercase text-sm">
                  <AlertCircle className="h-4 w-4" /> Below minimum
                </div>
                <p className="text-sm text-muted-foreground mt-1">Approve at least {season.min_team_count - approved.length} more team(s) before generating the format.</p>
              </Card>
            )}
            {approved.length > season.recommended_max_teams && (
              <Card className="p-4 border-amber-500/40 bg-amber-500/5">
                <div className="flex items-center gap-2 text-amber-400 font-display uppercase text-sm">
                  <AlertCircle className="h-4 w-4" /> Above recommended
                </div>
                <p className="text-sm text-muted-foreground mt-1">Consider closing registrations or splitting into divisions.</p>
              </Card>
            )}
            {approved.length % 2 === 1 && approved.length >= 4 && (
              <Card className="p-4 border-primary/30">
                <p className="text-sm">Odd team count — schedule will include <b>bye weeks</b>.</p>
              </Card>
            )}

            <Card className="p-4 space-y-3">
              <div className="text-xs font-display uppercase tracking-widest text-muted-foreground">Recommended for {approved.length} teams</div>
              <div className="text-lg font-display">{recommend.label}</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div><div className="text-[10px] uppercase text-muted-foreground">Playoff</div>{recommend.playoff}</div>
                <div><div className="text-[10px] uppercase text-muted-foreground">Regular BO</div>{recommend.regBo}</div>
                <div><div className="text-[10px] uppercase text-muted-foreground">Playoff BO</div>{recommend.playoffBo}</div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" onClick={generateFormat} disabled={busy || recommend.warn}>
                  <Wand2 className="h-3 w-3 mr-1" /> Generate recommended format
                </Button>
                <DisabledHint reason={season.format_status === "locked" ? "Format is locked" : season.format_status !== "generated" ? "Generate first" : undefined}>
                  <Button size="sm" variant="outline" onClick={() => updateSeason({ format_status: "locked" } as any)} disabled={busy || season.format_status !== "generated"}>
                    <Lock className="h-3 w-3 mr-1" /> Lock format
                  </Button>
                </DisabledHint>
                <DisabledHint reason={completedMatches > 0 ? "Cannot reset — matches already completed" : season.schedule_status === "locked" ? "Schedule is locked" : undefined}>
                  <Button size="sm" variant="outline" onClick={() => updateSeason({ format_status: "not_generated", generated_format: null } as any)}
                          disabled={busy || completedMatches > 0 || season.schedule_status === "locked"}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Reset format
                  </Button>
                </DisabledHint>
              </div>
            </Card>

            {season.generated_format && (
              <Card className="p-4">
                <div className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-2">Generated format</div>
                <pre className="text-xs bg-muted/20 p-3 rounded overflow-x-auto">{JSON.stringify(season.generated_format, null, 2)}</pre>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-4 space-y-3">
            <Card className="p-4">
              <div className="flex flex-wrap gap-2 items-center">
                <DisabledHint reason={season.format_status === "not_generated" ? "Generate format first" : completedMatches > 0 ? "Matches already completed — cannot regenerate" : approved.length < season.min_team_count ? `Need at least ${season.min_team_count} approved teams` : undefined}>
                  <Button size="sm" onClick={generateSchedule}
                          disabled={busy || season.format_status === "not_generated" || completedMatches > 0 || approved.length < season.min_team_count}>
                    <Calendar className="h-3 w-3 mr-1" /> Generate schedule
                  </Button>
                </DisabledHint>
                <DisabledHint reason={matches.length === 0 ? "Empty schedule" : undefined}>
                  <Button size="sm" variant="outline" onClick={lockSchedule}
                          disabled={busy || matches.length === 0 || season.schedule_status === "locked"}>
                    <Lock className="h-3 w-3 mr-1" /> Lock schedule
                  </Button>
                </DisabledHint>
                <DisabledHint reason={season.schedule_status !== "locked" ? "Lock schedule first" : undefined}>
                  <Button size="sm" onClick={startSeason} disabled={busy || season.schedule_status !== "locked" || season.status === "ongoing"}>
                    <Activity className="h-3 w-3 mr-1" /> Start season
                  </Button>
                </DisabledHint>
                <span className="text-xs text-muted-foreground ml-auto">Status: <b className="text-foreground">{season.schedule_status}</b></span>
              </div>
            </Card>
            <ScheduleView matches={matches} teamMap={teamMap} approved={approved} />
          </TabsContent>

          <TabsContent value="matches" className="mt-4">
            <MatchesTable matches={matches} teamMap={teamMap} busy={busy} setBusy={setBusy}
                          onChange={() => { loadMatches(seasonId); }} />
          </TabsContent>

          <TabsContent value="results" className="mt-4 space-y-4">
            <ResultsTab matches={matches} teamMap={teamMap} seasonId={seasonId}
                        onChange={() => { loadMatches(seasonId); }} />
          </TabsContent>

          <TabsContent value="disputes" className="mt-4 space-y-3">
            <DisputesTab disputes={disputes} matches={matches} teamMap={teamMap} seasonId={seasonId}
                         onChange={() => { loadDisputes(seasonId); loadMatches(seasonId); }} />
          </TabsContent>

          <TabsContent value="playoffs" className="mt-4 space-y-3">
            <PlayoffsTab season={season} matches={matches} teamMap={teamMap} allRegularDone={allRegularDone}
                         busy={busy} onGenerate={generatePlayoffs}
                         onArchive={() => updateSeason({ status: "completed" } as any)} />
          </TabsContent>

          <TabsContent value="hof" className="mt-4">
            <HofTab seasonId={seasonId} hof={hof} approved={approved} teamMap={teamMap} onChange={() => loadHof(seasonId)} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-3">
            <SettingsTab season={season} completedMatches={completedMatches}
                         onArchive={() => updateSeason({ status: "archived" } as any)}
                         onReopen={() => updateSeason({ status: "ongoing", registration_status: "open" } as any)}
                         onResetFormat={() => updateSeason({ format_status: "not_generated", generated_format: null } as any)}
                         onDeleteDraft={async () => {
                           if (completedMatches > 0) { toast.error("Cannot delete — matches already completed"); return; }
                           await wrap("Draft schedule deleted", async () => {
                             const r = await supabase.from("matches").delete().eq("season_id", seasonId);
                             if (!r.error) { await loadMatches(seasonId); await updateSeason({ schedule_status: "not_generated" } as any); }
                             return r;
                           });
                         }} />
          </TabsContent>
        </Tabs>
      )}
    </AdminLayout>
  );
}

function SeasonForm({ season, onSave, busy }: { season: Season; onSave: (p: Partial<Season>) => Promise<any>; busy: boolean }) {
  const [f, setF] = useState({
    name: season.name, region: season.region, visibility: season.visibility,
    min_team_count: season.min_team_count,
    recommended_min_teams: season.recommended_min_teams,
    recommended_max_teams: season.recommended_max_teams,
    max_team_count: season.max_team_count ?? "",
    registration_status: season.registration_status,
    status: season.status,
    match_format: season.match_format,
    playoff_match_format: season.playoff_match_format,
    registration_deadline: season.registration_deadline ? season.registration_deadline.slice(0, 16) : "",
    starts_at: season.starts_at ? season.starts_at.slice(0, 16) : "",
    ends_at: season.ends_at ? season.ends_at.slice(0, 16) : "",
  });
  useEffect(() => {
    setF({
      name: season.name, region: season.region, visibility: season.visibility,
      min_team_count: season.min_team_count,
      recommended_min_teams: season.recommended_min_teams,
      recommended_max_teams: season.recommended_max_teams,
      max_team_count: season.max_team_count ?? "",
      registration_status: season.registration_status,
      status: season.status,
      match_format: season.match_format,
      playoff_match_format: season.playoff_match_format,
      registration_deadline: season.registration_deadline ? season.registration_deadline.slice(0, 16) : "",
      starts_at: season.starts_at ? season.starts_at.slice(0, 16) : "",
      ends_at: season.ends_at ? season.ends_at.slice(0, 16) : "",
    });
  }, [season.id]);

  const save = () => {
    const payload: any = { ...f };
    payload.max_team_count = payload.max_team_count === "" ? null : Number(payload.max_team_count);
    payload.min_team_count = Number(payload.min_team_count);
    payload.recommended_min_teams = Number(payload.recommended_min_teams);
    payload.recommended_max_teams = Number(payload.recommended_max_teams);
    ["registration_deadline", "starts_at", "ends_at"].forEach(k => {
      payload[k] = payload[k] ? new Date(payload[k]).toISOString() : null;
    });
    onSave(payload);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div><Label>Season name</Label><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div><Label>Region</Label><Input value={f.region} onChange={e => setF({ ...f, region: e.target.value })} /></div>
        <div>
          <Label>Visibility</Label>
          <Select value={f.visibility} onValueChange={v => setF({ ...f, visibility: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="unlisted">Unlisted</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Season status</Label>
          <Select value={f.status} onValueChange={v => setF({ ...f, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="registration_open">Registration</SelectItem>
              <SelectItem value="ongoing">Active</SelectItem>
              <SelectItem value="playoffs">Playoffs</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Registration</Label>
          <Select value={f.registration_status} onValueChange={v => setF({ ...f, registration_status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Registration deadline</Label><Input type="datetime-local" value={f.registration_deadline} onChange={e => setF({ ...f, registration_deadline: e.target.value })} /></div>
        <div><Label>Min teams</Label><Input type="number" value={f.min_team_count} onChange={e => setF({ ...f, min_team_count: e.target.value as any })} /></div>
        <div><Label>Recommended min</Label><Input type="number" value={f.recommended_min_teams} onChange={e => setF({ ...f, recommended_min_teams: e.target.value as any })} /></div>
        <div><Label>Recommended max</Label><Input type="number" value={f.recommended_max_teams} onChange={e => setF({ ...f, recommended_max_teams: e.target.value as any })} /></div>
        <div><Label>Max teams (hard cap)</Label><Input type="number" value={f.max_team_count as any} onChange={e => setF({ ...f, max_team_count: e.target.value as any })} /></div>
        <div>
          <Label>Regular match format</Label>
          <Select value={f.match_format} onValueChange={v => setF({ ...f, match_format: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BO1">BO1</SelectItem>
              <SelectItem value="BO3">BO3</SelectItem>
              <SelectItem value="BO5">BO5</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Playoff match format</Label>
          <Select value={f.playoff_match_format} onValueChange={v => setF({ ...f, playoff_match_format: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BO1">BO1</SelectItem>
              <SelectItem value="BO3">BO3</SelectItem>
              <SelectItem value="BO5">BO5</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Starts at</Label><Input type="datetime-local" value={f.starts_at} onChange={e => setF({ ...f, starts_at: e.target.value })} /></div>
        <div><Label>Ends at</Label><Input type="datetime-local" value={f.ends_at} onChange={e => setF({ ...f, ends_at: e.target.value })} /></div>
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={busy}><Save className="h-3 w-3 mr-1" /> Save season</Button>
      </div>
    </Card>
  );
}

function TeamsTab({ approved, teamMap, matches, seasonId, onChange, busy, setBusy }: {
  approved: Registration[]; teamMap: Record<string, Team>; matches: MatchRow[]; seasonId: string;
  onChange: () => void; busy: boolean; setBusy: (b: boolean) => void;
}) {
  const [badgeOpen, setBadgeOpen] = useState<string | null>(null);
  const [badgeForm, setBadgeForm] = useState({ code: "", label: "" });

  const removeTeam = async (reg: Registration) => {
    setBusy(true);
    const r = await supabase.from("league_registrations").delete().eq("id", reg.id);
    setBusy(false);
    if (r.error) return toast.error(r.error.message);
    toast.success("Team removed from season");
    onChange();
  };

  const awardBadge = async (teamId: string) => {
    if (!badgeForm.code || !badgeForm.label) return toast.error("Code and label required");
    setBusy(true);
    const r = await supabase.from("league_badges").insert({ team_id: teamId, season_id: seasonId, code: badgeForm.code, label: badgeForm.label });
    setBusy(false);
    if (r.error) return toast.error(r.error.message);
    toast.success("Badge awarded");
    setBadgeOpen(null);
    setBadgeForm({ code: "", label: "" });
  };

  return (
    <Card className="p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead>Founding</TableHead>
            <TableHead>Upcoming</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approved.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No approved teams yet.</TableCell></TableRow>}
          {approved.map(r => {
            const t = teamMap[r.team_id];
            const upcoming = matches.filter(m => (m.team_a_id === r.team_id || m.team_b_id === r.team_id) && m.status !== "completed").length;
            return (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-display uppercase">{t?.name ?? r.team_id.slice(0, 8)}</div>
                  {t?.tag && <div className="text-xs text-muted-foreground">[{t.tag}]</div>}
                </TableCell>
                <TableCell>{r.is_founding_team ? <span className="text-amber-400 text-xs font-display">FOUNDING</span> : "—"}</TableCell>
                <TableCell className="text-sm">{upcoming}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {t && <Button asChild size="sm" variant="ghost"><Link to={`/teams/${t.id}`}>View</Link></Button>}
                    <Button size="sm" variant="outline" onClick={() => setBadgeOpen(r.team_id)}><Award className="h-3 w-3 mr-1" /> Badge</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive"><Trash2 className="h-3 w-3" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove team from season?</AlertDialogTitle>
                          <AlertDialogDescription>This removes their registration. Match history is kept.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeTeam(r)}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={!!badgeOpen} onOpenChange={o => !o && setBadgeOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Award league badge</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Code</Label><Input placeholder="champion / founding / etc" value={badgeForm.code} onChange={e => setBadgeForm({ ...badgeForm, code: e.target.value })} /></div>
            <div><Label>Label</Label><Input placeholder="Season 0 Champion" value={badgeForm.label} onChange={e => setBadgeForm({ ...badgeForm, label: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={() => badgeOpen && awardBadge(badgeOpen)} disabled={busy}>Award</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ScheduleView({ matches, teamMap, approved }: { matches: MatchRow[]; teamMap: Record<string, Team>; approved: Registration[] }) {
  if (matches.length === 0) return <Card className="p-8 text-center text-muted-foreground">No matches scheduled yet.</Card>;
  const grouped: Record<string, MatchRow[]> = {};
  for (const m of matches.filter(m => m.stage === "regular_season")) {
    const k = String(m.matchday ?? 0);
    (grouped[k] ||= []).push(m);
  }
  const keys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
  return (
    <div className="space-y-3">
      {keys.map(k => {
        const md = grouped[k];
        const playing = new Set<string>();
        md.forEach(m => { if (m.team_a_id) playing.add(m.team_a_id); if (m.team_b_id) playing.add(m.team_b_id); });
        const byes = approved.filter(r => !playing.has(r.team_id));
        return (
          <Card key={k} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-display uppercase tracking-widest text-sm">Matchday {k}</div>
              {byes.length > 0 && <div className="text-xs text-amber-400">Bye: {byes.map(b => teamMap[b.team_id]?.name ?? "?").join(", ")}</div>}
            </div>
            <div className="space-y-1 text-sm">
              {md.map(m => (
                <div key={m.id} className="flex items-center justify-between border-b border-border/40 last:border-0 py-1.5">
                  <span>{teamMap[m.team_a_id ?? ""]?.name ?? "?"} <span className="text-muted-foreground">vs</span> {teamMap[m.team_b_id ?? ""]?.name ?? "?"}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {m.scheduled_at && <span>{fmtDate(m.scheduled_at)}</span>}
                    <StatusPill status={m.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function MatchesTable({ matches, teamMap, busy, setBusy, onChange }: {
  matches: MatchRow[]; teamMap: Record<string, Team>; busy: boolean; setBusy: (b: boolean) => void; onChange: () => void;
}) {
  const [edit, setEdit] = useState<MatchRow | null>(null);
  const [form, setForm] = useState<{ scheduled_at: string; score_a: string; score_b: string; status: string }>({ scheduled_at: "", score_a: "", score_b: "", status: "" });

  const open = (m: MatchRow) => {
    setEdit(m);
    setForm({
      scheduled_at: m.scheduled_at ? m.scheduled_at.slice(0, 16) : "",
      score_a: m.score_a?.toString() ?? "",
      score_b: m.score_b?.toString() ?? "",
      status: m.status,
    });
  };

  const save = async () => {
    if (!edit) return;
    setBusy(true);
    const payload: any = {
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      score_a: form.score_a === "" ? null : Number(form.score_a),
      score_b: form.score_b === "" ? null : Number(form.score_b),
      status: form.status,
    };
    if (payload.score_a !== null && payload.score_b !== null) {
      payload.winner_id = payload.score_a > payload.score_b ? edit.team_a_id : payload.score_b > payload.score_a ? edit.team_b_id : null;
      payload.result_status = "completed";
      payload.status = "completed";
    }
    const r = await supabase.from("matches").update(payload).eq("id", edit.id);
    setBusy(false);
    if (r.error) return toast.error(r.error.message);
    toast.success("Match updated");
    setEdit(null);
    onChange();
  };

  const setStatus = async (m: MatchRow, status: string) => {
    setBusy(true);
    const r = await supabase.from("matches").update({ status }).eq("id", m.id);
    setBusy(false);
    if (r.error) return toast.error(r.error.message);
    toast.success(`Match → ${status}`);
    onChange();
  };

  const voidMatch = async (m: MatchRow) => {
    setBusy(true);
    const r = await supabase.from("matches").update({ status: "cancelled", result_status: "void", score_a: null, score_b: null, winner_id: null }).eq("id", m.id);
    setBusy(false);
    if (r.error) return toast.error(r.error.message);
    toast.success("Match voided"); onChange();
  };

  return (
    <>
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MD</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No matches.</TableCell></TableRow>}
            {matches.map(m => (
              <TableRow key={m.id}>
                <TableCell>{m.matchday ?? "—"}</TableCell>
                <TableCell className="text-xs">{m.stage}</TableCell>
                <TableCell>
                  <div className="text-sm">{teamMap[m.team_a_id ?? ""]?.name ?? "?"} <span className="text-muted-foreground">vs</span> {teamMap[m.team_b_id ?? ""]?.name ?? "?"}</div>
                </TableCell>
                <TableCell className="text-xs">{fmtDate(m.scheduled_at)}</TableCell>
                <TableCell className="font-mono text-sm">{m.score_a ?? "—"}–{m.score_b ?? "—"}</TableCell>
                <TableCell><StatusPill status={m.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="sm" variant="ghost"><Link to={`/matches/${m.id}`}>Open</Link></Button>
                    <Button size="sm" variant="outline" onClick={() => open(m)}>Edit</Button>
                    {m.status !== "live" && <Button size="sm" variant="outline" onClick={() => setStatus(m, "live")} disabled={busy}>Live</Button>}
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="destructive">Void</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Void this match?</AlertDialogTitle>
                          <AlertDialogDescription>Score and winner will be cleared. Standings will need recompute.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => voidMatch(m)}>Void match</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!edit} onOpenChange={o => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit match</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Scheduled at</Label><Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Score A</Label><Input type="number" value={form.score_a} onChange={e => setForm({ ...form, score_a: e.target.value })} /></div>
              <div><Label>Score B</Label><Input type="number" value={form.score_b} onChange={e => setForm({ ...form, score_b: e.target.value })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={save} disabled={busy}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ResultsTab({ matches, teamMap, seasonId, onChange }: {
  matches: MatchRow[]; teamMap: Record<string, Team>; seasonId: string; onChange: () => void;
}) {
  const pending = matches.filter(m => m.result_status === "pending_confirmation");
  const completed = matches.filter(m => m.result_status === "completed").slice(0, 20);

  const force = async (id: string) => {
    const r: any = await supabase.rpc("confirm_match_result", { _match_id: id });
    if (r.error) {
      const m = matches.find(x => x.id === id);
      if (!m) return toast.error(r.error.message);
      const winner = (m.score_a ?? 0) > (m.score_b ?? 0) ? m.team_a_id : (m.score_b ?? 0) > (m.score_a ?? 0) ? m.team_b_id : null;
      const r2 = await supabase.from("matches").update({ result_status: "completed", status: "completed", winner_id: winner, confirmed_at: new Date().toISOString() }).eq("id", id);
      if (r2.error) return toast.error(r2.error.message);
    }
    await supabase.rpc("recalculate_league_standings", { _season_id: seasonId });
    toast.success("Result confirmed");
    onChange();
  };

  const reject = async (id: string) => {
    const r = await supabase.from("matches").update({ result_status: "scheduled", score_a: null, score_b: null }).eq("id", id);
    if (r.error) return toast.error(r.error.message);
    toast.success("Result rejected — captains can resubmit"); onChange();
  };

  return (
    <>
      <Card className="p-4">
        <div className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-3">Pending confirmation ({pending.length})</div>
        {pending.length === 0 ? <p className="text-sm text-muted-foreground">No results awaiting confirmation.</p> : (
          <div className="space-y-2">
            {pending.map(m => (
              <div key={m.id} className="border border-border rounded p-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-display">{teamMap[m.team_a_id ?? ""]?.name} <span className="text-muted-foreground">vs</span> {teamMap[m.team_b_id ?? ""]?.name}</div>
                  <div className="text-sm text-muted-foreground">Score: {m.score_a}–{m.score_b}</div>
                  {m.proof_url && <a href={m.proof_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View proof</a>}
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline"><Link to={`/matches/${m.id}`}>Open</Link></Button>
                  <Button size="sm" onClick={() => force(m.id)}><Check className="h-3 w-3 mr-1" /> Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => reject(m.id)}><X className="h-3 w-3 mr-1" /> Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card className="p-4">
        <div className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-3">Recent confirmed ({completed.length})</div>
        {completed.length === 0 ? <p className="text-sm text-muted-foreground">No confirmed results yet.</p> : (
          <div className="divide-y divide-border/40 text-sm">
            {completed.map(m => (
              <div key={m.id} className="py-2 flex items-center justify-between">
                <span>{teamMap[m.team_a_id ?? ""]?.name} <b>{m.score_a}–{m.score_b}</b> {teamMap[m.team_b_id ?? ""]?.name}</span>
                <span className="text-xs text-muted-foreground">{m.winner_id ? `Winner: ${teamMap[m.winner_id]?.name}` : "Draw"}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function DisputesTab({ disputes, matches, teamMap, seasonId, onChange }: {
  disputes: Dispute[]; matches: MatchRow[]; teamMap: Record<string, Team>; seasonId: string; onChange: () => void;
}) {
  const [note, setNote] = useState<Record<string, string>>({});

  const resolve = async (d: Dispute, winnerSide: "a" | "b" | "void") => {
    const m = matches.find(x => x.id === d.match_id);
    if (!m) return;
    await supabase.from("match_disputes").update({ resolution_note: note[d.id] ?? null, status: "resolved", resolved_at: new Date().toISOString() }).eq("id", d.id);
    if (winnerSide === "void") {
      await supabase.from("matches").update({ status: "cancelled", result_status: "void", score_a: null, score_b: null, winner_id: null }).eq("id", m.id);
    } else {
      const winner = winnerSide === "a" ? m.team_a_id : m.team_b_id;
      const sa = winnerSide === "a" ? Math.max(1, m.score_a ?? 1) : (m.score_a ?? 0);
      const sb = winnerSide === "b" ? Math.max(1, m.score_b ?? 1) : (m.score_b ?? 0);
      await supabase.from("matches").update({
        status: "completed", result_status: "completed",
        score_a: sa, score_b: sb, winner_id: winner, confirmed_at: new Date().toISOString(),
      }).eq("id", m.id);
    }
    await supabase.rpc("recalculate_league_standings", { _season_id: seasonId });
    toast.success("Dispute resolved");
    onChange();
  };

  if (disputes.length === 0) return <Card className="p-8 text-center text-muted-foreground">No disputes filed.</Card>;
  return (
    <div className="space-y-3">
      {disputes.map(d => {
        const m = matches.find(x => x.id === d.match_id);
        return (
          <Card key={d.id} className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-display uppercase">{m ? `${teamMap[m.team_a_id ?? ""]?.name} vs ${teamMap[m.team_b_id ?? ""]?.name}` : d.match_id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">Opened {fmtDate(d.created_at)} · by {teamMap[d.opened_by_team_id]?.name ?? "team"}</div>
                <p className="text-sm mt-2">{d.reason}</p>
                {d.evidence_url && <a href={d.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View evidence</a>}
              </div>
              <StatusPill status={d.status} />
            </div>
            {d.status === "open" && m && (
              <div className="mt-3 space-y-2">
                <Textarea placeholder="Admin resolution note" value={note[d.id] ?? ""} onChange={e => setNote({ ...note, [d.id]: e.target.value })} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => resolve(d, "a")}>Confirm {teamMap[m.team_a_id ?? ""]?.name} win</Button>
                  <Button size="sm" onClick={() => resolve(d, "b")}>Confirm {teamMap[m.team_b_id ?? ""]?.name} win</Button>
                  <Button size="sm" variant="destructive" onClick={() => resolve(d, "void")}>Void match</Button>
                </div>
              </div>
            )}
            {d.resolution_note && <p className="text-xs text-muted-foreground mt-2">Resolution: {d.resolution_note}</p>}
          </Card>
        );
      })}
    </div>
  );
}

function PlayoffsTab({ season, matches, teamMap, allRegularDone, busy, onGenerate, onArchive }: {
  season: Season; matches: MatchRow[]; teamMap: Record<string, Team>; allRegularDone: boolean;
  busy: boolean; onGenerate: () => void; onArchive: () => void;
}) {
  const playoffs = matches.filter(m => m.stage === "playoff" || m.stage === "playoffs");
  if (!season.playoffs_started_at) {
    return (
      <Card className="p-8 text-center space-y-3">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
        <div className="font-display uppercase">Playoffs locked</div>
        <p className="text-sm text-muted-foreground">
          {allRegularDone ? "Regular season is complete — you can generate the bracket." : "Complete all regular-season matches before generating playoffs."}
        </p>
        <Button onClick={onGenerate} disabled={busy || !allRegularDone}><Swords className="h-3 w-3 mr-1" /> Generate playoffs</Button>
      </Card>
    );
  }
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-display uppercase">Playoff bracket</div>
        <Button size="sm" variant="outline" onClick={onArchive}><Trophy className="h-3 w-3 mr-1" /> Archive season</Button>
      </div>
      {playoffs.length === 0 ? <p className="text-sm text-muted-foreground">No playoff matches yet.</p> : (
        <div className="space-y-1">
          {playoffs.map(m => (
            <div key={m.id} className="flex items-center justify-between border-b border-border/40 py-2 text-sm">
              <span>{teamMap[m.team_a_id ?? ""]?.name ?? "TBD"} vs {teamMap[m.team_b_id ?? ""]?.name ?? "TBD"}</span>
              <span className="font-mono">{m.score_a ?? "—"}–{m.score_b ?? "—"}</span>
              <StatusPill status={m.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function HofTab({ seasonId, hof, approved, teamMap, onChange }: {
  seasonId: string; hof: HofEntry | null; approved: Registration[]; teamMap: Record<string, Team>; onChange: () => void;
}) {
  const [f, setF] = useState({ champion_team_id: hof?.champion_team_id ?? "", runner_up_team_id: hof?.runner_up_team_id ?? "", notes: hof?.notes ?? "" });
  useEffect(() => setF({ champion_team_id: hof?.champion_team_id ?? "", runner_up_team_id: hof?.runner_up_team_id ?? "", notes: hof?.notes ?? "" }), [hof?.id, seasonId]);

  const save = async () => {
    const payload: any = {
      season_id: seasonId,
      champion_team_id: f.champion_team_id || null,
      runner_up_team_id: f.runner_up_team_id || null,
      notes: f.notes || null,
    };
    let r;
    if (hof) r = await supabase.from("league_hall_of_fame").update(payload).eq("id", hof.id);
    else r = await supabase.from("league_hall_of_fame").insert(payload);
    if (r.error) return toast.error(r.error.message);
    if (f.champion_team_id) {
      await supabase.from("league_seasons").update({ champion_team_id: f.champion_team_id }).eq("id", seasonId);
      await supabase.rpc("award_league_champion", { _season_id: seasonId, _team_id: f.champion_team_id }).then(() => {}, () => {});
    }
    toast.success("Hall of Fame updated"); onChange();
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Champion</Label>
          <Select value={f.champion_team_id} onValueChange={v => setF({ ...f, champion_team_id: v })}>
            <SelectTrigger><SelectValue placeholder="Pick champion" /></SelectTrigger>
            <SelectContent>
              {approved.map(r => <SelectItem key={r.team_id} value={r.team_id}>{teamMap[r.team_id]?.name ?? r.team_id.slice(0, 8)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Runner-up</Label>
          <Select value={f.runner_up_team_id} onValueChange={v => setF({ ...f, runner_up_team_id: v })}>
            <SelectTrigger><SelectValue placeholder="Pick runner-up" /></SelectTrigger>
            <SelectContent>
              {approved.map(r => <SelectItem key={r.team_id} value={r.team_id}>{teamMap[r.team_id]?.name ?? r.team_id.slice(0, 8)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Notes</Label><Textarea rows={3} value={f.notes ?? ""} onChange={e => setF({ ...f, notes: e.target.value })} /></div>
      <div className="flex justify-end"><Button onClick={save}><Crown className="h-3 w-3 mr-1" /> Publish champion</Button></div>
    </Card>
  );
}

function SettingsTab({ season, completedMatches, onArchive, onReopen, onResetFormat, onDeleteDraft }: {
  season: Season; completedMatches: number;
  onArchive: () => void; onReopen: () => void; onResetFormat: () => void; onDeleteDraft: () => void;
}) {
  const Confirm = ({ trigger, title, desc, onAct }: { trigger: React.ReactNode; title: string; desc: string; onAct: () => void }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{desc}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onAct}>Confirm</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-amber-400 font-display uppercase text-sm">
        <ShieldAlert className="h-4 w-4" /> Dangerous actions
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Confirm
          title="Archive season?" desc="The season will be marked archived and read-only."
          onAct={onArchive}
          trigger={<Button variant="outline" disabled={season.status === "archived"}><Trophy className="h-3 w-3 mr-1" /> Archive season</Button>}
        />
        <Confirm
          title="Reopen season?" desc="Sets status to ongoing and registrations back to open."
          onAct={onReopen}
          trigger={<Button variant="outline"><RefreshCw className="h-3 w-3 mr-1" /> Reopen season</Button>}
        />
        <DisabledHint reason={completedMatches > 0 ? "Cannot delete — matches already completed" : undefined}>
          <Confirm
            title="Delete draft schedule?" desc="All non-completed matches in this season will be removed."
            onAct={onDeleteDraft}
            trigger={<Button variant="destructive" disabled={completedMatches > 0}><Trash2 className="h-3 w-3 mr-1" /> Delete draft schedule</Button>}
          />
        </DisabledHint>
        <DisabledHint reason={completedMatches > 0 ? "Cannot reset — matches already completed" : season.schedule_status === "locked" ? "Schedule is locked" : undefined}>
          <Confirm
            title="Reset generated format?" desc="Removes the generated format so it can be regenerated."
            onAct={onResetFormat}
            trigger={<Button variant="outline" disabled={completedMatches > 0 || season.schedule_status === "locked"}><Settings className="h-3 w-3 mr-1" /> Reset format</Button>}
          />
        </DisabledHint>
      </div>
    </Card>
  );
}
