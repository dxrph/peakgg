import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Swords, ArrowRight, Trophy, Users, Award, MessageCircle, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { DISCORD_INVITE } from "@/lib/links";

const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.7 } },
});

export default function HeroSection() {
  const { user } = useAuth();
  const { t } = useI18n();
  const registerHref = user ? "/play" : "/register";
  const scrollHowItWorks = () => {
    const el = document.getElementById("how-it-works");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section className="relative min-h-[88vh] md:min-h-[92vh] flex items-center gradient-hero overflow-hidden">
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

      <div className="container relative z-10 pt-24 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm border border-primary/40 bg-primary/5 mb-6 md:mb-7 uppercase"
          >
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] md:text-xs text-primary font-display font-semibold tracking-[0.22em]">{t("hero.season_badge")}</span>
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp(0.15)}
            className="text-[2.75rem] xs:text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-8xl font-display font-bold leading-[0.9] md:leading-[0.88] mb-5 md:mb-6 tracking-tight uppercase"
          >
            <span className="block text-foreground">{t("hero.line1")}</span>
            <span className="block text-foreground">{t("hero.line2")}</span>
            <span className="block text-primary text-glow-red">{t("hero.line3")}</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp(0.3)}
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl md:max-w-2xl mx-auto mb-7 md:mb-9 leading-relaxed font-body"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.4)}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 justify-center w-full max-w-md sm:max-w-none sm:w-auto"
          >
            <Link to={registerHref} className="w-full sm:w-auto">
              <Button
                variant="neon"
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-sm uppercase tracking-wider hover:-translate-y-0.5 transition-all duration-200 shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_36px_hsl(var(--primary)/0.5)]"
              >
                <Swords className="mr-2 h-5 w-5" />
                {t("hero.cta_register")}
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-sm uppercase tracking-wider border-[#5865F2]/40 text-[#a8b0f7] hover:bg-[#5865F2]/10 hover:text-white hover:border-[#5865F2]/60 hover:-translate-y-0.5 transition-all duration-200"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {t("hero.cta_discord")}
              </Button>
            </a>
          </motion.div>

          <motion.button
            initial="hidden" animate="visible" variants={fadeUp(0.5)}
            onClick={scrollHowItWorks}
            className="group inline-flex items-center gap-1.5 mb-9 md:mb-10 text-[11px] md:text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary transition-colors font-display font-semibold"
          >
            {t("hero.cta_secondary")}
            <ChevronDown className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" />
          </motion.button>

          {/* Competitive trust strip */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.55)}
            className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-y-2 text-[11px] md:text-xs text-muted-foreground font-body uppercase tracking-[0.14em]"
          >
            <div className="flex items-center gap-2 px-4">
              <Users className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{t("hero.trust_finder")}</span>
            </div>
            <span className="hidden sm:inline-block w-px h-3 bg-border" />
            <div className="flex items-center gap-2 px-4">
              <Award className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{t("hero.trust_ranks")}</span>
            </div>
            <span className="hidden sm:inline-block w-px h-3 bg-border" />
            <div className="flex items-center gap-2 px-4">
              <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{t("hero.trust_cups")}</span>
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
