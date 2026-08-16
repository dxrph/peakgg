import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Users, Swords } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Rail, Display, Chip, SectionHead, Panel } from "@/components/system";
import { useI18n } from "@/i18n";

type Row = {
  id: string;
  slug: string | null;
  name: string;
  status: string | null;
  start_date: string | null;
  max_teams: number | null;
  team_size: number | null;
  format: string | null;
  short_description: string | null;
};

export default function NextCupModule() {
  const { t } = useI18n();

  const { data: cup } = useQuery<Row | null>({
    queryKey: ["home-next-cup"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, slug, name, status, start_date, max_teams, team_size, format, short_description")
        .neq("status", "completed")
        .order("start_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      return (data as Row | null) ?? null;
    },
  });

  const { data: signups = 0 } = useQuery<number>({
    queryKey: ["home-next-cup-signups", cup?.id],
    enabled: !!cup?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("tournament_team_signups")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", cup!.id);
      return count ?? 0;
    },
  });

  const dateLabel = cup?.start_date
    ? new Date(cup.start_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : t("home.cup.tbd", { defaultValue: "Date TBD" });

  const slots = cup?.max_teams ?? 16;
  const pct = Math.min(100, Math.round((signups / Math.max(1, slots)) * 100));

  return (
    <section className="bc-section">
      <div className="container">
        <SectionHead
          rail={t("home.cup.rail", { defaultValue: "Next fixture" })}
          title={t("home.cup.title", { defaultValue: "The cup on the schedule" })}
          copy={t("home.cup.copy", {
            defaultValue:
              "Structured brackets, admin-verified scores and rating on the line. Registration opens to every verified roster.",
          })}
          aside={
            <Link to="/tournaments">
              <Button variant="outline" className="rounded-none border-border font-display uppercase tracking-[0.16em] text-xs">
                {t("home.cup.all", { defaultValue: "All tournaments" })}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          }
        />

        <Panel className="p-0 overflow-hidden">
          <div className="grid lg:grid-cols-[1.4fr_1fr]">
            <div className="p-6 md:p-9 border-b lg:border-b-0 lg:border-r border-border">
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <Chip className="border-primary/40 text-primary">
                  {cup?.status?.toUpperCase() ?? t("home.cup.soon", { defaultValue: "Announced" })}
                </Chip>
                <Chip>Valorant</Chip>
                <Chip>{cup?.format?.toUpperCase() ?? "Single elimination"}</Chip>
              </div>
              <Display className="text-3xl md:text-[3.4rem]">
                {cup?.name ?? t("home.cup.fallback", { defaultValue: "PeakGG Community Cup #1" })}
              </Display>
              <p className="mt-4 text-sm md:text-base text-muted-foreground font-body max-w-lg leading-relaxed">
                {cup?.short_description ??
                  t("home.cup.fallback_copy", {
                    defaultValue: "The opening cup of the closed beta. Five players, one bracket, no org required.",
                  })}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={cup?.slug ? `/tournaments/${cup.slug}` : "/tournaments"}>
                  <Button className="h-11 px-6 rounded-none font-display font-bold uppercase tracking-[0.16em]">
                    {t("home.cup.cta", { defaultValue: "View tournament" })}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/teams">
                  <Button variant="ghost" className="h-11 px-5 rounded-none font-display uppercase tracking-[0.16em] text-xs">
                    {t("home.cup.cta_team", { defaultValue: "Build a roster first" })}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="divide-y divide-border">
              {[
                { icon: CalendarDays, label: t("home.cup.meta_date", { defaultValue: "Start" }), value: dateLabel },
                {
                  icon: Users,
                  label: t("home.cup.meta_slots", { defaultValue: "Slots" }),
                  value: `${signups} / ${slots}`,
                },
                {
                  icon: Swords,
                  label: t("home.cup.meta_size", { defaultValue: "Team size" }),
                  value: `${cup?.team_size ?? 5}v${cup?.team_size ?? 5}`,
                },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between px-5 py-5">
                  <span className="inline-flex items-center gap-2.5 text-[10px] uppercase tracking-[0.24em] font-display font-bold text-muted-foreground">
                    <m.icon className="h-3.5 w-3.5 text-primary" />
                    {m.label}
                  </span>
                  <span className="bc-num text-2xl md:text-3xl">{m.value}</span>
                </div>
              ))}
              <div className="px-5 py-5">
                <Rail muted className="mb-3">
                  {t("home.cup.fill", { defaultValue: "Bracket filled" })}
                </Rail>
                <div className="h-1.5 bg-secondary">
                  <div className="h-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 text-[11px] font-display uppercase tracking-[0.18em] text-muted-foreground">{pct}%</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  );
}
