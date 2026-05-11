import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Swords, AlertTriangle, UsersRound, Trophy, Ban,
  TrendingUp, Activity, Gavel, Hourglass,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Stats = {
  totalPlayers: number;
  matchesToday: number;
  openTickets: number;
  activeTeams: number;
  liveTournaments: number;
  bannedPlayers: number;
  openDisputes: number;
  pendingMatches: number;
  disputedMatches: number;
  queueWaiting: number;
  signupsLast30: { day: string; count: number }[];
  rankDist: { rank: string; count: number }[];
};

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function rankFromElo(elo: number): string {
  if (elo >= 3000) return "Apex";
  if (elo >= 2500) return "Master";
  if (elo >= 2000) return "Elite";
  if (elo >= 1500) return "Expert";
  if (elo >= 1000) return "Rival";
  if (elo >= 500) return "Contender";
  return "Rookie";
}

const RANK_ORDER = ["Rookie", "Contender", "Rival", "Expert", "Elite", "Master", "Apex"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const todayISO = startOfTodayISO();
      const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        playersRes,
        matchesTodayRes,
        openTicketsRes,
        teamsRes,
        liveToursRes,
        bannedRes,
        signupsRes,
        eloRes,
        openDisputesRes,
        pendingMatchesRes,
        disputedMatchesRes,
        queueRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("matches").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("tickets").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase.from("tournaments").select("id", { count: "exact", head: true }).eq("status", "live"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_banned", true),
        supabase.from("profiles").select("created_at").gte("created_at", since30).order("created_at", { ascending: true }),
        supabase.from("player_stats").select("elo").eq("game", "valorant"),
        supabase.from("match_disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("result_status", "pending_confirmation"),
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("result_status", "disputed"),
        supabase.from("open_cup_queue").select("user_id", { count: "exact", head: true }),
      ]);

      if (cancelled) return;

      // Build signups per day
      const dayMap = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        dayMap.set(key, 0);
      }
      (signupsRes.data ?? []).forEach((row: { created_at: string }) => {
        const key = row.created_at.slice(0, 10);
        if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) || 0) + 1);
      });
      const signupsLast30 = Array.from(dayMap.entries()).map(([day, count]) => ({ day, count }));

      // Build rank distribution
      const rankMap = new Map<string, number>(RANK_ORDER.map((r) => [r, 0]));
      (eloRes.data ?? []).forEach((row: { elo: number }) => {
        const r = rankFromElo(row.elo ?? 0);
        rankMap.set(r, (rankMap.get(r) || 0) + 1);
      });
      const rankDist = RANK_ORDER.map((r) => ({ rank: r, count: rankMap.get(r) || 0 }));

      setStats({
        totalPlayers: playersRes.count ?? 0,
        matchesToday: matchesTodayRes.count ?? 0,
        openTickets: openTicketsRes.count ?? 0,
        activeTeams: teamsRes.count ?? 0,
        liveTournaments: liveToursRes.count ?? 0,
        bannedPlayers: bannedRes.count ?? 0,
        openDisputes: openDisputesRes.count ?? 0,
        pendingMatches: pendingMatchesRes.count ?? 0,
        disputedMatches: disputedMatchesRes.count ?? 0,
        queueWaiting: queueRes.count ?? 0,
        signupsLast30,
        rankDist,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminLayout
      title="Dashboard"
      description="Panoramica generale della piattaforma — dati in tempo reale."
    >
      {loading || !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              icon={Gavel}
              label="Open disputes"
              value={stats.openDisputes}
              badge={stats.openDisputes > 0 ? <Badge className="bg-destructive/20 text-destructive border-destructive/30">action</Badge> : undefined}
              to="/admin/disputes"
            />
            <StatCard
              icon={Hourglass}
              label="Pending confirmation"
              value={stats.pendingMatches}
              to="/admin/matches"
            />
            <StatCard
              icon={Swords}
              label="Disputed matches"
              value={stats.disputedMatches}
              badge={stats.disputedMatches > 0 ? <Badge className="bg-warning/20 text-warning border-warning/30">{stats.disputedMatches}</Badge> : undefined}
              to="/admin/matches"
            />
            <StatCard
              icon={Activity}
              label="In queue now"
              value={stats.queueWaiting}
            />
            <StatCard icon={Users}        label="Player totali"   value={stats.totalPlayers} />
            <StatCard icon={Activity}     label="Partite oggi"    value={stats.matchesToday} />
            <StatCard
              icon={AlertTriangle}
              label="Ticket aperti"
              value={stats.openTickets}
              badge={stats.openTickets > 0 ? <Badge className="bg-destructive/20 text-destructive border-destructive/30">{stats.openTickets}</Badge> : undefined}
              to="/admin/tickets"
            />
            <StatCard icon={UsersRound}   label="Team attivi"     value={stats.activeTeams} />
            <StatCard icon={Trophy}       label="Tornei in corso" value={stats.liveTournaments} />
            <StatCard icon={Ban}          label="Player bannati"  value={stats.bannedPlayers} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <ChartCard title="Registrazioni ultimi 30 giorni" icon={TrendingUp}>
              <SignupsChart data={stats.signupsLast30} />
            </ChartCard>
            <ChartCard title="Distribuzione rank" icon={Trophy}>
              <RankChart data={stats.rankDist} />
            </ChartCard>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function StatCard({
  icon: Icon, label, value, badge, to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  badge?: React.ReactNode;
  to?: string;
}) {
  const inner = (
    <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {badge}
      </div>
      <p className="text-3xl font-display font-bold mt-3">{value.toLocaleString()}</p>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-display mt-1">{label}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function ChartCard({
  title, icon: Icon, children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-display uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SignupsChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const w = 100;
  const h = 40;
  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * w;
    const y = h - (d.count / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div>
      <p className="text-2xl font-display font-bold">{total}</p>
      <p className="text-xs text-muted-foreground mb-2">nuove registrazioni</p>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-32">
        <polyline
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.6"
          points={points}
        />
      </svg>
    </div>
  );
}

function RankChart({ data }: { data: { rank: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.rank} className="flex items-center gap-2 text-xs">
          <span className="w-20 font-display uppercase tracking-wider text-muted-foreground">{d.rank}</span>
          <div className="flex-1 h-2 bg-muted rounded">
            <div
              className="h-full bg-primary rounded"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right font-mono">{d.count}</span>
        </div>
      ))}
    </div>
  );
}
