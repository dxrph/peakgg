import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import Footer from "@/components/landing/Footer";
import RankBadge from "@/components/RankBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Search, Trophy, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";

import { type GameId } from "@/lib/ranks";
import GameIcon from "@/components/GameIcon";

type GameFilter = GameId;

const GAME_TABS: { id: GameFilter; label: string }[] = [
  { id: "valorant", label: "Valorant" },
  { id: "cs2", label: "CS2" },
  { id: "r6s", label: "Rainbow Six" },
];

const PAGE_SIZE = 25;

interface PlayerRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  elo: number;
  wins: number;
  losses: number;
  team_name: string | null;
  team_tag: string | null;
}

function getRowHighlight(rank: number) {
  if (rank === 1) return "bg-yellow-400/10 border-l-4 border-l-yellow-400";
  if (rank === 2) return "bg-zinc-300/5 border-l-4 border-l-zinc-300";
  if (rank === 3) return "bg-amber-700/10 border-l-4 border-l-amber-600";
  return "border-l-4 border-l-transparent";
}

function CrownIcon({ rank }: { rank: number }) {
  if (rank > 3) return null;
  const colors = ["text-yellow-400", "text-zinc-300", "text-amber-600"];
  return <Crown className={`inline h-4 w-4 mr-1 ${colors[rank - 1]}`} />;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [game, setGame] = useState<GameFilter>("valorant");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allPlayers, setAllPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      // Fetch player_stats for the selected game, with embedded profile
      const { data: stats } = await supabase
        .from("player_stats")
        .select("user_id, elo, wins, losses, profile:profiles!inner(id, username, display_name, avatar_url)")
        .eq("game", game)
        .order("elo", { ascending: false })
        .limit(1000);
      if (cancelled || !stats) {
        if (!cancelled) {
          setAllPlayers([]);
          setLoading(false);
        }
        return;
      }

      const ids = stats.map((s: any) => s.user_id);

      // Team membership
      const { data: members } = ids.length
        ? await supabase
            .from("team_members")
            .select("user_id, teams!inner(name, tag)")
            .in("user_id", ids)
        : { data: [] as any[] };

      const teamMap = new Map<string, { name: string; tag: string }>();
      (members ?? []).forEach((m: any) => {
        if (m.teams) teamMap.set(m.user_id, { name: m.teams.name, tag: m.teams.tag });
      });

      const rows: PlayerRow[] = (stats as any[])
        .filter((s) => s.profile)
        .map((s: any) => ({
          id: s.profile.id,
          username: s.profile.username,
          display_name: s.profile.display_name,
          avatar_url: s.profile.avatar_url,
          elo: s.elo ?? 0,
          wins: s.wins ?? 0,
          losses: s.losses ?? 0,
          team_name: teamMap.get(s.user_id)?.name ?? null,
          team_tag: teamMap.get(s.user_id)?.tag ?? null,
        }));

      if (!cancelled) {
        setAllPlayers(rows);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [game]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allPlayers;
    return allPlayers.filter(
      (p) =>
        p.username.toLowerCase().includes(q) ||
        (p.display_name ?? "").toLowerCase().includes(q),
    );
  }, [allPlayers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const userRank = useMemo(() => {
    if (!user) return null;
    const idx = allPlayers.findIndex((p) => p.id === user.id);
    return idx >= 0 ? idx + 1 : null;
  }, [allPlayers, user]);

  const { t } = useI18n();

  useEffect(() => {
    setPage(1);
  }, [game, search]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Leaderboard — PeakGG | Top Ranked Players Season 1"
        description="See the top ranked competitive players on PeakGG. Season 1 leaderboard for Valorant, CS2 and Rainbow Six Siege with live ELO and rank tiers."
        keywords="Valorant leaderboard, ranked matchmaking FPS, Valorant ELO system, competitive gaming community, PeakGG ranking"
        path="/leaderboard"
      />
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold">
              <Trophy className="inline h-8 w-8 text-accent mr-2" />
              {t("leaderboard_page.title")}
            </h1>
            <p className="text-muted-foreground font-body mt-1">
              {t("leaderboard_page.subtitle")}
            </p>
          </div>
          {user && userRank && (
            <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-2 font-display">
              <span className="text-sm text-muted-foreground">{t("leaderboard_page.your_position")}</span>{" "}
              <span className="text-primary font-bold text-lg">#{userRank}</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <Tabs value={game} onValueChange={(v) => setGame(v as GameFilter)} className="w-full md:w-auto">
            <TabsList className="bg-card border border-border">
              {GAME_TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="font-display">
                  <GameIcon game={t.id} size={14} className="mr-1.5" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("leaderboard_page.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_auto_5rem] md:grid-cols-[3rem_1fr_auto_6rem_5rem_1fr] gap-3 px-4 py-3 bg-secondary/50 text-xs text-muted-foreground font-display uppercase tracking-widest">
            <span>#</span>
            <span>{t("leaderboard_page.col_player")}</span>
            <span>{t("leaderboard_page.col_rank")}</span>
            <span className="text-right">{t("leaderboard_page.col_elo")}</span>
            <span className="hidden md:block text-right">{t("leaderboard_page.col_winrate")}</span>
            <span className="hidden md:block">{t("leaderboard_page.col_team")}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              {t("leaderboard_page.loading")}
            </div>
          ) : pageRows.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-body">
              {t("leaderboard_page.empty")}
            </div>
          ) : (
            pageRows.map((p) => {
              const globalRank = allPlayers.findIndex((x) => x.id === p.id) + 1;
              const total = p.wins + p.losses;
              const wr = total > 0 ? Math.round((p.wins / total) * 100) : 0;
              const isMe = user?.id === p.id;
              const highlight = isMe
                ? "bg-primary/10 border-l-4 border-l-primary hover:bg-primary/15"
                : getRowHighlight(globalRank);

              return (
                <Link
                  key={p.id}
                  to={`/profile/${p.username}`}
                  className={`grid grid-cols-[3rem_1fr_auto_5rem] md:grid-cols-[3rem_1fr_auto_6rem_5rem_1fr] gap-3 px-4 py-3 border-t border-border transition-colors items-center hover:bg-secondary/30 ${highlight}`}
                >
                  <span className="font-display font-bold text-lg">
                    <CrownIcon rank={globalRank} />
                    {globalRank}
                  </span>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 border border-border shrink-0">
                      <AvatarImage src={p.avatar_url ?? undefined} alt={p.username} />
                      <AvatarFallback>{p.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold font-body truncate">
                        {p.username}
                        {isMe && <span className="ml-2 text-xs text-primary">{t("leaderboard_page.you")}</span>}
                      </div>
                      {p.display_name && p.display_name !== p.username && (
                        <div className="text-xs text-muted-foreground truncate">{p.display_name}</div>
                      )}
                    </div>
                  </div>
                  <RankBadge elo={p.elo} size="sm" />
                  <span className="text-right font-mono font-bold text-primary">{p.elo}</span>
                  <span className="hidden md:block text-right text-sm text-muted-foreground font-mono">
                    {total > 0 ? `${wr}%` : "—"}
                  </span>
                  <span className="hidden md:block text-sm text-muted-foreground truncate">
                    {p.team_tag ? `[${p.team_tag}] ${p.team_name}` : "—"}
                  </span>
                </Link>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-sm text-muted-foreground font-body">
              {t("leaderboard_page.page_info", { page: safePage, total: totalPages, count: filtered.length })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("leaderboard_page.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                {t("leaderboard_page.next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}