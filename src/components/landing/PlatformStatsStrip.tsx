import { motion } from "framer-motion";
import { Gamepad2, Award, Trophy, Globe2 } from "lucide-react";
import { useI18n } from "@/i18n";

export default function PlatformStatsStrip() {
  const { t } = useI18n();

  const STATS = [
    { icon: Gamepad2, value: "3",  label: t("platform_stats.games") },
    { icon: Award,    value: "10", label: t("platform_stats.ranks") },
    { icon: Trophy,   value: "3",  label: t("platform_stats.tiers") },
    { icon: Globe2,   value: "EU", label: t("platform_stats.region") },
  ];

  return (
    <section className="py-10 md:py-12 border-y border-border/60 bg-[#08080a] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 md:gap-0 md:divide-x divide-border/50">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="flex items-center justify-center gap-3 md:gap-4 px-2 md:px-4"
            >
              <s.icon className="h-6 w-6 md:h-7 md:w-7 text-primary shrink-0" />
              <div className="text-left">
                <div className="text-2xl md:text-3xl font-display font-bold text-foreground tabular-nums leading-none">
                  {s.value}
                </div>
                <div className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-display mt-1">
                  {s.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}