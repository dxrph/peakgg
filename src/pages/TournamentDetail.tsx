import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import {
  Trophy, Calendar, Users, MapPin, Shield, ChevronRight, Globe, User2, ArrowLeft,
} from "lucide-react";
import { useParams, Link } from "react-router-dom";
import BracketView from "@/components/tournaments/BracketView";
import CommunityCupDetail from "./CommunityCupDetail";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format as fmtDate } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { DISCORD_INVITE } from "@/lib/links";

export default function TournamentDetailPage() {
  const { id } = useParams();
  const isUuid = !!id && /^[0-9a-f-]{36}$/i.test(id);

  const { data: t, isLoading } = useQuery({
    queryKey: ["tournament-public", id],
    enabled: !!id,
    queryFn: async () => {
      const query = supabase.from("tournaments").select("*").limit(1);
      const { data, error } = isUuid
        ? await query.eq("id", id!).maybeSingle()
        : await query.eq("slug", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: realParticipantsCount = 0 } = useQuery({
    queryKey: ["tournament-participants-count", t?.id],
    enabled: !!t?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("tournament_registrations" as never)
        .select("*", { count: "exact", head: true })
        .eq("tournament_id", t!.id)
        .eq("status", "confirmed");
      return count ?? 0;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="container pt-24 pb-16 flex-1 space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!t) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="container pt-24 pb-16 flex-1">
          <EmptyState
            icon={Trophy}
            title="Tournament not found"
            description="This tournament does not exist or is not public yet."
            ctaLabel="Back to Tournaments"
            ctaTo="/tournaments"
            secondaryLabel="Join Discord"
            secondaryOnClick={() => window.open(DISCORD_INVITE, "_blank")}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (t.tournament_type === "community_cup") {
    return <CommunityCupDetail tournament={t as never} />;
  }

  const tierColors: Record<number, string> = { 1: "text-success", 2: "text-accent", 3: "text-primary" };
  const isTeamTournament = (t.tournament_type ?? "team_bracket") !== "solo_queue";
  const startDate = t.start_date ? fmtDate(new Date(t.start_date), "MMM d, yyyy — HH:mm") + " " + (t.timezone || "") : "TBD";
  const rules = (t.rules || "").split("\n").map(s => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {t.banner_url && (
        <div className="w-full h-48 md:h-64 relative overflow-hidden mt-16">
          <img src={t.banner_url} alt={t.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <div className="container pt-24 pb-16 flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 font-body">
          <Link to="/tournaments" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />Tournaments
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{t.name}</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 md:p-8 neon-border mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="outline" className="border-primary text-primary font-display uppercase">{t.status}</Badge>
                <Badge variant="secondary" className="font-display">
                  {isTeamTournament ? "Team Tournament" : "Solo Queue Cup"}
                </Badge>
                {t.format && <Badge variant="secondary" className="font-display">{t.format}</Badge>}
                <Badge variant="outline" className={`font-display ${tierColors[t.tier] ?? "text-muted-foreground"}`}>
                  {t.tier_label || `Tier ${t.tier}`}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">{t.name}</h1>
              {(t.description || t.short_description) && (
                <p className="text-muted-foreground font-body max-w-2xl">{t.description || t.short_description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground font-body">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{startDate}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{t.timezone || "EU"}</span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />{realParticipantsCount}/{t.max_teams} {isTeamTournament ? "teams" : "players"}
                </span>
                {t.prize_pool && (
                  <span className="flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-accent" />
                    <span className="text-accent font-semibold">{t.prize_pool}</span>
                  </span>
                )}
                {t.organizer_name && (
                  <span className="flex items-center gap-1.5"><User2 className="h-4 w-4" />{t.organizer_name}</span>
                )}
                {t.language && (
                  <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" />{t.language}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 md:items-end shrink-0">
              {isTeamTournament ? (
                <Link to="/teams"><Button variant="neon" size="lg" className="uppercase tracking-wider">Register Team</Button></Link>
              ) : (
                <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                  <Button variant="neon" size="lg" className="uppercase tracking-wider">Join via Discord</Button>
                </a>
              )}
              {t.rules_url && (
                <a href={t.rules_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="neonOutline" size="sm"><Shield className="mr-2 h-4 w-4" />Full Rules</Button>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />Bracket
              </h2>
              {realParticipantsCount > 0 ? (
                <BracketView tournamentId={t.id} />
              ) : (
                <p className="text-sm text-muted-foreground font-body py-8 text-center">
                  Bracket will appear once the tournament starts.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />Participants
              </h2>
              {realParticipantsCount > 0 ? (
                <p className="text-sm text-muted-foreground font-body">
                  {realParticipantsCount} confirmed {isTeamTournament ? "teams" : "players"}.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground font-body py-6 text-center">
                  No participants registered yet. Be the first to {isTeamTournament ? "register your team" : "sign up"}.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />Rewards
              </h3>
              <div className="space-y-2 text-sm font-body">
                {t.prize_pool && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Prize Pool</span>
                    <span className="text-accent font-semibold">{t.prize_pool}</span>
                  </div>
                )}
                {t.reward_trophies > 0 && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Trophies</span>
                    <span className="font-semibold">{t.reward_trophies}</span>
                  </div>
                )}
                {t.reward_badge && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Badge</span>
                    <span className="font-semibold">{t.reward_badge}</span>
                  </div>
                )}
                {!t.prize_pool && !t.reward_trophies && !t.reward_badge && (
                  <p className="text-muted-foreground">Tournament Points and recognition.</p>
                )}
              </div>
            </div>

            {rules.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />Rules
                </h3>
                <ul className="space-y-2">
                  {rules.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                      <span className="text-primary mt-0.5">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
