import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, ArrowRight, Gift, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";

const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.7 } },
});

export default function HeroSection() {
  const { user } = useAuth();
  const { t } = useI18n();
  const startHref = user ? "/play" : "/register";
  const scrollHowItWorks = () => {
    const el = document.getElementById("how-it-works");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
      {/* Diagonal lines + grid texture */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, hsl(var(--foreground) / 0.6) 0 1px, transparent 1px 22px), linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "auto, 80px 80px, 80px 80px",
        }}
      />
      {/* Soft red/orange radial glow — bottom-left origin */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 900px 700px at 15% 95%, hsl(352 100% 62% / 0.22), transparent 60%), radial-gradient(ellipse 600px 500px at 25% 85%, hsl(24 100% 63% / 0.12), transparent 65%)",
        }}
      />

      <div className="container relative z-10 pt-28 pb-20">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-neon" />
            <span className="text-sm text-primary font-display font-semibold tracking-wide">{t("hero.season_badge")}</span>
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp(0.15)}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.9] mb-6 tracking-tight"
          >
            <span className="text-foreground">{t("hero.headline_pre")}</span>{" "}
            <span className="text-primary text-glow-red">{t("hero.headline_accent")}</span>
            <br />
            <span className="text-foreground">{t("hero.headline_post")}</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp(0.3)}
            className="text-base md:text-xl text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed font-body"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.4)}
            className="flex flex-col sm:flex-row gap-3 mb-6 justify-center w-full sm:w-auto"
          >
            <Link to={startHref} className="w-full sm:w-auto">
              <Button
                variant="neon"
                size="xl"
                className="w-full sm:w-auto rounded-md hover:shadow-[0_0_30px_hsl(var(--primary)/0.55),0_0_70px_hsl(var(--primary)/0.25)] transition-shadow"
              >
                <Mountain className="mr-2 h-5 w-5" />
                {t("hero.cta_play")}
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="neonOutline"
              size="xl"
              className="w-full sm:w-auto rounded-md"
              onClick={scrollHowItWorks}
            >
              {t("hero.cta_secondary")}
            </Button>
          </motion.div>

          {/* Trust strip — replaces fake stat counters */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.55)}
            className="flex flex-wrap gap-x-6 gap-y-3 justify-center text-xs md:text-sm text-muted-foreground font-body"
          >
            <div className="flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-primary" />
              <span>{t("hero.trust_free")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span>{t("hero.trust_fast")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{t("hero.trust_safe")}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Animated gradient separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-[200%] animate-gradient-slide bg-[linear-gradient(90deg,transparent,hsl(var(--primary)/0.7),hsl(var(--accent)/0.7),transparent)]" />
      </div>
    </section>
  );
}
