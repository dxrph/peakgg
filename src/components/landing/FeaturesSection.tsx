import { Shield, Swords, Trophy, Users, Zap, Eye, Gamepad2, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n";

export default function FeaturesSection() {
  const { t } = useI18n();
  const features = [
    { icon: Swords,    title: t("features.f1_title"), description: t("features.f1_desc") },
    { icon: Trophy,    title: t("features.f2_title"), description: t("features.f2_desc") },
    { icon: Users,     title: t("features.f3_title"), description: t("features.f3_desc") },
    { icon: Shield,    title: t("features.f4_title"), description: t("features.f4_desc") },
    { icon: BarChart3, title: t("features.f5_title"), description: t("features.f5_desc") },
    { icon: Gamepad2,  title: t("features.f6_title"), description: t("features.f6_desc") },
  ];
  return (
    <section className="py-24 bg-background relative">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {t("features.title_pre")}{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("features.title_accent")}
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
            {t("features.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative p-7 rounded-lg border border-border/60 bg-[hsl(240_18%_10%)] transition-all duration-300 overflow-hidden hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.35)] hover:border-border"
            >
              {/* Subtle top accent border */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-60" />

              <div className="w-12 h-12 rounded-lg bg-[hsl(240_15%_6%)] border border-border/60 flex items-center justify-center mb-5">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-body">{feature.description}</p>

              {/* Hover glow */}
              <div className="absolute -bottom-4 -right-4 w-40 h-40 rounded-full bg-primary/[0.06] blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
