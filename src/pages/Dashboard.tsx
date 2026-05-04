import Navbar from "@/components/landing/Navbar";
import SeasonBanner from "@/components/seasons/SeasonBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import EloProgressBar from "@/components/EloProgressBar";
import { Bell, Mountain, Shield, Swords, Trophy, TrendingUp, Users, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const recentMatches = [
  { map: "Ascent", result: "WIN", score: "13-9", elo: "+25", time: "2h ago" },
  { map: "Haven", result: "LOSS", score: "8-13", elo: "-15", time: "4h ago" },
  { map: "Bind", result: "WIN", score: "13-11", elo: "+25", time: "Yesterday" },
];

const notifications = [
  { text: "You received a team invite from Peak Kings", time: "1h ago", type: "invite" },
  { text: "Tournament 'Weekly #12' starts in 2 hours", time: "2h ago", type: "tournament" },
  { text: "Your match result has been verified", time: "3h ago", type: "match" },
];

export default function DashboardPage() {
  const userElo = 2547;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <SeasonBanner />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Welcome back, <span className="text-primary">PhantomX</span></h1>
            <p className="text-muted-foreground font-body mt-1">Here's your competitive overview.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/play"><Button variant="neon"><Mountain className="mr-2 h-4 w-4" />Find Match</Button></Link>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">3</span>
            </Button>
          </div>
        </div>

        {/* ELO Progress */}
        <div className="rounded-lg border border-border bg-card p-5 neon-border mb-6">
          <div className="flex items-center gap-4 mb-3">
            <RankBadge elo={userElo} size="lg" showElo />
            <span className="text-sm text-muted-foreground font-body">Tournament Points: <strong className="text-foreground">320</strong></span>
          </div>
          <EloProgressBar elo={userElo} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: TrendingUp, label: "Current ELO", value: userElo.toLocaleString(), color: "text-primary" },
            { icon: Shield, label: "Rank", value: "Master", color: "text-accent" },
            { icon: Swords, label: "Matches", value: "342", color: "text-foreground" },
            { icon: Trophy, label: "Tournaments Won", value: "5", color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-5 neon-border">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground font-display uppercase tracking-wider">{s.label}</span>
              </div>
              <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 neon-border">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />Recent Matches
            </h3>
            <div className="space-y-3">
              {recentMatches.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-4">
                    <Badge variant={m.result === "WIN" ? "default" : "secondary"}
                      className={`font-display text-xs ${m.result === "WIN" ? "gradient-primary border-0" : ""}`}>
                      {m.result}
                    </Badge>
                    <span className="font-body">{m.map}</span>
                    <span className="text-sm text-muted-foreground font-mono">{m.score}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono font-bold text-sm ${m.elo.startsWith("+") ? "text-success" : "text-destructive"}`}>{m.elo}</span>
                    <span className="text-xs text-muted-foreground">{m.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/profile/PhantomX">
              <Button variant="ghost" size="sm" className="w-full mt-3">View All Matches</Button>
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 neon-border">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />Notifications
            </h3>
            <div className="space-y-3">
              {notifications.map((n, i) => (
                <div key={i} className="py-3 border-b border-border last:border-0">
                  <p className="text-sm font-body">{n.text}</p>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/teams">
            <div className="rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-all cursor-pointer neon-border text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <span className="font-display font-bold">Create Team</span>
            </div>
          </Link>
          <Link to="/tournaments">
            <div className="rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-all cursor-pointer neon-border text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-accent" />
              <span className="font-display font-bold">Join Tournament</span>
            </div>
          </Link>
          <Link to="/scrims">
            <div className="rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-all cursor-pointer neon-border text-center">
              <Swords className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
              <span className="font-display font-bold">Find Scrims</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
