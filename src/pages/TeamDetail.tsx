import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RankBadge from "@/components/RankBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Users, Globe, Shield, Trophy, ChevronRight, UserPlus, Crown,
  Settings, Inbox, Pencil, Check, X, Loader2, LogOut, Trash2,
  Award, Swords,
} from "lucide-react";
import JoinTeamDialog from "@/components/teams/JoinTeamDialog";

interface TeamRow {
  id: string;
  name: string;
  tag: string;
  game: string;
  region: string | null;
  rank: string | null;
  description: string | null;
  avatar_url: string | null;
  trophies: number;
  looking_for_players: boolean;
  slots: number;
  color: string;
  owner_id: string;
}

interface MemberRow {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: { username: string; display_name: string | null; avatar_url: string | null } | null;
}

interface JoinReqRow {
  id: string;
  user_id: string;
  role: string | null;
  message: string | null;
  status: string;
  created_at: string;
  profile?: { username: string; display_name: string | null; avatar_url: string | null } | null;
}

export default function TeamDetailPage({ manageMode = false }: { manageMode?: boolean } = {}) {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState<TeamRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [requests, setRequests] = useState<JoinReqRow[]>([]);
  const [myRequest, setMyRequest] = useState<JoinReqRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(manageMode ? "manage" : "overview");
  const [joinOpen, setJoinOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editLfp, setEditLfp] = useState(true);
  const [editSlots, setEditSlots] = useState(2);
  const [savingEdit, setSavingEdit] = useState(false);

  const isCaptain = !!(user && team && user.id === team.owner_id);
  const isMember = !!(user && members.some((m) => m.user_id === user.id));
  const hasPending = !!(myRequest && myRequest.status === "pending");

  // Manage mode protection: if route is /manage but viewer is not captain, redirect to public view.
  useEffect(() => {
    if (!loading && manageMode && team && user && !isCaptain) {
      toast.error("Only the team captain can manage this team");
      navigate(`/teams/${team.id}`, { replace: true });
    }
  }, [loading, manageMode, team, user, isCaptain, navigate]);

  const load = async () => {
    if (!teamId) return;
    setLoading(true);
    const { data: t } = await supabase
      .from("teams")
      .select("id, name, tag, game, region, rank, description, avatar_url, trophies, looking_for_players, slots, color, owner_id")
      .eq("id", teamId)
      .maybeSingle();

    if (!t) { setTeam(null); setLoading(false); return; }
    setTeam(t as any);
    setEditName((t as any).name);
    setEditTag((t as any).tag);
    setEditDesc((t as any).description ?? "");
    setEditRegion((t as any).region ?? "");
    setEditLfp((t as any).looking_for_players);
    setEditSlots((t as any).slots ?? 2);

    const { data: ms } = await supabase
      .from("team_members")
      .select("id, user_id, role, joined_at")
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });
    const memberRows = (ms as any[]) ?? [];

    if (memberRows.length) {
      const ids = memberRows.map((m) => m.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      setMembers(memberRows.map((m) => ({ ...m, profile: map.get(m.user_id) ?? null })));
    } else {
      setMembers([]);
    }

    if (user) {
      const { data: mine } = await supabase
        .from("team_join_requests")
        .select("id, user_id, role, message, status, created_at")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setMyRequest((mine as any) ?? null);

      // captain loads all pending
      if ((t as any).owner_id === user.id) {
        const { data: reqs } = await supabase
          .from("team_join_requests")
          .select("id, user_id, role, message, status, created_at")
          .eq("team_id", teamId)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        const reqRows = (reqs as any[]) ?? [];
        if (reqRows.length) {
          const ids = reqRows.map((r) => r.user_id);
          const { data: profs } = await supabase
            .from("profiles").select("id, username, display_name, avatar_url").in("id", ids);
          const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
          setRequests(reqRows.map((r) => ({ ...r, profile: map.get(r.user_id) ?? null })));
        } else setRequests([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [teamId, user?.id]);

  const pendingCount = requests.length;

  const handleAccept = async (req: JoinReqRow) => {
    const { error } = await supabase
      .from("team_join_requests")
      .update({ status: "accepted" })
      .eq("id", req.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Application accepted");
    load();
  };

  const handleReject = async (req: JoinReqRow) => {
    const { error } = await supabase
      .from("team_join_requests")
      .update({ status: "rejected" })
      .eq("id", req.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Application rejected");
    load();
  };

  const handleRemoveMember = async (m: MemberRow) => {
    if (m.user_id === team?.owner_id) { toast.error("Cannot remove the captain"); return; }
    if (!confirm(`Remove ${m.profile?.username ?? "this member"} from the team?`)) return;
    const { error } = await supabase.from("team_members").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Member removed");
    load();
  };

  const handleLeave = async () => {
    if (!user || !team) return;
    if (!confirm("Leave this team?")) return;
    const { error } = await supabase
      .from("team_members").delete()
      .eq("team_id", team.id).eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    toast.success("You left the team");
    navigate("/teams");
  };

  const handleSaveEdit = async () => {
    if (!team) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("teams")
      .update({
        name: editName.trim(),
        tag: editTag.trim().toUpperCase().slice(0, 4),
        description: editDesc.trim() || null,
        region: editRegion.trim() || null,
        looking_for_players: editLfp,
        slots: editSlots,
      } as any)
      .eq("id", team.id);
    setSavingEdit(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Team updated");
    load();
  };

  const handleDeleteTeam = async () => {
    if (!team) return;
    if (!confirm(`Delete team ${team.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("teams").delete().eq("id", team.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Team deleted");
    navigate("/teams");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container pt-32 pb-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container pt-32 pb-16 text-center">
          <h1 className="text-2xl font-display">Team not found</h1>
          <Link to="/teams"><Button variant="neon" className="mt-4">Back to Teams</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={`${team.name} · PeakGG Team`} description={team.description ?? `${team.name} team profile on PeakGG`} />
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-body">
          <Link to="/teams" className="hover:text-foreground transition-colors">Teams</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{team.name}</span>
        </div>

        {/* Header card */}
        <div className="rounded-lg border border-border bg-card p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center font-display font-bold text-white text-2xl shrink-0"
              style={{ background: team.color }}
            >
              {team.tag}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-display font-bold">{team.name}</h1>
                <Badge variant="outline" className="font-display uppercase text-xs">{team.game}</Badge>
                {team.looking_for_players && (
                  <Badge variant="outline" className="border-success text-success font-display">Recruiting</Badge>
                )}
                {isCaptain && (
                  <Badge variant="outline" className="border-accent text-accent font-display gap-1">
                    <Crown className="h-3 w-3" /> Captain
                  </Badge>
                )}
                {!isCaptain && isMember && (
                  <Badge variant="outline" className="border-primary text-primary font-display">Member</Badge>
                )}
              </div>
              {team.description && (
                <p className="text-muted-foreground font-body mb-4 max-w-2xl">{team.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-body items-center">
                <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" />{team.region ?? "—"}</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{members.length} members</span>
                <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-accent" />{team.trophies}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              {!user && (
                <Link to="/login"><Button variant="neon" className="w-full">Login to apply</Button></Link>
              )}
              {user && isCaptain && (
                <>
                  {manageMode ? (
                    <Link to={`/teams/${team.id}`}>
                      <Button variant="neonOutline" className="w-full">
                        <Shield className="mr-2 h-4 w-4" />View Public Page
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/teams/${team.id}/manage`}>
                      <Button variant="neon" className="w-full">
                        <Settings className="mr-2 h-4 w-4" />Manage Team
                      </Button>
                    </Link>
                  )}
                  {pendingCount > 0 && (
                    <Button variant="neonOutline" onClick={() => setTab("applications")}>
                      <Inbox className="mr-2 h-4 w-4" />Applications ({pendingCount})
                    </Button>
                  )}
                </>
              )}
              {user && !isCaptain && isMember && (
                <Button variant="ghost" onClick={handleLeave}>
                  <LogOut className="mr-2 h-4 w-4" />Leave Team
                </Button>
              )}
              {user && !isCaptain && !isMember && hasPending && (
                <Badge variant="outline" className="font-display py-2 px-3 justify-center">Application pending</Badge>
              )}
              {user && !isCaptain && !isMember && !hasPending && team.looking_for_players && (
                <Button variant="neon" onClick={() => setJoinOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />Apply to Team
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <TabsList className="mb-6 inline-flex">
              <TabsTrigger value="overview"><Shield className="h-4 w-4 mr-1" />Overview</TabsTrigger>
              <TabsTrigger value="roster"><Users className="h-4 w-4 mr-1" />Roster</TabsTrigger>
              <TabsTrigger value="recruitment"><UserPlus className="h-4 w-4 mr-1" />Recruitment</TabsTrigger>
              <TabsTrigger value="achievements"><Award className="h-4 w-4 mr-1" />Achievements</TabsTrigger>
              <TabsTrigger value="scrims"><Swords className="h-4 w-4 mr-1" />Scrims</TabsTrigger>
              {isCaptain && <TabsTrigger value="applications"><Inbox className="h-4 w-4 mr-1" />Applications {pendingCount > 0 && <Badge className="ml-2">{pendingCount}</Badge>}</TabsTrigger>}
              {isCaptain && <TabsTrigger value="manage"><Settings className="h-4 w-4 mr-1" />Manage</TabsTrigger>}
            </TabsList>
          </div>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Members" value={members.length} />
              <StatCard label="Trophies" value={team.trophies} />
              <StatCard label="Open slots" value={Math.max(0, team.slots)} />
              <StatCard label="Region" value={team.region ?? "—"} />
              <StatCard label="Avg rank" value={team.rank ?? "—"} />
            </div>
          </TabsContent>

          {/* RECRUITMENT (public) */}
          <TabsContent value="recruitment">
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <Badge variant="outline" className={`font-display ${team.looking_for_players ? "border-success text-success" : "border-muted text-muted-foreground"}`}>
                {team.looking_for_players ? "Open recruitment" : "Recruitment closed"}
              </Badge>
              <p className="text-sm text-muted-foreground font-body mt-3 max-w-md mx-auto">
                {team.looking_for_players
                  ? `${team.name} is currently recruiting. ${Math.max(0, team.slots)} open slot${team.slots === 1 ? "" : "s"}.`
                  : `${team.name} is not currently looking for new players.`}
              </p>
              {!isCaptain && !isMember && team.looking_for_players && user && (
                <Button variant="neon" className="mt-4" onClick={() => setJoinOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />Apply to Team
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ACHIEVEMENTS (public) */}
          <TabsContent value="achievements">
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Award className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg uppercase">No achievements yet</h3>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Trophies won in tournaments and seasons will appear here.
              </p>
            </div>
          </TabsContent>

          {/* SCRIMS (public) */}
          <TabsContent value="scrims">
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Swords className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg uppercase">No scrims posted yet</h3>
              <p className="text-sm text-muted-foreground font-body mt-1 mb-4">
                When this team posts scrims, you'll find them here.
              </p>
              <Link to="/scrims"><Button variant="neonOutline">Find Scrims</Button></Link>
            </div>
          </TabsContent>

          {/* ROSTER */}
          <TabsContent value="roster">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="space-y-3">
                {members.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 font-body">No members yet.</div>
                )}
                {members.length === 1 && isCaptain && (
                  <div className="text-center py-6 font-body border-b border-border mb-3">
                    <h3 className="font-display font-bold text-base uppercase">Your squad is just getting started</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">Invite players to fill your roster.</p>
                    <Link to="/free-agents"><Button variant="neonOutline" size="sm"><UserPlus className="h-4 w-4 mr-1.5" />Invite Players</Button></Link>
                  </div>
                )}
                {members.map((m) => {
                  const captain = m.user_id === team.owner_id;
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded border border-border bg-secondary/30 p-4">
                      <Link to={`/profile/${m.profile?.username ?? m.user_id}`} className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={m.profile?.avatar_url ?? undefined} />
                          <AvatarFallback>{(m.profile?.username ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-semibold truncate">{m.profile?.display_name ?? m.profile?.username ?? "Player"}</span>
                            {captain && <Badge variant="outline" className="border-accent text-accent text-xs font-display gap-1"><Crown className="h-3 w-3" />Captain</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground font-body">{m.role}</span>
                        </div>
                      </Link>
                      {isCaptain && !captain && (
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(m)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* APPLICATIONS */}
          {isCaptain && (
            <TabsContent value="applications">
              <div className="rounded-lg border border-border bg-card p-6">
                {requests.length === 0 ? (
                  <div className="text-center py-10 font-body">
                    <Inbox className="h-10 w-10 text-primary mx-auto mb-3" />
                    <h3 className="font-display font-bold text-lg uppercase">No applications yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Open recruitment or browse Free Agents.</p>
                    <Link to="/free-agents"><Button variant="neonOutline">Browse Free Agents</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((r) => (
                      <div key={r.id} className="rounded border border-border bg-secondary/30 p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <Link to={`/profile/${r.profile?.username ?? r.user_id}`} className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={r.profile?.avatar_url ?? undefined} />
                              <AvatarFallback>{(r.profile?.username ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-display font-semibold">{r.profile?.display_name ?? r.profile?.username}</div>
                              <div className="text-xs text-muted-foreground">Role: {r.role ?? "—"}</div>
                            </div>
                          </Link>
                          <div className="flex gap-2">
                            <Button size="sm" variant="neon" onClick={() => handleAccept(r)}><Check className="h-4 w-4 mr-1" />Accept</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleReject(r)}><X className="h-4 w-4 mr-1" />Reject</Button>
                          </div>
                        </div>
                        {r.message && (
                          <p className="text-sm text-muted-foreground font-body mt-3 border-t border-border pt-3">{r.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* MANAGE */}
          {isCaptain && (
            <TabsContent value="manage">
              <div className="rounded-lg border border-border bg-card p-6 space-y-5 max-w-2xl">
                <h3 className="font-display text-lg flex items-center gap-2"><Pencil className="h-4 w-4" />Edit Team</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="font-display text-xs uppercase">Name</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={50} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-display text-xs uppercase">Tag</Label>
                    <Input value={editTag} onChange={(e) => setEditTag(e.target.value.toUpperCase())} maxLength={4} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-display text-xs uppercase">Region</Label>
                  <Input value={editRegion} onChange={(e) => setEditRegion(e.target.value)} maxLength={20} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-display text-xs uppercase">Description</Label>
                  <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} maxLength={500} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm font-body">
                    <input type="checkbox" checked={editLfp} onChange={(e) => setEditLfp(e.target.checked)} />
                    Recruiting
                  </label>
                  <div className="space-y-1.5">
                    <Label className="font-display text-xs uppercase">Open slots</Label>
                    <Input type="number" min={0} max={10} value={editSlots} onChange={(e) => setEditSlots(parseInt(e.target.value || "0", 10))} />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="neon" onClick={handleSaveEdit} disabled={savingEdit}>
                    {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                  </Button>
                  <Button variant="ghost" onClick={handleDeleteTeam} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />Delete Team
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <JoinTeamDialog open={joinOpen} onOpenChange={setJoinOpen} team={team ? { id: team.id, name: team.name, game: team.game } : null} />
      <Footer />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-display font-bold">{value}</div>
    </div>
  );
}
