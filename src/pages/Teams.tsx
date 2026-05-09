import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { toast } from "sonner";
import { Users, Plus, Swords, Trophy, Globe, Shield, Target, MessageSquare, CheckCircle2, Eye, Settings, UserPlus } from "lucide-react";
import CreateTeamDialog from "@/components/teams/CreateTeamDialog";
import RosterDialog from "@/components/teams/RosterDialog";
import JoinTeamDialog from "@/components/teams/JoinTeamDialog";
import ScrimDialog from "@/components/teams/ScrimDialog";
import ContactPlayerDialog from "@/components/teams/ContactPlayerDialog";
import DiscordCTA from "@/components/landing/DiscordCTA";
import { Trophy as TrophyIcon, Sparkles, BadgeCheck } from "lucide-react";
import TeamLogo from "@/components/teams/TeamLogo";

const GAMES = [
  { value: "all", label: "All games" },
  { value: "valorant", label: "Valorant" },
  { value: "cs2", label: "CS2" },
  { value: "r6s", label: "Rainbow Six Siege" },
];
const RANKS_FILTER = ["all", "Rookie", "Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Apex"];

function getTeamBadge(team: { trophies: number; looking_for_players: boolean; is_founding?: boolean }) {
  if (team.is_founding) {
    return { label: "Founding Team", className: "border-accent/50 text-accent bg-accent/10", icon: TrophyIcon };
  }
  if (team.trophies >= 5) {
    return { label: "Tournament Winner", className: "border-accent/40 text-accent bg-accent/10", icon: TrophyIcon };
  }
  if (team.trophies >= 1) {
    return { label: "Verified", className: "border-primary/40 text-primary bg-primary/10", icon: BadgeCheck };
  }
  if (team.looking_for_players) {
    return { label: "Recruiting", className: "border-success/40 text-success bg-success/10", icon: Sparkles };
  }
  return null;
}

interface TeamRow {
  id: string;
  name: string;
  tag: string;
  game: string;
  rank: string | null;
  region: string | null;
  trophies: number;
  looking_for_players: boolean;
  slots: number;
  is_founding?: boolean;
  color: string;
  owner_id: string;
  avatar_url?: string | null;
}

interface ScrimRow {
  id: string;
  game: string;
  scheduled_date: string;
  scheduled_time: string;
  format: string;
  status: string;
  challenger_team_id: string | null;
  notes: string | null;
  teams?: { name: string; tag: string; rank: string | null } | null;
}

interface PlayerRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  game: string | null;
  rank: string | null;
  role: string | null;
  trophies: number;
}

export default function TeamsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState("teams");

  // data
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [scrims, setScrims] = useState<ScrimRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [myTeam, setMyTeam] = useState<TeamRow | null>(null);

  // filters
  const [gameFilter, setGameFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [onlyRecruiting, setOnlyRecruiting] = useState(false);
  const [pGame, setPGame] = useState("all");
  const [pRank, setPRank] = useState("all");

  // dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [rosterTeam, setRosterTeam] = useState<{ id: string; name: string } | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinTeam, setJoinTeam] = useState<{ id: string; name: string; game: string } | null>(null);
  const [scrimOpen, setScrimOpen] = useState(false);
  const [scrimTarget, setScrimTarget] = useState<{ id: string; name: string; game: string } | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactReceiver, setContactReceiver] = useState<{ id: string; name: string } | null>(null);

  const loadTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("id, name, tag, game, rank, region, trophies, looking_for_players, slots, color, owner_id, is_founding, avatar_url")
      .eq("is_demo", false)
      .order("trophies", { ascending: false });
    setTeams((data as any) ?? []);
  };

  const loadScrims = async () => {
    const { data } = await supabase
      .from("scrims")
      .select("id, game, scheduled_date, scheduled_time, format, status, challenger_team_id, notes, teams:teams!scrims_team_id_fkey(name, tag, rank)")
      .eq("status", "open")
      .order("scheduled_date", { ascending: true });
    // fallback: if join failed (no FK alias), fetch teams separately
    if (!data) { setScrims([]); return; }
    setScrims(data as any);
  };

  const loadPlayers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, game, rank, role, trophies")
      .eq("looking_for_team", true)
      .order("trophies", { ascending: false })
      .limit(50);
    setPlayers((data as any) ?? []);
  };

  const loadMyTeam = async () => {
    if (!user) { setMyTeam(null); return; }
    const { data: tm } = await supabase
      .from("team_members")
      .select("team_id, teams:teams!inner(id, name, tag, game, rank, region, trophies, looking_for_players, slots, color, owner_id, is_founding, avatar_url)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    setMyTeam(((tm as any)?.teams as TeamRow) ?? null);
  };

  useEffect(() => { loadTeams(); loadScrims(); loadPlayers(); }, []);
  useEffect(() => { loadMyTeam(); }, [user?.id]);

  const filteredTeams = useMemo(() => teams.filter(tt => {
    if (gameFilter !== "all" && tt.game !== gameFilter) return false;
    if (rankFilter !== "all" && tt.rank !== rankFilter) return false;
    if (regionFilter !== "all" && (tt.region ?? "") !== regionFilter) return false;
    if (onlyRecruiting && !tt.looking_for_players) return false;
    return true;
  }), [teams, gameFilter, rankFilter, regionFilter, onlyRecruiting]);

  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    teams.forEach(t => { if (t.region) set.add(t.region); });
    return Array.from(set).sort();
  }, [teams]);

  const filteredPlayers = useMemo(() => players.filter(p => {
    if (pGame !== "all" && p.game !== pGame) return false;
    if (pRank !== "all" && p.rank !== pRank) return false;
    return true;
  }), [players, pGame, pRank]);

  const recruitingTeams = useMemo(() => teams.filter(tt => tt.looking_for_players), [teams]);
  const trophyRanking = useMemo(() => [...teams].sort((a, b) => b.trophies - a.trophies).slice(0, 20), [teams]);

  const acceptScrim = async (scrim: ScrimRow) => {
    if (!user) { toast.error(t("teams_page.must_login", { defaultValue: "You must be logged in" })); return; }
    if (!myTeam) { toast.error(t("teams_page.need_team", { defaultValue: "You need a team" })); return; }
    const { error } = await supabase
      .from("scrims")
      .update({ status: "accepted", accepted_team_id: myTeam.id, accepted_by_team_id: myTeam.id } as any)
      .eq("id", scrim.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("teams_page.scrim_accepted", { defaultValue: "Scrim accepted!" }));
    loadScrims();
  };

  const openJoin = (team: TeamRow) => {
    if (!user) { navigate("/login"); return; }
    if (user && team.owner_id === user.id) {
      toast.error("You cannot apply to your own team");
      return;
    }
    setJoinTeam({ id: team.id, name: team.name, game: team.game });
    setJoinOpen(true);
  };
  const openScrim = (team: TeamRow) => {
    if (!user) { navigate("/login"); return; }
    if (!myTeam) { toast.error(t("teams_page.need_team", { defaultValue: "You need a team to challenge another" })); return; }
    setScrimTarget({ id: team.id, name: team.name, game: team.game });
    setScrimOpen(true);
  };
  const openOpenScrim = () => {
    if (!user) { navigate("/login"); return; }
    if (!myTeam) { toast.error(t("teams_page.need_team", { defaultValue: "You need a team to post a scrim" })); return; }
    setScrimTarget(null);
    setScrimOpen(true);
  };
  const openCreateTeam = () => {
    if (!user) { navigate("/login"); return; }
    setCreateOpen(true);
  };
  const openRoster = (team: TeamRow) => {
    setRosterTeam({ id: team.id, name: team.name });
    setRosterOpen(true);
  };
  const openContact = (p: PlayerRow) => {
    setContactReceiver({ id: p.id, name: p.display_name ?? p.username });
    setContactOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Teams · PeakGG" description="Browse, create and join competitive teams. Find scrims and recruit players." />
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-6">
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-2">
                <Shield className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                PEAKGG
              </h1>
              <Badge variant="outline" className="border-primary text-primary font-display">TEAMS</Badge>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-display font-bold">
                {t("teams_page.intro_title", { defaultValue: "Find teams, recruit players and set up scrims." })}
              </h2>
              <p className="text-sm text-muted-foreground font-body max-w-2xl mt-1">
                {t("teams_page.intro_subtitle", { defaultValue: "Create your squad, browse recruiting teams or challenge other teams before Season 1 begins." })}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
            <Button variant="neonOutline" size="default" className="w-full sm:w-auto" onClick={() => setTab("scrims")}>
              <Swords className="h-4 w-4 mr-1.5" /> {t("teams_page.find_scrims", { defaultValue: "Find Scrims" })}
            </Button>
            <Button variant="neon" size="default" className="w-full sm:w-auto" onClick={openCreateTeam}>
              <Plus className="h-4 w-4 mr-1.5" /> {t("teams_page.create_team", { defaultValue: "Create Team" })}
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <TabsList className="inline-flex md:grid md:w-fit md:grid-cols-3">
              <TabsTrigger value="teams"><Shield className="h-4 w-4 mr-1" /> {t("teams_page.tab_teams", { defaultValue: "Teams" })}</TabsTrigger>
              <TabsTrigger value="recruitment"><Target className="h-4 w-4 mr-1" /> {t("teams_page.tab_recruitment_board", { defaultValue: "Recruitment Board" })}</TabsTrigger>
              <TabsTrigger value="scrims"><Swords className="h-4 w-4 mr-1" /> {t("teams_page.tab_scrim_board", { defaultValue: "Scrim Board" })}</TabsTrigger>
            </TabsList>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-body mt-3">
            {tab === "teams" && t("teams_page.helper_teams", { defaultValue: "Browse all teams on PeakGG." })}
            {tab === "recruitment" && t("teams_page.helper_recruitment", { defaultValue: "Find teams actively looking for players." })}
            {tab === "scrims" && t("teams_page.helper_scrims", { defaultValue: "Find teams looking for practice matches." })}
          </p>

          {/* TAB 1 - TEAMS */}
          <TabsContent value="teams" className="mt-6">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{GAMES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={rankFilter} onValueChange={setRankFilter}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Rank" /></SelectTrigger>
                <SelectContent>{RANKS_FILTER.map(r => <SelectItem key={r} value={r}>{r === "all" ? "All ranks" : r}</SelectItem>)}</SelectContent>
              </Select>
              {regionOptions.length > 0 && (
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Region" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("teams_page.all_regions", { defaultValue: "All regions" })}</SelectItem>
                    {regionOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <label className="flex items-center gap-2 text-sm font-body cursor-pointer ml-auto">
                <Switch checked={onlyRecruiting} onCheckedChange={(v) => setOnlyRecruiting(Boolean(v))} />
                <span className="font-display uppercase tracking-wider text-xs">
                  {t("teams_page.recruiting_only", { defaultValue: "Recruiting only" })}
                </span>
              </label>
            </div>

            {filteredTeams.length === 0 ? (
              <EmptyState
                title={t("teams_page.empty_teams_title", { defaultValue: "No public teams yet" })}
                desc={t("teams_page.empty_teams_desc", { defaultValue: "Create your team and become one of the founding rosters of PeakGG. Join the Discord to coordinate with other early players." })}
                ctaLabel={t("teams_page.create_team", { defaultValue: "Create Team" })}
                onCta={openCreateTeam}
                icon={Shield}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTeams.map((tt) => {
                  const isOwner = !!user && tt.owner_id === user.id;
                  const userHasOtherTeam = !!myTeam && myTeam.id !== tt.id;
                  return (
                    <div key={tt.id} className="rounded-lg border border-border bg-card p-5 hover:border-primary/40 transition-all flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <TeamLogo name={tt.name} tag={tt.tag} avatarUrl={tt.avatar_url} color={tt.color} size={48} rounded="lg" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold text-lg truncate">{tt.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" />{tt.region ?? "—"}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        <Badge variant="secondary" className="text-xs font-display uppercase">{tt.game}</Badge>
                        {tt.rank && <Badge variant="outline" className="text-xs font-display">{tt.rank}</Badge>}
                        {(() => {
                          const b = getTeamBadge(tt);
                          if (!b) return null;
                          const Icon = b.icon;
                          return (
                            <Badge variant="outline" className={`text-[10px] font-display uppercase tracking-wider ${b.className}`}>
                              <Icon className="h-3 w-3 mr-1" />{b.label}
                            </Badge>
                          );
                        })()}
                      </div>
                      {(() => {
                        const cells = [
                          tt.trophies > 0 && (
                            <div key="t" className="rounded border border-border/60 bg-secondary/30 py-1.5">
                              <div className="text-primary font-display flex items-center justify-center gap-1"><Trophy className="h-3 w-3" />{tt.trophies}</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{t("teams_page.trophies", { defaultValue: "Trophies" })}</div>
                            </div>
                          ),
                          tt.looking_for_players && tt.slots > 0 && (
                            <div key="s" className="rounded border border-border/60 bg-secondary/30 py-1.5">
                              <div className="font-display">{Math.min(tt.slots, 5)}</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{t("teams_page.open_slots", { defaultValue: "Open slots" })}</div>
                            </div>
                          ),
                          tt.rank && (
                            <div key="r" className="rounded border border-border/60 bg-secondary/30 py-1.5">
                              <div className="font-display">{tt.rank}</div>
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{t("teams_page.avg_rank", { defaultValue: "Avg rank" })}</div>
                            </div>
                          ),
                        ].filter(Boolean);
                        if (cells.length === 0) return null;
                        const colsClass = cells.length === 1 ? "grid-cols-1" : cells.length === 2 ? "grid-cols-2" : "grid-cols-3";
                        return <div className={`grid ${colsClass} gap-2 text-xs font-body mb-3 text-center`}>{cells}</div>;
                      })()}
                      {tt.looking_for_players && (
                        <div className="text-center text-xs font-display uppercase tracking-wider py-1.5 mb-3 rounded bg-success/10 text-success border border-success/30">
                          {t("teams_page.recruiting", { defaultValue: "Recruiting" })}
                        </div>
                      )}
                      <div className="mt-auto flex flex-col gap-2">
                        <Button variant="neonOutline" size="sm" onClick={() => navigate(`/teams/${tt.id}`)}>
                          <Eye className="h-4 w-4 mr-1.5" /> {t("teams_page.view_team", { defaultValue: "View Team" })}
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          {isOwner ? (
                            <Button variant="neon" size="sm" className="col-span-2" onClick={() => navigate(`/teams/${tt.id}/manage`)}>
                              <Settings className="h-4 w-4 mr-1.5" /> {t("teams_page.manage_team", { defaultValue: "Manage Team" })}
                            </Button>
                          ) : (
                            <>
                              {tt.looking_for_players && (
                                <Button variant="neon" size="sm" onClick={() => openJoin(tt)}>
                                  <UserPlus className="h-4 w-4 mr-1.5" /> {t("teams_page.apply", { defaultValue: "Apply" })}
                                </Button>
                              )}
                              {userHasOtherTeam && (
                                <Button variant="ghost" size="sm" className="border border-border/60" onClick={() => openScrim(tt)}>
                                  <Swords className="h-4 w-4 mr-1.5" /> {t("teams_page.request_scrim", { defaultValue: "Request Scrim" })}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-10">
              <DiscordCTA variant="inline" />
            </div>
          </TabsContent>

          {/* TAB 2 - RECRUITMENT */}
          <TabsContent value="recruitment" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Teams looking for players */}
              <div>
                <h2 className="font-display text-xl uppercase tracking-wider mb-3 text-primary">
                  {t("teams_page.teams_seek_players", { defaultValue: "Teams looking for players" })}
                </h2>
                <div className="space-y-2">
                  {recruitingTeams.length === 0 && (
                    <EmptyState
                      compact
                      title={t("teams_page.empty_recruitment_title", { defaultValue: "No teams recruiting yet" })}
                      desc={t("teams_page.empty_recruitment_desc", { defaultValue: "Open recruitment on your team or check back soon." })}
                      ctaLabel={t("teams_page.create_team", { defaultValue: "Create Team" })}
                      onCta={openCreateTeam}
                      icon={Target}
                    />
                  )}
                  {recruitingTeams.map((tt) => (
                    <div key={tt.id} className="flex items-center gap-3 border border-border bg-card rounded-md p-3">
                      <TeamLogo name={tt.name} tag={tt.tag} avatarUrl={tt.avatar_url} color={tt.color} size={40} rounded="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-display truncate">{tt.name}</div>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="secondary" className="text-[10px] font-display uppercase">{tt.game}</Badge>
                          {tt.rank && <Badge variant="outline" className="text-[10px] font-display">{tt.rank}</Badge>}
                          <span className="text-[10px] text-muted-foreground self-center">· {Math.min(tt.slots, 5)} {t("teams_page.slots", { defaultValue: "open" })}</span>
                        </div>
                      </div>
                      <Button variant="neonOutline" size="sm" onClick={() => openJoin(tt)}>
                        <UserPlus className="h-3 w-3 mr-1" /> {t("teams_page.apply", { defaultValue: "Apply" })}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Players looking for teams */}
              <div>
                <h2 className="font-display text-xl uppercase tracking-wider mb-3 text-primary">
                  {t("teams_page.players_seek_teams", { defaultValue: "Players looking for teams" })}
                </h2>
                <div className="flex gap-2 mb-3">
                  <Select value={pGame} onValueChange={setPGame}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{GAMES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={pRank} onValueChange={setPRank}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{RANKS_FILTER.map(r => <SelectItem key={r} value={r}>{r === "all" ? "All ranks" : r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {filteredPlayers.length === 0 && <p className="text-muted-foreground text-sm font-body">{t("teams_page.no_players", { defaultValue: "None." })}</p>}
                  {filteredPlayers.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 border border-border bg-card rounded-md p-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display text-xs">
                        {(p.display_name ?? p.username).slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display truncate">{p.display_name ?? p.username}</div>
                        <div className="flex gap-1 mt-1 items-center">
                          {p.game && <Badge variant="secondary" className="text-[10px] font-display uppercase">{p.game}</Badge>}
                          {p.role && <Badge variant="outline" className="text-[10px] font-display">{p.role}</Badge>}
                          {p.rank && <Badge variant="outline" className="text-[10px] font-display">{p.rank}</Badge>}
                          <span className="text-[10px] text-primary flex items-center gap-1"><Trophy className="h-3 w-3" />{p.trophies}</span>
                        </div>
                      </div>
                      <Button variant="neonOutline" size="sm" onClick={() => openContact(p)}>
                        <MessageSquare className="h-3 w-3 mr-1" /> {t("teams_page.contact", { defaultValue: "Contact" })}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trophy ranking */}
            <div className="mt-10">
              <h2 className="font-display text-xl uppercase tracking-wider mb-3 text-primary flex items-center gap-2">
                <Trophy className="h-5 w-5" /> {t("teams_page.trophy_ranking", { defaultValue: "Team trophy ranking" })}
              </h2>
              <div className="border border-border rounded-md bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>{t("teams_page.team", { defaultValue: "Team" })}</TableHead>
                      <TableHead>{t("teams_page.game", { defaultValue: "Game" })}</TableHead>
                      <TableHead className="text-right">🏆</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trophyRanking.map((tt, i) => (
                      <TableRow key={tt.id}>
                        <TableCell className="font-display">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</TableCell>
                        <TableCell className="font-display">{tt.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px] font-display uppercase">{tt.game}</Badge></TableCell>
                        <TableCell className="text-right text-primary font-display">{tt.trophies}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-body">
                {t("teams_page.trophy_note", { defaultValue: "Team trophies are the sum of trophies of all its players." })}
              </p>
            </div>
          </TabsContent>

          {/* TAB 3 - SCRIMS */}
          <TabsContent value="scrims" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button variant="neon" size="sm" onClick={openOpenScrim}>
                <Plus className="h-4 w-4 mr-1" /> {t("teams_page.post_scrim", { defaultValue: "Post Scrim" })}
              </Button>
            </div>
            {scrims.length === 0 ? (
              <EmptyState
                title={t("teams_page.empty_scrims_title", { defaultValue: "No scrims posted yet" })}
                desc={t("teams_page.empty_scrims_desc", { defaultValue: "Create a scrim post and find practice matches before Season 1." })}
                ctaLabel={t("teams_page.create_scrim", { defaultValue: "Create Scrim" })}
                onCta={openOpenScrim}
                icon={Swords}
              />
            ) : (
            <div className="space-y-2">
              {scrims.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 border border-border bg-card rounded-md p-4">
                  <Swords className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="font-display">{s.teams?.name ?? "—"}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-[10px] font-display uppercase">{s.game}</Badge>
                      {s.teams?.rank && <Badge variant="outline" className="text-[10px] font-display">{s.teams.rank}</Badge>}
                      <Badge variant="outline" className="text-[10px] font-display">{s.scheduled_date} {s.scheduled_time?.slice(0,5)}</Badge>
                      <Badge variant="outline" className="text-[10px] font-display">{s.format}</Badge>
                    </div>
                  </div>
                  <span className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {t("teams_page.open", { defaultValue: "Open" })}</span>
                  <Button variant="neonOutline" size="sm" onClick={() => acceptScrim(s)}>
                    <Swords className="h-3 w-3 mr-1" /> {t("teams_page.accept", { defaultValue: "Accept" })}
                  </Button>
                </div>
              ))}
            </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { loadTeams(); loadMyTeam(); }} />
      <RosterDialog open={rosterOpen} onOpenChange={setRosterOpen} teamId={rosterTeam?.id ?? null} teamName={rosterTeam?.name} />
      <JoinTeamDialog open={joinOpen} onOpenChange={setJoinOpen} team={joinTeam} />
      <ScrimDialog
        open={scrimOpen}
        onOpenChange={setScrimOpen}
        targetTeam={scrimTarget}
        challengerTeamId={myTeam?.id ?? null}
        challengerGame={myTeam?.game}
        onCreated={loadScrims}
      />
      <ContactPlayerDialog open={contactOpen} onOpenChange={setContactOpen} receiver={contactReceiver} />

      <Footer />
    </div>
  );
}

/* ----------------- Local empty state helper ----------------- */
function EmptyState({
  title,
  desc,
  ctaLabel,
  onCta,
  icon: Icon,
  compact = false,
}: {
  title: string;
  desc: string;
  ctaLabel: string;
  onCta: () => void;
  icon: React.ComponentType<{ className?: string }>;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card text-center flex flex-col items-center ${
        compact ? "py-8 px-4 gap-3" : "py-14 px-6 gap-4"
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-display font-bold text-lg uppercase tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground font-body mt-1 max-w-md mx-auto">{desc}</p>
      </div>
      <Button variant="neon" size="sm" onClick={onCta}>
        <Plus className="h-4 w-4 mr-1.5" /> {ctaLabel}
      </Button>
    </div>
  );
}
