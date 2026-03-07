import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mountain } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/[0.04] blur-[150px] pointer-events-none" />
      
      <div className="container relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-5xl md:text-7xl font-display font-bold mb-6">
            READY TO <span className="text-primary text-glow-red">COMPETE</span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto font-body">
            Join thousands of players on the most advanced multi-game competitive platform.
          </p>
          <Link to="/register">
            <Button variant="neon" size="xl">
              <Mountain className="mr-2 h-5 w-5" />
              Create Your Account
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
