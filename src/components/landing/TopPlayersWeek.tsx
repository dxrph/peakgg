import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import { Trophy, ChevronRight, Lock, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TopPlayer = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  elo: number;
  wins: number;
};

function rankColor(r: number) {
  if (r === 1) return "text-yellow-400";
  if (r === 2) return "text-gray-300";
  if (r === 3) return "text-amber-600";
  return "text-muted-foreground";
}

export default function TopPlayersWeek() {
  const [players, setPlayers] = useState<TopPlayer[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from("player_stats")
        .select("user_id, elo, wins, profiles!inner(username, avatar_url)")
        .order("elo", { ascending: false })
        .limit(5);
      if (cancelled) return;
      const mapped: TopPlayer[] = (data ?? []).map((row: any) => ({
        user_id: row.user_id,
        elo: row.elo,
        wins: row.wins,
        username: row.profiles?.username ?? "Player",
        avatar_url: row.profiles?.avatar_url ?? null,
      }));
      // Only show real leaderboard if at least one player has played a match (elo != default 1000 or wins > 0)
      const hasActivity = mapped.some((p) => p.wins > 0 || p.elo !== 1000);
      setPlayers(hasActivity ? mapped : []);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const showList = players !== null && players.length > 0;

  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            TOP PLAYERS <span className="text-primary text-glow-red">THIS WEEK</span>
          </h2>
          <p className="mt-3 text-muted-foreground font-body">
            {showList ? "The five climbing the fastest right now." : "Be among the first to claim a spot on the leaderboard."}
          </p>
        </motion.div>

        {showList ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="grid grid-cols-[3rem_1fr_auto_4rem_5rem] gap-3 px-5 py-3 bg-secondary/40 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-display">
              <span>#</span>
              <span>Player</span>
              <span className="text-right pr-2">Rank</span>
              <span className="text-right">Wins</span>
              <span className="text-right">ELO</span>
            </div>
            {players!.map((p, i) => {
              const rank = i + 1;
              return (
                <motion.div
                  key={p.user_id}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="grid grid-cols-[3rem_1fr_auto_4rem_5rem] gap-3 px-5 py-3 border-t border-border/60 items-center hover:bg-secondary/30 transition-colors"
                >
                  <span className={`font-display font-bold text-lg flex items-center gap-1 ${rankColor(rank)}`}>
                    {rank <= 3 && <Crown className="h-4 w-4" />}
                    {rank}
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 border border-border/60">
                      {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.username} />}
                      <AvatarFallback className="text-[10px] bg-secondary">
                        {p.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold truncate font-body">{p.username}</span>
                  </div>
                  <div className="flex justify-end pr-2">
                    <RankBadge elo={p.elo} size="sm" />
                  </div>
                  <span className="text-right text-sm font-mono text-foreground/80">{p.wins}</span>
                  <span className="text-right font-mono font-bold text-primary">{p.elo}</span>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto rounded-xl border border-border bg-card overflow-hidden relative"
          >
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="relative px-6 py-16 flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.35)]">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold tracking-tight">
                  THE LEADERBOARD IS WAITING
                </h3>
                <p className="mt-2 text-sm text-muted-foreground font-body max-w-md">
                  No matches have been played yet. Register, queue up, and become the first
                  name on the global ranking.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-display uppercase tracking-[0.18em] mt-2">
                <Lock className="h-3 w-3" /> Top 5 unlocks after the first ranked matches
              </div>
            </div>
          </motion.div>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground mb-4 font-body italic">
            Want to be on top? — <Link to="/register" className="text-primary hover:underline">Start playing</Link>
          </p>
          <Link to="/leaderboard">
            <Button variant="neonOutline" size="lg" className="rounded-md">
              View Full Leaderboard <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
