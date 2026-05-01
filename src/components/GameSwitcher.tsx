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
    <div className={`flex items-center gap-1.5 ${className}`}>
      {GAMES.map((game) => {
        const elo = elos[game.id];
        const rank = getRankByElo(elo);
        const isActive = selectedGame === game.id;
        return (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            title={user ? `${game.name} — ${rank.name} (${elo} ELO)` : game.name}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display font-semibold uppercase tracking-wider transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground border border-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)]"
                : "bg-transparent text-muted-foreground border border-border/60 hover:text-foreground hover:border-border"
            }`}
          >
            <GameIcon game={game.id} size={16} />
            <span>{game.shortName}</span>
            {user && <RankBadge rank={rank.name} size="sm" />}
          </button>
        );
      })}
    </div>
  );
}
