import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import StatusPill from "@/components/leagues/StatusPill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import {
  Trophy, Users, ArrowRight, Mountain, Sparkles, MessageCircle,
  Shield, Star, CalendarClock, Flag, ListChecks, CheckCircle2, Hourglass, CalendarRange, Crown, Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DISCORD_INVITE } from "@/lib/links";
import { useGame } from "@/lib/game-context";
import { GAMES } from "@/lib/ranks";

interface LeagueListItem {
  id: string;
  name: string;
  slug: string;
  game: string;
  description: string | null;
  reward_text: string | null;
  banner_url: string | null;
  status: string;
  max_teams: number;
  current_season?: {
    id: string;
    name: string;
    status: string;
    min_team_count?: number;
    recommended_min_teams?: number;
    recommended_max_teams?: number;
    format_status?: string;
    schedule_status?: string;
    generated_format?: any;
    registration_deadline?: string | null;
  } | null;
  team_count: number;
  pending_count: number;
}

type Tab = "all" | "registration_open" | "active" | "upcoming" | "completed";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "registration_open", label: "Registration Open" },
  { id: "active", label: "Active Season" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
];

const ROADMAP = [
  { name: "Challenger League", game: "Valorant", note: "Mid-tier circuit between Open Cup and Peak League." },
  { name: "Community League", game: "Valorant", note: "Casual weekly bracket for newer rosters." },
  { name: "CS2 League", game: "CS2", note: "Launches when CS2 mode goes live." },
  { name: "Rainbow Six League", game: "Rainbow Six Siege", note: "Launches when R6 mode goes live." },
];

function statusToTab(s: string): Tab {
  if (s === "registration_open") return "registration_open";
  if (s === "ongoing" || s === "playoffs" || s === "registration_closed") return "active";
  if (s === "draft") return "upcoming";
  if (s === "completed") return "completed";
  return "all";
}

export default function LeaguesPage() {
  const { selectedGame } = useGame();
  const [leagues, setLeagues] = useState<LeagueListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [gameFilter, setGameFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data: ls } = await supabase
        .from("leagues")
        .select("id, name, slug, game, description, reward_text, banner_url, status, max_teams")
        .order("created_at", { ascending: false });
      const list = ls ?? [];
      const enriched = await Promise.all(list.map(async (l): Promise<LeagueListItem> => {
        const { data: seasons } = await supabase
          .from("league_seasons")
          .select("id, name, status, min_team_count, recommended_min_teams, recommended_max_teams, format_status, schedule_status, generated_format, registration_deadline")
          .eq("league_id", l.id)
          .order("season_number", { ascending: false })
          .limit(1);
        const current = seasons?.[0] ?? null;
        let team_count = 0;
        let pending_count = 0;
        if (current) {
          // Count only approved registrations whose team is real (non-demo) — must match Teams tab.
          const { data: regs } = await supabase
            .from("league_registrations")
            .select("team_id, status")
            .eq("season_id", current.id)
            .in("status", ["approved", "pending"]);
          const approvedIds = (regs ?? []).filter((r: any) => r.status === "approved").map((r: any) => r.team_id);
          const pendingIds = (regs ?? []).filter((r: any) => r.status === "pending").map((r: any) => r.team_id);
          const ids = approvedIds;
          if (ids.length) {
            const { count } = await supabase
              .from("teams")
              .select("id", { count: "exact", head: true })
              .in("id", ids)
              .eq("is_demo", false);
            team_count = count ?? 0;
          }
          if (pendingIds.length) {
            const { count } = await supabase
              .from("teams")
              .select("id", { count: "exact", head: true })
              .in("id", pendingIds)
              .eq("is_demo", false);
            pending_count = count ?? 0;
          }
        }
        return { ...l, current_season: current, team_count, pending_count };
      }));
      setLeagues(enriched);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return leagues.filter(l => {
      if (gameFilter !== "all" && l.game !== gameFilter) return false;
      if (tab === "all") return true;
      const status = l.current_season?.status ?? l.status;
      return statusToTab(status) === tab;
    });
  }, [leagues, tab, gameFilter]);

  const featured = useMemo(() => {
    return (
      leagues.find(l => (l.current_season?.status ?? l.status) === "registration_open") ||
      leagues.find(l => ["ongoing", "playoffs"].includes(l.current_season?.status ?? l.status)) ||
      leagues[0] ||
      null
    );
  }, [leagues]);

  const stats = useMemo(() => {
    const active = leagues.filter(l => ["ongoing", "playoffs"].includes(l.current_season?.status ?? "")).length;
    const regOpen = leagues.filter(l => (l.current_season?.status ?? l.status) === "registration_open").length;
    const teamsRegistered = leagues.reduce((sum, l) => sum + (l.team_count || 0), 0);
    const openSlots = leagues.reduce((sum, l) => {
      if ((l.current_season?.status ?? l.status) !== "registration_open") return sum;
      return sum + Math.max(0, (l.max_teams || 0) - (l.team_count || 0));
    }, 0);
    return { active, regOpen, teamsRegistered, openSlots };
  }, [leagues]);

  const renderCard = (l: LeagueListItem, isFeatured = false) => {
    const status = l.current_season?.status ?? l.status;
    const isOpen = status === "registration_open";
    const minTeams = l.current_season?.min_team_count ?? 4;
    const recMin = l.current_season?.recommended_min_teams ?? 8;
    const recMax = l.current_season?.recommended_max_teams ?? 12;
    const fmt = l.current_season?.generated_format;
    const formatGenerated = l.current_season?.format_status === "generated" && !!fmt;
    const scheduleGenerated = l.current_season?.schedule_status === "generated";
    const pct = Math.min(100, ((l.team_count || 0) / Math.max(1, recMax)) * 100);
    const gameName = GAMES.find(g => g.id === l.game)?.name ?? l.game;

    return (
      <Card
        key={l.id}
        className={`overflow-hidden transition-all hover:border-primary/50 hover:shadow-[0_0_30px_-12px_hsl(var(--primary)/0.5)] ${
          isFeatured ? "border-primary/40 neon-border" : ""
        }`}
      >
        {l.banner_url && (
          <div
            className={`bg-cover bg-center relative ${isFeatured ? "h-48 md:h-56" : "h-32"}`}
            style={{ backgroundImage: `url(${l.banner_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            {isFeatured && (
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-primary text-primary-foreground text-[10px] font-display uppercase tracking-widest">
                  <Star className="h-3 w-3" />Featured Season
                </span>
              </div>
            )}
          </div>
        )}
        <div className={isFeatured ? "p-6 md:p-8" : "p-5"}>
          <div className="flex items-start justify-between mb-3 gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">
                {gameName} · Europe · {l.current_season?.name ?? "No active season"}
              </div>
              <h3 className={`font-display font-bold uppercase tracking-tight ${isFeatured ? "text-2xl md:text-3xl" : "text-xl"}`}>
                {l.name}
              </h3>
            </div>
            <StatusPill status={status} />
          </div>
          {l.description && (
            <p className={`text-sm text-muted-foreground mb-4 ${isFeatured ? "" : "line-clamp-2"}`}>
              {l.description}
            </p>
          )}

          {l.current_season && (
            <div className="mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Stat icon={CheckCircle2} tone="success" label="Approved" value={l.team_count} />
                <Stat icon={Hourglass} tone="accent" label="Pending" value={l.pending_count} />
                <Stat icon={Shield} tone="muted" label="Min required" value={minTeams} />
                <Stat icon={CalendarRange} tone="muted" label="Recommended" value={`${recMin}–${recMax}`} />
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  <span>Approved teams</span>
                  <span>{l.team_count} / {recMax} target</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                {l.team_count < minTeams && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Minimum {minTeams} approved teams required to start.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider">
                <div className={`rounded-sm border px-2 py-1.5 flex items-center gap-1.5 ${formatGenerated ? "border-success/40 text-success bg-success/5" : "border-border text-muted-foreground bg-card/40"}`}>
                  <ListChecks className="h-3 w-3" />
                  Format: {formatGenerated ? "Generated" : "Pending"}
                </div>
                <div className={`rounded-sm border px-2 py-1.5 flex items-center gap-1.5 ${scheduleGenerated ? "border-success/40 text-success bg-success/5" : "border-border text-muted-foreground bg-card/40"}`}>
                  <CalendarClock className="h-3 w-3" />
                  Schedule: {scheduleGenerated ? "Generated" : "Locked"}
                </div>
              </div>
              {formatGenerated && fmt && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-[11px] space-y-1">
                  <div className="font-display uppercase tracking-wider text-[10px] text-primary flex items-center gap-1.5">
                    <Crown className="h-3 w-3" /> Generated format
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-foreground/90">
                    <span className="text-muted-foreground">Teams</span><span>{fmt.teams}</span>
                    <span className="text-muted-foreground">Mode</span><span className="uppercase">{String(fmt.mode ?? "").replace(/_/g, " ")}</span>
                    {fmt.matchdays != null && (<><span className="text-muted-foreground">Matchdays</span><span>{fmt.matchdays}</span></>)}
                    {fmt.total_matches != null && (<><span className="text-muted-foreground">Total matches</span><span>{fmt.total_matches}</span></>)}
                    {fmt.playoff_label && (<><span className="text-muted-foreground">Playoffs</span><span>{fmt.playoff_label}</span></>)}
                    {fmt.regular_match_format && (<><span className="text-muted-foreground">Regular</span><span>{fmt.regular_match_format}</span></>)}
                    {fmt.playoff_match_format && (<><span className="text-muted-foreground">Playoff</span><span>{fmt.playoff_match_format}</span></>)}
                    {typeof fmt.teams === "number" && fmt.teams % 2 === 1 && (<><span className="text-muted-foreground">Bye weeks</span><span>Enabled</span></>)}
                  </div>
                </div>
              )}
              {!l.current_season && (
                <p className="text-xs text-muted-foreground">No active season yet.</p>
              )}
              {l.current_season && l.team_count === 0 && (
                <p className="text-xs text-muted-foreground">No teams approved yet. Applications are open.</p>
              )}
              {isOpen && !formatGenerated && l.team_count >= minTeams && (
                <p className="text-xs text-muted-foreground">Final format will be generated once registrations close.</p>
              )}
            </div>
          )}

          {l.reward_text && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <Trophy className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="text-foreground">{l.reward_text}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant={isFeatured ? "neon" : "default"} className="flex-1 uppercase tracking-wider">
              <Link to={`/leagues/${l.id}`}>
                View League<ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            {isFeatured && isOpen && (
              <Button asChild variant="neonOutline" className="flex-1 uppercase tracking-wider">
                <Link to={`/leagues/${l.slug ?? l.id}#teams`}>
                  <Users className="h-4 w-4 mr-1" />Apply With Team
                </Link>
              </Button>
            )}
            {status === "draft" && (
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="neonOutline" className="w-full uppercase tracking-wider">
                  Get Notified
                </Button>
              </a>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const showStat = (n: number) => n > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="PeakGG League Hub — Competitive FPS Leagues"
        description="Browse active and upcoming PeakGG leagues. Register your team for Peak League, Challenger League and more competitive FPS circuits in Europe."
        path="/leagues"
      />
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative border-b border-border bg-gradient-to-b from-primary/10 to-background overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="container relative py-12 md:py-16">
            <div className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-primary mb-3">
              <Mountain className="h-4 w-4" /> PeakGG / Peak League
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl uppercase tracking-tight">
              Peak <span className="text-primary">League</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Europe's community-driven Valorant league. Teams apply. Admins approve. The season format is generated from the final approved teams.
            </p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 max-w-5xl">
              {[
                { icon: Users, label: "Dynamic Team Count" },
                { icon: CheckCircle2, label: "Admin-Approved Teams" },
                { icon: CalendarClock, label: "Auto Schedule" },
                { icon: ListChecks, label: "Live Standings" },
                { icon: Trophy, label: "Public Results" },
                { icon: Crown, label: "Playoffs + Champion" },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-border bg-card/60 px-3 py-2.5 flex items-center gap-2">
                  <s.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-[11px] font-display uppercase tracking-wider text-foreground/80 leading-tight">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <a href="#leagues-list">
                <Button variant="neon" size="lg" className="uppercase tracking-wider">
                  <Trophy className="h-4 w-4 mr-2" />Current Season
                </Button>
              </a>
              <Link to="/teams">
                <Button variant="neonOutline" size="lg" className="uppercase tracking-wider">
                  <Users className="h-4 w-4 mr-2" />Create Team
                </Button>
              </Link>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                <Button variant="neonOutline" size="lg" className="uppercase tracking-wider">
                  <MessageCircle className="h-4 w-4 mr-2" />Join Discord
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* FEATURED */}
        {!loading && featured && (
          <section className="container pt-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display uppercase tracking-widest text-xs text-muted-foreground">Featured Season</h2>
            </div>
            {renderCard(featured, true)}
          </section>
        )}

        {/* FILTERS + LIST */}
        <section id="leagues-list" className="container py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="font-display text-2xl uppercase tracking-tight">All Leagues</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider border transition-all ${
                      tab === t.id
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-card hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[{ id: "all", label: "All Games" }, ...GAMES.map(g => ({ id: g.id, label: g.name }))].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGameFilter(g.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider border transition-all ${
                      gameFilter === g.id
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-card hover:border-accent/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[0, 1].map(i => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No leagues in this category yet"
              description="New seasons will appear here once registration opens. Join Discord to be notified first."
              ctaLabel="Join Discord"
              ctaOnClick={() => window.open(DISCORD_INVITE, "_blank")}
              secondaryLabel="Create Team"
              secondaryTo="/teams"
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map(l => renderCard(l, false))}
            </div>
          )}
        </section>

        {/* UPCOMING ROADMAP */}
        <section className="container pb-10">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-4 w-4 text-accent" />
            <h2 className="font-display uppercase tracking-widest text-xs text-muted-foreground">Upcoming Opportunities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROADMAP.map(r => (
              <div key={r.name} className="rounded-lg border border-dashed border-border bg-card/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                    <Flag className="inline h-3 w-3 mr-1" />{r.game}
                  </span>
                  <span className="text-[10px] font-display uppercase tracking-widest text-accent">Coming Soon</span>
                </div>
                <h3 className="font-display font-bold uppercase tracking-tight">{r.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
              <Button variant="neonOutline" size="sm" className="uppercase tracking-wider">
                <MessageCircle className="h-4 w-4 mr-2" />Join Discord for updates
              </Button>
            </a>
          </div>
        </section>

        {/* WHY PEAK LEAGUE */}
        <section className="container pb-16">
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <Shield className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-display uppercase tracking-tight font-bold">Verified Rosters</h3>
                <p className="text-sm text-muted-foreground mt-1">Anti-smurf checks and captain controls keep matches fair.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Trophy className="h-6 w-6 text-accent shrink-0" />
              <div>
                <h3 className="font-display uppercase tracking-tight font-bold">Real Rewards</h3>
                <p className="text-sm text-muted-foreground mt-1">Seasonal badges, trophies and qualification paths — no fake prize pools.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-display uppercase tracking-tight font-bold">Built for Europe</h3>
                <p className="text-sm text-muted-foreground mt-1">EU-Brussels timezone, structured matchdays, captain confirmation flow.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
