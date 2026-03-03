import { Shield, Swords, Trophy, Users, Zap, Eye } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Swords,
    title: "Matchmaking 5v5",
    description: "Algoritmo Elo avanzato con bilanciamento dei ruoli e livelli di verifica. Match competitivi reali.",
  },
  {
    icon: Trophy,
    title: "Tornei",
    description: "Daily, weekly e monthly. Single e double elimination con check-in obbligatorio e bracket automatici.",
  },
  {
    icon: Users,
    title: "Sistema Team",
    description: "Crea il tuo team, gestisci roster e ruoli. Elo team separato e queue dedicata.",
  },
  {
    icon: Shield,
    title: "Anti-Smurf",
    description: "Sistema multi-livello con risk score, verifica account, analisi performance e fingerprinting.",
  },
  {
    icon: Zap,
    title: "Ranking Elo",
    description: "Elo dinamico con placement, K-factor adattivo e decay. Leaderboard stagionali.",
  },
  {
    icon: Eye,
    title: "Reputazione",
    description: "Sistema comportamentale 0-100. Premia i giocatori fair-play, penalizza i tossici.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-background relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            FEATURES <span className="text-primary">PRINCIPALI</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tutto ciò che serve per un'esperienza competitiva seria e sicura.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative p-6 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-lg bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
