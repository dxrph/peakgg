import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Trophy, Video, ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n";

export default function StartCompetingSection() {
  const { t } = useI18n();

  const CARDS = [
    {
      icon: Users,
      title: t("start_competing.card1_title"),
      desc: t("start_competing.card1_desc"),
      cta: t("start_competing.card1_cta"),
      href: "/free-agents",
    },
    {
      icon: Trophy,
      title: t("start_competing.card2_title"),
      desc: t("start_competing.card2_desc"),
      cta: t("start_competing.card2_cta"),
      href: "/tournaments",
    },
    {
      icon: Video,
      title: t("start_competing.card3_title"),
      desc: t("start_competing.card3_desc"),
      cta: t("start_competing.card3_cta"),
      href: "/clips",
    },
  ];

  return (
    <section className="py-20 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]/40" />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-14"
        >
          <span className="inline-block text-[11px] md:text-xs text-primary font-display font-semibold tracking-[0.22em] uppercase mb-3">
            {t("start_competing.eyebrow")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight uppercase">
            {t("start_competing.title_pre")} <span className="text-primary text-glow-red">{t("start_competing.title_accent")}</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground font-body max-w-xl mx-auto">
            {t("start_competing.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={c.href}
                className="group relative block h-full p-6 md:p-7 rounded-lg border border-border bg-gradient-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-15px_hsl(var(--primary)/0.5)]"
              >
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse 400px 200px at 50% 0%, hsl(var(--primary) / 0.08), transparent 70%)",
                  }}
                />
                <div className="relative">
                  <div className="w-11 h-11 rounded-md border border-primary/30 bg-primary/5 flex items-center justify-center mb-5 group-hover:border-primary/60 group-hover:bg-primary/10 transition-colors">
                    <c.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-display font-bold uppercase tracking-tight mb-2">
                    {c.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed mb-5">
                    {c.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-display font-semibold uppercase tracking-[0.16em] text-primary group-hover:gap-2.5 transition-all">
                    {c.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}