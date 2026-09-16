import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronRight, Sparkles, User, Users, Swords } from "lucide-react";
import { useI18n } from "@/i18n";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { cn } from "@/lib/utils";

/**
 * Persistent "Start here" card shown on the dashboard until the new user
 * has completed all 3 steps. Dismisses itself when done.
 */
export default function OnboardingChecklist() {
  const { t } = useI18n();
  const { steps, completed, total, done, loading } = useOnboardingProgress();

  if (loading || done) return null;

  const items = [
    {
      key: "profile",
      icon: User,
      title: t("onboarding.step_profile_title"),
      desc: t("onboarding.step_profile_desc"),
      to: "/settings",
      cta: t("onboarding.step_profile_cta"),
    },
    {
      key: "team",
      icon: Users,
      title: t("onboarding.step_team_title"),
      desc: t("onboarding.step_team_desc"),
      to: "/teams",
      cta: t("onboarding.step_team_cta"),
    },
    {
      key: "match",
      icon: Swords,
      title: t("onboarding.step_match_title"),
      desc: t("onboarding.step_match_desc"),
      to: "/play",
      cta: t("onboarding.step_match_cta"),
    },
  ] as const;

  const progress = Math.round((completed / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl border border-primary/30 bg-gradient-to-br from-primary/[0.06] via-card to-card p-5 md:p-6 mb-6 overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 600px 200px at 20% 0%, hsl(var(--primary)/0.6), transparent 60%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">
                {t("onboarding.title")}
              </h3>
              <p className="text-xs text-muted-foreground font-body">
                {t("onboarding.subtitle", { completed, total })}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 min-w-[120px]">
            <div className="text-xs font-display font-bold text-primary">{progress}%</div>
            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {items.map((item, i) => {
            const stepDone = steps[i]?.done;
            return (
              <Link
                key={item.key}
                to={item.to}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border p-3 transition-all",
                  stepDone
                    ? "border-success/40 bg-success/5"
                    : "border-border bg-background/40 hover:border-primary/50 hover:bg-primary/5",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                    stepDone
                      ? "border-success bg-success/15 text-success"
                      : "border-primary/40 bg-primary/10 text-primary",
                  )}
                >
                  {stepDone ? <Check className="h-4 w-4" /> : <item.icon className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-display font-semibold text-sm leading-tight",
                      stepDone && "line-through opacity-60",
                    )}
                  >
                    {item.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                  {!stepDone && (
                    <div className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-display font-bold text-primary uppercase tracking-wider">
                      {item.cta}
                      <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}