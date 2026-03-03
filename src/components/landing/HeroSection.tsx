import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crosshair, Shield, Trophy, Users, Zap, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center gradient-hero overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      
      {/* Glow orb */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 py-20">
        <div className="max-w-3xl">
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-sm text-primary font-medium">Piattaforma Competitiva EU</span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.9] mb-6"
          >
            <span className="text-foreground">DOMINA IL</span>
            <br />
            <span className="text-primary text-glow">COMPETITIVO</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed"
          >
            Matchmaking 5v5, ranking Elo, tornei e team per VALORANT.
            Sistema anti-smurf avanzato. La piattaforma dove il tuo skill conta davvero.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/signup">
              <Button variant="hero" size="xl">
                <Crosshair className="mr-2 h-5 w-5" />
                Inizia a giocare
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant="heroOutline" size="xl">
                Scopri di più
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={4}
            variants={fadeUp}
            className="mt-16 flex gap-12 flex-wrap"
          >
            {[
              { value: "10K+", label: "Giocatori" },
              { value: "50K+", label: "Match giocati" },
              { value: "500+", label: "Tornei" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-display font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
