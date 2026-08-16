import { Link } from "react-router-dom";
import { ArrowRight, Users, Trophy, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import DiscordIcon from "@/components/icons/DiscordIcon";
import { Display, Rail, LiveTag, StatBlock } from "@/components/system";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { DISCORD_INVITE } from "@/lib/links";

const SHORTCUTS = [
  { icon: Users, key: "find_team", label: "Find a team", to: "/teams" },
  { icon: Trophy, key: "open_cup", label: "Open Cup", to: "/tournaments" },
  { icon: Crosshair, key: "ladder", label: "Peak ladder", to: "/leaderboard" },
];

export default function HomeHero() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <section className="relative border-b border-border bc-rules">
      <div className="absolute inset-0 bc-scanlines opacity-40 pointer-events-none" />
      <div className="container relative z-10 pt-28 pb-14 md:pt-36 md:pb-20 grid lg:grid-cols-[1.15fr_.85fr] gap-12 lg:gap-16 items-center">
        {/* LEFT — statement */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <LiveTag label={t("home.hero.beta", { defaultValue: "Closed beta" })} />
            <Rail muted>{t("home.hero.region", { defaultValue: "Valorant · Europe" })}</Rail>
          </div>

          <Display as="h1" className="text-[clamp(3.2rem,9vw,7.5rem)]">
            {t("home.hero.title_1", { defaultValue: "Compete like" })}
            <br />
            {t("home.hero.title_2", { defaultValue: "a pro team" })}
            <br />
            <span className="text-primary">{t("home.hero.title_3", { defaultValue: "without one" })}</span>
          </Display>

          <p className="mt-7 text-base md:text-lg text-muted-foreground font-body max-w-xl leading-relaxed">
            {t("home.hero.subtitle", {
              defaultValue:
                "PeakGG is the competitive layer around Valorant: build a roster, enter structured cups and climb a rating that actually means something.",
            })}
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link to={user ? "/tournaments" : "/register"}>
              <Button size="lg" className="w-full sm:w-auto h-12 px-7 rounded-none font-display font-bold uppercase tracking-[0.16em]">
                {user
                  ? t("home.hero.cta_primary_auth", { defaultValue: "Enter the cup" })
                  : t("home.hero.cta_primary", { defaultValue: "Claim your spot" })}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-none border-border bg-transparent font-display font-bold uppercase tracking-[0.16em] text-[#C7C8FF] hover:border-[#5865F2]/60"
              >
                <DiscordIcon className="mr-2 h-4 w-4" />
                {t("home.hero.cta_discord", { defaultValue: "Join the Discord" })}
              </Button>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            {SHORTCUTS.map((s) => (
              <Link
                key={s.key}
                to={s.to}
                className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-display font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <s.icon className="h-3.5 w-3.5 text-primary" />
                {t(`home.hero.shortcut_${s.key}`, { defaultValue: s.label })}
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT — data readout column */}
        <div className="border border-border bg-card/40">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Rail>{t("home.hero.panel_rail", { defaultValue: "Season 1 · Snapshot" })}</Rail>
            <span className="text-[10px] uppercase tracking-[0.2em] font-display text-muted-foreground">EU</span>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <StatBlock value="7" label={t("home.hero.stat_ranks", { defaultValue: "Peak ranks" })} />
            <StatBlock value="5v5" label={t("home.hero.stat_format", { defaultValue: "Cup format" })} />
          </div>
          <div className="bc-hairline" />
          <div className="grid grid-cols-2 divide-x divide-border">
            <StatBlock value="BO1" label={t("home.hero.stat_series", { defaultValue: "Group stage" })} />
            <StatBlock value="BO3" label={t("home.hero.stat_playoffs", { defaultValue: "Playoffs" })} />
          </div>
          <div className="px-4 py-4 border-t border-border">
            <p className="text-[11px] leading-relaxed text-muted-foreground font-body">
              {t("home.hero.panel_note", {
                defaultValue:
                  "Admin-verified results, anti-smurf checks and a single unified rating across every PeakGG competition.",
              })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
