import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const mockPlayers = [
  { rank: 1, name: "PhantomX", elo: 2847, winrate: "68%", matches: 342, region: "EU-W" },
  { rank: 2, name: "NightShade", elo: 2791, winrate: "65%", matches: 298, region: "EU-W" },
  { rank: 3, name: "AceViper", elo: 2756, winrate: "63%", matches: 410, region: "EU-E" },
  { rank: 4, name: "BlitzStorm", elo: 2698, winrate: "61%", matches: 275, region: "EU-W" },
  { rank: 5, name: "ShadowReaper", elo: 2654, winrate: "60%", matches: 325, region: "EU-N" },
];

function getRankColor(rank: number) {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-muted-foreground";
}

export default function LeaderboardPreview() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            TOP <span className="text-primary">PLAYERS</span>
          </h2>
          <p className="text-muted-foreground">La classifica si aggiorna in tempo reale.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto rounded-lg border border-border bg-card overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-[3rem_1fr_5rem_4rem_4rem] md:grid-cols-[3rem_1fr_6rem_5rem_5rem_4rem] gap-4 px-4 py-3 bg-muted/50 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Elo</span>
            <span className="hidden md:block text-right">WR</span>
            <span className="hidden md:block text-right">Match</span>
            <span className="text-right">Region</span>
          </div>

          {mockPlayers.map((player, i) => (
            <div
              key={player.name}
              className="grid grid-cols-[3rem_1fr_5rem_4rem_4rem] md:grid-cols-[3rem_1fr_6rem_5rem_5rem_4rem] gap-4 px-4 py-3 border-t border-border hover:bg-muted/30 transition-colors items-center"
            >
              <span className={`font-display font-bold text-lg ${getRankColor(player.rank)}`}>
                {player.rank}
              </span>
              <span className="font-semibold truncate">{player.name}</span>
              <span className="text-right font-mono font-bold text-primary">{player.elo}</span>
              <span className="hidden md:block text-right text-sm text-muted-foreground">{player.winrate}</span>
              <span className="hidden md:block text-right text-sm text-muted-foreground">{player.matches}</span>
              <span className="text-right">
                <Badge variant="secondary" className="text-xs">{player.region}</Badge>
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
