import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crosshair } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-primary/[0.03]" />
      
      <div className="container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            PRONTO A <span className="text-primary text-glow">COMPETERE</span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
            Unisciti a migliaia di giocatori nella piattaforma competitiva più avanzata per VALORANT in Europa.
          </p>
          <Link to="/signup">
            <Button variant="hero" size="xl">
              <Crosshair className="mr-2 h-5 w-5" />
              Crea il tuo account
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
