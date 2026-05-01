import { motion } from "framer-motion";
import { UserPlus, Swords, Trophy } from "lucide-react";
import { useI18n } from "@/i18n";

export default function HowItWorksSection() {
  const { t } = useI18n();
  const steps = [
    { icon: UserPlus, step: "01", title: t("how_it_works.step1_title"), description: t("how_it_works.step1_desc") },
    { icon: Swords,   step: "02", title: t("how_it_works.step2_title"), description: t("how_it_works.step2_desc") },
    { icon: Trophy,   step: "03", title: t("how_it_works.step3_title"), description: t("how_it_works.step3_desc") },
  ];
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 bg-card/30" />
      <div className="container relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-3 tracking-tight">
            {t("how_it_works.title_pre")} <span className="text-accent">{t("how_it_works.title_accent")}</span>
          </h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto text-sm md:text-base">
            {t("how_it_works.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center px-4"
            >
              <div className="text-8xl font-display font-bold text-primary/[0.08] mb-2 select-none leading-none">{step.step}</div>
              <div className="w-16 h-16 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-[5.5rem] left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px border-t border-dashed border-primary/20" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
