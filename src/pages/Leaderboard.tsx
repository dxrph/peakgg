import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RankBadge from "@/components/RankBadge";
import { useGame } from "@/lib/game-context";
import { GAMES } from "@/lib/ranks";
import { Crown, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

const playersData: Record<string, any[]> = {
  valorant: [
    { rank: 1, name: "PhantomX", elo: 3120, wr: "68%", tp: 840, tierReached: 3, team: "Peak Kings", isUser: false },
    { rank: 2, name: "NightShade", elo: 2891, wr: "65%", tp: 720, tierReached: 3, team: "Void Reapers", isUser: false },
    { rank: 3, name: "AceViper", elo: 2756, wr: "63%", tp: 580, tierReached: 2, team: "—", isUser: false },
    { rank: 4, name: "BlitzStorm", elo: 2698, wr: "61%", tp: 520, tierReached: 2, team: "Storm Elite", isUser: false },
    { rank: 5, name: "ShadowReaper", elo: 2254, wr: "60%", tp: 410, tierReached: 2, team: "Shadow Corp", isUser: false },
    { rank: 6, name: "CyberJett", elo: 1821, wr: "59%", tp: 290, tierReached: 1, team: "—", isUser: false },
    { rank: 7, name: "FrostByte", elo: 1598, wr: "58%", tp: 230, tierReached: 1, team: "Ice Protocol", isUser: false },
    { rank: 8, name: "NovaFlash", elo: 1267, wr: "57%", tp: 180, tierReached: 1, team: "—", isUser: false },
    { rank: 9, name: "IronClad", elo: 943, wr: "56%", tp: 120, tierReached: 1, team: "Phoenix Rise", isUser: false },
    { rank: 10, name: "ViperStrike", elo: 521, wr: "55%", tp: 60, tierReached: 1, team: "—", isUser: false },
  ],
  cs2: [
    { rank: 1, name: "HeadHunter", elo: 2980, wr: "66%", tp: 780, tierReached: 3, team: "CS Masters", isUser: false },
    { rank: 2, name: "AWPKing", elo: 2750, wr: "64%", tp: 640, tierReached: 2, team: "—", isUser: false },
    { rank: 3, name: "FlashBang", elo: 2540, wr: "61%", tp: 490, tierReached: 2, team: "Smoke Screen", isUser: false },
  ],
  r6: [
    { rank: 1, name: "SiegeMain", elo: 2820, wr: "65%", tp: 700, tierReached: 3, team: "Ops Elite", isUser: false },
    { rank: 2, name: "BreachMaster", elo: 2620, wr: "62%", tp: 550, tierReached: 2, team: "—", isUser: false },
    { rank: 3, name: "GadgetGuru", elo: 2380, wr: "59%", tp: 380, tierReached: 2, team: "R6 Crew", isUser: false },
  ],
};

// Mock: user's own row
const userRow = { rank: 47, name: "YourName", elo: 1340, wr: "52%", tp: 120, tierReached: 1, team: "—", isUser: true };

const teamsData: Record<string, any[]> = {
  valorant: [
    { rank: 1, name: "Peak Kings", elo: 2650, wr: "72%", tp: 1200, members: 5 },
    { rank: 2, name: "Void Reapers", elo: 2580, wr: "68%", tp: 980, members: 5 },
    { rank: 3, name: "Storm Elite", elo: 2490, wr: "65%", tp: 840, members: 4 },
  ],
  cs2: [
    { rank: 1, name: "CS Masters", elo: 2700, wr: "70%", tp: 1050, members: 5 },
  ],
  r6: [
    { rank: 1, name: "Ops Elite", elo: 2620, wr: "67%", tp: 920, members: 5 },
  ],
};

function getRankHighlight(r: number) {
  if (r === 1) return "bg-yellow-400/10 border-l-2 border-l-yellow-400";
  if (r === 2) return "bg-gray-300/5 border-l-2 border-l-gray-400";
  if (r === 3) return "bg-amber-600/5 border-l-2 border-l-amber-600";
  return "";
}

const tierColors: Record<number, string> = { 1: "text-success", 2: "text-accent", 3: "text-primary" };

export default function LeaderboardPage() {
  const { selectedGame } = useGame();
  const [season, setSeason] = useState("1");

  const players = playersData[selectedGame] || [];
  const teams = teamsData[selectedGame] || [];
  const game = GAMES.find(g => g.id === selectedGame)!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold"><Crown className="inline h-8 w-8 text-accent mr-2" />Leaderboard</h1>
            <p className="text-muted-foreground font-body mt-1">Season {season} — {game.name} — Top players and teams.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="bg-card border border-border rounded-md px-3 py-2 text-sm font-display text-foreground"
            >
              <option value="1">Season 1</option>
              <option value="2">Season 2</option>
            </select>
          </div>
        </div>

        <Tabs defaultValue="players" className="w-full">
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="players" className="font-display">Players</TabsTrigger>
            <TabsTrigger value="teams" className="font-display">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <div className="rounded-lg border border-border bg-card overflow-hidden neon-border">
              <div className="grid grid-cols-[2.5rem_1fr_auto_4rem] md:grid-cols-[2.5rem_1fr_auto_5rem_4rem_5rem_5rem] gap-3 px-4 py-3 bg-secondary/50 text-xs text-muted-foreground font-display uppercase tracking-widest">
                <span>#</span><span>Player</span><span>Rank</span><span className="text-right">ELO</span>
                <span className="hidden md:block text-right">WR</span>
                <span className="hidden md:block text-right">TP</span>
                <span className="hidden md:block text-right">Tier</span>
              </div>
              {players.map((p) => (
                <div key={p.rank} className={`grid grid-cols-[2.5rem_1fr_auto_4rem] md:grid-cols-[2.5rem_1fr_auto_5rem_4rem_5rem_5rem] gap-3 px-4 py-3 border-t border-border hover:bg-secondary/20 transition-colors items-center ${getRankHighlight(p.rank)}`}>
                  <span className="font-display font-bold text-lg">
                    {p.rank <= 3 && <Crown className="inline h-4 w-4 text-yellow-400 mr-1" />}
                    {p.rank}
                  </span>
                  <span className="font-semibold font-body truncate">{p.name}</span>
                  <RankBadge elo={p.elo} size="sm" />
                  <span className="text-right font-mono font-bold text-primary">{p.elo}</span>
                  <span className="hidden md:block text-right text-sm text-muted-foreground">{p.wr}</span>
                  <span className="hidden md:block text-right text-sm font-mono">{p.tp}</span>
                  <span className={`hidden md:block text-right text-sm font-display font-bold ${tierColors[p.tierReached]}`}>
                    Tier {p.tierReached}
                  </span>
                </div>
              ))}
              {/* User's own row */}
              <div className="grid grid-cols-[2.5rem_1fr_auto_4rem] md:grid-cols-[2.5rem_1fr_auto_5rem_4rem_5rem_5rem] gap-3 px-4 py-3 border-t-2 border-primary/30 bg-primary/5 items-center">
                <span className="font-display font-bold text-lg text-primary">{userRow.rank}</span>
                <span className="font-semibold font-body truncate text-primary">{userRow.name} (You)</span>
                <RankBadge elo={userRow.elo} size="sm" />
                <span className="text-right font-mono font-bold text-primary">{userRow.elo}</span>
                <span className="hidden md:block text-right text-sm text-muted-foreground">{userRow.wr}</span>
                <span className="hidden md:block text-right text-sm font-mono">{userRow.tp}</span>
                <span className={`hidden md:block text-right text-sm font-display font-bold ${tierColors[userRow.tierReached]}`}>
                  Tier {userRow.tierReached}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="teams">
            <div className="rounded-lg border border-border bg-card overflow-hidden neon-border">
              <div className="grid grid-cols-[2.5rem_1fr_auto_5rem] md:grid-cols-[2.5rem_1fr_auto_5rem_4rem_5rem_4rem] gap-3 px-4 py-3 bg-secondary/50 text-xs text-muted-foreground font-display uppercase tracking-widest">
                <span>#</span><span>Team</span><span>Rank</span><span className="text-right">ELO</span>
                <span className="hidden md:block text-right">WR</span>
                <span className="hidden md:block text-right">TP</span>
                <span className="hidden md:block text-right">Members</span>
              </div>
              {teams.map((t) => (
                <div key={t.rank} className={`grid grid-cols-[2.5rem_1fr_auto_5rem] md:grid-cols-[2.5rem_1fr_auto_5rem_4rem_5rem_4rem] gap-3 px-4 py-3 border-t border-border hover:bg-secondary/20 transition-colors items-center ${getRankHighlight(t.rank)}`}>
                  <span className="font-display font-bold text-lg">
                    {t.rank <= 3 && <Crown className="inline h-4 w-4 text-yellow-400 mr-1" />}
                    {t.rank}
                  </span>
                  <span className="font-semibold font-body truncate">{t.name}</span>
                  <RankBadge elo={t.elo} size="sm" />
                  <span className="text-right font-mono font-bold text-primary">{t.elo}</span>
                  <span className="hidden md:block text-right text-sm text-muted-foreground">{t.wr}</span>
                  <span className="hidden md:block text-right text-sm font-mono">{t.tp}</span>
                  <span className="hidden md:block text-right text-sm text-muted-foreground">{t.members}/5</span>
                </div>
              ))}
              {teams.length === 0 && (
                <div className="text-center py-12 text-muted-foreground font-body">No teams ranked yet for {game.name}.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
