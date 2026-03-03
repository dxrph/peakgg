import { Shield, Swords, Trophy, Users, Zap, Eye, Gamepad2, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Swords,
    title: "Ranked Matchmaking",
    description: "5v5 competitive queue with ELO-based matching, role preferences, and anti-smurf verification levels.",
  },
  {
    icon: Trophy,
    title: "Tournaments",
    description: "Daily, weekly, and monthly competitions. Single & double elimination brackets with automated seeding.",
  },
  {
    icon: Users,
    title: "Team System",
    description: "Create your team, manage roster & roles. Separate team ELO with dedicated team queue.",
  },
  {
    icon: Shield,
    title: "Anti-Smurf",
    description: "Multi-layer smurf detection: risk scoring, account verification, performance anomaly analysis.",
  },
  {
    icon: BarChart3,
    title: "Player Profiles",
    description: "Detailed stats, match history, rank progression, achievements, and reputation tracking.",
  },
  {
    icon: Gamepad2,
    title: "Live Match Rooms",
    description: "Real-time lobbies, map veto, ready checks, score confirmation, and dispute resolution.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-background relative">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            BUILT FOR <span className="text-primary">COMPETITORS</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
            Everything you need for a serious, fair, and thrilling competitive experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative p-6 rounded-lg border border-border bg-card hover:border-primary/30 transition-all duration-300 neon-border overflow-hidden"
            >
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-body">{feature.description}</p>
              
              {/* Hover glow */}
              <div className="absolute -bottom-2 -right-2 w-32 h-32 rounded-full bg-primary/[0.04] blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
