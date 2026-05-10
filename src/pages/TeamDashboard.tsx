import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Crown, Users, Trophy, Calendar, ShieldCheck, MessageSquare, Settings, FileText, Inbox, Mountain, Check, X, Trash2, Swords } from "lucide-react";
import { competitiveQueues } from "@/lib/feature-flags";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import StatusPill from "@/components/leagues/StatusPill";
import MatchCard, { MatchCardData } from "@/components/leagues/MatchCard";
import TeamChatPanel from "@/components/team-dashboard/TeamChatPanel";
import TeamLogo from "@/components/teams/TeamLogo";

interface Team {
  id: string; name: string; tag: string; game: string; description: string | null;
  avatar_url: string | null; color: string; owner_id: string; trophies: number;
  region: string | null; looking_for_players: boolean; slots: number;
}
interface Member {
  id: string; user_id: string; role: string;
  profile?: { username: string; display_name: string | null; avatar_url: string | null } | null;
}
interface JoinReq {
  id: string; user_id: string; role: string | null; message: string | null; status: string; created_at: string;
  profile?: { username: string; avatar_url: string | null } | null;
}
interface Note {
  id: string; title: string; body: string | null; visibility: string; author_id: string; match_id: string | null; created_at: string;
}

export default function TeamDashboard() {
  const { teamId: paramId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useUserRoles();

  const [teamId, setTeamId] = useState<string | null>(paramId ?? null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<JoinReq[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [matches, setMatches] = useState<MatchCardData[]>([]);
  const [season, setSeason] = useState<any | null>(null);
  const [standing, setStanding] = useState<any | null>(null);
  const [registration, setRegistration] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-resolve teamId for /team-dashboard route
  useEffect(() => {
    if (paramId || !user || authLoading) return;
    (async () => {
      const { data } = await supabase.from("teams").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
      if (data?.id) setTeamId(data.id);
      else {
        // fallback: any team membership
        const { data: tm } = await supabase.from("team_members").select("team_id").eq("user_id", user.id).limit(1).maybeSingle();
        if (tm?.team_id) setTeamId(tm.team_id);
        else { toast.error("You don't belong to any team yet"); navigate("/teams"); }
      }
    })();
  }, [paramId, user, authLoading, navigate]);

  const isCaptain = !!(user && team && team.owner_id === user.id);
  const isMember = !!(user && (isCaptain || members.some((m) => m.user_id === user.id)));
  const myRole = members.find((m) => m.user_id === user?.id)?.role ?? (isCaptain ? "Captain" : null);
  const isCoach = myRole?.toLowerCase() === "coach" || isCaptain;

  const load = async () => {
    if (!teamId) return;
    setLoading(true);
    const { data: t } = await supabase
      .from("teams")
      .select("id, name, tag, game, description, avatar_url, color, owner_id, trophies, region, looking_for_players, slots")
      .eq("id", teamId).maybeSingle();
    if (!t) { setTeam(null); setLoading(false); return; }
    setTeam(t as Team);

    const { data: ms } = await supabase
      .from("team_members").select("id, user_id, role").eq("team_id", teamId).order("joined_at", { ascending: true });
    const memRows = (ms as any[]) ?? [];
    if (memRows.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", memRows.map((m) => m.user_id));
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      setMembers(memRows.map((m) => ({ ...m, profile: map.get(m.user_id) ?? null })));
    } else setMembers([]);

    // Pending applications (captain only sees them; query is fine since RLS may filter)
    const { data: reqs } = await supabase
      .from("team_join_requests").select("id, user_id, role, message, status, created_at")
      .eq("team_id", teamId).eq("status", "pending").order("created_at", { ascending: false });
    const reqRows = (reqs as any[]) ?? [];
    if (reqRows.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url").in("id", reqRows.map((r) => r.user_id));
      const m = new Map((profs ?? []).map((p: any) => [p.id, p]));
      setRequests(reqRows.map((r) => ({ ...r, profile: m.get(r.user_id) ?? null })));
    } else setRequests([]);

    const { data: ns } = await supabase
      .from("coach_notes").select("id, title, body, visibility, author_id, match_id, created_at")
      .eq("team_id", teamId).order("created_at", { ascending: false });
    setNotes((ns as Note[]) ?? []);

    // Matches (last 20 + all upcoming for this team)
    const { data: mts } = await supabase
      .from("matches")
      .select("id, matchday, scheduled_at, team_a_id, team_b_id, score_a, score_b, result_status, map, game")
      .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
      .order("scheduled_at", { ascending: false })
      .limit(40);
    const mt = (mts as any[]) ?? [];
    if (mt.length) {
      const oppIds = [...new Set(mt.flatMap((m) => [m.team_a_id, m.team_b_id]).filter(Boolean))];
      const { data: ts } = await supabase.from("teams").select("id, name, tag, avatar_url, owner_id").in("id", oppIds);
      const tMap = Object.fromEntries((ts ?? []).map((x: any) => [x.id, x]));
      setMatches(mt.map((m) => ({
        id: m.id, matchday: m.matchday, scheduled_at: m.scheduled_at,
        team_a: tMap[m.team_a_id] ?? null, team_b: tMap[m.team_b_id] ?? null,
        score_a: m.score_a, score_b: m.score_b, result_status: m.result_status ?? "scheduled",
        map: m.map, game: m.game,
      })));
    } else setMatches([]);

    // League registration / standing (latest)
    const { data: regs } = await supabase
      .from("league_registrations").select("id, season_id, division_id, status, created_at")
      .eq("team_id", teamId).order("created_at", { ascending: false }).limit(1);
    const reg = regs?.[0] ?? null;
    setRegistration(reg);
    if (reg) {
      const { data: s } = await supabase.from("league_seasons").select("id, name, status, league_id, playoff_size").eq("id", reg.season_id).maybeSingle();
      setSeason(s);
      if (reg.division_id) {
        const { data: st } = await supabase.from("league_standings").select("*").eq("division_id", reg.division_id).eq("team_id", teamId).maybeSingle();
        setStanding(st);
      }
    } else { setSeason(null); setStanding(null); }

    setLoading(false);
  };

  useEffect(() => { if (teamId) load(); /* eslint-disable-next-line */ }, [teamId]);

  const upcoming = useMemo(() => matches.filter((m) => m.result_status === "scheduled" || m.result_status === "live"), [matches]);
  const past = useMemo(() => matches.filter((m) => ["confirmed", "admin_resolved"].includes(m.result_status)), [matches]);
  const pending = useMemo(() => matches.filter((m) => m.result_status === "pending_confirmation"), [matches]);
  const disputed = useMemo(() => matches.filter((m) => m.result_status === "disputed"), [matches]);

  const winLoss = useMemo(() => {
    let w = 0, l = 0;
    past.forEach((m) => {
      const isA = m.team_a?.id === teamId;
      const myScore = isA ? (m.score_a ?? 0) : (m.score_b ?? 0);
      const opp = isA ? (m.score_b ?? 0) : (m.score_a ?? 0);
      if (myScore > opp) w++; else if (myScore < opp) l++;
    });
    return { w, l };
  }, [past, teamId]);

  if (loading || !team) {
    return (
      <div className="min-h-screen bg-background"><Navbar /><div className="container py-10"><Skeleton className="h-64" /></div></div>
    );
  }

  if (!isMember && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-20 text-center">
          <h1 className="font-display text-3xl uppercase">Access restricted</h1>
          <p className="text-muted-foreground mt-2">You don't have access to this team dashboard.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(`/teams/${team.id}`)}>View public page</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={`${team.name} — Team Dashboard | PeakGG`} description="Operational HQ for your team" />
      <Navbar />
      <main className="flex-1 container py-6">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => navigate(`/teams/${team.id}`)}>
          <ChevronLeft className="h-4 w-4" /> Public team page
        </Button>

        <div className="text-[10px] font-display uppercase tracking-[0.25em] text-primary/80 mb-2">Team Dashboard · Internal HQ</div>
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <TeamLogo name={team.name} tag={team.tag} avatarUrl={team.avatar_url} color={team.color} size={64} rounded="lg" />
            <div className="flex-1">
              <h1 className="font-display font-bold text-3xl uppercase">{team.name}</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">{team.game} · {team.region ?? "—"}</p>
              {team.description && <p className="text-sm mt-2 max-w-2xl">{team.description}</p>}
            </div>
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <div className="flex gap-4 text-center md:justify-end">
                <div><div className="font-display text-2xl">{members.length}</div><div className="text-xs text-muted-foreground">Roster</div></div>
                {team.trophies > 0 && (
                  <div><div className="font-display text-2xl">{team.trophies}</div><div className="text-xs text-muted-foreground">Trophies</div></div>
                )}
                {(winLoss.w + winLoss.l) > 0 && (
                  <div><div className="font-display text-2xl">{winLoss.w}-{winLoss.l}</div><div className="text-xs text-muted-foreground">W-L</div></div>
                )}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/teams/${team.id}`}>View public page</Link>
              </Button>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="overview">
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="inline-flex h-auto flex-wrap">
              <TabsTrigger value="overview"><Mountain className="h-4 w-4 mr-1" />Overview</TabsTrigger>
              <TabsTrigger value="roster"><Users className="h-4 w-4 mr-1" />Roster</TabsTrigger>
              <TabsTrigger value="league"><Trophy className="h-4 w-4 mr-1" />League</TabsTrigger>
              <TabsTrigger value="matches"><Calendar className="h-4 w-4 mr-1" />Matches</TabsTrigger>
              {isCaptain && <TabsTrigger value="applications"><Inbox className="h-4 w-4 mr-1" />Applications {requests.length > 0 && <span className="ml-1 text-primary">({requests.length})</span>}</TabsTrigger>}
              <TabsTrigger value="notes"><FileText className="h-4 w-4 mr-1" />Coach Notes</TabsTrigger>
              <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-1" />Team Chat</TabsTrigger>
              {isCaptain && <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" />Settings</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6 grid lg:grid-cols-3 gap-4">
            <Card className="p-5">
              <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-3">League standing</h3>
              {standing ? (
                <div>
                  <div className="font-display text-4xl">#{standing.position ?? "-"}</div>
                  <p className="text-sm text-muted-foreground mt-1">{season?.name}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center text-sm">
                    <div><div className="font-display text-lg">{standing.points}</div><div className="text-xs text-muted-foreground">Points</div></div>
                    <div><div className="font-display text-lg">{standing.wins}-{standing.draws}-{standing.losses}</div><div className="text-xs text-muted-foreground">W-D-L</div></div>
                    <div><div className="font-display text-lg">{standing.round_diff > 0 ? "+" : ""}{standing.round_diff}</div><div className="text-xs text-muted-foreground">RD</div></div>
                  </div>
                  {season && (standing.position ?? 99) <= (season.playoff_size ?? 4) && (
                    <div className="mt-3 text-xs text-success font-display uppercase">✓ Playoff qualified</div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Not registered for any league yet.</p>
                  <Button asChild size="sm" variant="outline" className="mt-3"><Link to="/leagues">View Peak League</Link></Button>
                </div>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-3">Next match</h3>
              {upcoming[upcoming.length - 1] ? (
                <MatchCard m={upcoming[upcoming.length - 1]} />
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">No matches scheduled yet.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button asChild size="sm" variant="outline"><Link to="/tournaments">View Tournaments</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link to="/leagues">View Peak League</Link></Button>
                  </div>
                </div>
              )}
            </Card>
            <Card className="p-5">
                  <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-3">Queue with team</h3>
                  {competitiveQueues.open_cup.allowFullTeam || competitiveQueues.open_cup.allowParty ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Queue your full or partial roster — missing slots are auto-filled.</p>
                      <Button size="sm" variant="neon" disabled={!isCaptain}>
                        <Swords className="h-4 w-4 mr-1" /> Queue Team
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Currently the public queue runs at {competitiveQueues.open_cup.teamSize}v{competitiveQueues.open_cup.teamSize}.
                      </p>
                      <Button size="sm" variant="outline" disabled className="opacity-70 cursor-not-allowed">
                        <Swords className="h-4 w-4 mr-1" /> Queue Team — opens with 5v5 beta
                      </Button>
                    </div>
                  )}
                </Card>
            <Card className="p-5">
              <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-3">Recent results</h3>
              {past.slice(0, 3).length === 0 ? (
                <div>
                  <p className="text-sm text-muted-foreground">No completed matches yet.</p>
                  <Button asChild size="sm" variant="outline" className="mt-3"><Link to="/tournaments">View Tournaments</Link></Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {past.slice(0, 3).map((m) => {
                    const isA = m.team_a?.id === teamId;
                    const myScore = isA ? (m.score_a ?? 0) : (m.score_b ?? 0);
                    const opp = isA ? (m.score_b ?? 0) : (m.score_a ?? 0);
                    const oppName = (isA ? m.team_b : m.team_a)?.name ?? "TBD";
                    const won = myScore > opp;
                    return (
                      <Link key={m.id} to={`/matches/${m.id}`} className="flex items-center justify-between text-sm hover:text-primary">
                        <span className="truncate">vs {oppName}</span>
                        <span className={`font-display ${won ? "text-success" : "text-destructive"}`}>{myScore}-{opp}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="roster" className="mt-6">
            <Card className="p-4">
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border border-border rounded p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {m.profile?.avatar_url ? <img src={m.profile.avatar_url} className="w-10 h-10 rounded object-cover" alt="" /> : <div className="w-10 h-10 rounded bg-muted" />}
                      <div className="min-w-0">
                        <div className="font-display uppercase truncate">{m.profile?.display_name ?? m.profile?.username}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {m.user_id === team.owner_id && <span className="text-accent flex items-center gap-1"><Crown className="h-3 w-3" /> Captain</span>}
                          <span>{m.role}</span>
                        </div>
                      </div>
                    </div>
                    {isCaptain && m.user_id !== team.owner_id && (
                      <div className="flex items-center gap-2">
                        <RoleSelector member={m} onChange={load} />
                        <Button size="sm" variant="ghost" onClick={async () => {
                          if (!confirm("Remove from team?")) return;
                          const { error } = await supabase.from("team_members").delete().eq("id", m.id);
                          if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
                        }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="league" className="mt-6 space-y-4">
            {!registration ? (
              <Card className="p-6 text-center">
                <p className="font-display uppercase mb-3">Not registered for any league.</p>
                <Button asChild><Link to="/leagues">Browse leagues</Link></Button>
              </Card>
            ) : (
              <Card className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <h3 className="font-display uppercase">{season?.name ?? "Season"}</h3>
                    <p className="text-xs text-muted-foreground">Registration {registration.status}</p>
                  </div>
                  <StatusPill status={registration.status} />
                </div>
                {standing && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                    <Stat label="Position" value={`#${standing.position ?? "-"}`} />
                    <Stat label="Points" value={standing.points} />
                    <Stat label="Played" value={standing.played} />
                    <Stat label="W-D-L" value={`${standing.wins}-${standing.draws}-${standing.losses}`} />
                    <Stat label="Round Diff" value={standing.round_diff > 0 ? `+${standing.round_diff}` : standing.round_diff} />
                  </div>
                )}
                {season && (
                  <Button asChild variant="outline" className="mt-4"><Link to={`/leagues/${season.league_id}`}>View league page</Link></Button>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="matches" className="mt-6 space-y-6">
            <Section title="Upcoming" items={upcoming} empty="No upcoming matches." />
            <Section title="Pending confirmations" items={pending} empty="None." />
            <Section title="Disputed" items={disputed} empty="None." />
            <Section title="Past results" items={past} empty="No past results." />
          </TabsContent>

          {isCaptain && (
            <TabsContent value="applications" className="mt-6">
              <Card className="p-4">
                {requests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No pending applications.</p>
                ) : requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border border-border rounded p-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {r.profile?.avatar_url ? <img src={r.profile.avatar_url} className="w-9 h-9 rounded" alt="" /> : <div className="w-9 h-9 rounded bg-muted" />}
                      <div className="min-w-0">
                        <div className="font-display uppercase truncate">{r.profile?.username}</div>
                        {r.message && <p className="text-xs text-muted-foreground truncate">{r.message}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        const { error } = await supabase.from("team_join_requests").update({ status: "accepted" }).eq("id", r.id);
                        if (error) toast.error(error.message); else { toast.success("Accepted"); load(); }
                      }}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        const { error } = await supabase.from("team_join_requests").update({ status: "rejected" }).eq("id", r.id);
                        if (error) toast.error(error.message); else { toast.success("Rejected"); load(); }
                      }}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </Card>
            </TabsContent>
          )}

          <TabsContent value="notes" className="mt-6">
            <CoachNotesPanel teamId={team.id} notes={notes} canWrite={isMember} canDelete={isCoach} reload={load} userId={user?.id ?? ""} />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <TeamChatPanel teamId={team.id} isCaptain={isCaptain} />
          </TabsContent>

          {isCaptain && (
            <TabsContent value="settings" className="mt-6">
              <SettingsPanel team={team} reload={load} />
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="border border-border rounded p-3">
      <div className="font-display text-xl">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Section({ title, items, empty }: { title: string; items: MatchCardData[]; empty: string }) {
  if (items.length === 0) return (
    <div>
      <h3 className="font-display uppercase tracking-widest text-xs text-muted-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{empty}</p>
    </div>
  );
  return (
    <div>
      <h3 className="font-display uppercase tracking-widest text-xs text-muted-foreground mb-2">{title}</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((m) => <MatchCard key={m.id} m={m} />)}
      </div>
    </div>
  );
}

function RoleSelector({ member, onChange }: { member: Member; onChange: () => void }) {
  return (
    <Select value={member.role} onValueChange={async (v) => {
      const { error } = await supabase.from("team_members").update({ role: v }).eq("id", member.id);
      if (error) toast.error(error.message); else { toast.success("Role updated"); onChange(); }
    }}>
      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="Member">Member</SelectItem>
        <SelectItem value="Coach">Coach</SelectItem>
        <SelectItem value="Substitute">Substitute</SelectItem>
        <SelectItem value="IGL">IGL</SelectItem>
      </SelectContent>
    </Select>
  );
}

function CoachNotesPanel({ teamId, notes, canWrite, canDelete, reload, userId }: { teamId: string; notes: Note[]; canWrite: boolean; canDelete: boolean; reload: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState("team");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim()) return toast.error("Title required");
    setBusy(true);
    const { error } = await supabase.from("coach_notes").insert({
      team_id: teamId, author_id: userId, title: title.trim(), body: body.trim() || null, visibility,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setTitle(""); setBody(""); reload();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-4 space-y-3 h-fit">
        <h3 className="font-display uppercase text-sm">New note</h3>
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        <Textarea placeholder="Body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="team">Whole team</SelectItem>
            <SelectItem value="captains_only">Captains only</SelectItem>
            <SelectItem value="coaches_only">Coaches only</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={create} disabled={busy || !canWrite}>Add note</Button>
      </Card>
      <Card className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No notes yet.</p>
        ) : notes.map((n) => (
          <div key={n.id} className="border border-border rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-display uppercase text-sm">{n.title}</h4>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.visibility.replace("_", " ")}</span>
            </div>
            {n.body && <p className="text-sm text-muted-foreground whitespace-pre-line">{n.body}</p>}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
              {(canDelete || n.author_id === userId) && (
                <button onClick={async () => {
                  if (!confirm("Delete note?")) return;
                  const { error } = await supabase.from("coach_notes").delete().eq("id", n.id);
                  if (error) toast.error(error.message); else { toast.success("Deleted"); reload(); }
                }} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function SettingsPanel({ team, reload }: { team: Team; reload: () => void }) {
  const [name, setName] = useState(team.name);
  const [tag, setTag] = useState(team.tag);
  const [desc, setDesc] = useState(team.description ?? "");
  const [region, setRegion] = useState(team.region ?? "");
  const [game, setGame] = useState(team.game);
  const [avatar, setAvatar] = useState(team.avatar_url ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("teams").update({
      name: name.trim(), tag: tag.trim().toUpperCase().slice(0, 4),
      description: desc.trim() || null, region: region.trim() || null,
      game, avatar_url: avatar.trim() || null,
    }).eq("id", team.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Team settings saved"); reload();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2 space-y-4">
        <div>
          <h3 className="font-display uppercase text-lg">Team identity</h3>
          <p className="text-xs text-muted-foreground mt-1">Edit how your team appears across PeakGG.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} /></div>
          <div className="space-y-1.5"><Label>Tag</Label><Input value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={4} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Region</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="EU West" maxLength={20} /></div>
          <div className="space-y-1.5">
            <Label>Main game</Label>
            <Select value={game} onValueChange={setGame}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="valorant">Valorant</SelectItem>
                <SelectItem value="cs2">CS2</SelectItem>
                <SelectItem value="r6s">R6 Siege</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} placeholder="Describe your team, goals and what kind of players you are looking for." />
          <p className="text-[11px] text-muted-foreground text-right">{desc.length}/500</p>
        </div>
        <div className="space-y-1.5">
          <Label>Logo URL</Label>
          <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          <p className="text-[11px] text-muted-foreground">Paste a public image URL. Square images work best.</p>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={busy}><ShieldCheck className="h-4 w-4 mr-1.5" /> {busy ? "Saving…" : "Save settings"}</Button>
        </div>
      </Card>
      <Card className="p-6 space-y-4 h-fit">
        <div className="text-xs font-display uppercase tracking-wider text-muted-foreground">Public preview</div>
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <TeamLogo name={name} tag={tag} avatarUrl={avatar || team.avatar_url} color={team.color} size={56} rounded="lg" />
            <div className="min-w-0">
              <div className="font-display font-bold truncate uppercase">{name || team.name}</div>
              <div className="text-[11px] text-muted-foreground uppercase">{game} · {region || "—"}</div>
            </div>
          </div>
          {desc ? (
            <p className="text-xs text-muted-foreground line-clamp-4">{desc}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">Add a description so players know what you're about.</p>
          )}
        </div>
      </Card>
    </div>
  );
}