import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const mockPlayers = [
  { rank: 1, name: "PhantomX", elo: 2847, winrate: "68%", kd: "1.42", team: "Rift Kings", region: "EU-W" },
  { rank: 2, name: "NightShade", elo: 2791, winrate: "65%", kd: "1.38", team: "Void Reapers", region: "EU-W" },
  { rank: 3, name: "AceViper", elo: 2756, winrate: "63%", kd: "1.35", team: "—", region: "EU-E" },
  { rank: 4, name: "BlitzStorm", elo: 2698, winrate: "61%", kd: "1.29", team: "Storm Elite", region: "EU-W" },
  { rank: 5, name: "ShadowReaper", elo: 2654, winrate: "60%", kd: "1.26", team: "Shadow Corp", region: "EU-N" },
  { rank: 6, name: "CyberJett", elo: 2621, winrate: "59%", kd: "1.24", team: "—", region: "EU-W" },
  { rank: 7, name: "FrostByte", elo: 2598, winrate: "58%", kd: "1.21", team: "Ice Protocol", region: "EU-N" },
];

function getRankStyle(rank: number) {
  if (rank === 1) return "text-yellow-400 text-glow-orange";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-muted-foreground";
}

export default function LeaderboardPreview() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            TOP <span className="text-primary">PLAYERS</span>
          </h2>
          <p className="text-muted-foreground font-body">Season 1 global leaderboard — updated in real-time.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-lg border border-border bg-card overflow-hidden neon-border"
        >
          {/* Header */}
          <div className="grid grid-cols-[2.5rem_1fr_4.5rem_4rem] md:grid-cols-[2.5rem_1fr_5rem_4.5rem_4rem_5rem_4rem] gap-3 px-4 py-3 bg-secondary/50 text-xs text-muted-foreground font-display uppercase tracking-widest">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">ELO</span>
            <span className="text-right hidden md:block">WR</span>
            <span className="text-right hidden md:block">K/D</span>
            <span className="text-right hidden md:block">Team</span>
            <span className="text-right">Region</span>
          </div>

          {mockPlayers.map((p) => (
            <div key={p.name}
              className="grid grid-cols-[2.5rem_1fr_4.5rem_4rem] md:grid-cols-[2.5rem_1fr_5rem_4.5rem_4rem_5rem_4rem] gap-3 px-4 py-3 border-t border-border hover:bg-secondary/30 transition-colors items-center"
            >
              <span className={`font-display font-bold text-lg ${getRankStyle(p.rank)}`}>{p.rank}</span>
              <span className="font-semibold truncate font-body">{p.name}</span>
              <span className="text-right font-mono font-bold text-primary">{p.elo}</span>
              <span className="hidden md:block text-right text-sm text-muted-foreground">{p.winrate}</span>
              <span className="hidden md:block text-right text-sm text-muted-foreground">{p.kd}</span>
              <span className="hidden md:block text-right text-sm text-muted-foreground truncate">{p.team}</span>
              <span className="text-right">
                <Badge variant="secondary" className="text-xs font-display">{p.region}</Badge>
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
