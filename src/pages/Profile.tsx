import Navbar from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RankBadge from "@/components/RankBadge";
import EloProgressBar from "@/components/EloProgressBar";
import { Shield, Swords, Trophy, TrendingUp, Star, Target } from "lucide-react";

const mockProfile = {
  username: "PhantomX",
  elo: 3120,
  totalMatches: 342,
  team: "Peak Kings",
  reputation: 92,
  verification: 3,
  tournamentPoints: 840,
};

const gameStats: Record<string, any> = {
  valorant: { matches: 220, wr: "68%", kd: "1.42", hs: "28%" },
  cs2: { matches: 80, wr: "61%", kd: "1.28", hs: "32%" },
  r6: { matches: 42, wr: "55%", kd: "1.12", hs: "18%" },
};

const matchHistory = [
  { id: 1, date: "Mar 3", map: "Ascent", result: "WIN", score: "13-9", kda: "24/12/6", elo: "+25", game: "valorant" },
  { id: 2, date: "Mar 3", map: "Haven", result: "LOSS", score: "8-13", kda: "15/18/4", elo: "-15", game: "valorant" },
  { id: 3, date: "Mar 2", map: "Dust2", result: "WIN", score: "16-12", kda: "21/16/8", elo: "+25", game: "cs2" },
  { id: 4, date: "Mar 2", map: "Split", result: "WIN", score: "13-7", kda: "26/10/5", elo: "+25", game: "valorant" },
  { id: 5, date: "Mar 1", map: "Clubhouse", result: "LOSS", score: "3-5", kda: "8/7/3", elo: "-15", game: "r6" },
  { id: 6, date: "Mar 1", map: "Lotus", result: "WIN", score: "13-5", kda: "28/8/7", elo: "+25", game: "valorant" },
];

const tournamentHistory = [
  { name: "Weekly #11", tier: 1, placement: "1st", points: "+100", game: "valorant" },
  { name: "Challenger Series #2", tier: 2, placement: "2nd", points: "+80", game: "valorant" },
  { name: "CS2 Open Cup #3", tier: 1, placement: "3rd", points: "+50", game: "cs2" },
];

const gameIcons: Record<string, string> = { valorant: "🎯", cs2: "💥", r6: "🛡️" };

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Header */}
        <div className="relative rounded-lg border border-border bg-card overflow-hidden mb-8 neon-border">
          <div className="h-32 md:h-44 gradient-hero relative">
            <div className="absolute inset-0 scanline pointer-events-none opacity-50" />
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-10 md:-mt-12">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full gradient-primary flex items-center justify-center text-2xl font-display font-bold text-primary-foreground border-4 border-card">
                PX
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-display font-bold">{mockProfile.username}</h1>
                  <RankBadge elo={mockProfile.elo} size="md" />
                  <Badge variant="secondary" className="font-display text-xs"><Shield className="h-3 w-3 mr-1" />Level {mockProfile.verification}</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-body">{mockProfile.team} · TP: {mockProfile.tournamentPoints}</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-display font-bold text-primary">{mockProfile.elo}</div>
                  <div className="text-xs text-muted-foreground font-display uppercase">ELO</div>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold">{mockProfile.totalMatches}</div>
                  <div className="text-xs text-muted-foreground font-display uppercase">Matches</div>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold">{mockProfile.tournamentPoints}</div>
                  <div className="text-xs text-muted-foreground font-display uppercase">TP</div>
                </div>
              </div>
            </div>
            <EloProgressBar elo={mockProfile.elo} className="mt-4 max-w-md" />
          </div>
        </div>

        {/* Game Stats Tabs */}
        <div className="mb-8">
          <h2 className="text-xl font-display font-bold mb-4">Stats by Game</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(gameStats).map(([game, stats]) => (
              <div key={game} className="rounded-lg border border-border bg-card p-4 neon-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{gameIcons[game]}</span>
                  <span className="font-display font-bold uppercase text-sm">{game}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-lg font-display font-bold">{stats.matches}</div><div className="text-xs text-muted-foreground">Matches</div></div>
                  <div><div className="text-lg font-display font-bold text-primary">{stats.wr}</div><div className="text-xs text-muted-foreground">Win Rate</div></div>
                  <div><div className="text-lg font-display font-bold">{stats.kd}</div><div className="text-xs text-muted-foreground">K/D</div></div>
                  <div><div className="text-lg font-display font-bold">{stats.hs}</div><div className="text-xs text-muted-foreground">HS%</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Swords, label: "Total Matches", value: mockProfile.totalMatches, color: "text-primary" },
            { icon: Target, label: "Avg HS%", value: "26%", color: "text-accent" },
            { icon: Star, label: "Reputation", value: `${mockProfile.reputation}/100`, color: "text-yellow-400" },
            { icon: TrendingUp, label: "Win Streak", value: "3", color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4 text-center neon-border">
              <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
              <div className="text-xl font-display font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Match History & Tournaments */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="bg-card border border-border mb-4">
            <TabsTrigger value="history" className="font-display">Match History</TabsTrigger>
            <TabsTrigger value="tournaments" className="font-display">Tournament History</TabsTrigger>
            <TabsTrigger value="achievements" className="font-display">Achievements</TabsTrigger>
          </TabsList>
          <TabsContent value="history">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-[2rem_3rem_1fr_4rem_5rem_5rem_4rem] gap-3 px-4 py-3 bg-secondary/50 text-xs text-muted-foreground font-display uppercase tracking-widest">
                <span>Game</span><span>Date</span><span>Map</span><span>Result</span><span>Score</span><span>K/D/A</span><span className="text-right">ELO</span>
              </div>
              {matchHistory.map((m) => (
                <div key={m.id} className="grid grid-cols-[2rem_3rem_1fr_4rem_5rem_5rem_4rem] gap-3 px-4 py-3 border-t border-border hover:bg-secondary/20 transition-colors items-center text-sm">
                  <span>{gameIcons[m.game]}</span>
                  <span className="text-xs text-muted-foreground">{m.date}</span>
                  <span className="font-body">{m.map}</span>
                  <span className={`font-display font-bold text-xs ${m.result === "WIN" ? "text-success" : "text-destructive"}`}>{m.result}</span>
                  <span className="font-mono text-muted-foreground">{m.score}</span>
                  <span className="font-mono text-muted-foreground">{m.kda}</span>
                  <span className={`text-right font-mono font-bold text-xs ${m.elo.startsWith("+") ? "text-success" : "text-destructive"}`}>{m.elo}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="tournaments">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-[2rem_1fr_4rem_5rem_4rem] gap-3 px-4 py-3 bg-secondary/50 text-xs text-muted-foreground font-display uppercase tracking-widest">
                <span>Game</span><span>Tournament</span><span>Tier</span><span>Placement</span><span className="text-right">Points</span>
              </div>
              {tournamentHistory.map((t, i) => (
                <div key={i} className="grid grid-cols-[2rem_1fr_4rem_5rem_4rem] gap-3 px-4 py-3 border-t border-border hover:bg-secondary/20 transition-colors items-center text-sm">
                  <span>{gameIcons[t.game]}</span>
                  <span className="font-display font-semibold">{t.name}</span>
                  <Badge variant="outline" className={`text-xs font-display ${t.tier === 3 ? "text-primary" : t.tier === 2 ? "text-accent" : "text-success"}`}>
                    T{t.tier}
                  </Badge>
                  <span className="font-display font-bold text-sm">{t.placement}</span>
                  <span className="text-right font-mono font-bold text-success text-xs">{t.points}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="achievements">
            <div className="text-center py-16 text-muted-foreground font-body">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p>Achievements system coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
