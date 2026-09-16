import { Link } from "react-router-dom";
import { UserPlus, Users, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import { SectionHead, Rail } from "@/components/system";
import { useI18n } from "@/i18n";

const STEPS = [
  { n: "01", icon: UserPlus, key: "profile", title: "Create your player card", copy: "Sign up, link your Riot ID and get your starting Peak rating.", to: "/register" },
  { n: "02", icon: Users, key: "roster", title: "Build or join a roster", copy: "Recruit from the free-agent board or apply to teams already scouting.", to: "/teams" },
  { n: "03", icon: Trophy, key: "compete", title: "Enter a cup", copy: "Open Cup is free entry. Brackets, check-ins and results are all admin verified.", to: "/tournaments" },
  { n: "04", icon: TrendingUp, key: "climb", title: "Climb the ladder", copy: "Every verified match moves your rating across the seven Peak tiers.", to: "/leaderboard" },
];

export default function PathModule() {
  const { t } = useI18n();
  return (
    <section className="bc-section">
      <div className="container">
        <SectionHead
          rail={t("home.path.rail", { defaultValue: "How it runs" })}
          title={t("home.path.title", { defaultValue: "Four steps to your first match" })}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-border divide-y sm:divide-y-0 divide-border lg:divide-x">
          {STEPS.map((s) => (
            <Link
              key={s.key}
              to={s.to}
              className="group relative p-6 md:p-7 bg-card/30 hover:bg-card/60 transition-colors sm:border-b lg:border-b-0 border-border"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="bc-num text-5xl text-foreground/12 group-hover:text-primary/40 transition-colors">{s.n}</span>
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-condensed font-black uppercase text-xl leading-none mb-2.5">
                {t(`home.path.${s.key}_title`, { defaultValue: s.title })}
              </h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                {t(`home.path.${s.key}_copy`, { defaultValue: s.copy })}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] font-display font-bold text-muted-foreground group-hover:text-primary transition-colors">
                {t("home.path.open", { defaultValue: "Open" })} <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
        <Rail muted className="mt-6">
          {t("home.path.note", { defaultValue: "No org, no manager, no invite chain required" })}
        </Rail>
      </div>
    </section>
  );
}
