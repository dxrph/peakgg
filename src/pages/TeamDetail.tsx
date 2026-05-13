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
  Loader2, LogOut, Award, Swords, LayoutDashboard, MessageCircle, Sparkles,
} from "lucide-react";
import { DISCORD_INVITE } from "@/lib/links";
import JoinTeamDialog from "@/components/teams/JoinTeamDialog";
import TeamLogo from "@/components/teams/TeamLogo";
import CommunityCupHistory from "@/components/community-cup/CommunityCupHistory";

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
  is_founding?: boolean;
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

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState<TeamRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [requests, setRequests] = useState<JoinReqRow[]>([]);
  const [myRequest, setMyRequest] = useState<JoinReqRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [joinOpen, setJoinOpen] = useState(false);
  const [conflictTeam, setConflictTeam] = useState<{ id: string; name: string } | null>(null);

  const isCaptain = !!(user && team && user.id === team.owner_id);
  const isMember = !!(user && members.some((m) => m.user_id === user.id));
  const hasPending = !!(myRequest && myRequest.status === "pending");

  const load = async () => {
    if (!teamId) return;
    setLoading(true);
    const { data: t } = await supabase
      .from("teams")
      .select("id, name, tag, game, region, rank, description, avatar_url, trophies, looking_for_players, slots, color, owner_id, is_founding")
      .eq("id", teamId)
      .maybeSingle();

    if (!t) { setTeam(null); setLoading(false); return; }
    setTeam(t as any);

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

      // Detect existing team for the same game (one-team-per-game rule)
      const { data: myTeams } = await supabase
        .from("team_members")
        .select("team_id, teams!inner(id, name, game, is_demo)")
        .eq("user_id", user.id);
      const conflict = (myTeams ?? []).find(
        (r: any) =>
          r.teams &&
          r.teams.is_demo === false &&
          r.teams.game === (t as any).game &&
          r.team_id !== (t as any).id,
      );
      setConflictTeam(conflict ? { id: (conflict as any).teams.id, name: (conflict as any).teams.name } : null);

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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO title={`${team.name} · PeakGG Team`} description={team.description ?? `${team.name} team profile on PeakGG`} />
      <Navbar />
      <main className="flex-1 container pt-24 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-body">
          <Link to="/teams" className="hover:text-foreground transition-colors">Teams</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{team.name}</span>
        </div>

        {/* Header card */}
        <div className="rounded-lg border border-border bg-card p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <TeamLogo name={team.name} tag={team.tag} avatarUrl={team.avatar_url} color={team.color} size={80} rounded="xl" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-display font-bold">{team.name}</h1>
                <Badge variant="outline" className="font-display uppercase text-xs">{team.game}</Badge>
                {team.is_founding && (
                  <Badge variant="outline" className="border-accent text-accent font-display gap-1">
                    <Sparkles className="h-3 w-3" /> Founding Team
                  </Badge>
                )}
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
                {team.trophies > 0 && (
                  <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-accent" />{team.trophies}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              {!user && (
                <Button asChild variant="neon" className="w-full"><Link to="/login">Login to apply</Link></Button>
              )}
              {user && isCaptain && (
                <Button asChild variant="neon" className="w-full">
                  <Link to={`/teams/${team.id}/dashboard`}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />Open Team Dashboard
                  </Link>
                </Button>
              )}
              {user && !isCaptain && isMember && (
                <>
                  <Button asChild variant="neonOutline" className="w-full">
                    <Link to={`/teams/${team.id}/dashboard`}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />Open Team Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={handleLeave}>
                    <LogOut className="mr-2 h-4 w-4" />Leave Team
                  </Button>
                </>
              )}
              {user && !isCaptain && !isMember && hasPending && (
                <Badge variant="outline" className="font-display py-2 px-3 justify-center">Application pending</Badge>
              )}
              {user && !isCaptain && !isMember && !hasPending && conflictTeam && (
                <div className="rounded-md border border-accent/40 bg-accent/5 p-3 text-xs font-body text-foreground/90">
                  You're already in a {team.game} team: <span className="font-display uppercase text-accent">{conflictTeam.name}</span>.
                  <Button asChild variant="neonOutline" size="sm" className="mt-2 w-full">
                    <Link to={`/teams/${conflictTeam.id}`}>View My Team</Link>
                  </Button>
                </div>
              )}
              {user && !isCaptain && !isMember && !hasPending && !conflictTeam && team.looking_for_players && (
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
              <TabsTrigger value="scrims"><Swords className="h-4 w-4 mr-1" />Matches</TabsTrigger>
            </TabsList>
          </div>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Members" value={members.length} />
              {team.trophies > 0 && <StatCard label="Trophies" value={team.trophies} />}
              {team.looking_for_players && team.slots > 0 && (
                <StatCard label="Open slots" value={Math.min(Math.max(0, team.slots), 5)} />
              )}
              <StatCard label="Region" value={team.region ?? "—"} />
              {team.rank && <StatCard label="Avg rank" value={team.rank} />}
            </div>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <h3 className="font-display uppercase tracking-wider text-sm">League Status</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {team.is_founding
                    ? "Founding team for Peak League Season 0 Beta. Standings will appear once the season starts."
                    : "Not currently registered to a Peak League season."}
                </p>
                <Button asChild variant="neonOutline" size="sm" className="mt-3">
                  <Link to="/leagues">View Peak League</Link>
                </Button>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-accent" />
                  <h3 className="font-display uppercase tracking-wider text-sm">Reputation</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Reputation will be built through official matches, fair play and activity.
                </p>
              </div>
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
                  ? team.is_founding
                    ? `${team.name} is recruiting players for Season 0 Beta. Apply to join this roster.`
                    : `${team.name} is looking for competitive players. Apply to join this roster.`
                  : `Recruitment is currently closed for ${team.name}.`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {!isCaptain && !isMember && team.looking_for_players && user && (
                  <Button variant="neon" onClick={() => setJoinOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />Apply to Team
                  </Button>
                )}
                <Button asChild variant="neonOutline">
                  <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />Join Discord
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ACHIEVEMENTS (public) */}
          <TabsContent value="achievements">
            <div className="rounded-lg border border-border bg-card p-8">
              {team.is_founding ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-accent/10 border border-accent/40 flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-accent" />
                  </div>
                  <div>
                    <div className="font-display font-bold uppercase">Founding Team</div>
                    <div className="text-xs text-muted-foreground">Awarded for joining Peak League Season 0 Beta as a founding roster.</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Award className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-display font-bold text-lg uppercase">No achievements yet</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Achievements will appear after official matches and events.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* MATCHES (public) */}
          <TabsContent value="scrims">
            <div className="rounded-lg border border-border bg-card p-10 text-center">
              <Swords className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg uppercase">No public matches yet</h3>
              <p className="text-sm text-muted-foreground font-body mt-1 mb-4">
                Match history will appear once {team.name} plays its first official match.
              </p>
              <Link to="/leagues"><Button variant="neonOutline">View Peak League</Button></Link>
            </div>
            <div className="mt-6">
              <CommunityCupHistory userId={(members.find((m: any) => m.role === "captain")?.user_id)} />
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
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/teams/${team.id}/dashboard`}>Manage</Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

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
