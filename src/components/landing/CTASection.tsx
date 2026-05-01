import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";

export default function CTASection() {
  const { user } = useAuth();
  const { t } = useI18n();
  const href = user ? "/play" : "/register";
  const label = user ? t("cta_section.cta_logged_in") : t("cta_section.cta_guest");
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/[0.04] blur-[150px] pointer-events-none" />
      
      <div className="container relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 tracking-tight">
            {t("cta_section.title_pre")} <span className="text-primary text-glow-red">{t("cta_section.title_accent")}</span>?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-lg mx-auto font-body">
            {t("cta_section.subtitle")}
          </p>
          <Link to={href}>
            <Button variant="neon" size="xl" className="hover:shadow-[0_0_30px_hsl(var(--primary)/0.55),0_0_70px_hsl(var(--primary)/0.25)] transition-shadow">
              <Mountain className="mr-2 h-5 w-5" />
              {label}
              <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-5 text-xs text-muted-foreground font-body">
            {t("cta_section.reassurance")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
