import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SectionHead, Panel, Rail } from "@/components/system";
import { getRankByElo } from "@/lib/ranks";
import { isPublicPlayer, hasCompetitiveActivity } from "@/lib/public-users";
import { useI18n } from "@/i18n";

type Row = { user_id: string; username: string; avatar_url: string | null; elo: number; wins: number; matches_played: number };

export default function LadderModule() {
  const { t } = useI18n();

  const { data: players = [] } = useQuery<Row[]>({
    queryKey: ["home-ladder"],
    queryFn: async () => {
      const { data: stats } = await supabase
        .from("player_stats")
        .select("user_id, elo, wins, matches_played")
        .gt("matches_played", 0)
        .order("elo", { ascending: false })
        .limit(20);
      if (!stats?.length) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", stats.map((s) => s.user_id));
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return stats
        .map((s) => ({
          user_id: s.user_id,
          elo: s.elo ?? 0,
          wins: s.wins ?? 0,
          matches_played: s.matches_played ?? 0,
          username: map.get(s.user_id)?.username ?? "Player",
          avatar_url: map.get(s.user_id)?.avatar_url ?? null,
        }))
        .filter((p) => isPublicPlayer(p) && hasCompetitiveActivity(p))
        .slice(0, 5);
    },
  });

  return (
    <section className="bc-section">
      <div className="container">
        <SectionHead
          rail={t("home.ladder.rail", { defaultValue: "Standings" })}
          title={t("home.ladder.title", { defaultValue: "Top of the Peak ladder" })}
          aside={
            <Link to="/leaderboard">
              <Button variant="outline" className="rounded-none border-border font-display uppercase tracking-[0.16em] text-xs">
                {t("home.ladder.cta", { defaultValue: "Full leaderboard" })}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          }
        />

        <Panel flat className="p-0">
          <div className="grid grid-cols-[3rem_1fr_auto_auto] md:grid-cols-[4rem_1fr_8rem_7rem] gap-3 px-4 md:px-6 py-3 border-b border-border text-[10px] uppercase tracking-[0.22em] font-display font-bold text-muted-foreground">
            <span>#</span>
            <span>{t("home.ladder.player", { defaultValue: "Player" })}</span>
            <span className="hidden md:block">{t("home.ladder.tier", { defaultValue: "Tier" })}</span>
            <span className="text-right">{t("home.ladder.elo", { defaultValue: "Elo" })}</span>
          </div>

          {players.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Rail muted className="justify-center">
                {t("home.ladder.empty_rail", { defaultValue: "Season 1 not started" })}
              </Rail>
              <p className="mt-3 text-sm text-muted-foreground font-body">
                {t("home.ladder.empty", { defaultValue: "The ladder fills up with the first verified cup results." })}
              </p>
            </div>
          ) : (
            players.map((p, i) => {
              const rank = getRankByElo(p.elo);
              return (
                <Link
                  key={p.user_id}
                  to={`/profile/${p.username}`}
                  className="grid grid-cols-[3rem_1fr_auto_auto] md:grid-cols-[4rem_1fr_8rem_7rem] gap-3 items-center px-4 md:px-6 py-4 border-b border-border/70 last:border-b-0 hover:bg-card/60 transition-colors"
                >
                  <span className="bc-num text-2xl md:text-3xl text-muted-foreground/60">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 rounded-none border border-border">
                      <AvatarImage src={p.avatar_url ?? undefined} alt={p.username} />
                      <AvatarFallback className="rounded-none text-[10px]">{p.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-display font-semibold truncate">{p.username}</span>
                  </span>
                  <span
                    className="hidden md:block text-[10px] uppercase tracking-[0.2em] font-display font-bold"
                    style={{ color: rank.hex }}
                  >
                    {rank.name}
                  </span>
                  <span className="bc-num text-2xl md:text-3xl text-right">{p.elo}</span>
                </Link>
              );
            })
          )}
        </Panel>
      </div>
    </section>
  );
}
