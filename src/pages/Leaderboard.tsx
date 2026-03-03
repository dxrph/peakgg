import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, TrendingUp, Users } from "lucide-react";

const players = [
  { rank: 1, name: "PhantomX", elo: 2847, wr: "68%", kd: "1.42", hs: "28%", team: "Rift Kings", region: "EU-W" },
  { rank: 2, name: "NightShade", elo: 2791, wr: "65%", kd: "1.38", hs: "26%", team: "Void Reapers", region: "EU-W" },
  { rank: 3, name: "AceViper", elo: 2756, wr: "63%", kd: "1.35", hs: "31%", team: "—", region: "EU-E" },
  { rank: 4, name: "BlitzStorm", elo: 2698, wr: "61%", kd: "1.29", hs: "24%", team: "Storm Elite", region: "EU-W" },
  { rank: 5, name: "ShadowReaper", elo: 2654, wr: "60%", kd: "1.26", hs: "27%", team: "Shadow Corp", region: "EU-N" },
  { rank: 6, name: "CyberJett", elo: 2621, wr: "59%", kd: "1.24", hs: "30%", team: "—", region: "EU-W" },
  { rank: 7, name: "FrostByte", elo: 2598, wr: "58%", kd: "1.21", hs: "25%", team: "Ice Protocol", region: "EU-N" },
  { rank: 8, name: "NovaFlash", elo: 2567, wr: "57%", kd: "1.19", hs: "22%", team: "—", region: "EU-W" },
  { rank: 9, name: "IronClad", elo: 2543, wr: "56%", kd: "1.18", hs: "23%", team: "Phoenix Rise", region: "EU-E" },
  { rank: 10, name: "ViperStrike", elo: 2521, wr: "55%", kd: "1.16", hs: "29%", team: "—", region: "EU-W" },
];

function getRankColor(r: number) {
  if (r === 1) return "text-yellow-400";
  if (r === 2) return "text-gray-300";
  if (r === 3) return "text-amber-600";
  return "text-muted-foreground";
}

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold"><Crown className="inline h-8 w-8 text-accent mr-2" />Leaderboard</h1>
          <p className="text-muted-foreground font-body mt-1">Season 1 — Top 100 players and teams.</p>
        </div>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="global" className="font-display">Global</TabsTrigger>
            <TabsTrigger value="europe" className="font-display">Europe</TabsTrigger>
            <TabsTrigger value="teams" className="font-display">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            <div className="rounded-lg border border-border bg-card overflow-hidden neon-border">
              <div className="grid grid-cols-[2.5rem_1fr_5rem] md:grid-cols-[2.5rem_1fr_5rem_4rem_4rem_4rem_5rem_4rem] gap-3 px-4 py-3 bg-secondary/50 text-xs text-muted-foreground font-display uppercase tracking-widest">
                <span>#</span><span>Player</span><span className="text-right">ELO</span>
                <span className="hidden md:block text-right">WR</span>
                <span className="hidden md:block text-right">K/D</span>
                <span className="hidden md:block text-right">HS%</span>
                <span className="hidden md:block text-right">Team</span>
                <span className="hidden md:block text-right">Region</span>
              </div>
              {players.map((p) => (
                <div key={p.rank} className="grid grid-cols-[2.5rem_1fr_5rem] md:grid-cols-[2.5rem_1fr_5rem_4rem_4rem_4rem_5rem_4rem] gap-3 px-4 py-3 border-t border-border hover:bg-secondary/20 transition-colors items-center">
                  <span className={`font-display font-bold text-lg ${getRankColor(p.rank)}`}>{p.rank}</span>
                  <span className="font-semibold font-body truncate">{p.name}</span>
                  <span className="text-right font-mono font-bold text-primary">{p.elo}</span>
                  <span className="hidden md:block text-right text-sm text-muted-foreground">{p.wr}</span>
                  <span className="hidden md:block text-right text-sm text-muted-foreground">{p.kd}</span>
                  <span className="hidden md:block text-right text-sm text-muted-foreground">{p.hs}</span>
                  <span className="hidden md:block text-right text-sm text-muted-foreground truncate">{p.team}</span>
                  <span className="hidden md:block text-right"><Badge variant="secondary" className="text-xs font-display">{p.region}</Badge></span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="europe"><p className="text-muted-foreground text-center py-16 font-body">European leaderboard — coming soon.</p></TabsContent>
          <TabsContent value="teams"><p className="text-muted-foreground text-center py-16 font-body">Team rankings — coming soon.</p></TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
