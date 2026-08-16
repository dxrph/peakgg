import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/system";
import { RANKS } from "@/lib/ranks";
import { useI18n } from "@/i18n";

export default function RanksModule() {
  const { t } = useI18n();
  return (
    <section className="bc-section">
      <div className="container">
        <SectionHead
          rail={t("home.ranks.rail", { defaultValue: "Rating system" })}
          title={t("home.ranks.title", { defaultValue: "Seven tiers. One rating." })}
          copy={t("home.ranks.copy", {
            defaultValue:
              "Your Peak rating is earned in verified competition only — cups, scrims and league play. Nothing is imported from in-game ranks.",
          })}
          aside={
            <Link to="/elo">
              <Button variant="outline" className="rounded-none border-border font-display uppercase tracking-[0.16em] text-xs">
                {t("home.ranks.cta", { defaultValue: "How rating works" })}
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          }
        />

        <div className="border border-border divide-y divide-border">
          {RANKS.map((r) => (
            <div key={r.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-8 px-4 md:px-6 py-4 bg-card/25 hover:bg-card/55 transition-colors">
              <span className="bc-num text-2xl md:text-3xl w-10 text-muted-foreground/50">{String(r.tier).padStart(2, "0")}</span>
              <div className="min-w-0 flex items-center gap-4">
                <span
                  className="h-8 w-1.5 shrink-0"
                  style={{ background: r.gradient ?? r.hex }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="font-condensed font-black uppercase text-xl md:text-2xl leading-none truncate" style={{ color: r.hex }}>
                    {r.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.22em] font-display text-muted-foreground mt-1">
                    {r.maxElo > 99999
                      ? `${r.minElo}+ ${t("home.ranks.elo", { defaultValue: "elo" })}`
                      : `${r.minElo} – ${r.maxElo} ${t("home.ranks.elo", { defaultValue: "elo" })}`}
                  </div>
                </div>
              </div>
              <div className="hidden md:block h-px w-24 lg:w-56 bg-border" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
