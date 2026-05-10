import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import SeasonBanner from "@/components/seasons/SeasonBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import EloProgressBar from "@/components/EloProgressBar";
import { Bell, Mountain, Shield, Swords, Trophy, TrendingUp, Activity, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardCards, dashboardAdmin, resolvePath, type NavItem } from "@/config/navigation";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { useGame } from "@/lib/game-context";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { getRankByElo } from "@/lib/ranks";

interface PlayerStat {
  elo: number;
  matches_played: number;
  wins: number;
  losses: number;
  peak_elo: number | null;
  peak_rank: string | null;
}

interface RecentMatch {
  id: string;
  result: "WIN" | "LOSS" | "DRAW";
  score: string;
  elo_delta: number | null;
  played_at: string | null;
  map: string | null;
  opponent: string;
}

export default function DashboardPage() {
  const { isAdmin } = useUserRoles();
  const { profile, user } = useAuth();
  const { t } = useI18n();
  const { currentGame } = useGame();
  const { notifications, loading: notifLoading } = useNotifications(5);
  const tr = (item: NavItem) => t(item.labelKey, { defaultValue: item.label });

  const [stats, setStats] = useState<PlayerStat | null>(null);
  const [recent, setRecent] = useState<RecentMatch[]>([]);
  const [tournamentsWon, setTournamentsWon] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const profileName = profile?.display_name || profile?.username || "Player";
  const profilePath = profile?.username ? `/profile/${profile.username}` : "/dashboard";
  const cards = dashboardCards();
  const adminCards = dashboardAdmin();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      // Player stats for current game
      const { data: ps } = await supabase
        .from("player_stats")
        .select("elo, matches_played, wins, losses, peak_elo, peak_rank")
        .eq("user_id", user.id)
        .eq("game", currentGame)
        .maybeSingle();
      if (cancelled) return;
      setStats(
        (ps as any) ?? { elo: 0, matches_played: 0, wins: 0, losses: 0, peak_elo: 0, peak_rank: "Rookie" }
      );

      // Recent matches (real, where user was on roster)
      const { data: rosters } = await supabase
        .from("match_rosters")
        .select("match_id, team_id, matches!inner(id, score_a, score_b, winner_id, team_a_id, team_b_id, played_at, map, status, result_status, is_demo, game)")
        .eq("user_id", user.id)
        .order("match_id", { ascending: false })
        .limit(20);

      const validMatches = (rosters ?? [])
        .map((r: any) => ({ row: r, m: r.matches }))
        .filter(({ m }) =>
          m && !m.is_demo && m.status === "completed" &&
          ["confirmed", "admin_resolved"].includes(m.result_status) &&
          m.game === currentGame
        )
        .slice(0, 5);

      // ELO deltas
      const matchIds = validMatches.map(({ m }) => m.id);
      const { data: history } = matchIds.length
        ? await supabase
            .from("elo_history")
            .select("match_id, delta")
            .eq("user_id", user.id)
            .in("match_id", matchIds)
        : { data: [] as any[] };
      const deltaMap = new Map<string, number>();
      (history ?? []).forEach((h: any) => deltaMap.set(h.match_id, h.delta));

      // Opponent team names
      const teamIds = new Set<string>();
      validMatches.forEach(({ row, m }) => {
        const opp = row.team_id === m.team_a_id ? m.team_b_id : m.team_a_id;
        if (opp) teamIds.add(opp);
      });
      const { data: teams } = teamIds.size
        ? await supabase.from("teams").select("id, name").in("id", Array.from(teamIds))
        : { data: [] as any[] };
      const teamMap = new Map<string, string>();
      (teams ?? []).forEach((tm: any) => teamMap.set(tm.id, tm.name));

      const formatted: RecentMatch[] = validMatches.map(({ row, m }) => {
        const myTeam = row.team_id;
        const isA = myTeam === m.team_a_id;
        const myScore = isA ? m.score_a : m.score_b;
        const oppScore = isA ? m.score_b : m.score_a;
        const oppId = isA ? m.team_b_id : m.team_a_id;
        let result: "WIN" | "LOSS" | "DRAW" = "DRAW";
        if (m.winner_id === myTeam) result = "WIN";
        else if (m.winner_id && m.winner_id !== myTeam) result = "LOSS";
        return {
          id: m.id,
          result,
          score: `${myScore ?? 0}-${oppScore ?? 0}`,
          elo_delta: deltaMap.get(m.id) ?? null,
          played_at: m.played_at,
          map: m.map,
          opponent: teamMap.get(oppId) ?? "—",
        };
      });
      if (cancelled) return;
      setRecent(formatted);

      // Tournaments won (placement = 1 in tournament_entries via team membership)
      const { data: ownedTeams } = await supabase
        .from("teams")
        .select("id")
        .eq("owner_id", user.id);
      const { data: memberTeams } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);
      const allTeamIds = new Set<string>([
        ...((ownedTeams ?? []) as any[]).map((t) => t.id),
        ...((memberTeams ?? []) as any[]).map((t) => t.team_id),
      ]);
      if (allTeamIds.size > 0) {
        const { count } = await supabase
          .from("tournament_entries")
          .select("id", { count: "exact", head: true })
          .eq("placement", 1)
          .in("team_id", Array.from(allTeamIds));
        if (!cancelled) setTournamentsWon(count ?? 0);
      } else {
        if (!cancelled) setTournamentsWon(0);
      }
      if (!cancelled) setStatsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, currentGame]);

  const elo = stats?.elo ?? 0;
  const rankName = getRankByElo(elo).name;
  const peakElo = stats?.peak_elo ?? 0;
  const peakRank = stats?.peak_rank ?? "Rookie";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <SeasonBanner />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {t("dashboard.welcome", { defaultValue: "Welcome back" })},{" "}
              <span className="text-primary">{profileName}</span>
            </h1>
            <p className="text-muted-foreground font-body mt-1">
              {t("dashboard.subtitle", { defaultValue: "Here's your competitive overview." })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/play">
              <Button variant="neon">
                <Mountain className="mr-2 h-4 w-4" />
                {t("dashboard.find_match", { defaultValue: "Find Match" })}
              </Button>
            </Link>
          </div>
        </div>

        {/* ELO Progress */}
        <div className="rounded-lg border border-border bg-card p-5 neon-border mb-6">
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <RankBadge elo={elo} size="lg" showElo />
            <span className="text-sm text-muted-foreground font-body">
              {t("dashboard.peak", { defaultValue: "Peak" })}:{" "}
              <strong className="text-foreground">{peakRank} ({peakElo})</strong>
            </span>
          </div>
          <EloProgressBar elo={elo} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: TrendingUp, label: t("dashboard.current_elo", { defaultValue: "Current ELO" }), value: elo.toLocaleString(), color: "text-primary" },
            { icon: Shield, label: t("dashboard.rank", { defaultValue: "Rank" }), value: rankName, color: "text-accent" },
            { icon: Swords, label: t("dashboard.matches", { defaultValue: "Matches" }), value: String(stats?.matches_played ?? 0), color: "text-foreground" },
            { icon: Trophy, label: t("dashboard.tournaments_won", { defaultValue: "Tournaments Won" }), value: String(tournamentsWon), color: "text-yellow-400" },
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
              <Activity className="h-5 w-5 text-primary" />
              {t("dashboard.recent_matches", { defaultValue: "Recent Matches" })}
            </h3>
            {statsLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">…</p>
            ) : recent.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <Users className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <p className="font-display uppercase tracking-wider text-sm">
                  {t("dashboard.no_matches_title", { defaultValue: "No matches yet" })}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {t("dashboard.no_matches_body", { defaultValue: "Play official matches to build your match history and start climbing the PeakGG ladder." })}
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <a href="https://discord.gg/peakgg" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="neon">{t("dashboard.join_discord_cta", { defaultValue: "Join Discord for Open Cup Beta" })}</Button>
                  </a>
                  <Link to="/tournaments"><Button size="sm" variant="outline">{t("dashboard.view_tournaments", { defaultValue: "View Tournaments" })}</Button></Link>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {recent.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-4 min-w-0">
                        <Badge variant={m.result === "WIN" ? "default" : "secondary"}
                          className={`font-display text-xs ${m.result === "WIN" ? "gradient-primary border-0" : ""}`}>
                          {m.result}
                        </Badge>
                        <span className="font-body truncate">{m.opponent}</span>
                        <span className="text-sm text-muted-foreground font-mono">{m.score}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {m.elo_delta != null && (
                          <span className={`font-mono font-bold text-sm ${m.elo_delta >= 0 ? "text-success" : "text-destructive"}`}>
                            {m.elo_delta >= 0 ? "+" : ""}{m.elo_delta}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {m.played_at ? new Date(m.played_at).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {profile?.username && (
                  <Link to={`/profile/${profile.username}`}>
                    <Button variant="ghost" size="sm" className="w-full mt-3">
                      {t("dashboard.view_all_matches", { defaultValue: "View All Matches" })}
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5 neon-border">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              {t("dashboard.notifications", { defaultValue: "Notifications" })}
            </h3>
            {notifLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">…</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("dashboard.no_notifications", { defaultValue: "No notifications yet." })}
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <Link key={n.id} to={n.action_url || "/notifications"} className="block">
                    <div className="py-3 border-b border-border last:border-0 hover:bg-muted/20 -mx-2 px-2 rounded transition-colors">
                      <p className="text-sm font-display font-semibold">{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display font-bold uppercase tracking-wider text-sm text-muted-foreground mb-4">
            {t("dashboard.shortcuts", { defaultValue: "Shortcuts" })}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cards.map((item) => {
              const Icon = item.icon ?? Mountain;
              const path = item.key === "my_profile" ? profilePath : resolvePath(item);
              return (
                <Link key={item.key} to={path}>
                  <div className="group relative rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer neon-border h-full flex flex-col items-center justify-center text-center min-h-[110px]">
                    <Icon className="h-7 w-7 mb-2 text-primary group-hover:scale-110 transition-transform" />
                    <span className="font-display font-bold text-sm leading-tight">{tr(item)}</span>
                    {item.comingSoon && (
                      <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wider text-accent border border-accent/40 rounded-sm px-1">
                        Soon
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {isAdmin && adminCards.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display font-bold uppercase tracking-wider text-sm text-accent mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" /> {t("dashboard.admin_shortcuts", { defaultValue: "Admin Shortcuts" })}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {adminCards.map((item) => {
                const Icon = item.icon ?? Shield;
                return (
                  <Link key={item.key} to={item.path}>
                    <div className="rounded-lg border border-accent/30 bg-card p-4 hover:border-accent transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center min-h-[110px]">
                      <Icon className="h-7 w-7 mb-2 text-accent" />
                      <span className="font-display font-bold text-sm leading-tight">{tr(item)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}