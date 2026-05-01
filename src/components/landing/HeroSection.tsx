import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain, Trophy, ChevronRight, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";

const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.7 } },
});

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const dur = 2000;
    const steps = 40;
    const inc = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, dur / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString()}{suffix}</>;
}

export default function HeroSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const startHref = user ? "/play" : "/register";
  const leaderboardClick = () => navigate(user ? "/leaderboard" : "/login", user ? undefined : { state: { from: "/leaderboard" } });
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
            className="text-6xl md:text-8xl lg:text-9xl font-display font-bold leading-[0.85] mb-6"
          >
            <span className="text-foreground">{t("hero.line1")}</span>
            <br />
            <span className="text-primary text-glow-red">{t("hero.line2")}</span>
            <br />
            <span className="text-accent text-glow-orange">{t("hero.line3")}</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp(0.3)}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed font-body"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.4)}
            className="flex flex-col sm:flex-row gap-4 mb-16 justify-center"
          >
            <Link to={startHref}>
              <Button
                variant="neon"
                size="xl"
                className="rounded-md hover:shadow-[0_0_30px_hsl(var(--primary)/0.55),0_0_70px_hsl(var(--primary)/0.25)] transition-shadow"
              >
                <Mountain className="mr-2 h-5 w-5" />
                {t("hero.cta_play")}
              </Button>
            </Link>
            <Button variant="neonOutline" size="xl" className="rounded-md" onClick={leaderboardClick}>
              {t("hero.cta_leaderboard")}
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.55)}
            className="flex flex-wrap gap-6 md:gap-12 p-5 rounded-lg border border-border bg-card/50 backdrop-blur-sm justify-center"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <div>
                <div className="text-2xl font-display font-bold text-foreground"><AnimatedCounter target={4213} /></div>
                <div className="text-xs text-muted-foreground font-body">{t("hero.stat_players_online")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Swords className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-display font-bold text-foreground"><AnimatedCounter target={18720} /></div>
                <div className="text-xs text-muted-foreground font-body">{t("hero.stat_matches_today")}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-accent" />
              <div>
                <div className="text-2xl font-display font-bold text-foreground"><AnimatedCounter target={36} /></div>
                <div className="text-xs text-muted-foreground font-body">{t("hero.stat_tournaments_live")}</div>
              </div>
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
