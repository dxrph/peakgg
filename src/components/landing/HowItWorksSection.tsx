import { motion } from "framer-motion";
import { UserPlus, Link as LinkIcon, Swords, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Crea Account",
    description: "Registrati e completa la verifica per accedere alla piattaforma.",
  },
  {
    icon: LinkIcon,
    step: "02",
    title: "Collega Riot ID",
    description: "Connetti il tuo account VALORANT per sbloccare queue verificate.",
  },
  {
    icon: Swords,
    step: "03",
    title: "Trova Match",
    description: "Entra in coda SoloQ o TeamQ. Il matchmaking bilancia team e ruoli.",
  },
  {
    icon: Trophy,
    step: "04",
    title: "Scala la Classifica",
    description: "Vinci match, guadagna Elo e competi nei tornei settimanali.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Subtle bg */}
      <div className="absolute inset-0 bg-card/50" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            COME <span className="text-primary">FUNZIONA</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className="text-6xl font-display font-bold text-primary/10 mb-2">{step.step}</div>
              <div className="w-14 h-14 rounded-full border-2 border-primary/30 bg-primary/5 flex items-center justify-center mx-auto mb-4">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-display font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>

              {/* Connector line (hidden on last + mobile) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-[4.5rem] left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px border-t border-dashed border-primary/20" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
