import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RankBadge from "@/components/RankBadge";
import EloProgressBar from "@/components/EloProgressBar";
import { Clock, Swords, Users, MessageCircle, UserPlus, Trophy, Sparkles, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "@/lib/game-context";
import { GAMES } from "@/lib/ranks";
import GameIcon from "@/components/GameIcon";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DISCORD_INVITE } from "@/lib/links";
import { useUserRoles } from "@/hooks/useUserRoles";
import { rankedPublicBetaEnabled } from "@/lib/feature-flags";
import { useMatchFoundListener } from "@/hooks/useMatchFoundListener";

export default function PlayPage() {
  const { selectedGame } = useGame();
  const game = GAMES.find((g) => g.id === selectedGame)!;
  const { user, profile } = useAuth();
  const { isAdmin } = useUserRoles();
  const [elo, setElo] = useState<number | null>(null);
  const [matchesPlayed, setMatchesPlayed] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);

  // Auto-redirect if user is matched while sitting on /play
  useMatchFoundListener();

  useEffect(() => {
    let active = true;
    if (!user) {
      setElo(null);
      setMatchesPlayed(0);
      return;
    }
    setLoadingStats(true);
    supabase
      .from("player_stats")
      .select("elo, matches_played")
      .eq("user_id", user.id)
      .eq("game", selectedGame)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setElo(data?.elo ?? null);
        setMatchesPlayed(data?.matches_played ?? 0);
        setLoadingStats(false);
      });
    return () => {
      active = false;
    };
  }, [user, selectedGame]);

  const isRanked = !!user && matchesPlayed > 0 && elo !== null;
  const profileIncomplete = !!user && (!profile?.username || !profile?.riot_id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Ranked Matchmaking — PeakGG"
        description="PeakGG ranked matchmaking is launching with Season 1. Complete your profile and join Discord to be ready."
        path="/play"
      />
      <Navbar />
      <div className="container pt-24 pb-16 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-xl w-full">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 animate-glow-pulse">
            <Swords className="h-10 w-10 text-primary-foreground" />
          </div>

          <Badge variant="outline" className="mb-3 border-primary/40 text-primary uppercase tracking-widest">
            <Sparkles className="h-3 w-3 mr-1" /> {rankedPublicBetaEnabled ? "Public Beta" : "Closed Beta"}
          </Badge>

          <h1 className="text-4xl font-display font-bold mb-2">Ranked Matchmaking</h1>
          <p className="text-muted-foreground font-body mb-2">
            {rankedPublicBetaEnabled
              ? "Ranked matchmaking is in public beta — 1v1 Test Queue."
              : "Ranked matchmaking is being tested with early players."}
          </p>
          <p className="text-sm text-muted-foreground font-body mb-8 max-w-md mx-auto">
            {rankedPublicBetaEnabled
              ? "Results affect your ELO and rank after both sides confirm. During beta, the Ranked queue runs through the Open Cup test queue."
              : "It will affect your ELO and rank once public. For now, join Discord to access early tests with the PeakGG team."}
          </p>

          {isAdmin && (
            <div className="mb-6 p-3 rounded-lg border border-accent/40 bg-accent/5 text-left flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-accent font-display uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" /> Admin tools
              </div>
              <Link to="/admin/elo" className="text-xs underline text-accent">Open ELO panel</Link>
            </div>
          )}

          {/* Rank card */}
          <div className="mb-8 p-6 rounded-lg border border-border bg-card/60 backdrop-blur-sm">
            {!user ? (
              <div className="space-y-3">
                <div className="text-sm uppercase tracking-widest text-muted-foreground font-display">Your Rank</div>
                <div className="text-2xl font-display font-bold">Sign in to see your rank</div>
                <p className="text-sm text-muted-foreground font-body">
                  Create an account to claim your PeakGG profile before Season 1.
                </p>
              </div>
            ) : loadingStats ? (
              <div className="text-sm text-muted-foreground font-body">Loading your stats…</div>
            ) : isRanked ? (
              <>
                <div className="mb-4">
                  <RankBadge elo={elo!} size="lg" showElo />
                </div>
                <EloProgressBar elo={elo!} className="text-left" />
              </>
            ) : (
              <div className="space-y-3">
                <div className="text-sm uppercase tracking-widest text-muted-foreground font-display">Your Rank</div>
                <div className="text-2xl font-display font-bold">Unranked</div>
                <p className="text-sm text-muted-foreground font-body">
                  Play future ranked matches to receive your first PeakGG rank.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-6 mb-8 text-sm text-muted-foreground font-body flex-wrap">
            <div className="flex items-center gap-2">
              <GameIcon game={game.id} size={24} />
              <span className="font-semibold text-foreground">{game.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Matchmaking opens with Season 1</span>
            </div>
          </div>

          {/* Primary actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            {!user ? (
              <Button variant="neon" size="lg" asChild>
                <Link to="/register"><UserPlus className="mr-1" /> Create Account</Link>
              </Button>
            ) : profileIncomplete ? (
              <Button variant="neon" size="lg" asChild>
                <Link to="/settings">Complete Profile</Link>
              </Button>
            ) : (
              <Button variant="neon" size="lg" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            )}
            <Button variant="neonOutline" size="lg" asChild>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1" /> Join Discord
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/free-agents"><Users className="mr-1" /> Find Teammates</Link>
            </Button>
          </div>

          {rankedPublicBetaEnabled ? (
            <Button variant="neon" size="lg" asChild className="mb-10">
              <Link to={user ? "/tournaments#solo-path" : "/login?redirect=/tournaments"}>
                <Swords className="h-4 w-4 mr-1.5" />Find Ranked Match (1v1 Beta)
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled className="mb-10 opacity-70">
              Find Match — opens with Season 1
            </Button>
          )}

          {/* Multi-game note */}
          <div className="mb-10 p-4 rounded-lg border border-border bg-card/40 text-left">
            <p className="text-xs text-muted-foreground font-body">
              Ranked queues will launch progressively for Valorant, CS2 and Rainbow Six Siege.
            </p>
          </div>

          {/* Rules preview */}
          <div className="mb-10 p-5 rounded-lg border border-border bg-card/50 text-left">
            <h3 className="font-display font-bold text-sm mb-3 uppercase tracking-wider">Ranked Rules Preview</h3>
            <ul className="text-xs text-muted-foreground font-body space-y-1.5">
              <li>• Accept matches before the timer expires</li>
              <li>• Captains confirm final scores</li>
              <li>• Leaving or dodging may trigger cooldowns</li>
              <li>• Wins and losses affect your PeakGG ELO</li>
              <li>• Anti-smurf checks will improve competitive integrity</li>
            </ul>
            <p className="text-[10px] text-muted-foreground/70 mt-3 italic">Rules subject to change before Season 1.</p>
          </div>

          {/* Season 1 CTA card */}
          <div className="p-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="font-display font-bold text-lg uppercase tracking-wider">Get ready for Season 1</h3>
            </div>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Join Discord to get notified when ranked matchmaking opens and help test the first queues.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="neon" size="sm" asChild>
                <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">Join Discord</a>
              </Button>
              <Button variant="neonOutline" size="sm" asChild>
                <Link to="/tournaments">View Tournaments</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/teams">Find Team</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
