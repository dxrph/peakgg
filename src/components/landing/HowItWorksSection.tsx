import { motion } from "framer-motion";
import { UserPlus, Gamepad2, Swords, Trophy } from "lucide-react";
import { useI18n } from "@/i18n";

export default function HowItWorksSection() {
  const { t } = useI18n();
  const steps = [
    { icon: UserPlus, step: "01", title: t("how_it_works.step1_title"), description: t("how_it_works.step1_desc") },
    { icon: Gamepad2, step: "02", title: t("how_it_works.step2_title"), description: t("how_it_works.step2_desc") },
    { icon: Swords, step: "03", title: t("how_it_works.step3_title"), description: t("how_it_works.step3_desc") },
    { icon: Trophy, step: "04", title: t("how_it_works.step3_title"), description: t("how_it_works.step3_desc") },
  ];
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-card/30" />
      <div className="container relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {t("how_it_works.title_pre")} <span className="text-accent">{t("how_it_works.title_accent")}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className="text-7xl font-display font-bold text-primary/[0.08] mb-2 select-none">{step.step}</div>
              <div className="w-14 h-14 rounded-full border-2 border-primary/30 bg-primary/5 flex items-center justify-center mx-auto mb-4">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-display font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-[4.5rem] left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px border-t border-dashed border-primary/20" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
