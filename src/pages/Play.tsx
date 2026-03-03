import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crosshair, Clock, Shield, Swords, Users } from "lucide-react";
import { useState } from "react";

export default function PlayPage() {
  const [queuing, setQueuing] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const startQueue = () => {
    setQueuing(true);
    setSeconds(0);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    // cleanup would be needed in real app
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 animate-glow-pulse">
            <Swords className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-2">Ranked Matchmaking</h1>
          <p className="text-muted-foreground font-body mb-8">5v5 competitive queue — ELO-based matching</p>

          <div className="flex justify-center gap-6 mb-8 text-sm text-muted-foreground font-body">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Your ELO: <strong className="text-foreground">1,247</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <span>Online: <strong className="text-foreground">2,847</strong></span>
            </div>
          </div>

          {!queuing ? (
            <Button variant="neon" size="xl" onClick={startQueue} className="px-16">
              <Crosshair className="mr-2 h-5 w-5" />
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
              <li>• Mismatched scores trigger an automatic dispute</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
