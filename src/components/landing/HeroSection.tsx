import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crosshair, Shield, Trophy, Users, Zap, ChevronRight, Activity, Gamepad2, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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
  return (
    <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline pointer-events-none" />
      
      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />
      
      {/* Glow orbs */}
      <div className="absolute top-1/4 right-1/5 w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/6 w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-[120px] pointer-events-none" />

      <div className="container relative z-10 pt-28 pb-20">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-neon" />
            <span className="text-sm text-primary font-display font-semibold tracking-wide">SEASON 1 — NOW LIVE</span>
          </motion.div>

          {/* Title */}
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp(0.15)}
            className="text-6xl md:text-8xl lg:text-9xl font-display font-bold leading-[0.85] mb-6"
          >
            <span className="text-foreground">COMPETE.</span>
            <br />
            <span className="text-primary text-glow-red">RISE.</span>
            <br />
            <span className="text-accent text-glow-orange">DOMINATE.</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp(0.3)}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed font-body"
          >
            The ultimate competitive platform for VALORANT. Ranked matchmaking, 
            tournaments, team management — all powered by a multi-layer anti-smurf system.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.4)}
            className="flex flex-col sm:flex-row gap-4 mb-16"
          >
            <Link to="/register">
              <Button variant="neon" size="xl">
                <Crosshair className="mr-2 h-5 w-5" />
                Start Playing
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="neonOutline" size="xl">
                View Leaderboard
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Live Stats Bar */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.55)}
            className="flex flex-wrap gap-6 md:gap-12 p-5 rounded-lg border border-border bg-card/50 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <div>
                <div className="text-2xl font-display font-bold text-foreground"><AnimatedCounter target={2847} /></div>
                <div className="text-xs text-muted-foreground font-body">Players Online</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Swords className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-display font-bold text-foreground"><AnimatedCounter target={12543} /></div>
                <div className="text-xs text-muted-foreground font-body">Matches Today</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-accent" />
              <div>
                <div className="text-2xl font-display font-bold text-foreground"><AnimatedCounter target={24} /></div>
                <div className="text-xs text-muted-foreground font-body">Tournaments Live</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
