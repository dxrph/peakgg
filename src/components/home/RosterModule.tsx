import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SectionHead, Panel, Rail } from "@/components/system";
import { useI18n } from "@/i18n";

export default function RosterModule() {
  const { t } = useI18n();

  const { data: counts } = useQuery({
    queryKey: ["home-roster-counts"],
    queryFn: async () => {
      const [agents, teams] = await Promise.all([
        supabase.from("lfp_board").select("id", { count: "exact", head: true }).eq("is_active", true).eq("type", "player"),
        supabase.from("lfp_board").select("id", { count: "exact", head: true }).eq("is_active", true).eq("type", "team"),
      ]);
      return { agents: agents.count ?? 0, teams: teams.count ?? 0 };
    },
  });

  const cards = [
    {
      key: "agents",
      icon: Search,
      value: counts?.agents ?? 0,
      title: t("home.roster.agents_title", { defaultValue: "Free agents looking for a team" }),
      copy: t("home.roster.agents_copy", { defaultValue: "Filter by role, rank and availability, then contact them directly." }),
      cta: t("home.roster.agents_cta", { defaultValue: "Browse free agents" }),
      to: "/free-agents",
    },
    {
      key: "teams",
      icon: Megaphone,
      value: counts?.teams ?? 0,
      title: t("home.roster.teams_title", { defaultValue: "Teams currently recruiting" }),
      copy: t("home.roster.teams_copy", { defaultValue: "Open tryouts posted by captains that still need a slot filled." }),
      cta: t("home.roster.teams_cta", { defaultValue: "Find a team" }),
      to: "/teams",
    },
  ];

  return (
    <section className="bc-section">
      <div className="container">
        <SectionHead
          rail={t("home.roster.rail", { defaultValue: "Roster market" })}
          title={t("home.roster.title", { defaultValue: "Five players is the only entry fee" })}
          copy={t("home.roster.copy", {
            defaultValue: "The board is live: post yourself as a free agent or open a tryout slot for your roster.",
          })}
        />
        <div className="grid md:grid-cols-2 gap-5">
          {cards.map((c) => (
            <Panel key={c.key} className="p-6 md:p-8 flex flex-col">
              <div className="flex items-start justify-between">
                <span className="bc-num text-6xl md:text-7xl">{c.value}</span>
                <c.icon className="h-5 w-5 text-primary mt-2" />
              </div>
              <h3 className="mt-5 font-condensed font-black uppercase text-2xl leading-none">{c.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground font-body leading-relaxed flex-1">{c.copy}</p>
              <Link to={c.to} className="mt-6">
                <Button variant="outline" className="rounded-none border-border font-display uppercase tracking-[0.16em] text-xs">
                  {c.cta}
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </Link>
            </Panel>
          ))}
        </div>
        <Rail muted className="mt-6">
          {t("home.roster.note", { defaultValue: "Every listing is tied to a verified PeakGG account" })}
        </Rail>
      </div>
    </section>
  );
}
