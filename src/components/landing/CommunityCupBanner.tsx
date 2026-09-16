import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SummitPassBanner from "@/components/summit-pass/SummitPassBanner";
import { tournamentToSummitPass, type TournamentRow } from "@/components/summit-pass/adapter";

export default function CommunityCupBanner() {
  const { data: t } = useQuery<TournamentRow | null>({
    queryKey: ["community-cup-1-banner"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select(
          "id, slug, name, game, status, short_description, description, start_date, registration_close_at, max_teams, team_size, format, entry_cost_coins, route_label, permit_number, serial, stamp_line1, stamp_line2, show_stamp, summit_accent",
        )
        .eq("slug", "community-cup-1")
        .maybeSingle();
      return (data as TournamentRow | null) ?? null;
    },
  });

  // Count registered teams (live), drives slotsFilled.
  const { data: registeredTeams = 0 } = useQuery<number>({
    queryKey: ["community-cup-1-signups-count", t?.id],
    enabled: !!t?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("tournament_team_signups")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", t!.id);
      return count ?? 0;
    },
  });

  if (!t || t.status === "completed") return null;

  const cfg = tournamentToSummitPass(t, registeredTeams);

  return (
    <section className="container py-8 md:py-12">
      <SummitPassBanner config={cfg} />
    </section>
  );
}