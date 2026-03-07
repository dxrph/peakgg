import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import EloProgressBar from "@/components/EloProgressBar";
import { Mountain, Clock, Shield, Swords, Users } from "lucide-react";
import { useState } from "react";
import { useGame } from "@/lib/game-context";
import { GAMES } from "@/lib/ranks";

export default function PlayPage() {
  const [queuing, setQueuing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const { selectedGame } = useGame();
  const game = GAMES.find(g => g.id === selectedGame)!;

  const startQueue = () => {
    setQueuing(true);
    setSeconds(0);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const userElo = 1247;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 animate-glow-pulse">
            <Swords className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-2">Ranked Matchmaking</h1>
          <p className="text-muted-foreground font-body mb-4">5v5 competitive queue — {game.name}</p>

          <div className="mb-6">
            <RankBadge elo={userElo} size="lg" showElo />
          </div>

          <EloProgressBar elo={userElo} className="mb-8 text-left" />

          <div className="flex justify-center gap-6 mb-8 text-sm text-muted-foreground font-body">
            <div className="flex items-center gap-2">
              <span className="text-lg">{game.icon}</span>
              <span className="font-semibold text-foreground">{game.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <span>Online: <strong className="text-foreground">4,213</strong></span>
            </div>
          </div>

          {!queuing ? (
            <Button variant="neon" size="xl" onClick={startQueue} className="px-16">
              <Mountain className="mr-2 h-5 w-5" />
              Find Match
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-6 rounded-lg border border-primary/30 bg-card animate-glow-pulse">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                  <span className="text-2xl font-display font-bold text-primary">{formatTime(seconds)}</span>
                </div>
                <p className="text-sm text-muted-foreground font-body">Searching for match...</p>
                <p className="text-xs text-muted-foreground font-body mt-1">Estimated wait: ~2 min</p>
              </div>
              <Button variant="outline" onClick={() => setQueuing(false)}>Cancel Queue</Button>
            </div>
          )}

          <div className="mt-12 p-4 rounded-lg border border-border bg-card/50 text-left">
            <h3 className="font-display font-bold text-sm mb-2 uppercase tracking-wider">Queue Rules</h3>
            <ul className="text-xs text-muted-foreground font-body space-y-1">
              <li>• You must accept within 30 seconds when a match is found</li>
              <li>• Declining or not responding results in a 5-minute cooldown</li>
              <li>• Both team captains must confirm the final score</li>
              <li>• Win: +25 ELO · Loss: -15 ELO</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
