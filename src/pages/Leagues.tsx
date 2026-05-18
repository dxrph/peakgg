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
  Trophy, Users, ArrowRight, MessageCircle, Shield, CalendarClock, Flag,
  ListChecks, CheckCircle2, Crown, ChevronRight, Swords, ClipboardCheck,
  Sparkles, Radio, Eye, History, Globe2,
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

const HOW_STEPS = [
  { n: "01", icon: Users, title: "Create Your Team", desc: "Set up your roster and invite your players." },
  { n: "02", icon: ClipboardCheck, title: "Apply To The League", desc: "Submit your team for Season 0 Beta." },
  { n: "03", icon: Shield, title: "Staff Review", desc: "Admins approve valid rosters." },
  { n: "04", icon: ListChecks, title: "Format Generated", desc: "The season adapts to approved teams." },
  { n: "05", icon: Swords, title: "Play Matchdays", desc: "Compete, submit results and climb standings." },
  { n: "06", icon: Crown, title: "Playoffs", desc: "Top teams fight for champion status." },
];

const WHY = [
  { icon: Eye, title: "Get Discovered", desc: "Build your team history on PeakGG." },
  { icon: ListChecks, title: "Real Structure", desc: "Standings, results, playoffs and public records." },
  { icon: Globe2, title: "Community Competition", desc: "Compete against other European teams and communities." },
  { icon: History, title: "Founding Status", desc: "Early teams become part of PeakGG history." },
];

const FEATURES = [
  { icon: Users, title: "Build Your Roster", desc: "Create your team and apply for the season." },
  { icon: Shield, title: "Staff-Approved Competition", desc: "Only reviewed teams enter the league." },
  { icon: CalendarClock, title: "Matchdays + Standings", desc: "Every result updates the race to playoffs." },
  { icon: Crown, title: "Playoffs + Champion", desc: "Top teams fight for the Peak League title." },
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
          const { data: regs } = await supabase
            .from("league_registrations")
            .select("team_id, status")
            .eq("season_id", current.id)
            .in("status", ["approved", "pending"]);
          const approvedIds = (regs ?? []).filter((r: any) => r.status === "approved").map((r: any) => r.team_id);
          const pendingIds = (regs ?? []).filter((r: any) => r.status === "pending").map((r: any) => r.team_id);
          if (approvedIds.length) {
            const { count } = await supabase
              .from("teams").select("id", { count: "exact", head: true })
              .in("id", approvedIds).eq("is_demo", false);
            team_count = count ?? 0;
          }
          if (pendingIds.length) {
            const { count } = await supabase
              .from("teams").select("id", { count: "exact", head: true })
              .in("id", pendingIds).eq("is_demo", false);
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

  const featuredSlug = featured?.slug ?? featured?.id;
  const fStatus = featured?.current_season?.status ?? featured?.status ?? "draft";
  const fIsOpen = fStatus === "registration_open";
  const fMin = featured?.current_season?.min_team_count ?? 4;
  const fRecMin = featured?.current_season?.recommended_min_teams ?? 8;
  const fRecMax = featured?.current_season?.recommended_max_teams ?? 12;
  const fFmt = featured?.current_season?.generated_format;
  const fFormatGenerated = featured?.current_season?.format_status === "generated" && !!fFmt;
  const fApproved = featured?.team_count ?? 0;
  const fPct = Math.min(100, (fApproved / Math.max(1, fMin)) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Peak League — Europe's Competitive Valorant League | PeakGG"
        description="Apply with your team, climb the standings, and fight for the playoffs in Peak League — the competitive ladder for European Valorant teams on PeakGG."
        path="/leagues"
      />
      <Navbar />

      <main className="flex-1">
        {/* ============== HERO ============== */}
        <section className="relative overflow-hidden border-b border-border/60">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
          <div className="absolute inset-0 bg-grid-faint opacity-40 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/15 blur-[160px] pointer-events-none" />
          {/* Diagonal lines */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: "repeating-linear-gradient(115deg, hsl(var(--primary)) 0, hsl(var(--primary)) 1px, transparent 1px, transparent 22px)",
            }}
          />

          <div className="container relative py-16 md:py-24">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* LEFT */}
              <div className="lg:col-span-7">
                <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] font-display uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors">
                  PeakGG <ChevronRight className="h-3 w-3" /> <span className="text-primary">Peak League</span>
                </Link>

                <h1 className="mt-5 font-display font-bold uppercase leading-[0.92] tracking-tight text-6xl sm:text-7xl md:text-8xl lg:text-[8.5rem]">
                  Peak<br />
                  <span className="text-primary text-glow-red">League</span>
                </h1>

                <p className="mt-6 text-lg md:text-xl text-foreground/85 font-body max-w-xl">
                  The competitive ladder for European Valorant teams.
                </p>
                <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
                  Build your roster. Apply to the league. Compete through matchdays, climb the standings and fight for the playoffs.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3">
                  <Button asChild variant="neon" size="lg" className="ring-soft-primary">
                    <Link to={featuredSlug ? `/leagues/${featuredSlug}#teams` : "/teams"}>
                      <Users className="h-4 w-4" /> Apply With Team
                    </Link>
                  </Button>
                  <Button asChild variant="neonOutline" size="lg">
                    <Link to={featuredSlug ? `/leagues/${featuredSlug}` : "#leagues-list"}>
                      <Trophy className="h-4 w-4" /> View League
                    </Link>
                  </Button>
                  <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
                      <MessageCircle className="h-4 w-4" /> Join Discord
                    </Button>
                  </a>
                </div>
              </div>

              {/* RIGHT — Season status overlay panel */}
              <div className="lg:col-span-5">
                {loading || !featured ? (
                  <Skeleton className="h-[380px] rounded-xl" />
                ) : (
                  <div className="relative">
                    {/* Halo */}
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/40 via-transparent to-accent/30 blur-sm opacity-70" />
                    <div className="relative rounded-2xl border border-primary/30 bg-[linear-gradient(160deg,hsl(240_15%_9%_/0.95),hsl(240_18%_5%_/0.95))] overflow-hidden shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.5)]">
                      {/* Top strip */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-primary/20 bg-primary/[0.04]">
                        <div className="flex items-center gap-2">
                          <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
                          <span className="text-[10px] font-display uppercase tracking-[0.3em] text-primary">Season Status</span>
                        </div>
                        <StatusPill status={fStatus} />
                      </div>

                      <div className="p-6">
                        <div className="text-[11px] font-display uppercase tracking-[0.25em] text-muted-foreground">
                          {featured.current_season?.name ?? "Founding Season"}
                        </div>
                        <h2 className="mt-1 font-display font-bold uppercase text-3xl md:text-4xl tracking-tight">
                          {featured.name}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Europe · Valorant · Staff-approved teams only.
                        </p>

                        {/* Metric trio */}
                        <div className="mt-6 grid grid-cols-3 gap-3">
                          <MetricBig value={fApproved} label="Teams Approved" tone="primary" />
                          <MetricBig value={fMin} label="Needed To Start" />
                          <MetricBig value={`${fRecMin}–${fRecMax}`} label="Recommended" />
                        </div>

                        {/* Progress */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                            <span>Registration Progress</span>
                            <span className="text-foreground/80 font-display">{fApproved} approved / {fMin} needed</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary/60 overflow-hidden relative">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-700"
                              style={{ width: `${fPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Format line */}
                        <div className="mt-5 flex items-center gap-2 text-xs">
                          <ListChecks className={`h-3.5 w-3.5 ${fFormatGenerated ? "text-success" : "text-muted-foreground"}`} />
                          <span className="text-muted-foreground">Format:</span>
                          <span className={fFormatGenerated ? "text-success font-medium" : "text-foreground/80"}>
                            {fFormatGenerated ? "Generated" : "Not generated yet"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ============== FEATURE BLOCKS ============== */}
        <section className="container py-16 md:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative rounded-xl p-6 bg-[linear-gradient(160deg,hsl(240_15%_10%/0.9),hsl(240_18%_6%/0.9))] border border-border/60 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.5)]"
              >
                <div className="absolute top-3 right-4 text-[10px] font-display tracking-[0.25em] text-primary/40">0{i + 1}</div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-bold uppercase tracking-tight text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============== CURRENT SEASON FEATURE ============== */}
        {!loading && featured && (
          <section className="container pb-16 md:pb-24">
            <div className="text-center mb-10">
              <div className="eyebrow justify-center"><Sparkles className="h-3 w-3" /> Current Season</div>
              <h2 className="mt-3 font-display font-bold uppercase text-4xl md:text-5xl tracking-tight">
                {featured.current_season?.name ?? "Season 0 Beta"}
              </h2>
              <div className="mt-3 flex justify-center"><StatusPill status={fStatus} /></div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-border/70 bg-[linear-gradient(160deg,hsl(240_15%_9%),hsl(240_18%_5%))]">
              {/* Decorative */}
              <div className="absolute inset-0 bg-grid-faint opacity-30 pointer-events-none" />
              <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

              <div className="relative p-8 md:p-12">
                <p className="text-base md:text-lg text-foreground/85 max-w-3xl">
                  PeakGG's founding competitive season. Teams are reviewed by staff before entering the league.
                  The final format is generated from approved teams when registrations close.
                </p>

                {/* 3 big metrics */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <BigMetric value={fApproved} label="Teams Approved" highlight />
                  <BigMetric value={fMin} label="Needed To Start" />
                  <BigMetric value={`${fRecMin}–${fRecMax}`} label="Recommended" />
                </div>

                {/* Format message */}
                {!fFormatGenerated && (
                  <div className="mt-8 rounded-lg border border-primary/25 bg-primary/[0.04] px-5 py-4 flex items-center gap-3">
                    <ListChecks className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-sm text-foreground/85">
                      Final format will be generated once registrations close.
                    </p>
                  </div>
                )}

                {/* Generated format details */}
                {fFormatGenerated && fFmt && (
                  <div className="mt-8 rounded-xl border border-success/30 bg-success/[0.04] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Crown className="h-4 w-4 text-success" />
                      <span className="text-[11px] font-display uppercase tracking-[0.25em] text-success">Generated Format</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <FormatStat label="Teams" value={fFmt.teams} />
                      <FormatStat label="Format" value={String(fFmt.mode ?? "").replace(/_/g, " ")} />
                      {fFmt.matchdays != null && <FormatStat label="Matchdays" value={fFmt.matchdays} />}
                      {fFmt.total_matches != null && <FormatStat label="Total Matches" value={fFmt.total_matches} />}
                      {fFmt.playoff_label && <FormatStat label="Playoffs" value={fFmt.playoff_label} />}
                      {typeof fFmt.teams === "number" && fFmt.teams % 2 === 1 && <FormatStat label="Bye Weeks" value="Enabled" />}
                    </div>
                  </div>
                )}

                {/* Big progress */}
                <div className="mt-8">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-[11px] font-display uppercase tracking-[0.25em] text-muted-foreground">Road To Kickoff</span>
                    <span className="font-display text-lg">
                      <span className="text-primary text-2xl">{fApproved}</span>
                      <span className="text-muted-foreground"> approved / {fMin} needed to start</span>
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary/60 overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent shadow-[0_0_20px_hsl(var(--primary)/0.6)] transition-all duration-700"
                      style={{ width: `${fPct}%` }}
                    />
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-10 flex flex-col sm:flex-row gap-3">
                  {fIsOpen && (
                    <Button asChild variant="neon" size="lg" className="ring-soft-primary">
                      <Link to={`/leagues/${featuredSlug}#teams`}>
                        <Users className="h-4 w-4" /> Apply With Team
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="neonOutline" size="lg">
                    <Link to={`/leagues/${featuredSlug}`}>
                      <Trophy className="h-4 w-4" /> View League <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============== HOW IT WORKS ============== */}
        <section className="relative py-20 md:py-24 border-y border-border/60 overflow-hidden">
          <div className="absolute inset-0 bg-[#0a0a0a]/40" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="container relative">
            <div className="text-center mb-14">
              <div className="eyebrow justify-center"><CalendarClock className="h-3 w-3" /> Roadmap</div>
              <h2 className="mt-3 font-display font-bold uppercase text-4xl md:text-5xl tracking-tight">
                How <span className="text-primary text-glow-red">Peak League</span> Works
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Six steps from team creation to lifting the trophy.
              </p>
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-4">
              <div className="hidden lg:block absolute top-[3.25rem] left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              {HOW_STEPS.map((s, i) => (
                <div key={s.n} className="relative text-center px-2">
                  <div className="relative mx-auto w-24 h-24 mb-5">
                    <div className="absolute inset-0 rounded-full bg-primary/[0.06] border border-primary/30 flex items-center justify-center backdrop-blur-sm">
                      <s.icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="absolute -top-1 -right-1 text-2xl font-display font-bold text-primary text-glow-red bg-background px-1.5 rounded">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="font-display font-bold uppercase tracking-tight">{s.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[16ch] mx-auto">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============== WHY TEAMS JOIN ============== */}
        <section className="container py-20 md:py-24">
          <div className="text-center mb-12">
            <div className="eyebrow justify-center"><Trophy className="h-3 w-3" /> The Edge</div>
            <h2 className="mt-3 font-display font-bold uppercase text-4xl md:text-5xl tracking-tight">
              Why Teams Join
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY.map((w, i) => (
              <div
                key={w.title}
                className="group relative rounded-xl overflow-hidden border border-border/60 bg-[linear-gradient(160deg,hsl(240_15%_10%/0.92),hsl(240_18%_5%/0.92))] p-6 hover:border-accent/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <w.icon className="h-7 w-7 text-accent mb-4" />
                <h3 className="font-display font-bold uppercase tracking-tight text-lg">{w.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============== ALL LEAGUES ============== */}
        <section id="leagues-list" className="container pt-2 pb-20">
          <div className="rounded-xl border border-border/60 bg-card/30 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 md:px-7 pt-5 pb-4 border-b border-border/60 bg-gradient-to-r from-card/60 via-card/30 to-transparent">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <div className="eyebrow text-[10px]"><Flag className="h-3 w-3" /> Browse</div>
                  <h2 className="mt-1.5 font-display font-bold uppercase text-2xl md:text-[1.75rem] tracking-tight leading-none whitespace-nowrap">
                    All Leagues
                  </h2>
                </div>
                <span className="text-[11px] font-display uppercase tracking-[0.2em] text-muted-foreground pb-0.5">
                  {filtered.length} {filtered.length === 1 ? "league" : "leagues"}
                </span>
              </div>

              {/* Filters row */}
              <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
                <FilterGroup label="Status">
                  {TABS.map(t => (
                    <FilterPill
                      key={t.id}
                      active={tab === t.id}
                      tone="primary"
                      onClick={() => setTab(t.id)}
                    >
                      {t.label}
                    </FilterPill>
                  ))}
                </FilterGroup>
                <div className="hidden md:block h-8 w-px bg-border/70 shrink-0" />
                <FilterGroup label="Game">
                  {[{ id: "all", label: "All" }, ...GAMES.map(g => ({ id: g.id, label: g.name }))].map(g => (
                    <FilterPill
                      key={g.id}
                      active={gameFilter === g.id}
                      tone="accent"
                      onClick={() => setGameFilter(g.id)}
                    >
                      {g.label}
                    </FilterPill>
                  ))}
                </FilterGroup>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 md:p-7">
              {loading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[0, 1].map(i => <Skeleton key={i} className="h-56" />)}
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
                  {filtered.map(l => <LeagueCard key={l.id} l={l} />)}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============== UPCOMING ROADMAP ============== */}
        <section className="container pb-20">
          <div className="flex items-center gap-2 mb-5">
            <CalendarClock className="h-4 w-4 text-accent" />
            <h2 className="font-display uppercase tracking-[0.25em] text-xs text-muted-foreground">Upcoming Opportunities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROADMAP.map(r => (
              <div key={r.name} className="rounded-xl border border-dashed border-border/70 bg-card/30 p-5 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-display uppercase tracking-[0.2em] text-muted-foreground">
                    <Flag className="inline h-3 w-3 mr-1" />{r.game}
                  </span>
                  <span className="text-[10px] font-display uppercase tracking-[0.2em] text-accent">Coming Soon</span>
                </div>
                <h3 className="font-display font-bold uppercase tracking-tight">{r.name}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{r.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <MessageCircle className="h-4 w-4" /> Join Discord for updates
              </Button>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

/* ─────────── Helpers ─────────── */

function MetricBig({ value, label, tone }: { value: string | number; label: string; tone?: "primary" }) {
  return (
    <div className="rounded-lg bg-background/60 border border-border/60 p-3 text-center">
      <div className={`font-display font-bold text-2xl md:text-3xl leading-none ${tone === "primary" ? "text-primary text-glow-red" : "text-foreground"}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground leading-tight">{label}</div>
    </div>
  );
}

function BigMetric({ value, label, highlight }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <div className={`relative rounded-xl border p-6 text-center overflow-hidden ${highlight ? "border-primary/40 bg-primary/[0.06]" : "border-border/60 bg-background/40"}`}>
      {highlight && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />}
      <div className={`font-display font-bold text-5xl md:text-6xl leading-none tracking-tight ${highlight ? "text-primary text-glow-red" : "text-foreground"}`}>
        {value}
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
    </div>
  );
}

function FormatStat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg capitalize">{String(value)}</div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="hidden md:inline text-[10px] font-display uppercase tracking-[0.22em] text-muted-foreground/70 shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
        {children}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "primary" | "accent";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeCls =
    tone === "primary"
      ? "bg-primary/15 text-primary border-primary/50 shadow-[0_0_18px_-6px_hsl(var(--primary)/0.6)]"
      : "bg-accent/15 text-accent border-accent/50 shadow-[0_0_18px_-6px_hsl(var(--accent)/0.6)]";
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-8 px-3.5 rounded-full text-[11px] font-display uppercase tracking-[0.12em] transition-all border ${
        active
          ? activeCls
          : "bg-transparent text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
      }`}
    >
      {children}
    </button>
  );
}

function LeagueCard({ l }: { l: LeagueListItem }) {
  const status = l.current_season?.status ?? l.status;
  const isOpen = status === "registration_open";
  const minTeams = l.current_season?.min_team_count ?? 4;
  const fmt = l.current_season?.generated_format;
  const formatGenerated = l.current_season?.format_status === "generated" && !!fmt;
  const pct = Math.min(100, ((l.team_count || 0) / Math.max(1, minTeams)) * 100);
  const gameName = GAMES.find(g => g.id === l.game)?.name ?? l.game;

  return (
    <Card className="group overflow-hidden border-border/60 bg-[linear-gradient(160deg,hsl(240_15%_9%/0.95),hsl(240_18%_5%/0.95))] hover:border-primary/40 transition-all duration-300 hover:shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.4)]">
      {l.banner_url ? (
        <div
          className="h-36 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${l.banner_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        </div>
      ) : (
        <div className="h-2 bg-gradient-to-r from-primary via-primary/60 to-accent" />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="text-[10px] font-display uppercase tracking-[0.22em] text-muted-foreground mb-1">
              {gameName} · Europe
            </div>
            <h3 className="font-display font-bold uppercase tracking-tight text-2xl">{l.name}</h3>
            {l.current_season?.name && (
              <div className="text-xs text-muted-foreground mt-1">{l.current_season.name}</div>
            )}
          </div>
          <StatusPill status={status} />
        </div>

        {l.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{l.description}</p>
        )}

        {l.current_season && (
          <>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
              <span>Approved Teams</span>
              <span className="text-foreground/80">{l.team_count} approved / {minTeams} needed to start</span>
            </div>
            <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-5">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className={`h-3 w-3 ${formatGenerated ? "text-success" : "text-muted-foreground"}`} />
                {formatGenerated ? "Format generated" : "Format not generated yet"}
              </span>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="neon" className="flex-1">
            <Link to={`/leagues/${l.slug ?? l.id}`}>
              View League <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {isOpen && (
            <Button asChild variant="neonOutline" className="flex-1">
              <Link to={`/leagues/${l.slug ?? l.id}#teams`}>
                <Users className="h-4 w-4" /> Apply
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
