import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
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
import { Search, Users, Loader2, Star, ShieldCheck, Sparkles, Globe2, MessageSquare, Filter as FilterIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { GAMES, getRankByElo, type GameId } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";
import GameIcon from "@/components/GameIcon";

type AgentRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  language: string | null;
  preferred_game: string | null;
  reputation_score: number;
  account_verified: boolean;
  smurf_risk_score: number;
  last_active_at: string;
  fast_track: boolean;
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

export default function FreeAgentsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentRow[]>([]);

  // filters
  const [search, setSearch] = useState("");
  const [game, setGame] = useState<"all" | GameId>("all");
  const [eloRange, setEloRange] = useState<[number, number]>([0, 3000]);
  const [region, setRegion] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [minRep, setMinRep] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [noSmurf, setNoSmurf] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: profs } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url, bio, region, language, preferred_game, reputation_score, account_verified, smurf_risk_score, last_active_at, fast_track"
        )
        .eq("looking_for_team", true)
        .eq("is_banned", false)
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
      if (Number(a.reputation_score) < minRep) return false;
      if (verifiedOnly && !a.account_verified) return false;
      if (noSmurf && (a.smurf_risk_score ?? 0) >= 50) return false;
      return true;
    });
  }, [agents, search, game, eloRange, region, language, minRep, verifiedOnly, noSmurf]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{t("free_agents.meta_title")}</title>
        <meta name="description" content={t("free_agents.meta_description")} />
        <link rel="canonical" href="https://peakgg.net/free-agents" />
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-10 border-b border-border overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.18] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)/0.25) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.25) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="container relative z-[1]">
          <Badge variant="outline" className="mb-3 border-primary/40 text-primary uppercase font-display tracking-widest text-[11px]">
            <Users className="h-3 w-3 mr-1.5" /> {t("free_agents.eyebrow")}
          </Badge>
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-3">
            {t("free_agents.title")}
          </h1>
          <p className="text-muted-foreground font-body max-w-2xl">
            {t("free_agents.subtitle")}
          </p>
        </div>
      </section>

      <div className="container py-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Filters */}
        <aside className="space-y-5 lg:sticky lg:top-20 self-start rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-muted-foreground">
            <FilterIcon className="h-3.5 w-3.5" /> {t("free_agents.filters")}
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider font-display">{t("free_agents.search")}</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("free_agents.search_ph")}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider font-display">{t("free_agents.game")}</Label>
            <Select value={game} onValueChange={(v) => setGame(v as any)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("free_agents.all_games")}</SelectItem>
                {GAMES.map((g) => (
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
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs uppercase tracking-wider font-display">ELO</Label>
              <span className="text-[11px] font-mono text-muted-foreground">
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
            <Label className="text-xs uppercase tracking-wider font-display">{t("free_agents.region")}</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("free_agents.all_regions")}</SelectItem>
                {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider font-display">{t("free_agents.language")}</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("free_agents.all_languages")}</SelectItem>
                {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs uppercase tracking-wider font-display">{t("free_agents.min_rep")}</Label>
              <span className="text-[11px] font-mono text-muted-foreground">{minRep.toFixed(1)} ★</span>
            </div>
            <Slider value={[minRep]} onValueChange={(v) => setMinRep(v[0])} min={0} max={5} step={0.5} className="mt-2" />
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="verified" className="text-xs font-body cursor-pointer flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {t("free_agents.verified_only")}
              </Label>
              <Switch id="verified" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="nosmurf" className="text-xs font-body cursor-pointer flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> {t("free_agents.no_smurf")}
              </Label>
              <Switch id="nosmurf" checked={noSmurf} onCheckedChange={setNoSmurf} />
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground font-body">
              {loading ? t("free_agents.loading") : t("free_agents.results", { count: filtered.length })}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="font-display font-bold text-lg mb-1">{t("free_agents.empty_title")}</h3>
              <p className="text-sm text-muted-foreground font-body">{t("free_agents.empty_sub")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((a) => <AgentCard key={a.id} agent={a} />)}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentRow }) {
  const elo = agent.best_elo ?? 1000;
  const rank = getRankByElo(elo);
  const rep = Number(agent.reputation_score ?? 5);
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