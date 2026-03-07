import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import { Users, Globe, Shield, Trophy, ChevronRight, Swords, TrendingUp, UserPlus } from "lucide-react";
import { useParams, Link } from "react-router-dom";

const teamData: Record<string, any> = {
  "1": {
    name: "Peak Kings",
    tag: "PK",
    elo: 2650,
    region: "EU-West",
    description: "Top-tier competitive team competing across VALORANT, CS2, and R6 on PeakGG. Founded in 2025, we focus on strategic play and consistent improvement.",
    recruiting: true,
    stats: { wins: 87, losses: 34, winRate: "72%", tournamentsWon: 3 },
    roster: [
      { username: "PhantomX", role: "Duelist", elo: 3120, captain: true },
      { username: "NexusGhost", role: "Controller", elo: 2680, captain: false },
      { username: "AceViper", role: "Sentinel", elo: 2590, captain: false },
      { username: "CyberWolf", role: "Initiator", elo: 2540, captain: false },
      { username: "BladeRunner", role: "Flex", elo: 1510, captain: false },
    ],
    recentMatches: [
      { opponent: "Void Reapers", result: "WIN", score: "13-9", map: "Ascent", date: "Mar 4" },
      { opponent: "Storm Elite", result: "WIN", score: "13-7", map: "Haven", date: "Mar 3" },
      { opponent: "Shadow Corp", result: "LOSS", score: "10-13", map: "Bind", date: "Mar 1" },
      { opponent: "Phoenix Rise", result: "WIN", score: "13-11", map: "Split", date: "Feb 28" },
    ],
    tournamentHistory: [
      { name: "Weekly #11", placement: "1st", prize: "€300", tier: 1 },
      { name: "Challenger Series #2", placement: "2nd", prize: "€500", tier: 2 },
      { name: "Weekly #9", placement: "1st", prize: "€300", tier: 1 },
    ],
  },
};

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const team = teamData[teamId || "1"] || teamData["1"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-body">
          <Link to="/teams" className="hover:text-foreground transition-colors">Teams</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{team.name}</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 md:p-8 neon-border mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-xl gradient-primary flex items-center justify-center font-display font-bold text-primary-foreground text-2xl shrink-0">
              {team.tag}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-display font-bold">{team.name}</h1>
                {team.recruiting && (
                  <Badge variant="outline" className="border-success text-success font-display">Recruiting</Badge>
                )}
              </div>
              <p className="text-muted-foreground font-body mb-4 max-w-2xl">{team.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-body items-center">
                <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" />{team.region}</span>
                <RankBadge elo={team.elo} showElo />
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{team.roster.length}/5 members</span>
              </div>
            </div>
            {team.recruiting && (
              <Button variant="neon" size="lg"><UserPlus className="mr-2 h-4 w-4" />Request to Join</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Swords, label: "Wins", value: team.stats.wins, color: "text-success" },
            { icon: Swords, label: "Losses", value: team.stats.losses, color: "text-destructive" },
            { icon: TrendingUp, label: "Win Rate", value: team.stats.winRate, color: "text-primary" },
            { icon: Trophy, label: "Tournaments Won", value: team.stats.tournamentsWon, color: "text-accent" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4 neon-border">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground font-display uppercase tracking-wider">{s.label}</span>
              </div>
              <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-6 neon-border mb-6">
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />Roster
              </h2>
              <div className="space-y-3">
                {team.roster.map((player: any) => (
                  <Link to={`/profile/${player.username}`} key={player.username}
                    className="flex items-center justify-between rounded border border-border bg-secondary/30 p-4 hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-display font-bold text-sm text-muted-foreground">
                        {player.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold">{player.username}</span>
                          {player.captain && <Badge variant="outline" className="border-accent text-accent text-xs font-display">Captain</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground font-body">{player.role}</span>
                      </div>
                    </div>
                    <RankBadge elo={player.elo} size="sm" showElo />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 neon-border">
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" />Recent Matches
              </h2>
              <div className="space-y-3">
                {team.recentMatches.map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant={m.result === "WIN" ? "default" : "secondary"}
                        className={`font-display text-xs w-12 justify-center ${m.result === "WIN" ? "gradient-primary border-0" : ""}`}>
                        {m.result}
                      </Badge>
                      <span className="font-body text-sm">vs {m.opponent}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground font-body">{m.map}</span>
                      <span className="font-mono font-bold">{m.score}</span>
                      <span className="text-xs text-muted-foreground">{m.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-lg border border-border bg-card p-6 neon-border">
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />Tournament History
              </h3>
              <div className="space-y-3">
                {team.tournamentHistory.map((t: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                    <div>
                      <div className="font-display font-semibold text-sm">{t.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{t.placement}</span>
                        <Badge variant="outline" className="text-[10px] font-display">Tier {t.tier}</Badge>
                      </div>
                    </div>
                    <span className="text-accent font-mono font-bold text-sm">{t.prize}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
