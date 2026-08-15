import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Search, Users, Loader2, Star, ShieldCheck, Sparkles, Globe2, MessageSquare, Filter as FilterIcon, UserPlus, Target, RotateCcw, ChevronDown, Trophy, Compass, Radio, CheckCircle2, ArrowRight, Eye, Gamepad2, MapPin, Languages, Clock, BadgeCheck, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { GAMES, getActiveGames, getRankByElo, type GameId } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";
import GameIcon from "@/components/GameIcon";
import { useAuth } from "@/hooks/useAuth";
import { DISCORD_INVITE } from "@/lib/links";
import {
  handleCompleteFreeAgentProfile,
  freeAgentCtaLabel,
  isFreeAgentListed,
} from "@/lib/free-agent";
import PartyFinderBoard from "@/components/competitive/PartyFinderBoard";

type AgentRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  language: string | null;
  preferred_game: string | null;
  role: string | null;
  availability: string | null;
  reputation_score: number;
  account_verified: boolean;
  smurf_risk_score: number;
  last_active_at: string;
  fast_track: boolean;
  preferred_team_type: string | null;
  // joined
  best_elo?: number;
  best_game?: GameId;
};

const REGIONS = ["EU", "EU-West", "EU-East", "EU-North", "EU-South"];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
];
const VALORANT_ROLES = ["Duelist", "Controller", "Initiator", "Sentinel", "Flex", "IGL"];
const COMPETITIVE_GOALS = [
  { value: "casual", label: "Casual" },
  { value: "ranked", label: "Ranked Grind" },
  { value: "tournaments", label: "Tournaments" },
  { value: "longterm", label: "Long-term Team" },
];

export default function FreeAgentsPage() {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const onCompleteCta = () => handleCompleteFreeAgentProfile(user, navigate);
  const ctaLabel = freeAgentCtaLabel(user, profile);
  const alreadyListed = isFreeAgentListed(profile);
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [game, setGame] = useState<"all" | GameId>("all");
  const [eloRange, setEloRange] = useState<[number, number]>([0, 3000]);
  const [region, setRegion] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [minRep, setMinRep] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [noSmurf, setNoSmurf] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [goalFilter, setGoalFilter] = useState<string>("all");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: profs } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, bio, region, language, preferred_game, role, availability, reputation_score, account_verified, smurf_risk_score, last_active_at, fast_track, preferred_team_type"
        )
        .eq("looking_for_team", true)
        .eq("is_banned", false)
        // Only profiles that are "complete enough" should appear publicly.
        .not("preferred_game", "is", null)
        .not("role", "is", null)
        .not("region", "is", null)
        .not("availability", "is", null)
        .order("last_active_at", { ascending: false })
        .limit(200);
      const list = (profs as AgentRow[]) ?? [];

      // Fetch best ELO per player
      if (list.length > 0) {
        const ids = list.map((p) => p.id);
        const { data: stats } = await supabase
          .from("player_stats")
          .select("user_id, game, elo")
          .in("user_id", ids);
        const bestByUser = new Map<string, { elo: number; game: GameId }>();
        (stats ?? []).forEach((s: any) => {
          const cur = bestByUser.get(s.user_id);
          if (!cur || s.elo > cur.elo) bestByUser.set(s.user_id, { elo: s.elo, game: s.game });
        });
        list.forEach((p) => {
          const b = bestByUser.get(p.id);
          p.best_elo = b?.elo ?? 1000;
          p.best_game = b?.game ?? (p.preferred_game as GameId) ?? "valorant";
        });
      }

      if (!active) return;
      setAgents(list);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      if (q && !`${a.username} ${a.display_name ?? ""}`.toLowerCase().includes(q)) return false;
      if (game !== "all" && a.preferred_game !== game && a.best_game !== game) return false;
      const elo = a.best_elo ?? 1000;
      if (elo < eloRange[0] || elo > eloRange[1]) return false;
      if (region !== "all" && (a.region ?? "").toLowerCase() !== region.toLowerCase()) return false;
      if (language !== "all" && (a.language ?? "").toLowerCase() !== language.toLowerCase()) return false;
      if (roleFilter !== "all" && (a.role ?? "").toLowerCase() !== roleFilter.toLowerCase()) return false;
      if (goalFilter !== "all" && (a.preferred_team_type ?? "").toLowerCase() !== goalFilter.toLowerCase()) return false;
      if (Number(a.reputation_score) < minRep) return false;
      if (verifiedOnly && !a.account_verified) return false;
      if (noSmurf && (a.smurf_risk_score ?? 0) >= 50) return false;
      return true;
    });
  }, [agents, search, game, eloRange, region, language, minRep, verifiedOnly, noSmurf, roleFilter, goalFilter]);

  const filtersActive =
    search.trim() !== "" ||
    game !== "all" ||
    eloRange[0] !== 0 ||
    eloRange[1] !== 3000 ||
    region !== "all" ||
    language !== "all" ||
    minRep > 0 ||
    verifiedOnly ||
    noSmurf ||
    roleFilter !== "all" ||
    goalFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setGame("all");
    setEloRange([0, 3000]);
    setRegion("all");
    setLanguage("all");
    setMinRep(0);
    setVerifiedOnly(false);
    setNoSmurf(false);
    setRoleFilter("all");
    setGoalFilter("all");
  };

  // Real stats (no fake numbers — only shown when data exists)
  const stats = useMemo(() => {
    const listed = agents.length;
    const verified = agents.filter((a) => a.account_verified).length;
    const cleanProfiles = agents.filter((a) => (a.smurf_risk_score ?? 0) < 50).length;
    const regions = new Set(agents.map((a) => a.region).filter(Boolean)).size;
    return { listed, verified, cleanProfiles, regions };
  }, [agents]);

  const FiltersPanel = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-muted-foreground">
          <FilterIcon className="h-3.5 w-3.5" /> {t("free_agents.filters", { defaultValue: "Filters" })}
        </div>
        {filtersActive && (
          <button
            onClick={resetFilters}
            className="text-[10px] font-display uppercase tracking-wider text-primary hover:text-primary/80 inline-flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {agents.length === 0 && !loading && (
        <div className="rounded-lg border border-border/50 bg-background/30 p-3 flex gap-2 items-start">
          <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] leading-relaxed text-muted-foreground font-body">
            Filters will become useful once players start listing their profiles.
          </p>
        </div>
      )}

      <div>
        <Label className="text-[11px] uppercase tracking-wider font-display text-muted-foreground">{t("free_agents.search", { defaultValue: "Search" })}</Label>
        <div className="relative mt-1.5">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("free_agents.search_ph", { defaultValue: "Player or tag…" })}
            className="pl-9 bg-background/40 border-border/60 focus-visible:border-primary/60"
          />
        </div>
      </div>

      <div>
        <Label className="text-[11px] uppercase tracking-wider font-display text-muted-foreground">{t("free_agents.game", { defaultValue: "Game" })}</Label>
        <Select value={game} onValueChange={(v) => setGame(v as any)}>
          <SelectTrigger className="mt-1.5 bg-background/40 border-border/60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("free_agents.all_games", { defaultValue: "All games" })}</SelectItem>
            {getActiveGames().map((g) => (
              <SelectItem key={g.id} value={g.id}>
                <span className="inline-flex items-center gap-2">
                  <GameIcon game={g.id} size={14} /> {g.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-[11px] uppercase tracking-wider font-display text-muted-foreground">ELO</Label>
          <span className="text-[11px] font-mono text-primary">
            {eloRange[0]} – {eloRange[1] >= 3000 ? "MAX" : eloRange[1]}
          </span>
        </div>
        <Slider
          value={eloRange}
          onValueChange={(v) => setEloRange([v[0], v[1]] as [number, number])}
          min={0}
          max={3000}
          step={50}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-[11px] uppercase tracking-wider font-display text-muted-foreground">{t("free_agents.region", { defaultValue: "Region" })}</Label>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="mt-1.5 bg-background/40 border-border/60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("free_agents.all_regions", { defaultValue: "All regions" })}</SelectItem>
            {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-[11px] uppercase tracking-wider font-display text-muted-foreground">{t("free_agents.language", { defaultValue: "Language" })}</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="mt-1.5 bg-background/40 border-border/60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("free_agents.all_languages", { defaultValue: "All languages" })}</SelectItem>
            {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-[11px] uppercase tracking-wider font-display text-muted-foreground">{t("free_agents.role", { defaultValue: "Role" })}</Label>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="mt-1.5 bg-background/40 border-border/60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("free_agents.all_roles", { defaultValue: "All roles" })}</SelectItem>
            {VALORANT_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-[11px] uppercase tracking-wider font-display text-muted-foreground">{t("free_agents.goal", { defaultValue: "Competitive goal" })}</Label>
        <Select value={goalFilter} onValueChange={setGoalFilter}>
          <SelectTrigger className="mt-1.5 bg-background/40 border-border/60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("free_agents.all_goals", { defaultValue: "Any goal" })}</SelectItem>
            {COMPETITIVE_GOALS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-[11px] uppercase tracking-wider font-display text-muted-foreground">{t("free_agents.min_rep", { defaultValue: "Min reputation" })}</Label>
          <span className="text-[11px] font-mono text-primary">{minRep.toFixed(1)} ★</span>
        </div>
        <Slider value={[minRep]} onValueChange={(v) => setMinRep(v[0])} min={0} max={5} step={0.5} className="mt-2" />
      </div>

      <div className="space-y-3 pt-3 border-t border-border/60">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="verified" className="text-xs font-body cursor-pointer flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t("free_agents.verified_only", { defaultValue: "Verified only" })}
          </Label>
          <Switch id="verified" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="nosmurf" className="text-xs font-body cursor-pointer flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> {t("free_agents.no_smurf", { defaultValue: "No smurf risk" })}
          </Label>
          <Switch id="nosmurf" checked={noSmurf} onCheckedChange={setNoSmurf} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <Helmet>
        <title>{t("free_agents.meta_title")}</title>
        <meta name="description" content={t("free_agents.meta_description")} />
        <link rel="canonical" href="https://peakgg.net/free-agents" />
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-12 border-b border-border/70 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.14] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)/0.25) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.25) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at top, black 20%, transparent 75%)",
          }}
        />
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[480px] pointer-events-none opacity-60"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(var(--primary)/0.18) 0%, transparent 60%)",
          }}
        />
        <div className="container relative z-[1] max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-4 border-primary/40 text-primary uppercase font-display tracking-widest text-[11px] bg-primary/5">
              <Users className="h-3 w-3 mr-1.5" /> Recruitment Board
            </Badge>
            <h1 className="font-display font-bold text-5xl md:text-7xl tracking-tight mb-4 leading-none">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">FREE AGENTS</span>
            </h1>
            <p className="font-display uppercase tracking-[0.2em] text-foreground/90 text-base md:text-lg mb-4">
              Find players. Build rosters. Get discovered.
            </p>
            <p className="text-muted-foreground font-body max-w-2xl text-sm md:text-base">
              List your profile, show your game, role, rank and availability — or scout verified players for your next competitive roster.
            </p>

            {/* Auth-aware hero CTAs — all "Complete Profile" buttons share one handler */}
            <div className="mt-7 flex flex-wrap gap-2.5 justify-center">
              <Button variant="neon" size="lg" onClick={onCompleteCta}>
                <UserPlus className="h-4 w-4 mr-1.5" /> {ctaLabel}
              </Button>
              <a href="#agents-list">
                <Button variant="neonOutline" size="lg">
                  <Compass className="h-4 w-4 mr-1.5" /> Browse Players
                </Button>
              </a>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-4 w-4 mr-1.5" /> Join Discord
                </Button>
              </a>
            </div>
            {alreadyListed && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-display uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3 w-3" /> Your profile is listed
              </p>
            )}
          </div>

          {/* Hero stats — only show real values, hide if zero */}
          {!loading && agents.length > 0 && (
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <HeroStat icon={Users} value={stats.listed} label="Players Listed" />
              <HeroStat icon={ShieldCheck} value={stats.verified} label="Verified Profiles" tone="primary" />
              <HeroStat icon={Sparkles} value={stats.cleanProfiles} label="No-Smurf Filter" tone="accent" />
              <HeroStat icon={Globe2} value={stats.regions || 1} label="EU Regions" />
            </div>
          )}
        </div>
      </section>

      <PartyFinderBoard />

      {/* For Players / For Teams cards */}
      <section className="container max-w-6xl py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <PurposeCard
            tone="primary"
            icon={UserPlus}
            title="For Players"
            body="Create a free agent profile with your game, role, rank, region, languages and availability."
            bullets={["Show your role and rank", "Get discovered by teams", "Add availability and languages"]}
            ctaLabel={ctaLabel}
            ctaOnClick={onCompleteCta}
          />
          <PurposeCard
            tone="accent"
            icon={Target}
            title="For Teams"
            body="Scout available players using filters for game, ELO, region, language and trust signals."
            bullets={["Filter by game and rank", "Find verified profiles", "Build rosters faster"]}
            ctaLabel="Scout Players"
            ctaTo="#agents-list"
          />
        </div>
      </section>

      <div id="agents-list" className="container max-w-7xl pt-2 pb-10 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 scroll-mt-20">
        {/* Mobile filters drawer */}
        {isMobile ? (
          <Collapsible open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="inline-flex items-center gap-2">
                  <FilterIcon className="h-4 w-4" /> Filters
                  {filtersActive && <Badge variant="outline" className="ml-1 border-primary/50 text-primary text-[10px]">Active</Badge>}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileFiltersOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 rounded-xl border border-border bg-card/80 backdrop-blur p-5">
              {FiltersPanel}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <aside className="lg:sticky lg:top-20 self-start rounded-xl border border-border/50 bg-card/30 backdrop-blur p-5">
            {FiltersPanel}
          </aside>
        )}

        {/* Results */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold uppercase tracking-wider text-lg leading-none">Available Players</h2>
              <p className="text-xs text-muted-foreground font-body mt-1">
                {loading
                  ? t("free_agents.loading", { defaultValue: "Loading players…" })
                  : filtersActive
                    ? `${filtered.length} ${filtered.length === 1 ? "player" : "players"} found with current filters.`
                    : agents.length === 0
                      ? "No players listed yet — complete your profile to become discoverable."
                      : `${agents.length} ${agents.length === 1 ? "player" : "players"} listed`}
              </p>
            </div>
            {filtersActive && !loading && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
              </Button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card/40 h-[260px] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              filtersActive={filtersActive}
              ctaLabel={ctaLabel}
              onComplete={onCompleteCta}
              onReset={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((a) => <AgentCard key={a.id} agent={a} />)}
            </div>
          )}
        </div>
      </div>

      {/* How Free Agents work */}
      <HowItWorksSection />

      <Footer />
    </div>
  );
}

/* ───────── Sub-components ───────── */

function HeroStat({ icon: Icon, value, label, tone = "default" }: { icon: any; value: number; label: string; tone?: "default" | "primary" | "accent" }) {
  const ring = tone === "primary" ? "border-primary/30" : tone === "accent" ? "border-accent/30" : "border-border";
  const iconColor = tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-muted-foreground";
  return (
    <div className={`rounded-xl border ${ring} bg-card/40 backdrop-blur px-4 py-3 flex items-center gap-3`}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <div className="min-w-0">
        <div className="font-display font-bold text-xl leading-none">{value.toLocaleString()}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-display mt-1 truncate">{label}</div>
      </div>
    </div>
  );
}

function PurposeCard({
  tone,
  icon: Icon,
  title,
  body,
  bullets,
  ctaLabel,
  ctaTo,
  ctaOnClick,
}: {
  tone: "primary" | "accent";
  icon: any;
  title: string;
  body: string;
  bullets: string[];
  ctaLabel: string;
  ctaTo?: string;
  ctaOnClick?: () => void;
}) {
  const isHash = !!ctaTo && ctaTo.startsWith("#");
  const hoverBorder = tone === "primary" ? "hover:border-primary/60" : "hover:border-accent/60";
  const iconText = tone === "primary" ? "text-primary" : "text-accent";
  const bulletText = tone === "primary" ? "text-primary" : "text-accent";
  const gradientVar = tone === "primary" ? "--primary" : "--accent";
  return (
    <div
      className={`group relative rounded-xl border border-border/70 bg-card/60 backdrop-blur p-6 overflow-hidden transition-all ${hoverBorder} hover:-translate-y-0.5`}
    >
      {/* Gradient edge */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, hsl(var(${gradientVar})/0.7), transparent)` }}
      />
      <div
        className="absolute -top-20 -right-16 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl pointer-events-none"
        style={{ background: `hsl(var(${gradientVar})/0.18)` }}
      />

      <div className="flex items-start gap-4">
        <div
          className="h-11 w-11 shrink-0 rounded-lg border flex items-center justify-center"
          style={{ background: `hsl(var(${gradientVar})/0.1)`, borderColor: `hsl(var(${gradientVar})/0.4)` }}
        >
          <Icon className={`h-5 w-5 ${iconText}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold uppercase tracking-wider text-lg leading-none">{title}</h3>
          <p className="text-sm text-muted-foreground font-body mt-2 leading-relaxed">{body}</p>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm font-body text-foreground/90">
            <CheckCircle2 className={`h-3.5 w-3.5 ${bulletText} shrink-0`} />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {ctaOnClick ? (
          <Button
            variant={tone === "primary" ? "neon" : "neonOutline"}
            className="w-full sm:w-auto"
            onClick={ctaOnClick}
          >
            {ctaLabel} <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : isHash ? (
          <a href={ctaTo}>
            <Button variant={tone === "primary" ? "neon" : "neonOutline"} className="w-full sm:w-auto">
              {ctaLabel} <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </a>
        ) : (
          <Link to={ctaTo!}>
            <Button variant={tone === "primary" ? "neon" : "neonOutline"} className="w-full sm:w-auto">
              {ctaLabel} <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  filtersActive,
  ctaLabel,
  onComplete,
  onReset,
}: {
  filtersActive: boolean;
  ctaLabel: string;
  onComplete: () => void;
  onReset: () => void;
}) {
  const benefits = [
    { icon: Target, label: "Show your role" },
    { icon: Trophy, label: "Display your rank / ELO" },
    { icon: MessageSquare, label: "Get contacted by captains" },
  ];
  const teamsSee = [
    { icon: Gamepad2, label: "Main game" },
    { icon: Target, label: "Role" },
    { icon: Trophy, label: "Rank / ELO" },
    { icon: MapPin, label: "Region" },
    { icon: Languages, label: "Languages" },
    { icon: Clock, label: "Availability" },
    { icon: BadgeCheck, label: "Verification & trust" },
  ];
  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl border border-border/70 bg-gradient-to-b from-card/80 to-card/30 backdrop-blur p-8 md:p-10 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)/0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(circle at center, black, transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/40 flex items-center justify-center mb-5 shadow-[0_0_40px_hsl(var(--primary)/0.35)]">
            <Users className="h-9 w-9 text-primary" />
          </div>
          <h3 className="font-display font-bold uppercase tracking-wider text-2xl mb-2">
            {filtersActive ? "No players match these filters" : "No free agents listed yet"}
          </h3>
          <p className="text-sm text-muted-foreground font-body max-w-lg mx-auto leading-relaxed">
            {filtersActive
              ? "No players match these filters. Try widening your search."
              : "Be one of the first players discovered by PeakGG teams. Complete your profile and appear in the scouting board for captains building competitive rosters."}
          </p>

          {!filtersActive && (
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {benefits.map((b) => (
                <div
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] font-display uppercase tracking-wider text-foreground/90"
                >
                  <b.icon className="h-3 w-3 text-primary" /> {b.label}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <Button variant="neon" onClick={onComplete}>
              <UserPlus className="h-4 w-4 mr-1.5" /> {ctaLabel}
            </Button>
            {filtersActive && (
              <Button variant="neonOutline" onClick={onReset}>
                <RotateCcw className="h-4 w-4 mr-1.5" /> Reset Filters
              </Button>
            )}
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
              <Button variant="neonOutline">
                <MessageSquare className="h-4 w-4 mr-1.5" /> Join Discord
              </Button>
            </a>
          </div>

          <p className="mt-5 text-[11px] uppercase tracking-wider font-display text-muted-foreground/80">
            Teams can only discover players who complete their free agent profile.
          </p>
        </div>
      </div>

      {/* What teams will see */}
      <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-4 w-4 text-accent" />
          <h4 className="font-display font-bold uppercase tracking-wider text-sm">What teams will see</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {teamsSee.map((it) => (
            <div
              key={it.label}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/30 px-3 py-2.5 text-xs font-body text-foreground/90"
            >
              <it.icon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{it.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground font-body">
          This is what your card will look like to captains scouting rosters — the more complete your profile, the better your visibility.
        </p>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  const steps = [
    { icon: UserPlus, title: "Create Your Profile", desc: "Add your game, role, rank, region and languages." },
    { icon: Radio, title: "Set Availability", desc: "Show if you are LFT, casual, competitive or tournament-ready." },
    { icon: Compass, title: "Get Discovered", desc: "Teams find you through filters and profile cards." },
    { icon: Trophy, title: "Join a Roster", desc: "Connect with captains and start competing." },
  ];
  return (
    <section className="border-t border-border/60 bg-gradient-to-b from-background to-card/30">
      <div className="container max-w-6xl py-14">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3 border-primary/40 text-primary uppercase font-display tracking-widest text-[11px] bg-primary/5">
            Player Marketplace
          </Badge>
          <h2 className="font-display font-bold uppercase tracking-tight text-3xl md:text-4xl">
            How Free Agents <span className="text-primary">Work</span>
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-2 max-w-xl mx-auto">
            Four steps to get on the radar of European founding teams.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-xl border border-border/70 bg-card/50 backdrop-blur p-5 hover:border-primary/50 transition-all group"
            >
              <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/40 flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-display font-bold text-3xl text-primary/20 leading-none">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-display font-bold uppercase tracking-wider text-sm mb-1.5">{s.title}</h3>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentCard({ agent }: { agent: AgentRow }) {
  const elo = agent.best_elo ?? 1000;
  const rank = getRankByElo(elo);
  const rep = Number(agent.reputation_score ?? 5);
  const goalLabel = COMPETITIVE_GOALS.find((g) => g.value === (agent.preferred_team_type ?? "").toLowerCase())?.label;
  return (
    <Link
      to={`/profile/${agent.username}`}
      className="group rounded-lg border border-border bg-card hover:border-primary/60 transition-all overflow-hidden flex flex-col"
      style={{ boxShadow: `inset 0 0 0 1px transparent` }}
    >
      <div
        className="h-16 relative"
        style={{
          background: `linear-gradient(135deg, ${rank.hex}33 0%, hsl(var(--background)) 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>
      <div className="px-4 pb-4 -mt-7 flex-1 flex flex-col">
        <div className="flex items-end justify-between">
          <div
            className="rounded-full p-[2px]"
            style={{ background: rank.gradient ?? rank.hex, boxShadow: `0 0 16px ${rank.hex}55` }}
          >
            <Avatar className="h-14 w-14 border-2 border-background">
              <AvatarImage src={agent.avatar_url ?? undefined} alt={agent.username} />
              <AvatarFallback className="gradient-primary text-primary-foreground font-display font-bold">
                {agent.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col gap-1 items-end mt-3">
            {agent.account_verified && (
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-primary/50 text-primary">
                <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Verified
              </Badge>
            )}
            {agent.fast_track && (
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-accent/50 text-accent">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Fast Track
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-2">
          <div className="font-display font-bold text-base truncate">{agent.display_name || agent.username}</div>
          <div className="text-xs text-muted-foreground font-mono truncate">@{agent.username}</div>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <RankBadge elo={elo} size="sm" showLabel />
          <span className="font-mono text-xs text-primary font-bold">{elo}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {agent.role && (
            <Badge variant="outline" className="text-[10px] font-display uppercase tracking-wider border-primary/40 text-primary bg-primary/5">
              <Target className="h-2.5 w-2.5 mr-1" />{agent.role}
            </Badge>
          )}
          {agent.availability && (
            <Badge variant="outline" className="text-[10px] font-display uppercase tracking-wider border-accent/30 text-accent bg-accent/5">
              <Clock className="h-2.5 w-2.5 mr-1" />{agent.availability}
            </Badge>
          )}
          {goalLabel && (
            <Badge variant="outline" className="text-[10px] font-display uppercase tracking-wider border-border text-foreground/80">
              <Trophy className="h-2.5 w-2.5 mr-1" />{goalLabel}
            </Badge>
          )}
        </div>

        {agent.bio && (
          <p className="text-xs text-muted-foreground font-body mt-2 line-clamp-2">{agent.bio}</p>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-display uppercase tracking-wider text-muted-foreground border-t border-border pt-3">
          <div className="flex items-center gap-1" title="Reputation">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400/40" />
            <span className="font-mono text-foreground">{rep.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 truncate" title="Region">
            <Globe2 className="h-3 w-3" />
            <span className="truncate text-foreground">{agent.region || "EU"}</span>
          </div>
          <div className="flex items-center gap-1 justify-end" title="Language">
            <span className="text-foreground uppercase font-mono">{agent.language || "EN"}</span>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full group-hover:border-primary/60 group-hover:text-primary"
          onClick={(e) => { e.preventDefault(); }}
          asChild
        >
          <span>
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> View Profile
          </span>
        </Button>
      </div>
    </Link>
  );
}

