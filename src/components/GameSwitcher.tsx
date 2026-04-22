import { GAMES, type GameId } from "@/lib/ranks";
import { useGame } from "@/lib/game-context";
import GameIcon from "@/components/GameIcon";

export default function GameSwitcher({ className = "" }: { className?: string }) {
  const { selectedGame, setSelectedGame } = useGame();

  return (
    <div className={`flex items-center rounded-full bg-secondary/80 border border-border p-0.5 ${className}`}>
      {GAMES.map((game) => (
        <button
          key={game.id}
          onClick={() => setSelectedGame(game.id)}
          className={`px-3 py-1 rounded-full text-xs font-display font-semibold uppercase tracking-wider transition-all ${
            selectedGame === game.id
              ? "gradient-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GameIcon game={game.id} size={16} className="mr-1.5 align-middle" />
          {game.shortName}
        </button>
      ))}
    </div>
  );
}
