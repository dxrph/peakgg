import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GAMES, getRankByElo } from "@/lib/ranks";
import { Trophy, TrendingUp, TrendingDown, Swords, Clock, Info, ShieldCheck, ChevronDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import RankShowcaseGrid from "@/components/RankShowcaseGrid";
import ProgressionPath from "@/components/landing/ProgressionPath";

type EloRow = {
  id: string;
  user_id: string;
  game: string;
  match_id: string | null;
  elo_before: number;
  elo_after: number;
  delta: number;
  reason: string;
  created_at: string;
};

const RULES = [
  { icon: TrendingUp,   label: "Beat stronger team",  value: "Bigger gain",  tone: "text-success" },
  { icon: TrendingDown, label: "Lose to weaker team", value: "Bigger loss",  tone: "text-destructive" },
  { icon: Swords,       label: "Scrims",              value: "No rank impact", tone: "text-accent" },
  { icon: Clock,        label: "Inactivity Decay",    value: "−10 / 14 days", tone: "text-muted-foreground" },
];

export default function EloExplained() {
  const { user } = useAuth();
  const [rows, setRows] = useState<EloRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "How ELO works · PeakGG";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Learn how PeakGG calculates ELO after every match — formula, rewards, decay, and a transparent log of recent score updates.");
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let query = supabase
        .from("elo_history" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (user) query = query.eq("user_id", user.id);
      const { data } = await query;
      if (!cancelled) {
        setRows((data as any) ?? []);
        setLoading(false);
      }
    }
    load();

    // Realtime: append new entries when match results land
    const channel = supabase
      .channel("elo_history_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "elo_history" },
        (payload) => {
          const row = payload.new as EloRow;
          if (user && row.user_id !== user.id) return;
          setRows((prev) => [row, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16 max-w-5xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary font-display tracking-widest">
            TRANSPARENT RANKING
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            HOW WE CALCULATE <span className="text-primary text-glow-red">ELO</span>
          </h1>
          <p className="mt-4 text-muted-foreground font-body max-w-2xl mx-auto">
            Every PeakGG player has a single ELO score per game. It updates automatically after every
            match — no hidden multipliers, no surprise resets.
          </p>
        </motion.div>

        {/* How ELO works — plain-language */}
        <Card className="p-6 md:p-8 mb-8 border-border bg-card neon-border">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-xl uppercase tracking-wider">How ELO works</h2>
          </div>
          <p className="text-sm md:text-base font-body text-foreground/90 leading-relaxed">
            PeakGG uses a <span className="text-primary font-semibold">dynamic ELO system</span>. Beating stronger
            teams gives you more ELO. Losing to weaker teams costs you more ELO.
            {" "}<span className="text-foreground font-semibold">Scrims do not affect your official rank.</span>
          </p>

          <div className="mt-5 grid md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-success/30 bg-success/5 p-4">
              <div className="text-xs uppercase tracking-widest text-success font-display mb-2">Underdog win</div>
              <p className="text-sm font-body text-muted-foreground">
                Your team avg <span className="text-foreground font-mono">1000</span> beats opponent
                avg <span className="text-foreground font-mono">1200</span>:
                <span className="text-success font-semibold"> bigger ELO reward</span> than a normal win.
                A loss would <span className="text-foreground">cost less</span> than usual.
              </p>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="text-xs uppercase tracking-widest text-destructive font-display mb-2">Favored loss</div>
              <p className="text-sm font-body text-muted-foreground">
                Your team avg <span className="text-foreground font-mono">1200</span> loses to opponent
                avg <span className="text-foreground font-mono">1000</span>:
                <span className="text-destructive font-semibold"> bigger ELO loss</span> than a normal defeat.
                A win would <span className="text-foreground">give less</span> than usual.
              </p>
            </div>
          </div>

          <details className="mt-5 group rounded-lg border border-border bg-background/60 p-4">
            <summary className="flex items-center justify-between cursor-pointer text-xs uppercase tracking-widest font-display text-muted-foreground hover:text-foreground transition-colors">
              Advanced formula
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 font-mono text-xs md:text-sm overflow-x-auto space-y-1.5">
              <div className="text-muted-foreground"># Standard Elo expected score</div>
              <div><span className="text-primary">expected</span> = 1 / (1 + 10 ^ ((opponentAvgElo − teamAvgElo) / 400))</div>
              <div><span className="text-primary">delta</span> = round(K × (actual − expected))</div>
              <div className="text-muted-foreground"># actual = 1 for win, 0 for loss · minimum ELO is 0</div>
              <div className="text-muted-foreground mt-2"># K factor by match type</div>
              <div>Open Cup · Ranked Match → <span className="text-foreground">K = 24</span></div>
              <div>Challenger Series → <span className="text-foreground">K = 28</span></div>
              <div>Peak Championship → <span className="text-foreground">K = 32</span></div>
              <div>Scrim → <span className="text-accent">does not affect official ELO</span></div>
            </div>
          </details>

          <p className="text-xs text-muted-foreground mt-4 font-body">
            ELO is calculated server-side the moment a match is marked
            <em> completed</em>. Every change is logged below for full transparency.
          </p>
        </Card>

        {/* Rules grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {RULES.map((r) => (
            <Card key={r.label} className="p-5 border-border bg-card text-center">
              <r.icon className={`h-6 w-6 mx-auto mb-2 ${r.tone}`} />
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-display">
                {r.label}
              </div>
              <div className={`mt-1 font-mono font-bold ${r.tone}`}>{r.value}</div>
            </Card>
          ))}
        </div>

        {/* All 7 ranks preview */}
        <div className="mb-12">
          <div className="mb-10">
            <ProgressionPath variant="compact" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="font-display font-bold text-xl uppercase tracking-wider">The 7 PeakGG ranks</h2>
          </div>
          <RankShowcaseGrid />
        </div>

        {/* Trigger explanation */}
        <Card className="p-6 mb-12 border-border bg-card">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h2 className="font-display font-bold text-xl uppercase tracking-wider">When does it update?</h2>
          </div>
          <ol className="space-y-3 text-sm font-body text-muted-foreground list-decimal list-inside">
            <li>Both teams confirm the match score (or an admin resolves a dispute).</li>
            <li>The match status flips to <span className="text-foreground font-mono">completed</span>.</li>
            <li>
              Our backend function <span className="text-foreground font-mono">update-match-result</span> is
              triggered, computes the new ELO for every participant, and writes a record to your
              public ELO history.
            </li>
            <li>Your rank tier (Rookie → Apex) is recalculated live from the new score.</li>
          </ol>
        </Card>

        {/* Live log */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-2xl uppercase tracking-wider flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {user ? "Your recent ELO updates" : "Latest ELO updates"}
          </h2>
          {!user && (
            <Link to="/login" className="text-xs text-primary hover:underline font-display uppercase tracking-widest">
              Sign in for your own log
            </Link>
          )}
        </div>

        <Card className="border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground font-body text-sm">
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground font-body text-sm">
              No ELO changes yet. Once Season 1 starts, every match update will appear here in real time.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const game = GAMES.find((g) => g.id === r.game);
                const positive = r.delta >= 0;
                const tier = getRankByElo(r.elo_after);
                return (
                  <li key={r.id} className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${positive ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                      {positive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm font-body">
                        <span className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">
                          {game?.name ?? r.game}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-foreground capitalize">{r.reason.replace("_", " ")}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-body mt-0.5">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        {" · now "}
                        <span className="text-foreground font-mono">{r.elo_after}</span>
                        {" ELO ("}
                        <span className="font-display" style={{ color: tier.color }}>{tier.name}</span>
                        {")"}
                      </div>
                    </div>
                    <div className={`font-mono font-bold text-lg tabular-nums ${positive ? "text-success" : "text-destructive"}`}>
                      {positive ? "+" : ""}{r.delta}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="text-center mt-10">
          <Link to="/leaderboard" className="text-primary hover:underline font-display uppercase tracking-widest text-sm">
            View the full leaderboard →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
