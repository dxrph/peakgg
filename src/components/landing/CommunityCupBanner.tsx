import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SummitPassBanner from "@/components/summit-pass/SummitPassBanner";
import { defaultSummitPass } from "@/components/summit-pass/config";
import type { SummitPassConfig } from "@/components/summit-pass/types";

type CupRow = {
  id: string;
  slug: string | null;
  name: string;
  status: string;
  short_description: string | null;
  start_date: string | null;
  max_teams: number | null;
  format: string | null;
};

export default function CommunityCupBanner() {
  const { data: t } = useQuery<CupRow | null>({
    queryKey: ["community-cup-1-banner"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, slug, name, status, short_description, start_date, max_teams, format")
        .eq("slug", "community-cup-1")
        .maybeSingle();
      return (data as CupRow | null) ?? null;
    },
  });

  if (!t || t.status === "completed") return null;

  // Derive a SummitPassConfig from the live tournament row, fall back to defaults.
  const dateLabel = t.start_date
    ? new Date(t.start_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date TBA";
  const timeLabel = t.start_date
    ? new Date(t.start_date).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Brussels",
      }) + " CEST"
    : undefined;

  const formLines: SummitPassConfig["formLines"] = [
    { key: "Departure", value: dateLabel, valueSub: timeLabel },
    { key: "Party size", value: "5 climbers", valueSub: "per rope team" },
    { key: "Expedition", value: t.max_teams ? `${t.max_teams} teams` : "Open roster", valueSub: t.format ?? "single elim" },
    { key: "Permit fee", value: "None — free ascent", valueColor: "green" },
  ];

  const cfg: Partial<SummitPassConfig> = {
    ...defaultSummitPass,
    titleLine1: "Community",
    titleLine2: "Cup",
    titleAccent: "#1",
    description:
      t.short_description ??
      "Free EU tournament for community teams, amateur players and rising 5-stacks. Single elimination — one night, one summit.",
    formLines,
    countdownTarget: t.start_date ?? defaultSummitPass.countdownTarget,
    slotsTotal: t.max_teams ?? defaultSummitPass.slotsTotal,
    ctaHref: `/tournaments/${t.slug ?? t.id}`,
  };

  return (
    <section className="container py-8 md:py-12">
      <SummitPassBanner config={cfg} />
    </section>
  );
}