import { motion } from "framer-motion";
import { Gamepad2, Swords, Trophy } from "lucide-react";

const STEPS = [
  { num: "01", icon: Gamepad2, title: "Create Your Account", desc: "Sign up in 30 seconds, link your game account." },
  { num: "02", icon: Swords,   title: "Choose Your Game",    desc: "Pick Valorant, CS2 or Rainbow Six Siege and queue up." },
  { num: "03", icon: Trophy,   title: "Compete & Rise",      desc: "Win matches, climb the ranks, join tournaments." },
];

export default function HowItWorksSteps() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]/60" />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            HOW IT <span className="text-primary text-glow-red">WORKS</span>
          </h2>
          <p className="mt-4 text-muted-foreground font-body">Three steps to start your climb.</p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[3.25rem] left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative text-center px-4"
            >
              <div className="relative mx-auto w-24 h-24 mb-5">
                <div className="absolute inset-0 rounded-full bg-primary/5 border border-primary/30 flex items-center justify-center">
                  <s.icon className="h-9 w-9 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 text-3xl font-display font-bold text-primary text-glow-red bg-[#0a0a0a] px-2 rounded">
                  {s.num}
                </span>
              </div>
              <h3 className="text-xl font-display font-bold mb-2 tracking-wide">{s.title}</h3>
              <p className="text-sm text-muted-foreground font-body max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}