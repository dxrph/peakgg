import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Swords, ArrowRight, Trophy, Users, Award, MessageCircle, ChevronDown, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { DISCORD_INVITE } from "@/lib/links";
import apexBadge from "@/assets/ranks/apex.png";
import masterBadge from "@/assets/ranks/master.png";
import eliteBadge from "@/assets/ranks/elite.png";

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
    <section className="relative min-h-[78vh] md:min-h-[86vh] flex items-center gradient-hero overflow-hidden">
      {/* L1 — Cyber grid depth (masked to centre) */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "80px 80px, 80px 80px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 35%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 35%, transparent 80%)",
        }}
      />

      {/* L2 — Diagonal HUD motion streaks */}
      <div
        className="absolute inset-0 opacity-[0.09] pointer-events-none mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, hsl(var(--primary) / 0.4) 0 1px, transparent 1px 140px), repeating-linear-gradient(115deg, hsl(var(--accent) / 0.3) 0 1px, transparent 1px 320px)",
        }}
      />

      {/* L3 — PeakGG mountain silhouette motif */}
      <svg
        aria-hidden
        className="absolute bottom-0 left-0 right-0 w-full h-[42%] opacity-[0.16] pointer-events-none"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="peakFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path
          d="M0,400 L0,260 L180,140 L320,240 L480,90 L680,230 L860,120 L1040,250 L1220,160 L1440,300 L1440,400 Z"
          fill="url(#peakFade)"
        />
        <path
          d="M0,400 L0,320 L160,240 L360,300 L540,210 L760,320 L960,230 L1180,310 L1440,240 L1440,400 Z"
          fill="hsl(var(--accent))"
          fillOpacity="0.10"
        />
      </svg>

      {/* L4 — Soft red/orange arena glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 900px 700px at 15% 95%, hsl(352 100% 62% / 0.25), transparent 60%), radial-gradient(ellipse 700px 500px at 85% 10%, hsl(24 100% 63% / 0.14), transparent 65%)",
        }}
      />

      {/* L5 — Floating rank badges (decorative, low opacity) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.img
          src={apexBadge}
          alt=""
          aria-hidden
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 0.2, y: 0 }}
          transition={{ duration: 1.4, delay: 0.4 }}
          className="hidden md:block absolute right-[5%] top-[16%] w-[260px] lg:w-[320px] drop-shadow-[0_0_45px_hsl(var(--primary)/0.55)]"
          style={{ animation: "heroFloatY 9s ease-in-out infinite" }}
        />
        <motion.img
          src={masterBadge}
          alt=""
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 1.6, delay: 0.7 }}
          className="hidden lg:block absolute left-[3%] top-[22%] w-[150px] drop-shadow-[0_0_30px_hsl(var(--accent)/0.4)]"
          style={{ animation: "heroFloatY 11s ease-in-out infinite reverse" }}
        />
        <motion.img
          src={eliteBadge}
          alt=""
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ duration: 1.6, delay: 0.9 }}
          className="hidden lg:block absolute left-[8%] bottom-[20%] w-[120px]"
          style={{ animation: "heroFloatY 13s ease-in-out infinite" }}
        />
      </div>

      {/* Local keyframes for hero-only motion */}
      <style>{`
        @keyframes heroFloatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes heroSweep  { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
      `}</style>

      <div className="container relative z-10 pt-20 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm border border-primary/40 bg-primary/5 backdrop-blur-sm mb-5 md:mb-6 uppercase"
          >
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-[11px] md:text-xs text-primary font-display font-semibold tracking-[0.22em]">{t("hero.season_badge")}</span>
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp(0.15)}
            className="text-[2.75rem] xs:text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-8xl font-display font-bold leading-[0.9] md:leading-[0.88] mb-4 md:mb-5 tracking-tight uppercase"
          >
            <span className="block text-foreground">{t("hero.line1")}</span>
            <span className="block text-foreground">{t("hero.line2")}</span>
            <span className="relative inline-block overflow-hidden">
              <span className="block text-primary text-glow-red relative z-10">{t("hero.line3")}</span>
              {/* Red light sweep across the accent line */}
              <span
                aria-hidden
                className="absolute inset-y-0 -inset-x-1/4 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 35%, hsl(var(--primary) / 0.55) 50%, transparent 65%)",
                  mixBlendMode: "screen",
                  filter: "blur(6px)",
                  animation: "heroSweep 5s ease-in-out infinite",
                }}
              />
            </span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp(0.3)}
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl md:max-w-2xl mx-auto mb-6 md:mb-7 leading-relaxed font-body"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.4)}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3 justify-center w-full max-w-md sm:max-w-none sm:w-auto"
          >
            <Link to={registerHref} className="w-full sm:w-auto">
              <Button
                variant="neon"
                size="lg"
                className="group relative w-full sm:w-auto h-12 px-7 rounded-sm uppercase tracking-wider hover:-translate-y-0.5 transition-all duration-200 shadow-[0_0_28px_hsl(var(--primary)/0.45),0_0_60px_hsl(var(--primary)/0.18)] hover:shadow-[0_0_42px_hsl(var(--primary)/0.65),0_0_90px_hsl(var(--primary)/0.28)] overflow-hidden"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
                  }}
                />
                <Swords className="mr-2 h-5 w-5 relative" />
                <span className="relative">{t("hero.cta_register")}</span>
                <ArrowRight className="ml-1 h-5 w-5 relative group-hover:translate-x-0.5 transition-transform" />
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
                className="w-full sm:w-auto h-12 px-6 rounded-sm uppercase tracking-wider border-[#5865F2]/40 text-[#a8b0f7] bg-[#5865F2]/[0.04] backdrop-blur-sm hover:bg-[#5865F2]/10 hover:text-white hover:border-[#5865F2]/60 hover:-translate-y-0.5 transition-all duration-200"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {t("hero.cta_discord")}
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp(0.45)}
            className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] md:text-xs text-emerald-200/90 font-body">
              {t("hero.beta_access_note")}
            </span>
          </motion.div>

          <motion.button
            initial="hidden" animate="visible" variants={fadeUp(0.5)}
            onClick={scrollHowItWorks}
            className="group inline-flex items-center gap-1.5 mb-7 md:mb-8 text-[11px] md:text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary transition-colors font-display font-semibold"
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
