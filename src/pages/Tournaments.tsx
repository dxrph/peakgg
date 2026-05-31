import { Link, useNavigate } from "react-router-dom";
import { buildMatchUrl } from "@/lib/match-url";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import {
  Trophy, Users, User, Lock, Sparkles, ArrowRight, Calendar,
  Target, Award, Shield, MessageCircle, Swords, Loader2, X, Zap,
  TrendingUp, ChevronRight, Crown, Flame, Star, Globe, CheckCircle2, Clock,
} from "lucide-react";
import { useGame } from "@/lib/game-context";
import { GAMES, getRankByElo } from "@/lib/ranks";
import GameComingSoon from "@/components/GameComingSoon";
import DiscordCTA from "@/components/landing/DiscordCTA";
import { DISCORD_INVITE } from "@/lib/links";
import { supabase } from "@/integrations/supabase/client";
import { format as fmtDate } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useUserRoles } from "@/hooks/useUserRoles";
import { openCupPublicQueueEnabled, openCupTeamSize } from "@/lib/feature-flags";
import { useMatchFoundListener } from "@/hooks/useMatchFoundListener";
import RankBadge from "@/components/RankBadge";
import QueueLobby from "@/components/competitive/QueueLobby";
import TournamentCountdown from "@/components/tournaments/TournamentCountdown";
import ProgressionPath from "@/components/landing/ProgressionPath";

// Thresholds for cup unlocks (ELO-based)
// Aligned with PeakGG Rank thresholds (see src/lib/ranks.ts):
//   Rival starts at 1000 ELO  → unlocks Challenger Series
//   Elite starts at 2000 ELO  → unlocks Peak Championship
const CHALLENGER_ELO = 1000;
const CHAMPIONSHIP_ELO = 2000;

type SoloTier = {
  id: "open" | "challenger" | "championship";
  name: string;
  tagline: string;
  status: "Public Beta" | "Locked · Coming Later" | "Invite-only · Coming Later";
  unlock: string;
  rewards: string[];
  cta: { label: string; href: string; external?: boolean };
  accent: string;
  icon: typeof Trophy;
  locked?: boolean;
};

const SOLO_TIERS: SoloTier[] = [
  {
    id: "open",
    name: "Open Cup",
    tagline: "Solo queue · 1v1 Test · Affects ELO · Public Beta",
    status: "Public Beta",
    unlock: "Open Cup is in public beta. Queue size and rules may change while we test matchmaking and ELO updates. Currently 1v1 only — full 5v5 opens as the player pool grows.",
    rewards: ["Dynamic ELO (K=24)", "More for upsets, less for favored wins", "Open Cup badge"],
    cta: { label: "Join Open Cup", href: "#solo-path" },
    accent: "border-success/40 text-success",
    icon: Trophy,
  },
  {
    id: "challenger",
    name: "Challenger Series",
    tagline: "Coming later · ELO threshold required when live",
    status: "Locked · Coming Later",
    unlock: "Unlocks through ELO progression once Open Cup is live. Climb in Open Cup to qualify.",
    rewards: ["Challenger badge", "Higher-stake matches", "Path to Championship"],
    cta: { label: "View Path", href: "#solo-path" },
    accent: "border-accent/40 text-accent",
    icon: Award,
    locked: true,
  },
  {
    id: "championship",
    name: "Peak Championship",
    tagline: "Invite-only · Coming later",
    status: "Invite-only · Coming Later",
    unlock: "Invite-only for now. Future qualification path will open after Challenger Series goes live.",
    rewards: ["Season badge", "Championship recognition", "Leaderboard glory"],
    cta: { label: "View Path", href: "#solo-path" },
    accent: "border-primary/40 text-primary",
    icon: Sparkles,
    locked: true,
  },
];

const HOW_IT_WORKS = [
  { icon: User, title: "Join as a player", text: "Sign up solo — no permanent team needed." },
  { icon: Users, title: "Get matched", text: "We build a temporary team for the cup." },
  { icon: Swords, title: "Play the cup", text: "Compete in a single-elimination bracket." },
  { icon: Target, title: "Confirm result", text: "Both sides confirm; admin resolves disputes." },
  { icon: Award, title: "Gain ELO & rank up", text: "ELO updates instantly. Higher cups unlock at thresholds." },
];

const FAQ = [
  { q: "Do I need a team for the Open Cup?", a: "No. Open Cup creates a temporary team for that match only — it does not appear on the public Teams page." },
  { q: "How does my ELO change?", a: "PeakGG uses a dynamic Elo formula. Beating a stronger team gives more ELO; losing to a weaker team costs more. K factor is 24 for Open Cup and Ranked, 28 for Challenger Series, 32 for Peak Championship. Scrims do not affect your rank." },
  { q: "How are Team Tournaments different?", a: "Team Tournaments require a captain to register a full permanent roster. Results count for the team, not individuals." },
  { q: "When does ELO update?", a: "Only after both sides confirm the result (or an admin resolves a dispute). Cancelled or unconfirmed matches do not affect ELO." },
];

export default function TournamentsPage() {
  const { selectedGame } = useGame();
  const game = GAMES.find(g => g.id === selectedGame)!;
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [joining, setJoining] = useState(false);
  // Driven by config — flip openCupTeamSize in feature-flags.ts to switch to 5v5.
  const [teamSize] = useState<number>(openCupTeamSize);
  const { isAdmin } = useUserRoles();
  // Public queue is gated behind a feature flag. Admins always retain access
  // for end-to-end testing of matchmaking + ELO.
  const queueEnabled = openCupPublicQueueEnabled || isAdmin;

  // Auto-redirect when a match is created for me (covers the second player
  // who is still sitting on this page when the queue pairs them).
  useMatchFoundListener();

  // Player ELO for current game
  const { data: myStats } = useQuery({
    queryKey: ["my-player-stats", user?.id, selectedGame],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("player_stats").select("elo, wins, losses, matches_played")
        .eq("user_id", user!.id).eq("game", selectedGame).maybeSingle();
      return data;
    },
  });
  const myElo = myStats?.elo ?? 1000;
  const myRank = getRankByElo(myElo);

  // My queue entry
  const { data: queueEntry, refetch: refetchQueue } = useQuery({
    queryKey: ["my-open-cup-queue", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("open_cup_queue").select("game, team_size, joined_at")
        .eq("user_id", user!.id).maybeSingle();
      return data;
    },
    refetchInterval: 5000,
  });

  // Active open cup match
  const { data: activeMatch, refetch: refetchActive } = useQuery({
    queryKey: ["my-open-cup-match", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // 1v1 matches: lookup by player_a_id / player_b_id.
      // Team-based open cup (future): also include match_rosters.
      const { data: m1 } = await supabase
        .from("matches")
        .select("id, status, kind, result_status, created_at")
        .eq("kind", "open_cup")
        .or(`player_a_id.eq.${user!.id},player_b_id.eq.${user!.id}`)
        .not("status", "in", "(completed,cancelled)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (m1) return m1;
      const { data: rs } = await supabase
        .from("match_rosters").select("match_id").eq("user_id", user!.id);
      const ids = (rs ?? []).map((r: any) => r.match_id);
      if (!ids.length) return null;
      const { data: m2 } = await supabase
        .from("matches").select("id, status, kind, result_status")
        .in("id", ids).eq("kind", "open_cup")
        .not("status", "in", "(completed,cancelled)")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return m2;
    },
    refetchInterval: 5000,
  });

  const joinQueue = async () => {
    if (!user) { navigate("/login?redirect=/tournaments"); return; }
    setJoining(true);
    const { data, error } = await supabase.rpc("enqueue_solo", {
      _mode: "open_cup",
      _game: selectedGame,
    });
    setJoining(false);
    if (error) {
      const msg = String(error.message ?? "").toLowerCase();
      if (msg.includes("already") || msg.includes("duplicate") || msg.includes("23505")) {
        // Already queued — surface as the lobby state, not a hard error.
        refetchQueue();
        return;
      }
      toast.error("Could not create match. Please try again or contact support.");
      return;
    }
    const result = data as any;
    if (result?.status === "matched" && result.match_id) {
      toast.success("Match found!");
      navigate((buildMatchUrl(result.match_id) ?? "#"));
    } else {
      toast.success("You're in the queue. Waiting for opponents…");
      refetchQueue();
    }
  };

  const cancelQueue = async () => {
    const { error } = await supabase.rpc("cancel_open_cup_queue");
    if (error) return toast.error(error.message);
    toast.success("Queue cancelled");
    refetchQueue();
  };

  // Realtime redirect handled by useMatchFoundListener above.

  const { data: teamTournaments = [] } = useQuery({
    queryKey: ["public-team-tournaments", selectedGame],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, slug, name, format, start_date, max_teams, status, tier_label, banner_url, short_description")
        .eq("game", selectedGame)
        .eq("visibility", "public")
        .in("status", ["registration_open", "checkin", "live", "upcoming", "Open"])
        .order("start_date", { ascending: true })
        .limit(6);
      return data ?? [];
    },
  });

  // Featured tournament — PeakGG Community Cup #1 (the current flagship event).
  const { data: featured } = useQuery({
    queryKey: ["featured-community-cup", selectedGame],
    queryFn: async () => {
      const { data: t } = await supabase
        .from("tournaments")
        .select("id, slug, name, format, start_date, max_teams, status, tier_label, short_description, tournament_type, game, registration_close_at, checkin_close_at, countdown_enabled")
        .eq("slug", "community-cup-1")
        .maybeSingle();
      if (!t || t.game !== selectedGame) return null;
      const { count } = await supabase
        .from("tournament_team_signups")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", t.id)
        .eq("status", "approved");
      return { ...t, approved_count: count ?? 0 };
    },
  });

  // Hide featured tournament from the lower team tournaments grid to avoid duplication.
  const otherTeamTournaments = teamTournaments.filter(
    (t: any) => !featured || t.id !== featured.id,
  );

  const featuredStatusLabel =
    featured?.status === "registration_open" ? "Registration Open"
    : featured?.status === "checkin" ? "Check-in Open"
    : featured?.status === "live" ? "Live Now"
    : featured?.status === "completed" ? "Completed"
    : "Coming Soon";

  const daysUntilStart = featured?.start_date
    ? Math.ceil((new Date(featured.start_date).getTime() - Date.now()) / 86400000)
    : null;

  const seo = (
    <SEO
      title="Tournaments — PeakGG | Solo Queue Cups & Team Tournaments"
      description="Compete solo in PeakGG Open Cups. Win matches, gain ELO and unlock higher cups. Or register your team for official team tournaments."
      keywords="solo queue tournament, Valorant cup, free FPS tournament, PeakGG Open Cup, Peak Championship"
      path="/tournaments"
    />
  );

  if (game.status !== "live") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {seo}
        <Navbar />
        <div className="pt-24 flex-1"><GameComingSoon /></div>
        <Footer />
      </div>
    );
  }

  // Derived progress to next tier — used by the My Progress card.
  const nextTierName = myElo < CHALLENGER_ELO ? "Challenger Series" : myElo < CHAMPIONSHIP_ELO ? "Peak Championship" : null;
  const nextTierThreshold = myElo < CHALLENGER_ELO ? CHALLENGER_ELO : myElo < CHAMPIONSHIP_ELO ? CHAMPIONSHIP_ELO : null;
  const nextTierFloor = myElo < CHALLENGER_ELO ? 0 : myElo < CHAMPIONSHIP_ELO ? CHALLENGER_ELO : CHAMPIONSHIP_ELO;
  const tierProgressPct = nextTierThreshold
    ? Math.min(100, Math.max(0, Math.round(((myElo - nextTierFloor) / (nextTierThreshold - nextTierFloor)) * 100)))
    : 100;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {seo}
      <Navbar />

      <main className="container pt-24 pb-16 flex-1">
        {/* HERO — premium 2-col with My Progress card */}
        <section className="relative overflow-hidden rounded-2xl border border-border gradient-hero mb-12 neon-border">
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse at 30% 20%, black 0%, transparent 75%)",
            }}
          />
          <div
            className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(352 100% 62% / 0.18), transparent 60%)" }}
          />
          <div
            className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(24 100% 63% / 0.12), transparent 60%)" }}
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 p-6 sm:p-8 md:p-12 items-center">
            {/* LEFT — title + CTAs */}
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <Badge variant="outline" className="border-primary/40 text-primary font-display uppercase tracking-widest text-[10px]">
                  <Flame className="h-3 w-3 mr-1" />Season 0 Beta
                </Badge>
                <Badge variant="outline" className="border-border text-muted-foreground font-display uppercase tracking-widest text-[10px]">
                  Unified Competitive Path
                </Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight leading-[1.05]">
                Your climb <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">starts here.</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground font-body mt-5 max-w-xl">
                Play Open Cup, gain ELO, unlock Challenger and fight for a place in the Peak Championship.
              </p>
              <p className="text-xs text-muted-foreground/70 font-body mt-2 italic">
                Final public format: 5v5 solo queue. Current test size: {teamSize}v{teamSize}.
              </p>

              {/* CTA row */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {queueEnabled && !queueEntry && !activeMatch && (
                  <Button
                    variant="neon" size="lg" onClick={joinQueue} disabled={joining}
                    className="shadow-xl shadow-primary/30"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    {joining ? "Joining…" : "Join Open Cup"}
                  </Button>
                )}
                {!queueEnabled && (
                  <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                    <Button variant="neon" size="lg"><MessageCircle className="h-4 w-4 mr-1" />Join Discord for Beta</Button>
                  </a>
                )}
                {activeMatch?.id && (
                  <Button variant="neon" size="lg" asChild>
                    <Link to={(buildMatchUrl(activeMatch.id) ?? "#")}>
                      <Swords className="h-4 w-4 mr-1" />Open Match<ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button variant="neonOutline" size="lg" asChild>
                  <Link to="/leaderboard"><TrendingUp className="h-4 w-4 mr-1" />View Leaderboard</Link>
                </Button>
              </div>

              {/* Active queue lobby — replaces hero CTA when queued */}
              {queueEntry && !activeMatch && (
                <div className="mt-6">
                  <QueueLobby
                    mode="open_cup"
                    game={queueEntry.game}
                    teamSize={queueEntry.team_size}
                    joinedAt={queueEntry.joined_at}
                    myElo={user ? myElo : null}
                    onCancel={cancelQueue}
                  />
                </div>
              )}
            </div>

            {/* RIGHT — My Progress card */}
            <div className="lg:col-span-5">
              {user ? (
                <div className="relative rounded-2xl border border-primary/30 bg-card/80 backdrop-blur p-5 sm:p-6 shadow-xl shadow-primary/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Your Progress</div>
                    <Badge variant="outline" className="border-success/40 text-success font-display uppercase text-[10px]">Tier 1 · Open Cup</Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <RankBadge elo={myElo} size="lg" />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-2xl uppercase leading-none" style={{ color: myRank.hex }}>
                        {myRank.name}
                      </div>
                      <div className="font-mono text-sm text-muted-foreground mt-1">{myElo} ELO</div>
                      {myStats && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {myStats.wins ?? 0}W · {myStats.losses ?? 0}L · {myStats.matches_played ?? 0} matches
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5">
                    {nextTierName ? (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Next Unlock</span>
                          <span className="text-xs font-display uppercase text-foreground">{nextTierName}</span>
                        </div>
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${tierProgressPct}%`,
                              background: "linear-gradient(90deg, hsl(352 100% 62%), hsl(24 100% 63%))",
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground font-mono">
                          <span>{myElo} / {nextTierThreshold} ELO</span>
                          <span className="text-accent">{Math.max(0, nextTierThreshold! - myElo)} to go</span>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-md border border-accent/30 bg-accent/5 p-3 text-center">
                        <Crown className="h-5 w-5 text-accent mx-auto mb-1" />
                        <div className="text-sm font-display uppercase text-accent">Championship Eligible</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-md border border-border bg-secondary/40 p-2">
                      <div className="text-[10px] font-display uppercase text-muted-foreground tracking-widest">Challenger</div>
                      <div className="text-sm font-mono mt-0.5">{CHALLENGER_ELO} ELO</div>
                    </div>
                    <div className="rounded-md border border-border bg-secondary/40 p-2">
                      <div className="text-[10px] font-display uppercase text-muted-foreground tracking-widest">Championship</div>
                      <div className="text-sm font-mono mt-0.5">{CHAMPIONSHIP_ELO} ELO</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur p-6 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full gradient-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/30">
                    <Trophy className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-lg uppercase">Track your climb</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Create an account to track your ELO and unlock competitive tiers.
                  </p>
                  <Button variant="neon" size="sm" className="mt-4" asChild>
                    <Link to="/register">Create Account<ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Unified progression explainer */}
        <section className="mb-16">
          <ProgressionPath />
        </section>

        {/* FEATURED TOURNAMENT — PeakGG Community Cup #1 (current flagship) */}
        {featured && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="border-accent/50 text-accent font-display uppercase tracking-widest text-[10px]">
                <Star className="h-3 w-3 mr-1" />Featured Event
              </Badge>
              <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                First Official PeakGG Community Event
              </span>
            </div>

            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-card shadow-2xl shadow-primary/20">
              {/* Glow layers */}
              <div
                className="absolute inset-0 pointer-events-none opacity-80"
                style={{
                  background:
                    "radial-gradient(ellipse at top left, hsl(352 100% 62% / 0.18), transparent 55%), radial-gradient(ellipse at bottom right, hsl(24 100% 63% / 0.15), transparent 55%)",
                }}
              />
              <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
                  backgroundSize: "44px 44px",
                }}
              />
              {/* Top accent stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-1 pointer-events-none"
                style={{ background: "linear-gradient(90deg, hsl(352 100% 62%), hsl(24 100% 63%))" }}
              />

              <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 md:p-10">
                {/* LEFT — main info */}
                <div className="lg:col-span-8">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge className="bg-success/15 text-success border border-success/40 font-display uppercase tracking-wider text-[10px] hover:bg-success/15">
                      <Flame className="h-3 w-3 mr-1" />{featuredStatusLabel}
                    </Badge>
                    <Badge variant="outline" className="border-primary/40 text-primary font-display uppercase tracking-wider text-[10px]">
                      VALORANT
                    </Badge>
                    <Badge variant="outline" className="border-border text-foreground font-display uppercase tracking-wider text-[10px]">
                      <Globe className="h-3 w-3 mr-1" />EU
                    </Badge>
                    <Badge variant="outline" className="border-border text-foreground font-display uppercase tracking-wider text-[10px]">
                      5v5
                    </Badge>
                    <Badge variant="outline" className="border-accent/40 text-accent font-display uppercase tracking-wider text-[10px]">
                      Community Cup
                    </Badge>
                  </div>

                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold uppercase tracking-tight leading-[1.05]">
                    PeakGG <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Community Cup #1</span>
                  </h2>
                  <p className="text-sm sm:text-base text-foreground/90 font-body mt-3 max-w-2xl">
                    Free EU VALORANT tournament for community teams, amateur players and rising 5-stacks.
                  </p>
                  <p className="text-base sm:text-lg font-display uppercase tracking-tight text-accent mt-3 max-w-2xl">
                    “Bring your 5-stack. Represent your community. Fight for the first PeakGG Community Cup title.”
                  </p>
                  <p className="text-sm text-muted-foreground font-body mt-4 max-w-2xl">
                    The PeakGG Community Cup is the first official community tournament on PeakGG, built to bring together EU VALORANT communities, amateur teams and rising players in a clean competitive event.
                  </p>

                  {/* Mini info row */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      { icon: CheckCircle2, label: "Free Entry" },
                      { icon: Globe, label: "EU Servers" },
                      { icon: MessageCircle, label: "English" },
                      { icon: Shield, label: "Staff-reviewed signups" },
                      { icon: Users, label: "8–16 Teams" },
                    ].map(({ icon: Icon, label }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-[11px] font-body text-foreground/90"
                      >
                        <Icon className="h-3 w-3 text-primary" />{label}
                      </span>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button variant="neon" size="lg" asChild className="shadow-xl shadow-primary/30">
                      <Link to={`/tournaments/${featured.slug || featured.id}`}>
                        <Trophy className="h-4 w-4 mr-1" />Register Your Team<ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="neonOutline" size="lg" asChild>
                      <Link to={`/tournaments/${featured.slug || featured.id}`}>
                        View Tournament Details
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* RIGHT — stats panel */}
                <div className="lg:col-span-4">
                  <div className="rounded-xl border border-primary/30 bg-background/60 backdrop-blur p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Slots</span>
                      <span className="font-mono text-sm text-foreground">
                        {featured.approved_count}/{featured.max_teams ?? 16} teams
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.round(((featured.approved_count ?? 0) / (featured.max_teams ?? 16)) * 100))}%`,
                          background: "linear-gradient(90deg, hsl(352 100% 62%), hsl(24 100% 63%))",
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="rounded-md border border-border bg-secondary/40 p-2.5">
                        <div className="text-[10px] font-display uppercase text-muted-foreground tracking-widest">Entry</div>
                        <div className="text-sm font-display uppercase mt-0.5 text-success">Free</div>
                      </div>
                      <div className="rounded-md border border-border bg-secondary/40 p-2.5">
                        <div className="text-[10px] font-display uppercase text-muted-foreground tracking-widest">Format</div>
                        <div className="text-sm font-display uppercase mt-0.5">BO1</div>
                      </div>
                      <div className="rounded-md border border-border bg-secondary/40 p-2.5">
                        <div className="text-[10px] font-display uppercase text-muted-foreground tracking-widest">Grand Final</div>
                        <div className="text-sm font-display uppercase mt-0.5">BO3</div>
                      </div>
                      <div className="rounded-md border border-border bg-secondary/40 p-2.5">
                        <div className="text-[10px] font-display uppercase text-muted-foreground tracking-widest">Region</div>
                        <div className="text-sm font-display uppercase mt-0.5">EU</div>
                      </div>
                    </div>

                    {featured.start_date && (
                      <div className="rounded-md border border-accent/30 bg-accent/5 p-3">
                        <div className="flex items-center gap-2 text-[10px] font-display uppercase tracking-widest text-accent">
                          <Calendar className="h-3 w-3" />Starts
                        </div>
                        <div className="text-sm font-body text-foreground mt-1">
                          {fmtDate(new Date(featured.start_date), "EEE, MMM d, yyyy — HH:mm")}
                        </div>
                      </div>
                    )}

                    <TournamentCountdown
                      startsAt={featured.start_date ?? null}
                      registrationClosesAt={featured.registration_close_at ?? null}
                      checkinClosesAt={featured.checkin_close_at ?? null}
                      countdownEnabled={featured.countdown_enabled ?? true}
                      status={featured.status}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* COMPETITIVE PATH — 3 connected tier cards */}
        <section id="solo-path" className="mb-16">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight">Choose your next climb</h2>
              <p className="text-sm text-muted-foreground font-body mt-1">One ladder. Three tiers. Every match matters.</p>
            </div>
          </div>

          {/* Connector line behind cards (desktop only) */}
          <div className="relative">
            <div
              className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px pointer-events-none"
              style={{ background: "linear-gradient(90deg, hsl(var(--success)/0.5), hsl(var(--accent)/0.5), hsl(var(--primary)/0.5))" }}
            />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {SOLO_TIERS.map((tier, i) => {
              const Icon = tier.icon;
              const isOpen = tier.id === "open";
              const eligible = tier.id === "open"
                ? true
                : tier.id === "challenger" ? myElo >= CHALLENGER_ELO
                : myElo >= CHAMPIONSHIP_ELO;
              const progressTo = tier.id === "challenger" ? CHALLENGER_ELO : tier.id === "championship" ? CHAMPIONSHIP_ELO : null;
              const isCurrent = isOpen; // only Open Cup is currently active
              const tierTone =
                tier.id === "open" ? "from-success/30 to-success/0 border-success/50"
                : tier.id === "challenger" ? "from-accent/30 to-accent/0 border-accent/40"
                : "from-primary/30 to-primary/0 border-primary/40";
              const iconTone =
                tier.id === "open" ? "bg-success/15 text-success border-success/40"
                : tier.id === "challenger" ? "bg-accent/15 text-accent border-accent/40"
                : "bg-primary/15 text-primary border-primary/40";
              return (
                <div
                  key={tier.id}
                  className={`group relative rounded-2xl border bg-card p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    isCurrent
                      ? "border-success/50 shadow-xl shadow-success/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {/* Glow halo for current tier */}
                  {isCurrent && (
                    <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${tierTone} opacity-60 pointer-events-none`} />
                  )}
                  {/* Tier number ribbon */}
                  <div className="relative flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center ${iconTone} shadow-md`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Tier {i + 1}</div>
                      {isCurrent ? (
                        <Badge variant="outline" className="border-success/40 text-success font-display text-[10px] uppercase tracking-wider mt-1">
                          <Flame className="h-3 w-3 mr-1" />Live · Open Beta
                        </Badge>
                      ) : eligible ? (
                        <Badge variant="outline" className="border-accent/40 text-accent font-display text-[10px] uppercase tracking-wider mt-1">
                          Eligible · Coming Soon
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-border text-muted-foreground font-display text-[10px] uppercase tracking-wider mt-1">
                          <Lock className="h-3 w-3 mr-1" />{tier.id === "championship" ? "Invite-only" : "Locked"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="relative text-2xl font-display font-bold uppercase tracking-tight">{tier.name}</h3>
                  <p className="relative text-xs text-muted-foreground font-body mt-1">
                    {tier.id === "open" && "Open to everyone · Affects ELO"}
                    {tier.id === "challenger" && `Requires ${CHALLENGER_ELO}+ ELO`}
                    {tier.id === "championship" && `Requires ${CHAMPIONSHIP_ELO}+ ELO or Challenger qualification`}
                  </p>

                  <div className="relative mt-4 rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-muted-foreground">Format</span>
                      <span className="text-foreground">{tier.id === "open" ? `${teamSize}v${teamSize} Test` : "5v5 (planned)"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-muted-foreground">Stakes</span>
                      <span className="text-foreground">{tier.id === "open" ? "Dynamic ELO · K=24" : tier.id === "challenger" ? "Dynamic ELO · K=28" : "Dynamic ELO · K=32"}</span>
                    </div>
                    {user && progressTo && !eligible && (
                      <div className="pt-2 border-t border-border/60">
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(100, Math.round((myElo / progressTo) * 100))}%` }} />
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1">{myElo} / {progressTo} ELO</div>
                      </div>
                    )}
                  </div>

                  <div className="relative mt-4 flex-1">
                    <p className="text-sm text-muted-foreground font-body">{tier.tagline}</p>
                  </div>

                  <div className="relative mt-5">
                    {isOpen ? (
                      queueEnabled ? (
                        activeMatch?.id ? (
                          <Button variant="neon" className="w-full" asChild>
                            <Link to={(buildMatchUrl(activeMatch.id) ?? "#")}>Open Match<ArrowRight className="ml-1 h-3 w-3" /></Link>
                          </Button>
                        ) : queueEntry ? (
                          <Button variant="neonOutline" className="w-full" disabled>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />In Queue
                          </Button>
                        ) : (
                          <Button variant="neon" className="w-full" onClick={joinQueue} disabled={joining}>
                            <Zap className="h-3 w-3 mr-1" />Join Open Cup<ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        )
                      ) : (
                        <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="block">
                          <Button variant="neon" className="w-full">
                            <MessageCircle className="h-3 w-3 mr-1" />Join Discord
                          </Button>
                        </a>
                      )
                    ) : eligible ? (
                      <Button variant="neonOutline" className="w-full" disabled>
                        <Crown className="h-3 w-3 mr-1" />{tier.id === "championship" ? "Championship Eligible" : "Eligible · Coming Soon"}
                      </Button>
                    ) : (
                      <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="neonOutline" className="w-full">
                          <MessageCircle className="h-3 w-3 mr-1" />View Path on Discord
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Path arrow connector (desktop only, between cards) */}
                  {i < SOLO_TIERS.length - 1 && (
                    <div className="hidden md:flex absolute top-12 -right-3 z-10 w-6 h-6 rounded-full bg-card border border-border items-center justify-center">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </section>

        {/* HOW IT WORKS — compact strip */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight mb-6">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="rounded-xl border border-border bg-card p-5 relative hover:border-primary/40 transition-colors">
                  <div className="absolute top-3 right-3 text-sm font-display font-bold text-primary/40">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/40 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold uppercase tracking-tight">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FORMATS — slim strip replacing the old two-up overview */}
        <section className="mb-16 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-success/30 bg-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-success/15 border border-success/40 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-success" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-display uppercase tracking-widest text-success">Available now</div>
              <h3 className="font-display font-bold uppercase">Solo Queue</h3>
              <p className="text-xs text-muted-foreground font-body">Sign up alone — we build a team for the match.</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 opacity-90">
            <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Coming with 5v5 beta</div>
              <h3 className="font-display font-bold uppercase">Team Queue</h3>
              <p className="text-xs text-muted-foreground font-body">Captain registers a full roster. Results count for the team.</p>
            </div>
          </div>
        </section>

        {/* TEAM TOURNAMENTS */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight">Team Tournaments</h2>
              <p className="text-sm text-muted-foreground font-body mt-1">For full rosters. Captain registers, the team plays.</p>
            </div>
            <Link to="/teams">
              <Button variant="neonOutline" size="sm">
                <Users className="mr-1 h-3 w-3" />Create Team
              </Button>
            </Link>
          </div>

          {otherTeamTournaments.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Team tournaments will open after Season 0 Beta begins"
              description="No official team tournaments are scheduled yet. Build your roster now and be ready for launch."
              ctaLabel="Create Team"
              ctaTo="/teams"
              secondaryLabel="Join Discord"
              secondaryOnClick={() => window.open(DISCORD_INVITE, "_blank")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {otherTeamTournaments.map(t => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <Badge variant="outline" className="font-display text-[10px] uppercase tracking-wider border-primary/40 text-primary">
                      {t.tier_label || "Team Tournament"}
                    </Badge>
                    <Badge variant="secondary" className="font-display text-[10px] uppercase">{t.status}</Badge>
                  </div>
                  <h3 className="text-lg font-display font-bold uppercase tracking-tight">{t.name}</h3>
                  {t.short_description && (
                    <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">{t.short_description}</p>
                  )}
                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground font-body flex-1">
                    {t.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {fmtDate(new Date(t.start_date), "MMM d, yyyy — HH:mm")}
                      </div>
                    )}
                    {t.format && (
                      <div className="flex items-center gap-2">
                        <Swords className="h-3.5 w-3.5" />{t.format}
                      </div>
                    )}
                    {t.max_teams && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />Up to {t.max_teams} teams
                      </div>
                    )}
                  </div>
                  <Link to={`/tournaments/${t.slug || t.id}`} className="mt-4">
                    <Button variant="neonOutline" size="sm" className="w-full uppercase tracking-wider">
                      View Details<ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RULES / FAQ */}
        <section className="mb-14">
          <h2 className="text-3xl font-display font-bold uppercase tracking-tight mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />Rules & FAQ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQ.map(item => (
              <div key={item.q} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-display font-bold uppercase tracking-tight text-sm">{item.q}</h3>
                <p className="text-sm text-muted-foreground font-body mt-2">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <DiscordCTA variant="inline" />
      </main>

      <Footer />
    </div>
  );
}
