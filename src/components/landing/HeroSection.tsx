import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Users, Award, ChevronDown, CheckCircle2, Swords } from "lucide-react";
import DiscordIcon from "@/components/icons/DiscordIcon";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { DISCORD_INVITE } from "@/lib/links";
import heroBg from "@/assets/peakgg-afterburn-hero.webp";

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
    <section className="cinematic-hero relative min-h-[690px] md:min-h-[790px] flex items-center overflow-hidden bg-[#05050a] border-b border-white/[0.06]">
      <div aria-hidden className="hero-slash hero-slash-a" />
      <div aria-hidden className="hero-slash hero-slash-b" />
      {/* Background artwork */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-[62%_center] md:bg-[center_right] scale-[1.08] md:scale-100"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      {/* Readability overlays */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(3,3,8,0.98) 0%, rgba(3,3,8,0.88) 32%, rgba(3,3,8,0.48) 58%, rgba(3,3,8,0.12) 82%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,3,6,0.55) 0%, rgba(3,3,6,0.85) 55%, rgba(3,3,6,0.95) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 pointer-events-none bg-gradient-to-b from-[#050505] to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-[#050505] to-transparent"
      />
      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "linear-gradient(90deg, black 0%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(90deg, black 0%, transparent 70%)",
        }}
      />

      <div className="container relative z-10 pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 xl:col-span-6 max-w-2xl">
            {/* Status pill */}
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp(0)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/35 bg-primary/[0.07] backdrop-blur-xl mb-6 uppercase"
            >
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-[11px] md:text-xs text-primary font-display font-semibold tracking-[0.24em]">
                {t("home.hero.status")}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial="hidden" animate="visible" variants={fadeUp(0.12)}
              className="hero-brush font-display font-bold uppercase leading-[0.84] tracking-[-0.055em] mb-6 text-[2.75rem] xs:text-[3.25rem] sm:text-[4.4rem] md:text-[5.3rem] lg:text-[5.5rem] xl:text-[6.2rem]"
            >
              <span className="block text-white/95 [text-shadow:0_2px_18px_rgba(0,0,0,0.6)]">{t("home.hero.title.line1")}</span>
              <span className="block text-white/95 [text-shadow:0_2px_18px_rgba(0,0,0,0.6)]">{t("home.hero.title.line2")}</span>
              <span
                className="block bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(95deg, #FF4655 0%, #FF6A4D 55%, #FF8C42 100%)",
                  filter: "drop-shadow(0 0 22px rgba(255,70,85,0.45))",
                }}
              >
                {t("home.hero.title.highlight")}
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial="hidden" animate="visible" variants={fadeUp(0.24)}
              className="text-[15px] md:text-lg text-slate-300 max-w-[540px] mb-7 leading-relaxed font-body"
            >
              {t("home.hero.subtitle")}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp(0.32)}
              className="flex flex-col sm:flex-row gap-3 mb-5 w-full sm:w-auto"
            >
              <Link to={registerHref} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="group relative w-full sm:w-auto h-14 px-8 rounded-xl uppercase tracking-wider font-display font-bold text-sm text-white border-0 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-[0_16px_44px_-20px_rgba(255,70,85,0.9)] hover:shadow-[0_18px_52px_-18px_rgba(255,70,85,0.95)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(95deg, #FF4655 0%, #FF5A3D 55%, #FF7A30 100%)",
                  }}
                >
                  <Swords className="mr-2 h-5 w-5 relative" />
                  <span className="relative">{t("home.hero.primaryCta")}</span>
                  <ArrowRight className="ml-2 h-5 w-5 relative group-hover:translate-x-0.5 transition-transform" />
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
                  className="group w-full sm:w-auto h-14 px-7 rounded-xl uppercase tracking-wider font-display font-semibold border-white/15 text-[#D9DBFF] bg-white/[0.035] backdrop-blur-xl hover:bg-[#5865F2]/15 hover:text-white hover:border-[#5865F2]/60 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <DiscordIcon className="mr-3 h-[18px] w-[18px] md:h-5 md:w-5 shrink-0 text-[#C7C8FF] group-hover:text-white transition-colors" />
                  {t("home.hero.discordCta")}
                </Button>
              </a>
            </motion.div>

            {/* Beta status banner */}
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp(0.4)}
              className="inline-flex items-start gap-2 px-3.5 py-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.055] backdrop-blur-xl max-w-[560px] mb-7"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs md:text-sm text-emerald-100/90 font-body leading-snug">
                {t("home.hero.betaNotice")}
              </span>
            </motion.div>

            {/* COME FUNZIONA */}
            <motion.button
              initial="hidden" animate="visible" variants={fadeUp(0.46)}
              onClick={scrollHowItWorks}
              className="group inline-flex items-center gap-2 text-[11px] md:text-xs uppercase tracking-[0.24em] text-gray-400 hover:text-primary transition-colors font-display font-semibold"
            >
              <span className="h-px w-6 bg-primary/50" />
              {t("home.hero.howItWorks")}
              <ChevronDown className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" />
            </motion.button>
          </div>

          {/* Right column reserved for crystal artwork (background) + optional label */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-6 relative h-[520px]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.9 }}
              className="absolute top-10 right-4 xl:right-12 flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary/40 bg-black/40 backdrop-blur-md"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_#FF4655]" />
              <span className="text-[10px] font-display font-bold tracking-[0.28em] text-white/90">{t("home.hero.peakRank")}</span>
            </motion.div>
          </div>
        </div>

        {/* Feature shortcuts */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp(0.55)}
          className="mt-12 md:mt-16 mb-4 grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch"
        >
          {[
            { icon: Users, title: t("home.hero.features.findTeam.title"), desc: t("home.hero.features.findTeam.description"), to: "/teams" },
            { icon: Award, title: t("home.hero.features.rankPeak.title"), desc: t("home.hero.features.rankPeak.description"), to: "/leaderboard" },
            { icon: Trophy, title: t("home.hero.features.openCup.title"), desc: t("home.hero.features.openCup.description"), to: "/tournaments" },
          ].map(({ icon: Icon, title, desc, to }) => (
            <Link
              key={title}
              to={to}
              className="group relative flex h-full flex-col rounded-xl border border-white/10 bg-[rgba(8,9,15,0.72)] backdrop-blur-md p-5 md:p-6 transition-all duration-200 hover:-translate-y-[3px] hover:border-[rgba(255,70,85,0.55)] hover:shadow-[0_12px_40px_-12px_rgba(255,70,85,0.45),0_0_0_1px_rgba(255,70,85,0.15)_inset] overflow-hidden"
            >
              {/* gradient overlay on hover */}
              <span
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,70,85,0.14) 0%, rgba(8,9,15,0.0) 70%)",
                }}
              />
              {/* ambient glow */}
              <span
                aria-hidden
                className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-primary/[0.10] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              />
              {/* subtle corner accent */}
              <span aria-hidden className="absolute top-0 left-0 h-3 w-3 border-t border-l border-primary/40 group-hover:border-primary transition-colors" />

              <div className="relative flex items-center gap-3 mb-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md text-primary transition-all duration-200 group-hover:shadow-[0_0_18px_rgba(255,70,85,0.45)]"
                  style={{
                    background: "rgba(255,70,85,0.08)",
                    border: "1px solid rgba(255,70,85,0.35)",
                  }}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
                </span>
                <h3 className="font-display font-bold tracking-[0.12em] text-white/95 text-[15px] uppercase">
                  {title}
                </h3>
                <ArrowRight className="ml-auto h-4 w-4 text-gray-500 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
              </div>
              <p className="relative text-sm text-gray-400 font-body leading-[1.65]">{desc}</p>
            </Link>
          ))}
        </motion.div>
      </div>

      {/* Animated gradient separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
        <div className="h-full w-[200%] animate-gradient-slide bg-[linear-gradient(90deg,transparent,hsl(var(--primary)/0.7),hsl(var(--accent)/0.7),transparent)]" />
      </div>
    </section>
  );
}

