import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import { Trophy, Calendar, Users, MapPin, Clock, Shield, ChevronRight, CheckCircle2 } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import BracketView from "@/components/tournaments/BracketView";

const tournamentData: Record<string, any> = {
  "1": {
    name: "PeakGG Weekly #12",
    format: "5v5 Single Elimination",
    date: "March 8, 2026 — 19:00 CET",
    prize: "€500",
    slots: "12/16",
    status: "Open",
    tier: 1,
    region: "EU-West",
    description: "Weekly competitive tournament open to all players. Single elimination bracket with best-of-1 matches until semifinals, then best-of-3.",
    rules: [
      "Open to all PeakGG players (Tier 1 — Open Cup)",
      "Check-in opens 30 minutes before start",
      "No-show after 5 minutes = automatic forfeit",
      "Standard competitive rules apply",
      "Tournament Points awarded: +10 per win, +50 top 4, +100 champion",
    ],
    prizeBreakdown: [
      { place: "1st", amount: "€300" },
      { place: "2nd", amount: "€125" },
      { place: "3rd-4th", amount: "€37.50" },
    ],
    participants: [
      { name: "Peak Kings", tag: "PK", elo: 2650, checkedIn: true },
      { name: "Void Reapers", tag: "VR", elo: 2580, checkedIn: true },
      { name: "Storm Elite", tag: "SE", elo: 2490, checkedIn: false },
      { name: "Shadow Corp", tag: "SC", elo: 2420, checkedIn: true },
      { name: "Ice Protocol", tag: "IP", elo: 2380, checkedIn: false },
      { name: "Phoenix Rise", tag: "PR", elo: 2340, checkedIn: true },
      { name: "Nova Strike", tag: "NS", elo: 2300, checkedIn: false },
      { name: "Lunar Vanguard", tag: "LV", elo: 1850, checkedIn: false },
      { name: "Apex Predators", tag: "AP", elo: 1600, checkedIn: true },
      { name: "Crimson Wolves", tag: "CW", elo: 1180, checkedIn: false },
      { name: "Eclipse Gaming", tag: "EG", elo: 950, checkedIn: true },
      { name: "Zenith Esports", tag: "ZE", elo: 720, checkedIn: false },
    ],
    bracket: [
      { round: "Quarterfinals", matches: [
        { team1: "Peak Kings", team2: "Zenith Esports", score1: 13, score2: 7, status: "completed" },
        { team1: "Void Reapers", team2: "Eclipse Gaming", score1: null, score2: null, status: "upcoming" },
        { team1: "Storm Elite", team2: "Crimson Wolves", score1: null, score2: null, status: "upcoming" },
        { team1: "Shadow Corp", team2: "Apex Predators", score1: null, score2: null, status: "upcoming" },
      ]},
      { round: "Semifinals", matches: [
        { team1: "Peak Kings", team2: "TBD", score1: null, score2: null, status: "upcoming" },
        { team1: "TBD", team2: "TBD", score1: null, score2: null, status: "upcoming" },
      ]},
      { round: "Grand Final", matches: [
        { team1: "TBD", team2: "TBD", score1: null, score2: null, status: "upcoming" },
      ]},
    ],
  },
};

export default function TournamentDetailPage() {
  const { id } = useParams();
  const tournament = tournamentData[id || "1"] || tournamentData["1"];

  const tierColors: Record<number, string> = { 1: "text-success", 2: "text-accent", 3: "text-primary" };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-body">
          <Link to="/tournaments" className="hover:text-foreground transition-colors">Tournaments</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{tournament.name}</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 md:p-8 neon-border mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="border-primary text-primary font-display">{tournament.status}</Badge>
                <Badge variant="secondary" className="font-display">{tournament.format}</Badge>
                <Badge variant="outline" className={`font-display ${tierColors[tournament.tier]}`}>
                  Tier {tournament.tier}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">{tournament.name}</h1>
              <p className="text-muted-foreground font-body max-w-2xl">{tournament.description}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground font-body">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{tournament.date}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{tournament.region}</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{tournament.slots} teams</span>
                <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-accent" /><span className="text-accent font-semibold">{tournament.prize}</span></span>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Button variant="neon" size="lg">Register Team</Button>
              <Button variant="neonOutline" size="sm"><Clock className="mr-2 h-4 w-4" />Check-in (opens 30m before)</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 neon-border">
              <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />Bracket
              </h2>
              <div className="space-y-8 overflow-x-auto">
                {tournament.bracket.map((round: any) => (
                  <div key={round.round}>
                    <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">{round.round}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {round.matches.map((match: any, i: number) => (
                        <div key={i} className={`rounded border p-3 ${match.status === "completed" ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30"}`}>
                          <div className="flex justify-between items-center">
                            <div className="space-y-1.5">
                              <div className={`text-sm font-display font-semibold ${match.status === "completed" && match.score1 > match.score2 ? "text-primary" : ""}`}>
                                {match.team1}
                              </div>
                              <div className={`text-sm font-display font-semibold ${match.status === "completed" && match.score2 > match.score1 ? "text-primary" : ""}`}>
                                {match.team2}
                              </div>
                            </div>
                            <div className="text-right space-y-1.5">
                              {match.status === "completed" ? (
                                <>
                                  <div className={`text-sm font-mono font-bold ${match.score1 > match.score2 ? "text-primary" : "text-muted-foreground"}`}>{match.score1}</div>
                                  <div className={`text-sm font-mono font-bold ${match.score2 > match.score1 ? "text-primary" : "text-muted-foreground"}`}>{match.score2}</div>
                                </>
                              ) : (
                                <Badge variant="secondary" className="text-xs font-display">Upcoming</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 neon-border">
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />Participants ({tournament.participants.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tournament.participants.map((p: any) => (
                  <div key={p.tag} className="flex items-center justify-between rounded border border-border bg-secondary/30 p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded gradient-primary flex items-center justify-center font-display font-bold text-primary-foreground text-xs">{p.tag}</div>
                      <div>
                        <span className="font-display font-semibold text-sm">{p.name}</span>
                        <div className="mt-0.5"><RankBadge elo={p.elo} size="sm" /></div>
                      </div>
                    </div>
                    {p.checkedIn && <CheckCircle2 className="h-4 w-4 text-success" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 neon-border">
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />Prize Breakdown
              </h3>
              <div className="space-y-3">
                {tournament.prizeBreakdown.map((p: any) => (
                  <div key={p.place} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="font-display font-semibold text-sm">{p.place}</span>
                    <span className="text-accent font-mono font-bold">{p.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 neon-border">
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />Rules
              </h3>
              <ul className="space-y-2">
                {tournament.rules.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                    <span className="text-primary mt-0.5">•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {id && (
          <div className="mt-10">
            <h2 className="font-display text-xl uppercase tracking-widest mb-4">Tabellone</h2>
            <BracketView tournamentId={id} />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
