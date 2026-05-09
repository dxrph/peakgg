import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trophy, Users, Calendar, Search, Lock, Coins, ArrowRight } from "lucide-react";
import { useGame } from "@/lib/game-context";
import { TOURNAMENT_TIERS, GAMES } from "@/lib/ranks";
import GameComingSoon from "@/components/GameComingSoon";
import NextTournamentHero from "@/components/tournaments/NextTournamentHero";
import DiscordCTA from "@/components/landing/DiscordCTA";

type TournamentStatus = "Coming Soon" | "Open" | "Live" | "Full" | "Finished";

interface MockTournament {
  id: number;
  name: string;
  format: string;
  date: string;
  prize: string;
  slots: string;
  status: TournamentStatus;
  tier: 1 | 2 | 3;
  game: string;
  entry: "Free" | "Paid";
}

const tournaments: MockTournament[] = [
  { id: 1, name: "Peak Open Cup #1",     format: "5v5 BO1", date: "Season 0 Beta", prize: "Founding badge", slots: "Open", status: "Open",        tier: 1, game: "valorant", entry: "Free" },
  { id: 2, name: "Peak Community Cup",   format: "5v5 BO1", date: "Season 0 Beta", prize: "Community badge", slots: "Open", status: "Open",        tier: 1, game: "valorant", entry: "Free" },
  { id: 3, name: "Peak Championship S1", format: "5v5 BO3", date: "Coming soon",   prize: "Season 1 invite", slots: "—",    status: "Coming Soon", tier: 3, game: "valorant", entry: "Free" },
];

const tierColors: Record<number, string> = {
  1: "border-success/50 text-success",
  2: "border-accent/50 text-accent",
  3: "border-primary/50 text-primary",
};

const tierLabels: Record<number, string> = {
  1: "Open Cup",
  2: "Challenger Series",
  3: "Peak Championship",
};

const statusStyles: Record<TournamentStatus, string> = {
  "Open":        "bg-success/15 text-success border-success/40",
  "Live":        "gradient-primary border-0 text-primary-foreground",
  "Full":        "bg-muted text-muted-foreground border-border",
  "Coming Soon": "bg-accent/15 text-accent border-accent/40",
  "Finished":    "bg-secondary text-muted-foreground border-border",
};

// Mock user data
const userTierProgress = { completedTier1: true, completedTier2: false, tournamentPoints: 120, rank: "Rival" as const };

export default function TournamentsPage() {
  const { selectedGame } = useGame();
  const game = GAMES.find(g => g.id === selectedGame)!;
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | 1 | 2 | 3>("all");

  const filtered = useMemo(() => tournaments.filter(t => {
    if (t.game !== selectedGame) return false;
    if (tierFilter !== "all" && t.tier !== tierFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [selectedGame, tierFilter, search]);

  const nextTournament = useMemo(() => {
    return tournaments.find(t => t.game === selectedGame && (t.status === "Open" || t.status === "Coming Soon")) ?? null;
  }, [selectedGame]);

  // Countdown target: 7 days from now as a placeholder until real dates
  const countdownTarget = useMemo(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), []);

  const seo = (
    <SEO
      title="Tournaments — PeakGG | Valorant CS2 R6 Competitions"
      description="Join free Valorant tournaments and competitive events on PeakGG. Open Cup, Challenger Series and Peak Championship for Valorant, CS2 and Rainbow Six Siege players."
      keywords="free Valorant tournaments, CS2 competitive platform, Rainbow Six Siege tournaments, FPS esports Europe, PeakGG tournaments"
      path="/tournaments"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: "PeakGG Open Cup Season 1",
        sport: "Esports",
        organizer: { "@type": "Organization", name: "PeakGG", url: "https://peakgg.net" },
        url: "https://peakgg.net/tournaments",
        description: "Free competitive Valorant tournament on PeakGG",
      }}
    />
  );

  if (game.status !== "live") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {seo}
        <Navbar />
        <div className="pt-24"><GameComingSoon /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {seo}
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-display font-bold"><Trophy className="inline h-8 w-8 text-primary mr-2" />Tournaments</h1>
            <p className="text-muted-foreground font-body mt-1">Compete in tiered events — climb from Open Cup to Peak Championship.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tournaments..."
                className="pl-10 md:w-64 bg-card border-border"
              />
            </div>
          </div>
        </div>

        {/* Next Tournament Hero */}
        {nextTournament && (
          <NextTournamentHero
            name={nextTournament.name}
            game={GAMES.find(g => g.id === nextTournament.game)?.name ?? nextTournament.game}
            date={countdownTarget}
            prize={nextTournament.prize}
            format={nextTournament.format}
            slots={nextTournament.slots}
            tier={tierLabels[nextTournament.tier]}
            href={`/tournaments/${nextTournament.id}`}
          />
        )}

        {/* Tier filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {([
            { value: "all" as const, label: "All Tiers" },
            { value: 1 as const, label: "Open Cup" },
            { value: 2 as const, label: "Challenger Series" },
            { value: 3 as const, label: "Peak Championship" },
          ]).map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => setTierFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider border transition-all ${
                tierFilter === opt.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card hover:border-primary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Tier Progression Tree */}
        <div className="rounded-lg border border-border bg-card p-6 neon-border mb-8">
          <h3 className="font-display font-bold text-lg mb-6">Tournament Tier Progression</h3>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-0">
            {TOURNAMENT_TIERS.map((tier, i) => {
              const unlocked = tier.tier === 1 || (tier.tier === 2 && userTierProgress.completedTier1) || (tier.tier === 3 && userTierProgress.completedTier2);
              return (
                <div key={tier.tier} className="flex items-center flex-1 w-full md:w-auto">
                  <div className={`flex-1 rounded-lg border p-4 text-center transition-all ${
                    unlocked ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20 opacity-60"
                  }`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {!unlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                      <span className={`text-xs font-display font-bold uppercase tracking-wider ${tierColors[tier.tier]}`}>
                        Tier {tier.tier}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-lg">{tier.name}</h4>
                    <p className="text-xs text-muted-foreground font-body mt-1">{tier.requirement}</p>
                    {tier.pointsToUnlock && !unlocked && (
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground font-body mb-1">
                          {userTierProgress.tournamentPoints} / {tier.pointsToUnlock} Tournament Points
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (userTierProgress.tournamentPoints / tier.pointsToUnlock) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  {i < TOURNAMENT_TIERS.length - 1 && (
                    <div className="hidden md:block w-8 h-px border-t border-dashed border-primary/30 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-card p-5 hover:border-primary/40 hover:shadow-[0_0_28px_-12px_hsl(var(--primary)/0.5)] transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge className={`font-display text-[10px] uppercase tracking-wider border ${statusStyles[t.status]}`}>
                    {t.status === "Live" && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
                    {t.status}
                  </Badge>
                  <Badge variant="outline" className={`font-display text-[10px] uppercase tracking-wider ${tierColors[t.tier]}`}>
                    {tierLabels[t.tier]}
                  </Badge>
                </div>
                <Badge variant="outline" className={`font-display text-[10px] uppercase ${t.entry === "Free" ? "text-success border-success/40" : "text-accent border-accent/40"}`}>
                  {t.entry === "Free" ? "Free" : <><Coins className="h-3 w-3 mr-1" />Paid</>}
                </Badge>
              </div>
              <h3 className="text-lg font-display font-bold mb-2 group-hover:text-primary transition-colors uppercase tracking-tight">{t.name}</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground font-body flex-1">
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{t.date} · {t.format}</div>
                <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{t.slots} teams</div>
                <div className="flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-accent" /><span className="text-accent font-semibold">{t.prize}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link to={`/tournaments/${t.id}`}>
                  <Button variant="neon" size="sm" className="w-full uppercase tracking-wider" disabled={t.status === "Full" || t.status === "Finished"}>
                    Register
                  </Button>
                </Link>
                <Link to={`/tournaments/${t.id}`}>
                  <Button variant="neonOutline" size="sm" className="w-full uppercase tracking-wider">
                    Details <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground font-body">
              No tournaments for this game yet. Check back soon!
            </div>
          )}
        </div>

        <div className="mt-12">
          <DiscordCTA variant="inline" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
