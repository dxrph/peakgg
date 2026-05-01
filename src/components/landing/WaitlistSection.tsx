import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Sparkles } from "lucide-react";
import { z } from "zod";

const TARGET_SPOTS = 100;
const STARTING_REMAINING = 67;

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);

function CountDown({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [val, setVal] = useState(TARGET_SPOTS);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const duration = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(TARGET_SPOTS - (TARGET_SPOTS - to) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref} className="tabular-nums">{val}</span>;
}

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ position: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from("waitlist")
      .insert({ email: parsed.data })
      .select("position")
      .single();
    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("This email is already on the waitlist.");
      } else {
        toast.error("Something went wrong. Try again.");
      }
      return;
    }

    setSuccess({ position: data.position });
    setEmail("");
    // Confetti burst
    const colors = ["#ff4655", "#ff8c42", "#ffffff"];
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors });
    setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors }), 200);
    setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors }), 200);
  };

  return (
    <section className="py-24 relative overflow-hidden border-t border-border/60">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 900px 600px at 50% 100%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(ellipse 600px 400px at 50% 0%, hsl(var(--accent) / 0.08), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-primary font-display font-semibold tracking-widest uppercase">
            Early Access
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-display font-bold mb-4 tracking-tight"
        >
          BE AMONG THE FIRST{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            100 PLAYERS
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="text-muted-foreground font-body mb-10 max-w-xl mx-auto"
        >
          Early access members get exclusive rank badges and tournament priority.
        </motion.p>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-primary/40 bg-primary/5 p-8 max-w-lg mx-auto"
          >
            <div className="text-2xl md:text-3xl font-display font-bold mb-2">
              You're in!
            </div>
            <p className="text-foreground/90 font-body">
              You are <span className="text-primary font-bold">#{success.position}</span> on the waitlist 🎯
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 255))}
                placeholder="your@email.com"
                required
                maxLength={255}
                className="w-full h-12 pl-10 pr-3 rounded-md bg-secondary/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="h-12 px-6 rounded-md font-display font-bold uppercase tracking-wider text-primary-foreground bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_24px_hsl(var(--primary)/0.5)] transition-shadow border-0"
            >
              {submitting ? "Joining…" : "Join the Waitlist"}
            </Button>
          </motion.form>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-8 inline-flex items-center gap-2 text-sm font-display tracking-wider"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-foreground">
            <CountDown to={STARTING_REMAINING} />
          </span>
          <span className="text-muted-foreground uppercase text-xs tracking-[0.2em]">spots remaining</span>
        </motion.div>
      </div>
    </section>
  );
}