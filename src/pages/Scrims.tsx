import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RankBadge from "@/components/RankBadge";
import { useGame } from "@/lib/game-context";
import { GAMES } from "@/lib/ranks";
import { Search, Filter, Calendar, Clock, Users, Swords, Plus, MessageCircle } from "lucide-react";
import { useState } from "react";
import GameComingSoon from "@/components/GameComingSoon";

const mockScrims = [
  { id: 1, team: "Peak Kings", tag: "PK", avgElo: 2650, game: "valorant", date: "Mar 8", time: "20:00", format: "5v5 BO3", notes: "Looking for Elite+ teams. Serious practice.", status: "open" },
  { id: 2, team: "Storm Elite", tag: "SE", avgElo: 2490, game: "valorant", date: "Mar 9", time: "19:00", format: "5v5 BO1", notes: "Practicing for weekly tournament.", status: "open" },
  { id: 3, team: "Shadow Corp", tag: "SC", avgElo: 1420, game: "cs2", date: "Mar 8", time: "21:00", format: "5v5 BO3", notes: "Casual practice, any rank welcome.", status: "open" },
  { id: 4, team: "Void Reapers", tag: "VR", avgElo: 2580, game: "valorant", date: "Mar 7", time: "18:00", format: "5v5 BO1", notes: "Quick warmup before tourney.", status: "accepted" },
  { id: 5, team: "Ice Protocol", tag: "IP", avgElo: 980, game: "r6", date: "Mar 10", time: "20:30", format: "5v5 BO3", notes: "New team looking for practice partners.", status: "open" },
  { id: 6, team: "Phoenix Rise", tag: "PR", avgElo: 640, game: "cs2", date: "Mar 9", time: "17:00", format: "5v5 BO1", notes: "Beginner-friendly scrim.", status: "open" },
];

export default function ScrimsPage() {
  const { selectedGame } = useGame();
  const filtered = mockScrims.filter(s => s.game === selectedGame);
  const game = GAMES.find(g => g.id === selectedGame)!;

  if (game.status !== "live") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="pt-24"><GameComingSoon /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold"><Swords className="inline h-8 w-8 text-primary mr-2" />Scrims</h1>
            <p className="text-muted-foreground font-body mt-1">Find practice matches for your team — {game.name}</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search scrims..." className="pl-10 w-64 bg-card border-border" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
            <Button variant="neon" size="sm"><Plus className="mr-2 h-4 w-4" />Post Scrim</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => (
            <div key={s.id} className={`rounded-lg border bg-card p-5 neon-border transition-all group ${
              s.status === "accepted" ? "border-success/30" : "border-border hover:border-primary/30"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center font-display font-bold text-primary-foreground text-xs">
                    {s.tag}
                  </div>
                  <div>
                    <h3 className="font-display font-bold group-hover:text-primary transition-colors">{s.team}</h3>
                    <RankBadge elo={s.avgElo} size="sm" />
                  </div>
                </div>
                {s.status === "accepted" ? (
                  <Badge variant="outline" className="border-success text-success text-xs font-display">Accepted</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs font-display">Open</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground font-body mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {s.date} at {s.time}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  {s.format}
                </div>
                <p className="text-xs italic">{s.notes}</p>
              </div>

              {s.status === "open" ? (
                <Button variant="neonOutline" size="sm" className="w-full">
                  <Swords className="mr-2 h-3.5 w-3.5" />Accept Scrim
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full border-success/30 text-success">
                  <MessageCircle className="mr-2 h-3.5 w-3.5" />Contact Team
                </Button>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground font-body">
              No scrims posted for {game.name} yet. Be the first!
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
