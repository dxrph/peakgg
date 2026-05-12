import { useEffect, useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import RoleGuard from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Download, Trophy, ChevronUp, ChevronDown, Plus, Trash2, RotateCcw, Sparkles, Star, AlertTriangle, Map as MapIcon, Info, LayoutGrid, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_VALORANT_MAP_POOL,
  MAP_SELECTION_MODE_LABEL,
  MATCH_FORMAT_OPTIONS,
  RESULT_CONFIRMATION_MODES,
  TOURNAMENT_STATUS_OPTIONS,
} from "@/lib/valorant-maps";

type Signup = {
  id: string; tournament_id: string; created_at: string; status: string;
  team_name: string; team_tag: string | null; team_logo_url: string | null;
  community_name: string; community_discord_url: string | null;
  country_language: string; average_rank: string | null;
  captain_name: string; captain_discord: string; captain_email: string; captain_riot_id: string;
  player_1_riot_id: string; player_2_riot_id: string; player_3_riot_id: string; player_4_riot_id: string; player_5_riot_id: string;
  substitute_1_riot_id: string | null; substitute_2_riot_id: string | null;
  notes: string | null; admin_note: string | null; checked_in_at: string | null;
  agreement_available: boolean; agreement_discord: boolean; agreement_rules: boolean; agreement_forfeit: boolean;
  wants_permanent_team?: boolean; permanent_team_request_note?: string | null;
};

type Tournament = {
  id: string; name: string; status: string; max_teams: number; min_teams: number | null;
  slug: string | null; tagline?: string | null; short_description: string | null;
  description: string | null; rules: string | null; rules_url: string | null;
  discord_url?: string | null; organizer_discord: string | null;
  game: string; language: string | null; timezone: string | null;
  start_date: string | null; end_date: string | null;
  registration_open_at: string | null; registration_close_at: string | null;
  checkin_open_at: string | null; checkin_close_at: string | null;
  countdown_enabled?: boolean | null;
  match_format_default?: string | null;
  match_format_final?: string | null;
  map_selection_mode?: string | null;
  result_confirmation_mode?: string | null;
  third_place_enabled?: boolean | null;
  forfeit_grace_minutes?: number | null;
  team_size: string | null;
};

type MapPoolRow = { id: string; tournament_id: string; map_name: string; is_active: boolean; display_order: number; image_url: string | null };
type MatchRow = { id: string; round: number | null; bracket_position: number | null; status: string; team_a_id: string | null; team_b_id: string | null; score_a: number | null; score_b: number | null; winner_id: string | null; map: string | null };

const SIGNUP_STATUSES = ["pending","approved","rejected","waitlisted","checked_in","eliminated","champion"] as const;

export default function AdminCommunityCup() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [mapPool, setMapPool] = useState<MapPoolRow[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [detail, setDetail] = useState<Signup | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: t } = await supabase
      .from("tournaments")
      .select("*")
      .eq("slug", "community-cup-1")
      .maybeSingle();
    if (t) {
      setTournament(t as Tournament);
      const [sRes, mpRes, mRes] = await Promise.all([
        supabase.from("tournament_team_signups" as never).select("*").eq("tournament_id", t.id).order("created_at", { ascending: false }),
        supabase.from("tournament_map_pool" as never).select("*").eq("tournament_id", t.id).order("display_order", { ascending: true }),
        supabase.from("matches").select("id, round, bracket_position, status, team_a_id, team_b_id, score_a, score_b, winner_id, map").eq("tournament_id", t.id).order("round", { ascending: true }).order("bracket_position", { ascending: true }),
      ]);
      setSignups(((sRes.data ?? []) as never as Signup[]));
      setMapPool(((mpRes.data ?? []) as never as MapPoolRow[]));
      setMatches(((mRes.data ?? []) as never as MatchRow[]));
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: signups.length };
    for (const s of SIGNUP_STATUSES) c[s] = signups.filter((x) => x.status === s).length;
    return c;
  }, [signups]);

  if (loading) {
    return (
      <RoleGuard allow={["admin","moderator"]}>
        <AdminLayout title="Community Cup #1" description="Loading…">
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        </AdminLayout>
      </RoleGuard>
    );
  }
  if (!tournament) {
    return (
      <RoleGuard allow={["admin","moderator"]}>
        <AdminLayout title="Community Cup #1" description="Not found">
          <p className="text-sm text-muted-foreground">Tournament not found.</p>
        </AdminLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allow={["admin","moderator"]}>
      <AdminLayout
        title="Community Cup #1"
        description="Full operational control for the PeakGG Community Cup."
      >
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="registrations">Registrations ({counts.all})</TabsTrigger>
            <TabsTrigger value="map-pool">Map Pool</TabsTrigger>
            <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab tournament={tournament} counts={counts} mapPool={mapPool} matches={matches} onChanged={load} />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab tournament={tournament} onChanged={load} />
          </TabsContent>
          <TabsContent value="registrations" className="mt-6">
            <RegistrationsTab signups={signups} counts={counts} onChanged={load} onOpen={setDetail} />
          </TabsContent>
          <TabsContent value="map-pool" className="mt-6">
            <MapPoolTab tournament={tournament} pool={mapPool} onChanged={load} />
          </TabsContent>
          <TabsContent value="matches" className="mt-6">
            <MatchesTab tournament={tournament} matches={matches} signups={signups} mapPool={mapPool} onChanged={load} />
          </TabsContent>
        </Tabs>

        <SignupDetailDialog
          signup={detail}
          onClose={() => setDetail(null)}
          onChanged={load}
        />
      </AdminLayout>
    </RoleGuard>
  );
}

/* ──────────────── OVERVIEW ──────────────── */

function OverviewTab({ tournament, counts, mapPool, matches, onChanged }: {
  tournament: Tournament; counts: Record<string, number>; mapPool: MapPoolRow[]; matches: MatchRow[]; onChanged: () => void;
}) {
  const slots = (counts.approved ?? 0) + (counts.checked_in ?? 0);
  const activeMaps = mapPool.filter((m) => m.is_active).length;
  const completedMatches = matches.filter((m) => m.status === "completed").length;

  const setStatus = async (status: string) => {
    const { error } = await supabase.from("tournaments").update({ status }).eq("id", tournament.id);
    if (error) return toast.error(error.message);
    toast.success(`Status: ${status}`);
    onChanged();
  };

  const generateBracket = async () => {
    if (!confirm("Generate the bracket from approved/checked-in teams? This will replace any existing pending matches.")) return;
    const { error } = await supabase.rpc("generate_bracket" as never, { _tournament_id: tournament.id } as never);
    if (error) return toast.error(error.message);
    toast.success("Bracket generated");
    onChanged();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat label="Status" value={tournament.status} />
        <Stat label="Pending" value={counts.pending ?? 0} />
        <Stat label="Approved" value={counts.approved ?? 0} />
        <Stat label="Waitlisted" value={counts.waitlisted ?? 0} />
        <Stat label="Checked-in" value={counts.checked_in ?? 0} />
        <Stat label="Slots" value={`${slots}/${tournament.max_teams}`} />
        <Stat label="Active Maps" value={activeMaps || "—"} />
        <Stat label="Total Matches" value={matches.length} />
        <Stat label="Completed" value={completedMatches} />
        <Stat label="Format" value={`${tournament.match_format_default ?? "BO1"} / ${tournament.match_format_final ?? "BO3"}`} />
        <Stat label="Map Mode" value={MAP_SELECTION_MODE_LABEL[tournament.map_selection_mode ?? "admin_manual"]?.split(" ")[0] ?? "Admin"} />
        <Stat label="Start" value={tournament.start_date ? new Date(tournament.start_date).toLocaleString() : "TBA"} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-display uppercase tracking-wide text-sm mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setStatus("registration_open")}>Open Registration</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("registration_closed")}>Close Registration</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("checkin")}>Open Check-in</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("live")}>Start Tournament</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("paused")}>Pause</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus("completed")}>Complete</Button>
          <Button size="sm" variant="neon" onClick={generateBracket}>
            <Sparkles className="h-3.5 w-3.5 mr-1" />Generate Bracket
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-display uppercase tracking-wide text-sm mb-3">Tournament Status</p>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="border-primary text-primary font-display">{tournament.status}</Badge>
          <Select value={tournament.status} onValueChange={setStatus}>
            <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TOURNAMENT_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── SETTINGS ──────────────── */

function SettingsTab({ tournament, onChanged }: { tournament: Tournament; onChanged: () => void }) {
  const [f, setF] = useState<Tournament>(tournament);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setF(tournament); }, [tournament]);

  const upd = (k: keyof Tournament, v: unknown) => setF((p) => ({ ...p, [k]: v }) as Tournament);

  const save = async () => {
    setSaving(true);
    const payload = {
      name: f.name,
      tagline: f.tagline ?? null,
      short_description: f.short_description ?? null,
      description: f.description ?? null,
      rules: f.rules ?? null,
      rules_url: f.rules_url ?? null,
      discord_url: f.discord_url ?? null,
      organizer_discord: f.organizer_discord ?? null,
      language: f.language ?? null,
      timezone: f.timezone ?? "Europe/Brussels",
      start_date: f.start_date || null,
      end_date: f.end_date || null,
      registration_open_at: f.registration_open_at || null,
      registration_close_at: f.registration_close_at || null,
      checkin_open_at: f.checkin_open_at || null,
      checkin_close_at: f.checkin_close_at || null,
      max_teams: Number(f.max_teams) || 16,
      min_teams: Number(f.min_teams ?? 8),
      team_size: f.team_size ?? "5v5",
      countdown_enabled: !!f.countdown_enabled,
      match_format_default: f.match_format_default ?? "BO1",
      match_format_final: f.match_format_final ?? "BO3",
      map_selection_mode: f.map_selection_mode ?? "admin_manual",
      result_confirmation_mode: f.result_confirmation_mode ?? "admin_manual",
      third_place_enabled: !!f.third_place_enabled,
      forfeit_grace_minutes: Number(f.forfeit_grace_minutes ?? 10),
    };
    const { error } = await supabase.from("tournaments").update(payload as never).eq("id", tournament.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    onChanged();
  };

  return (
    <div className="space-y-6">
      <SettingsCard title="Basic Info">
        <Row2>
          <FieldA label="Name"><Input value={f.name} onChange={(e) => upd("name", e.target.value)} /></FieldA>
          <FieldA label="Tagline"><Input value={f.tagline ?? ""} onChange={(e) => upd("tagline", e.target.value)} placeholder="A short subtitle for the hero" /></FieldA>
        </Row2>
        <Row2>
          <FieldA label="Language"><Input value={f.language ?? ""} onChange={(e) => upd("language", e.target.value)} placeholder="en" /></FieldA>
          <FieldA label="Timezone"><Input value={f.timezone ?? ""} onChange={(e) => upd("timezone", e.target.value)} placeholder="Europe/Brussels" /></FieldA>
        </Row2>
        <Row2>
          <FieldA label="Discord URL"><Input value={f.discord_url ?? ""} onChange={(e) => upd("discord_url", e.target.value)} placeholder="https://discord.gg/..." /></FieldA>
          <FieldA label="Rules URL"><Input value={f.rules_url ?? ""} onChange={(e) => upd("rules_url", e.target.value)} /></FieldA>
        </Row2>
        <FieldA label="Short description"><Textarea rows={2} value={f.short_description ?? ""} onChange={(e) => upd("short_description", e.target.value)} /></FieldA>
        <FieldA label="Description"><Textarea rows={4} value={f.description ?? ""} onChange={(e) => upd("description", e.target.value)} /></FieldA>
      </SettingsCard>

      <SettingsCard title="Capacity & Format">
        <Row2>
          <FieldA label="Max teams"><Input type="number" value={f.max_teams ?? 16} onChange={(e) => upd("max_teams", Number(e.target.value))} /></FieldA>
          <FieldA label="Min teams"><Input type="number" value={f.min_teams ?? 8} onChange={(e) => upd("min_teams", Number(e.target.value))} /></FieldA>
        </Row2>
        <Row2>
          <FieldA label="Team size"><Input value={f.team_size ?? "5v5"} onChange={(e) => upd("team_size", e.target.value)} /></FieldA>
          <FieldA label="Forfeit grace (min)"><Input type="number" value={f.forfeit_grace_minutes ?? 10} onChange={(e) => upd("forfeit_grace_minutes", Number(e.target.value))} /></FieldA>
        </Row2>
        <Row2>
          <FieldA label="Default match format">
            <Select value={f.match_format_default ?? "BO1"} onValueChange={(v) => upd("match_format_default", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MATCH_FORMAT_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldA>
          <FieldA label="Grand final format">
            <Select value={f.match_format_final ?? "BO3"} onValueChange={(v) => upd("match_format_final", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MATCH_FORMAT_OPTIONS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldA>
        </Row2>
        <Row2>
          <FieldA label="Map selection mode">
            <Select value={f.map_selection_mode ?? "admin_manual"} onValueChange={(v) => upd("map_selection_mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MAP_SELECTION_MODE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldA>
          <FieldA label="Result confirmation mode">
            <Select value={f.result_confirmation_mode ?? "admin_manual"} onValueChange={(v) => upd("result_confirmation_mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESULT_CONFIRMATION_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldA>
        </Row2>
        <div className="flex items-center gap-3">
          <Switch checked={!!f.third_place_enabled} onCheckedChange={(v) => upd("third_place_enabled", v)} />
          <span className="text-sm">Enable 3rd-place match</span>
        </div>
      </SettingsCard>

      <SettingsCard title="Schedule & Countdown">
        <div className="flex items-center gap-3 mb-2">
          <Switch checked={!!f.countdown_enabled} onCheckedChange={(v) => upd("countdown_enabled", v)} />
          <span className="text-sm">Show countdown on public page</span>
        </div>
        <Row2>
          <FieldA label="Tournament start"><DateTimeInput value={f.start_date} onChange={(v) => upd("start_date", v)} /></FieldA>
          <FieldA label="Tournament end (estimated)"><DateTimeInput value={f.end_date} onChange={(v) => upd("end_date", v)} /></FieldA>
        </Row2>
        <Row2>
          <FieldA label="Registration opens at"><DateTimeInput value={f.registration_open_at} onChange={(v) => upd("registration_open_at", v)} /></FieldA>
          <FieldA label="Registration closes at"><DateTimeInput value={f.registration_close_at} onChange={(v) => upd("registration_close_at", v)} /></FieldA>
        </Row2>
        <Row2>
          <FieldA label="Check-in opens at"><DateTimeInput value={f.checkin_open_at} onChange={(v) => upd("checkin_open_at", v)} /></FieldA>
          <FieldA label="Check-in closes at"><DateTimeInput value={f.checkin_close_at} onChange={(v) => upd("checkin_close_at", v)} /></FieldA>
        </Row2>
      </SettingsCard>

      <SettingsCard title="Rules text">
        <FieldA label="Rules (markdown allowed)"><Textarea rows={6} value={f.rules ?? ""} onChange={(e) => upd("rules", e.target.value)} /></FieldA>
      </SettingsCard>

      <div className="flex justify-end">
        <Button variant="neon" onClick={save} disabled={saving} className="uppercase tracking-wider">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Settings
        </Button>
      </div>
    </div>
  );
}

/* ──────────────── REGISTRATIONS ──────────────── */

function RegistrationsTab({ signups, counts, onChanged, onOpen }: {
  signups: Signup[]; counts: Record<string, number>; onChanged: () => void; onOpen: (s: Signup) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [actingId, setActingId] = useState<string | null>(null);
  const filtered = filter === "all" ? signups : signups.filter((s) => s.status === filter);

  const setStatus = async (id: string, status: string) => {
    setActingId(id);
    const { error } = await supabase.from("tournament_team_signups" as never)
      .update({ status, ...(status === "checked_in" ? { checked_in_at: new Date().toISOString() } : {}) } as never)
      .eq("id", id);
    setActingId(null);
    if (error) return toast.error(error.message);
    toast.success(`Status: ${status}`);
    onChanged();
  };

  const exportCsv = () => {
    const header = ["status","team_name","team_tag","community_name","country_language","average_rank","wants_permanent_team","permanent_team_request_note","captain_name","captain_discord","captain_email","captain_riot_id","p1","p2","p3","p4","p5","sub1","sub2","created_at"];
    const lines = [header.join(",")];
    for (const s of filtered) {
      const row = [
        s.status, s.team_name, s.team_tag ?? "", s.community_name, s.country_language, s.average_rank ?? "",
        s.wants_permanent_team ? "yes" : "no", s.permanent_team_request_note ?? "",
        s.captain_name, s.captain_discord, s.captain_email, s.captain_riot_id,
        s.player_1_riot_id, s.player_2_riot_id, s.player_3_riot_id, s.player_4_riot_id, s.player_5_riot_id,
        s.substitute_1_riot_id ?? "", s.substitute_2_riot_id ?? "", s.created_at,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
      lines.push(row);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "community-cup-1-signups.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            {SIGNUP_STATUSES.map((s) => <TabsTrigger key={s} value={s}>{s} ({counts[s] ?? 0})</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-2" />Export CSV
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase font-display text-muted-foreground">
            <tr>
              <th className="text-left p-3">Team</th>
              <th className="text-left p-3">Community</th>
              <th className="text-left p-3">Captain</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Permanent?</th>
              <th className="text-left p-3">Date</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No signups in this view.</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                <td className="p-3">
                  <div className="font-display">{s.team_tag ? <span className="text-muted-foreground mr-1">[{s.team_tag}]</span> : null}{s.team_name}</div>
                  {s.average_rank && <div className="text-xs text-muted-foreground">{s.average_rank}</div>}
                </td>
                <td className="p-3">
                  <div>{s.community_name}</div>
                  <div className="text-xs text-muted-foreground">{s.country_language}</div>
                </td>
                <td className="p-3">
                  <div>{s.captain_name}</div>
                  <div className="text-xs text-muted-foreground">{s.captain_discord}</div>
                </td>
                <td className="p-3"><Badge variant="secondary" className="font-display">{s.status}</Badge></td>
                <td className="p-3">
                  {s.wants_permanent_team ? (
                    <Badge variant="outline" className="border-accent text-accent font-display"><Star className="h-3 w-3 mr-1" />Yes</Badge>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</td>
                <td className="p-3 text-right space-x-1 whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => onOpen(s)} disabled={actingId === s.id}>View</Button>
                  {s.status !== "approved" && <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "approved")} disabled={actingId === s.id}>Approve</Button>}
                  {s.status !== "waitlisted" && s.status === "pending" && <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "waitlisted")} disabled={actingId === s.id}>Waitlist</Button>}
                  {s.status === "approved" && <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "checked_in")} disabled={actingId === s.id}>Check-in</Button>}
                  {s.status !== "rejected" && <Button size="sm" variant="ghost" onClick={() => setStatus(s.id, "rejected")} disabled={actingId === s.id}>Reject</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────────────── MAP POOL ──────────────── */

function MapPoolTab({ tournament, pool, onChanged }: { tournament: Tournament; pool: MapPoolRow[]; onChanged: () => void }) {
  const tournamentId = tournament.id;
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const totalMaps = pool.length;
  const activeMaps = pool.filter((m) => m.is_active).length;
  const inactiveMaps = totalMaps - activeMaps;
  const modeLabel = MAP_SELECTION_MODE_LABEL[tournament.map_selection_mode ?? "admin_manual"] ?? "Admin selects map manually";
  const hasCustomPool = totalMaps > 0;
  const hasActiveMaps = activeMaps > 0;

  const initDefault = async () => {
    setBusy(true);
    const rows = DEFAULT_VALORANT_MAP_POOL.map((m, i) => ({
      tournament_id: tournamentId, map_name: m, is_active: true, display_order: i,
    }));
    const { error } = await supabase.from("tournament_map_pool" as never).upsert(rows as never, { onConflict: "tournament_id,map_name" } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Default VALORANT map pool initialized");
    onChanged();
  };

  const resetDefault = async () => {
    if (!confirm("Reset to default VALORANT pool? Custom maps not in the default list will be removed.")) return;
    setBusy(true);
    await supabase.from("tournament_map_pool" as never).delete().eq("tournament_id", tournamentId);
    await initDefault();
  };

  const addMap = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    const order = (pool[pool.length - 1]?.display_order ?? -1) + 1;
    const { error } = await supabase.from("tournament_map_pool" as never).insert({
      tournament_id: tournamentId, map_name: name, is_active: true, display_order: order,
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    setNewName("");
    toast.success(`"${name}" added to pool`);
    onChanged();
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    setBusy(true);
    const { error } = await supabase.from("tournament_map_pool" as never).update({ is_active } as never).eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    onChanged();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this map from the pool?")) return;
    setRemovingId(id);
    setBusy(true);
    const { error } = await supabase.from("tournament_map_pool" as never).delete().eq("id", id);
    setBusy(false);
    setRemovingId(null);
    if (error) return toast.error(error.message);
    toast.success("Map removed");
    onChanged();
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= pool.length) return;
    setBusy(true);
    const a = pool[i]; const b = pool[j];
    await supabase.from("tournament_map_pool" as never).update({ display_order: b.display_order } as never).eq("id", a.id);
    await supabase.from("tournament_map_pool" as never).update({ display_order: a.display_order } as never).eq("id", b.id);
    setBusy(false);
    onChanged();
  };

  const poolStatusLabel = hasCustomPool
    ? (hasActiveMaps ? "Custom pool active" : "Custom pool — no active maps")
    : "Default fallback";
  const poolStatusColor = hasCustomPool
    ? (hasActiveMaps ? "text-emerald-400" : "text-amber-400")
    : "text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <MapIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-display uppercase tracking-wide text-base">Map Pool &amp; Veto Control</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage the active VALORANT maps used for PeakGG Community Cup #1. These maps will be used for admin map selection, random map draw or future captain veto.
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total maps" value={String(totalMaps)} />
        <StatCard label="Active maps" value={String(activeMaps)} />
        <StatCard label="Inactive maps" value={String(inactiveMaps)} />
        <StatCard label="Map selection" value={modeLabel.split(" ")[0]} />
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Pool status</p>
          <p className={cn("font-display text-sm mt-1", poolStatusColor)}>{poolStatusLabel}</p>
        </div>
      </div>

      {/* Warnings */}
      {!hasCustomPool && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-200">No custom map pool configured</p>
            <p className="text-xs text-amber-200/70 mt-1">
              The public page will fall back to the default VALORANT pool until you initialize or add maps.
            </p>
          </div>
        </div>
      )}
      {hasCustomPool && !hasActiveMaps && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive-foreground">Warning: no active maps</p>
            <p className="text-xs text-destructive-foreground/70 mt-1">
              Matches cannot draw maps until at least one map is active.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="neon" onClick={initDefault} disabled={busy}>
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Initialize VALORANT Default Pool
        </Button>
        <Button size="sm" variant="outline" onClick={resetDefault} disabled={busy || !hasCustomPool}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset to Default VALORANT Pool
        </Button>
      </div>

      {/* Add Map Card */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="font-display uppercase tracking-wide text-sm mb-3">Add Map</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Example: Ascent"
            maxLength={40}
            className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") addMap(); }}
          />
          <Button onClick={addMap} disabled={busy || !newName.trim()} className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Map
          </Button>
        </div>
      </div>

      {/* Map Pool Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <p className="font-display uppercase tracking-wide text-sm">Map Pool</p>
          <p className="text-xs text-muted-foreground">{activeMaps} of {totalMaps} active</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase font-display text-muted-foreground">
              <tr>
                <th className="text-left p-3 w-12">Order</th>
                <th className="text-left p-3">Map</th>
                <th className="text-left p-3 w-20">Active</th>
                <th className="text-left p-3 w-24">Visibility</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pool.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <LayoutGrid className="h-6 w-6 text-muted-foreground/50" />
                      <p>No custom maps yet.</p>
                      <Button size="sm" variant="neon" onClick={initDefault} disabled={busy} className="mt-1">
                        <Sparkles className="h-3.5 w-3.5 mr-1" />Initialize Default Pool
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                pool.map((m, i) => (
                  <tr key={m.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-3 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="p-3 font-display">{m.map_name}</td>
                    <td className="p-3">
                      <Switch
                        checked={m.is_active}
                        onCheckedChange={(v) => toggleActive(m.id, v)}
                        disabled={busy}
                      />
                    </td>
                    <td className="p-3">
                      {m.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <Eye className="h-3.5 w-3.5" /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <EyeOff className="h-3.5 w-3.5" /> Hidden
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={busy || i === 0} className="h-8 w-8">
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={busy || i === pool.length - 1} className="h-8 w-8">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive h-8 w-8"
                          onClick={() => remove(m.id)}
                          disabled={busy}
                        >
                          {removingId === m.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map Selection Mode Preview */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-accent" />
          <p className="font-display uppercase tracking-wide text-sm">Map Selection Mode</p>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(MAP_SELECTION_MODE_LABEL).map(([k, v]) => (
            <Badge
              key={k}
              variant={tournament.map_selection_mode === k ? "default" : "outline"}
              className={cn(
                "font-display text-xs",
                tournament.map_selection_mode === k ? "bg-primary/90" : "border-border text-muted-foreground"
              )}
            >
              {v}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Map selection mode can be changed in <span className="font-display text-foreground">Settings</span>.
        </p>
      </div>

      {/* Public Preview */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-4 w-4 text-primary" />
          <p className="font-display uppercase tracking-wide text-sm">Public Preview</p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          These are the active maps for PeakGG Community Cup #1. Match maps will be selected based on the current tournament map selection mode.
        </p>
        {hasActiveMaps ? (
          <div className="flex flex-wrap gap-2">
            {pool.filter((m) => m.is_active).map((m) => (
              <div
                key={m.id}
                className="inline-flex items-center rounded-md border border-border bg-secondary/40 px-3 py-1.5 text-sm font-display"
              >
                {m.map_name}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            No active maps to display. Activate maps above or initialize the default pool.
          </div>
        )}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <MapIcon className="h-3.5 w-3.5 text-accent" />
          <span>
            Mode: <span className="font-display text-foreground">{modeLabel}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">{label}</p>
      <p className="font-display text-lg mt-1">{value}</p>
    </div>
  );
}

/* ──────────────── MATCHES ──────────────── */

function MatchesTab({ tournament, matches, signups, mapPool, onChanged }: {
  tournament: Tournament; matches: MatchRow[]; signups: Signup[]; mapPool: MapPoolRow[]; onChanged: () => void;
}) {
  // Tournament matches use team_a_id / team_b_id which reference public.teams.
  // Signups are independent. Show what we have and let admin operate on score/map/winner.
  const activeMaps = (mapPool.filter((m) => m.is_active).map((m) => m.map_name));
  const usableMaps = activeMaps.length > 0 ? activeMaps : Array.from(DEFAULT_VALORANT_MAP_POOL);

  const setMap = async (id: string, map: string) => {
    const { error } = await supabase.from("matches").update({ map }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Map set");
    onChanged();
  };

  const setScore = async (id: string, m: MatchRow, score_a: number, score_b: number) => {
    const winner = score_a > score_b ? m.team_a_id : score_b > score_a ? m.team_b_id : null;
    const { error } = await supabase.rpc("admin_resolve_match" as never, { _match_id: id, _score_a: score_a, _score_b: score_b } as never);
    if (error) {
      // fallback direct update
      const { error: e2 } = await supabase.from("matches").update({ score_a, score_b, winner_id: winner, status: "completed", result_status: "admin_resolved", confirmed_at: new Date().toISOString() } as never).eq("id", id);
      if (e2) return toast.error(e2.message);
    }
    toast.success("Result saved");
    onChanged();
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Map veto is admin-manual for now: pick a map per match from the active pool. Scores update the bracket via the existing admin resolver.
      </p>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase font-display text-muted-foreground">
            <tr>
              <th className="text-left p-3">Round</th>
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Team A</th>
              <th className="text-left p-3">Team B</th>
              <th className="text-left p-3">Map</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No matches yet — generate the bracket first from Overview.</td></tr>
            ) : matches.map((m) => <MatchRow2 key={m.id} m={m} maps={usableMaps} onMap={setMap} onScore={setScore} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchRow2({ m, maps, onMap, onScore }: { m: MatchRow; maps: string[]; onMap: (id: string, map: string) => void; onScore: (id: string, m: MatchRow, a: number, b: number) => void }) {
  const [a, setA] = useState<string>(String(m.score_a ?? 0));
  const [b, setB] = useState<string>(String(m.score_b ?? 0));
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await onScore(m.id, m, Number(a) || 0, Number(b) || 0); }
    finally { setSaving(false); }
  };
  return (
    <tr className="border-t border-border">
      <td className="p-3">{m.round ?? "—"}</td>
      <td className="p-3">{m.bracket_position ?? "—"}</td>
      <td className="p-3 text-xs font-mono">{m.team_a_id ? m.team_a_id.slice(0,8) : "TBD"}</td>
      <td className="p-3 text-xs font-mono">{m.team_b_id ? m.team_b_id.slice(0,8) : "TBD"}</td>
      <td className="p-3">
        <Select value={m.map ?? ""} onValueChange={(v) => onMap(m.id, v)}>
          <SelectTrigger className="w-[140px] h-8"><SelectValue placeholder="Pick map" /></SelectTrigger>
          <SelectContent>{maps.map((mp) => <SelectItem key={mp} value={mp}>{mp}</SelectItem>)}</SelectContent>
        </Select>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          <Input className="w-14 h-8" type="number" value={a} onChange={(e) => setA(e.target.value)} />
          <span className="text-muted-foreground">:</span>
          <Input className="w-14 h-8" type="number" value={b} onChange={(e) => setB(e.target.value)} />
        </div>
      </td>
      <td className="p-3"><Badge variant="secondary" className="font-display">{m.status}</Badge></td>
      <td className="p-3 text-right">
        <Button size="sm" variant="outline" onClick={save} disabled={saving || !m.team_a_id || !m.team_b_id}>
          {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}Save Result
        </Button>
      </td>
    </tr>
  );
}

/* ──────────────── SIGNUP DETAIL DIALOG ──────────────── */

function SignupDetailDialog({ signup, onClose, onChanged }: { signup: Signup | null; onClose: () => void; onChanged: () => void }) {
  const [note, setNote] = useState("");
  useEffect(() => { setNote(signup?.admin_note ?? ""); }, [signup]);

  if (!signup) return null;

  const setStatus = async (status: string) => {
    const { error } = await supabase.from("tournament_team_signups" as never)
      .update({ status, ...(status === "checked_in" ? { checked_in_at: new Date().toISOString() } : {}) } as never)
      .eq("id", signup.id);
    if (error) return toast.error(error.message);
    toast.success(`Status: ${status}`);
    onChanged();
  };
  const saveNote = async () => {
    const { error } = await supabase.from("tournament_team_signups" as never).update({ admin_note: note } as never).eq("id", signup.id);
    if (error) return toast.error(error.message);
    toast.success("Note saved");
    onChanged();
  };
  const remove = async () => {
    if (!confirm("Delete this registration permanently?")) return;
    const { error } = await supabase.from("tournament_team_signups" as never).delete().eq("id", signup.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onClose();
    onChanged();
  };

  return (
    <Dialog open={!!signup} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {signup.team_tag ? <span className="text-muted-foreground mr-1">[{signup.team_tag}]</span> : null}{signup.team_name}
          </DialogTitle>
          <DialogDescription>{signup.community_name} · {signup.country_language}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <Block title="Captain">
            <KV k="Name" v={signup.captain_name} />
            <KV k="Discord" v={signup.captain_discord} />
            <KV k="Email" v={signup.captain_email} />
            <KV k="Riot ID" v={signup.captain_riot_id} />
          </Block>
          <Block title="Players">
            {[1,2,3,4,5].map((i) => <KV key={i} k={`Player ${i}`} v={(signup as never as Record<string,string>)[`player_${i}_riot_id`]} />)}
            {signup.substitute_1_riot_id && <KV k="Sub 1" v={signup.substitute_1_riot_id} />}
            {signup.substitute_2_riot_id && <KV k="Sub 2" v={signup.substitute_2_riot_id} />}
          </Block>
          <Block title="Confirmations">
            <KV k="Available" v={signup.agreement_available ? "✓" : "✗"} />
            <KV k="Discord" v={signup.agreement_discord ? "✓" : "✗"} />
            <KV k="Rules" v={signup.agreement_rules ? "✓" : "✗"} />
            <KV k="Forfeit" v={signup.agreement_forfeit ? "✓" : "✗"} />
          </Block>
          {(signup.wants_permanent_team || signup.permanent_team_request_note) && (
            <Block title="Permanent team interest">
              <KV k="Wants permanent team" v={signup.wants_permanent_team ? "Yes" : "No"} />
              {signup.permanent_team_request_note && <p className="text-muted-foreground text-xs mt-1">{signup.permanent_team_request_note}</p>}
            </Block>
          )}
          {signup.notes && <Block title="Captain notes"><p className="text-muted-foreground">{signup.notes}</p></Block>}

          <div className="space-y-2">
            <p className="text-xs font-display uppercase text-muted-foreground">Admin note (visible to captain)</p>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} />
            <Button size="sm" variant="outline" onClick={saveNote}>Save note</Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-display uppercase text-muted-foreground">Set status</p>
            <div className="flex flex-wrap gap-2">
              {SIGNUP_STATUSES.map((s) => (
                <Button key={s} size="sm" variant={signup.status === s ? "neon" : "outline"} onClick={() => setStatus(s)}>
                  {s === "champion" && <Trophy className="h-3 w-3 mr-1" />}{s}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="justify-between">
          <Button variant="ghost" className="text-destructive" onClick={remove}>Delete</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────── small helpers ──────────────── */

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[10px] uppercase font-display text-muted-foreground tracking-widest">{label}</p>
      <p className="text-xl font-display font-bold mt-1 truncate">{value}</p>
    </div>
  );
}
function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <p className="font-display uppercase tracking-wide text-sm">{title}</p>
      {children}
    </div>
  );
}
function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}
function FieldA({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
function DateTimeInput({ value, onChange }: { value: string | null | undefined; onChange: (v: string | null) => void }) {
  const local = value ? new Date(value).toISOString().slice(0, 16) : "";
  return (
    <Input
      type="datetime-local"
      value={local}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
    />
  );
}
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-display uppercase text-muted-foreground mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono text-xs text-right break-all">{v}</span>
    </div>
  );
}
