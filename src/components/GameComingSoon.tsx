import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import GameIcon from "@/components/GameIcon";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/game-context";
import { GAMES, getGameById } from "@/lib/ranks";

export default function GameComingSoon() {
  const { selectedGame, setSelectedGame } = useGame();
  const game = getGameById(selectedGame);
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center rounded-xl border border-border bg-card/60 backdrop-blur-sm p-10"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <GameIcon game={game.id} size={48} />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-4">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-primary font-display font-semibold tracking-widest uppercase">
            Coming Soon
          </span>
        </div>
        <h2 className="text-3xl font-display font-bold mb-3">{game.name}</h2>
        <p className="text-muted-foreground font-body mb-6">
          Support for {game.name} is launching soon. Stay tuned and be the first to compete.
        </p>
        <Button
          variant="neonOutline"
          onClick={() => setSelectedGame("valorant")}
        >
          Switch to VALORANT
        </Button>
      </motion.div>
    </section>
  );
}