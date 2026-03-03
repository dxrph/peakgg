import Navbar from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Swords, Trophy, TrendingUp, Star, Target } from "lucide-react";

const mockProfile = {
  username: "PhantomX",
  riotId: "PhantomX#EUW",
  elo: 2847,
  rank: "Radiant",
  winrate: "68%",
  kd: "1.42",
  hs: "28%",
  totalMatches: 342,
  team: "Rift Kings",
  reputation: 92,
  verification: 3,
};

const matchHistory = [
  { id: 1, date: "Mar 3", map: "Ascent", result: "WIN", score: "13-9", kda: "24/12/6", elo: "+28" },
  { id: 2, date: "Mar 3", map: "Haven", result: "LOSS", score: "8-13", kda: "15/18/4", elo: "-22" },
  { id: 3, date: "Mar 2", map: "Bind", result: "WIN", score: "13-11", kda: "21/16/8", elo: "+24" },
  { id: 4, date: "Mar 2", map: "Split", result: "WIN", score: "13-7", kda: "26/10/5", elo: "+30" },
  { id: 5, date: "Mar 1", map: "Icebox", result: "LOSS", score: "10-13", kda: "18/17/3", elo: "-20" },
  { id: 6, date: "Mar 1", map: "Lotus", result: "WIN", score: "13-5", kda: "28/8/7", elo: "+32" },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Header */}
        <div className="relative rounded-lg border border-border bg-card overflow-hidden mb-8 neon-border">
          {/* Banner */}
          <div className="h-32 md:h-44 gradient-hero relative">
            <div className="absolute inset-0 scanline pointer-events-none opacity-50" />
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-10 md:-mt-12">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full gradient-primary flex items-center justify-center text-2xl font-display font-bold text-primary-foreground border-4 border-card">
                PX
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-display font-bold">{mockProfile.username}</h1>
                  <Badge variant="outline" className="border-accent text-accent font-display text-xs">{mockProfile.rank}</Badge>
                  <Badge variant="secondary" className="font-display text-xs"><Shield className="h-3 w-3 mr-1" />Level {mockProfile.verification}</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-body">{mockProfile.riotId} · {mockProfile.team}</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-2xl font-display font-bold text-primary">{mockProfile.elo}</div>
                  <div className="text-xs text-muted-foreground font-display uppercase">ELO</div>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold">{mockProfile.winrate}</div>
                  <div className="text-xs text-muted-foreground font-display uppercase">Win Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold">{mockProfile.kd}</div>
                  <div className="text-xs text-muted-foreground font-display uppercase">K/D</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Swords, label: "Matches", value: mockProfile.totalMatches, color: "text-primary" },
            { icon: Target, label: "HS%", value: mockProfile.hs, color: "text-accent" },
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

        {/* Match History */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="bg-card border border-border mb-4">
            <TabsTrigger value="history" className="font-display">Match History</TabsTrigger>
            <TabsTrigger value="achievements" className="font-display">Achievements</TabsTrigger>
          </TabsList>
          <TabsContent value="history">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-[3rem_1fr_4rem_5rem_5rem_4rem] gap-3 px-4 py-3 bg-secondary/50 text-xs text-muted-foreground font-display uppercase tracking-widest">
                <span>Date</span><span>Map</span><span>Result</span><span>Score</span><span>K/D/A</span><span className="text-right">ELO</span>
              </div>
              {matchHistory.map((m) => (
                <div key={m.id} className="grid grid-cols-[3rem_1fr_4rem_5rem_5rem_4rem] gap-3 px-4 py-3 border-t border-border hover:bg-secondary/20 transition-colors items-center text-sm">
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
