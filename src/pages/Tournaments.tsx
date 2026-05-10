import { Link, useNavigate } from "react-router-dom";
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

// Thresholds for cup unlocks (ELO-based)
const CHALLENGER_ELO = 1200;
const CHAMPIONSHIP_ELO = 1800;

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
    rewards: ["+25 ELO per win", "−15 ELO per loss", "Open Cup badge"],
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
  { q: "How does my ELO change?", a: "Open Cup matches use the same ELO system as ranked matches: about +25 for a win and −15 for a loss, adjusted for opponent strength." },
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
    if (error) { toast.error(error.message); return; }
    const result = data as any;
    if (result?.status === "matched" && result.match_id) {
      toast.success("Match found!");
      navigate(`/matches/${result.match_id}`);
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {seo}
      <Navbar />

      <main className="container pt-24 pb-16 flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-12 mb-12 neon-border">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative max-w-3xl">
            <Badge variant="outline" className="border-primary/40 text-primary font-display uppercase tracking-widest text-[10px] mb-4">
              Season 0 Beta
            </Badge>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight">
              Tournaments
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-body mt-4">
              Compete solo. <span className="text-foreground">Increase your ELO.</span> Unlock higher cups.
            </p>

            {/* Open Cup Queue widget */}
            {queueEnabled ? (
            <div className="mt-6 rounded-xl border border-primary/30 bg-secondary/40 p-4 max-w-2xl">
              {activeMatch ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-display uppercase tracking-widest text-success">Active Open Cup match</div>
                    <div className="text-sm font-body text-muted-foreground">Status: {activeMatch.result_status}</div>
                  </div>
                  <Link to={`/matches/${activeMatch.id}`}>
                    <Button variant="neon" size="sm" className="uppercase tracking-wider">Open Match<ArrowRight className="ml-2 h-3 w-3" /></Button>
                  </Link>
                </div>
              ) : queueEntry ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div>
                      <div className="text-[10px] font-display uppercase tracking-widest text-primary">Searching for opponents</div>
                      <div className="text-sm font-body text-muted-foreground">{queueEntry.team_size}v{queueEntry.team_size} · {queueEntry.game}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={cancelQueue}><X className="h-3 w-3 mr-1.5" />Cancel</Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                      Solo Queue · Open Cup {isAdmin && !openCupPublicQueueEnabled && <span className="text-accent ml-1">· Admin Test</span>}
                    </div>
                    <div className="text-sm font-body">
                      {user ? <>Your ELO: <span className="text-foreground font-medium">{myElo}</span> · Rank: <span style={{color: myRank.hex}}>{myRank.name}</span></> : "Sign in to play your first Open Cup match"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/40 text-primary font-display uppercase text-[10px]">1v1 Test</Badge>
                    <Button variant="neon" size="sm" onClick={joinQueue} disabled={joining} className="uppercase tracking-wider">
                      <Zap className="h-3 w-3 mr-1.5" />Join Open Cup
                    </Button>
                  </div>
                </div>
              )}
            </div>
            ) : (
              <div className="mt-6 rounded-xl border border-primary/30 bg-secondary/40 p-4 max-w-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-display uppercase tracking-widest text-accent">Closed Beta</div>
                    <div className="text-sm font-body text-muted-foreground">
                      Open Cup matchmaking is in closed beta. Join Discord to access early tests.
                    </div>
                  </div>
                  <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                    <Button variant="neon" size="sm" className="uppercase tracking-wider">
                      <MessageCircle className="h-3 w-3 mr-1.5" />Join Discord for Open Cup Beta
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* TWO PATHS OVERVIEW */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          <div className="rounded-xl border border-success/30 bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/15 border border-success/40 flex items-center justify-center">
                <User className="h-5 w-5 text-success" />
              </div>
              <h2 className="text-2xl font-display font-bold">Solo Queue Cups</h2>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Join alone. We create a temporary team for the cup. Each confirmed result updates your personal ELO.
            </p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold">Team Tournaments</h2>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Captain registers a full roster. Results count for the team — built for orgs and established lineups. Coming after Season 0 Beta.
            </p>
          </div>
        </section>

        {/* SOLO QUEUE PATH */}
        <section id="solo-path" className="mb-14">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-3xl font-display font-bold uppercase tracking-tight">Solo Queue Cup Path</h2>
              <p className="text-sm text-muted-foreground font-body mt-1">Three tiers. Climb with ELO from confirmed results.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SOLO_TIERS.map((tier, i) => {
              const Icon = tier.icon;
              const isOpen = tier.id === "open";
              const unlocked = tier.id === "open"
                ? true
                : tier.id === "challenger" ? myElo >= CHALLENGER_ELO
                : myElo >= CHAMPIONSHIP_ELO;
              const progressTo = tier.id === "challenger" ? CHALLENGER_ELO : tier.id === "championship" ? CHAMPIONSHIP_ELO : null;
              return (
                <div
                  key={tier.id}
                  className={`relative rounded-xl border bg-card p-6 flex flex-col transition-all hover:border-primary/40 ${
                    !unlocked && !isOpen ? "opacity-90" : ""
                  } ${i === 0 ? "border-success/30" : "border-border"}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${tier.accent} bg-card`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-display text-[10px] uppercase tracking-wider ${tier.accent}`}
                    >
                      {!unlocked && !isOpen && <Lock className="h-3 w-3 mr-1" />}
                      {isOpen ? "Open · Beta" : (unlocked ? "Unlocked" : tier.status)}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-display font-bold uppercase">{tier.name}</h3>
                  <p className="text-xs font-display uppercase tracking-wider text-muted-foreground mt-1">
                    Tier {i + 1}
                  </p>
                  <p className="text-sm text-muted-foreground font-body mt-3">{tier.tagline}</p>

                  <div className="mt-4 rounded-md border border-border bg-secondary/30 p-3">
                    <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-1">Requirement</p>
                    <p className="text-sm font-body">{tier.unlock}</p>
                    {user && progressTo && !unlocked && (
                      <p className="text-[11px] mt-1 text-muted-foreground">{myElo} / {progressTo} ELO</p>
                    )}
                  </div>

                  <div className="mt-4 flex-1">
                    <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-2">Rewards</p>
                    <ul className="space-y-1.5">
                      {tier.rewards.map(r => (
                        <li key={r} className="flex items-center gap-2 text-sm font-body">
                          <Award className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5">
                    {isOpen ? (
                      queueEnabled ? (
                        <Button variant="neon" className="w-full uppercase tracking-wider" onClick={joinQueue} disabled={joining || !!queueEntry || !!activeMatch}>
                          {activeMatch ? "Match in progress" : queueEntry ? "In queue…" : (isAdmin && !openCupPublicQueueEnabled ? "Join Open Cup (Admin Test)" : "Join Open Cup")}<ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      ) : (
                        <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="block">
                          <Button variant="neon" className="w-full uppercase tracking-wider">
                            <MessageCircle className="h-3 w-3 mr-1.5" />Join Discord for Open Cup Beta
                          </Button>
                        </a>
                      )
                    ) : unlocked ? (
                      <Button variant="neonOutline" className="w-full uppercase tracking-wider" disabled>
                        Coming Soon
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button variant="neonOutline" className="w-full uppercase tracking-wider" disabled>
                          <Lock className="h-3 w-3 mr-1.5" />{tier.id === "championship" ? "Invite-only" : "Locked"}
                        </Button>
                        <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="block">
                          <Button variant="ghost" size="sm" className="w-full uppercase tracking-wider text-xs">
                            <MessageCircle className="h-3 w-3 mr-1.5" />Join Discord
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mb-14">
          <h2 className="text-3xl font-display font-bold uppercase tracking-tight mb-6">How Solo Queue Cups Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="rounded-xl border border-border bg-card p-5 relative">
                  <div className="absolute top-3 right-3 text-xs font-display font-bold text-muted-foreground/50">
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

        {/* TEAM TOURNAMENTS */}
        <section className="mb-14">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-3xl font-display font-bold uppercase tracking-tight">Team Tournaments</h2>
              <p className="text-sm text-muted-foreground font-body mt-1">For full rosters. Captain registers, team plays.</p>
            </div>
            <Link to="/teams">
              <Button variant="neonOutline" size="sm" className="uppercase tracking-wider">
                <Users className="mr-2 h-3 w-3" />Create Team
              </Button>
            </Link>
          </div>

          {teamTournaments.length === 0 ? (
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
              {teamTournaments.map(t => (
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
