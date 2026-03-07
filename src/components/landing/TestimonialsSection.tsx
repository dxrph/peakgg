import { motion } from "framer-motion";
import { Star } from "lucide-react";
import RankBadge from "@/components/RankBadge";

const testimonials = [
  {
    name: "PhantomX",
    elo: 2847,
    text: "Finally a platform that takes anti-smurf seriously. The matchmaking quality is insane compared to other platforms.",
    avatar: "PX",
  },
  {
    name: "NightShade",
    elo: 2600,
    text: "The tournament tier system is genius. Working your way from Open Cup to Peak Championship feels so rewarding.",
    avatar: "NS",
  },
  {
    name: "AceViper",
    elo: 1850,
    text: "Best team management I've seen. Creating a team and getting into team queue took less than 5 minutes.",
    avatar: "AV",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-card/30" />
      <div className="container relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            WHAT PLAYERS <span className="text-accent">SAY</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-lg border border-border bg-card neon-border"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-xs font-display font-bold text-primary-foreground">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold font-body text-sm">{t.name}</div>
                  <RankBadge elo={t.elo} size="sm" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
