import { motion } from "framer-motion";
import { UserPlus, Users, Swords, Trophy } from "lucide-react";
import { useI18n } from "@/i18n";

export default function HowItWorksSteps() {
  const { t } = useI18n();
  const STEPS = [
    { num: "01", icon: UserPlus, title: t("how_it_works.step1_title"), desc: t("how_it_works.step1_desc") },
    { num: "02", icon: Users,    title: t("how_it_works.step2_title"), desc: t("how_it_works.step2_desc") },
    { num: "03", icon: Swords,   title: t("how_it_works.step3_title"), desc: t("how_it_works.step3_desc") },
    { num: "04", icon: Trophy,   title: t("how_it_works.step4_title"), desc: t("how_it_works.step4_desc") },
  ];
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 bg-[#0a0a0a]/60" />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            {t("how_it_works.title_pre")} <span className="text-primary text-glow-red">{t("how_it_works.title_accent")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground font-body">{t("how_it_works.subtitle")}</p>
        </motion.div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[3.25rem] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative text-center px-4"
            >
              <div className="relative mx-auto w-24 h-24 mb-5">
                <div className="absolute inset-0 rounded-full bg-primary/5 border border-primary/30 flex items-center justify-center">
                  <s.icon className="h-9 w-9 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 text-3xl font-display font-bold text-primary text-glow-red bg-[#0a0a0a] px-2 rounded">
                  {s.num}
                </span>
              </div>
              <h3 className="text-xl font-display font-bold mb-2 tracking-wide">{s.title}</h3>
              <p className="text-sm text-muted-foreground font-body max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}