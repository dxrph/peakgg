import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trophy, Users, Calendar, Search, Filter, Lock } from "lucide-react";
import { useGame } from "@/lib/game-context";
import { TOURNAMENT_TIERS, GAMES } from "@/lib/ranks";
import GameComingSoon from "@/components/GameComingSoon";

const tournaments = [
  { id: 1, name: "PeakGG Weekly #12", format: "5v5", date: "Mar 8, 2026", prize: "€500", slots: "12/16", status: "Open", tier: 1, game: "valorant" },
  { id: 2, name: "EU Masters Qualifier", format: "5v5", date: "Mar 15, 2026", prize: "€2,000", slots: "28/32", status: "Open", tier: 2, game: "valorant" },
  { id: 3, name: "1v1 Aim Challenge", format: "1v1", date: "Mar 10, 2026", prize: "€100", slots: "48/64", status: "Open", tier: 1, game: "cs2" },
  { id: 4, name: "Peak Championship", format: "5v5", date: "Mar 22, 2026", prize: "€5,000", slots: "16/16", status: "Full", tier: 3, game: "valorant" },
  { id: 5, name: "Community Cup", format: "5v5", date: "Mar 5, 2026", prize: "€250", slots: "8/8", status: "Live", tier: 1, game: "r6" },
  { id: 6, name: "Newcomers Tournament", format: "5v5", date: "Mar 12, 2026", prize: "€200", slots: "6/16", status: "Open", tier: 1, game: "cs2" },
];

const tierColors: Record<number, string> = {
  1: "border-success/50 text-success",
  2: "border-accent/50 text-accent",
  3: "border-primary/50 text-primary",
};

// Mock user data
const userTierProgress = { completedTier1: true, completedTier2: false, tournamentPoints: 120, rank: "Rival" as const };

export default function TournamentsPage() {
  const { selectedGame } = useGame();
  const filtered = tournaments.filter(t => t.game === selectedGame);
  const game = GAMES.find(g => g.id === selectedGame)!;

  if (game.status !== "live") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-24"><GameComingSoon /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold"><Trophy className="inline h-8 w-8 text-primary mr-2" />Tournaments</h1>
            <p className="text-muted-foreground font-body mt-1">Compete in tiered events — climb from Open Cup to Peak Championship.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tournaments..." className="pl-10 w-64 bg-card border-border" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
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
            <div key={t.id} className="rounded-lg border border-border bg-card p-5 neon-border hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  <Badge variant={t.status === "Live" ? "default" : t.status === "Full" ? "secondary" : "outline"}
                    className={`font-display text-xs ${t.status === "Live" ? "gradient-primary border-0" : ""}`}>
                    {t.status === "Live" && <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground mr-1 animate-pulse" />}
                    {t.status}
                  </Badge>
                  <Badge variant="outline" className={`font-display text-xs ${tierColors[t.tier]}`}>
                    Tier {t.tier}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground font-body">{t.format}</span>
              </div>
              <h3 className="text-lg font-display font-bold mb-2 group-hover:text-primary transition-colors">{t.name}</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground font-body">
                <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{t.date}</div>
                <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />{t.slots} teams</div>
                <div className="flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-accent" /><span className="text-accent font-semibold">{t.prize}</span></div>
              </div>
              <Link to={`/tournaments/${t.id}`}><Button variant="neonOutline" size="sm" className="w-full mt-4">View Details</Button></Link>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground font-body">
              No tournaments for this game yet. Check back soon!
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
