import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Gamepad2, Swords, Trophy, Users } from "lucide-react";

function CountUp({ to, duration = 1800 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref}>{val.toLocaleString()}</span>;
}

const STATS = [
  { icon: Gamepad2, value: 1240, label: "Players Registered", color: "text-primary" },
  { icon: Swords,   value: 89,   label: "Matches Played",     color: "text-accent" },
  { icon: Trophy,   value: 12,   label: "Tournaments Live",   color: "text-primary" },
  { icon: Users,    value: 34,   label: "Active Teams",       color: "text-accent" },
];

export default function LiveStatsBar() {
  return (
    <section className="py-12 border-y border-border/60 bg-[#0a0a0a]/80 backdrop-blur-sm relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="container relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center justify-center gap-4 px-4 py-3 md:py-1"
            >
              <s.icon className={`h-7 w-7 ${s.color}`} />
              <div>
                <div className="text-3xl md:text-4xl font-display font-bold text-foreground tabular-nums">
                  <CountUp to={s.value} />
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-display">
                  {s.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}