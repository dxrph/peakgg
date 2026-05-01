import { useEffect, useState } from "react";
import { GAMES, type GameId, getRankByElo } from "@/lib/ranks";
import { useGame } from "@/lib/game-context";
import GameIcon from "@/components/GameIcon";
import RankBadge from "@/components/RankBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function GameSwitcher({ className = "" }: { className?: string }) {
  const { selectedGame, setSelectedGame } = useGame();
  const { user } = useAuth();
  const [elos, setElos] = useState<Record<GameId, number>>({
    valorant: 1000,
    cs2: 1000,
    r6s: 1000,
  });

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("player_stats")
        .select("game, elo")
        .eq("user_id", user.id);
      if (!active || !data) return;
      const next: Record<GameId, number> = { valorant: 1000, cs2: 1000, r6s: 1000 };
      data.forEach((r: any) => {
        if (r.game === "valorant" || r.game === "cs2" || r.game === "r6s") {
          next[r.game as GameId] = r.elo ?? 1000;
        }
      });
      setElos(next);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {GAMES.map((game) => {
        const elo = elos[game.id];
        const rank = getRankByElo(elo);
        const isActive = selectedGame === game.id;
        return (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            title={user ? `${game.name} — ${rank.name} (${elo} ELO)` : game.name}
            className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-xs font-display font-semibold uppercase tracking-wider transition-colors duration-200 ${
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GameIcon game={game.id} size={16} />
            <span>{game.shortName}</span>
            {isActive && (
              <span className="absolute left-2 right-2 -bottom-0.5 h-[2px] bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
