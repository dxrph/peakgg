import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight, Lock } from "lucide-react";

export default function TopPlayersWeek() {
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
            The leaderboard unlocks when Season 1 goes live.
          </p>
        </motion.div>

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
                SEASON 1 — COMING SOON
              </h3>
              <p className="mt-2 text-sm text-muted-foreground font-body max-w-md">
                Season 1 hasn't started yet — every match you play from day one will count
                toward the global leaderboard.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-2 text-center">
              {[
                { label: "Players registered", value: "—" },
                { label: "Matches played", value: "—" },
                { label: "Season starts", value: "TBA" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-display font-bold text-foreground tabular-nums">
                    {s.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-display mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-display uppercase tracking-[0.18em] mt-2">
              <Lock className="h-3 w-3" /> Leaderboard locked until launch
            </div>
          </div>
        </motion.div>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground mb-4 font-body italic">
            Want to be in the first season? — <Link to="/register" className="text-primary hover:underline">Start playing</Link>
          </p>
          <Link to="/leaderboard">
            <Button variant="neonOutline" size="lg" className="rounded-md">
              Preview Leaderboard <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
