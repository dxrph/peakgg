import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import StatusPill from "@/components/leagues/StatusPill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, Calendar, ArrowRight, Mountain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeagueListItem {
  id: string;
  name: string;
  slug: string;
  game: string;
  description: string | null;
  reward_text: string | null;
  banner_url: string | null;
  status: string;
  max_teams: number;
  current_season?: { id: string; name: string; status: string } | null;
  team_count: number;
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<LeagueListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: ls } = await supabase
        .from("leagues")
        .select("id, name, slug, game, description, reward_text, banner_url, status, max_teams")
        .order("created_at", { ascending: false });
      const list = ls ?? [];
      const enriched = await Promise.all(list.map(async (l): Promise<LeagueListItem> => {
        const { data: seasons } = await supabase
          .from("league_seasons")
          .select("id, name, status")
          .eq("league_id", l.id)
          .order("season_number", { ascending: false })
          .limit(1);
        const current = seasons?.[0] ?? null;
        let team_count = 0;
        if (current) {
          const { count } = await supabase
            .from("league_registrations")
            .select("*", { count: "exact", head: true })
            .eq("season_id", current.id)
            .eq("status", "approved");
          team_count = count ?? 0;
        }
        return { ...l, current_season: current, team_count };
      }));
      setLeagues(enriched);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Peak League — Competitive FPS leagues | PeakGG"
        description="Join Peak League, the persistent competitive league ecosystem for FPS teams. Standings, matchdays, playoffs and trophies."
      />
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-primary/10 to-background">
          <div className="container py-12 md:py-16">
            <div className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-primary mb-3">
              <Mountain className="h-4 w-4" /> PeakGG / Leagues
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl uppercase tracking-tight">
              Peak <span className="text-primary">League</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              The persistent competitive league ecosystem of PeakGG. Compete across matchdays, climb the standings, fight for playoffs and lift trophies.
            </p>
          </div>
        </section>

        <section className="container py-10">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[0, 1].map(i => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : leagues.length === 0 ? (
            <div className="border border-dashed border-border rounded-md p-12 text-center">
              <Trophy className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h2 className="font-display text-xl uppercase tracking-wider">No active leagues yet</h2>
              <p className="text-sm text-muted-foreground mt-2">Peak League Season 0 Beta is launching soon. Stay tuned.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {leagues.map(l => (
                <Card key={l.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                  {l.banner_url && (
                    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${l.banner_url})` }} />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div>
                        <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-1">
                          {l.game} · {l.current_season?.name ?? "No active season"}
                        </div>
                        <h3 className="font-display text-xl font-bold uppercase">{l.name}</h3>
                      </div>
                      <StatusPill status={l.status} />
                    </div>
                    {l.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{l.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {l.team_count}/{l.max_teams} teams</span>
                      {l.reward_text && <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-primary" /> {l.reward_text}</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link to={`/leagues/${l.id}`}>View League <ArrowRight className="h-4 w-4 ml-1" /></Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
