import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MessageCircle, Swords, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { DISCORD_INVITE } from "@/lib/links";

export default function PreLaunchCTA() {
  const { user } = useAuth();
  const { t } = useI18n();
  const registerHref = user ? "/dashboard" : "/register";

  return (
    <section className="py-14 md:py-20 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto rounded-xl border border-primary/30 bg-gradient-to-br from-[hsl(240_18%_8%)] to-[hsl(240_15%_5%)] p-7 md:p-10 overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              background:
                "radial-gradient(ellipse 600px 300px at 0% 0%, hsl(var(--primary) / 0.18), transparent 60%), radial-gradient(ellipse 500px 300px at 100% 100%, hsl(var(--accent) / 0.12), transparent 65%)",
            }}
          />
          <div className="relative flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/5 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] md:text-xs font-display font-semibold tracking-[0.22em] uppercase text-primary">
                {t("pre_launch_cta.eyebrow")}
              </span>
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold uppercase tracking-tight">
              {t("pre_launch_cta.title")}
            </h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground font-body max-w-2xl">
              {t("pre_launch_cta.subtitle")}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-md sm:max-w-none sm:w-auto">
              <Link to={registerHref} className="w-full sm:w-auto">
                <Button size="lg" variant="neon" className="w-full sm:w-auto h-12 px-6 rounded-sm uppercase tracking-wider">
                  <Swords className="mr-2 h-5 w-5" />
                  {t("pre_launch_cta.cta_register")}
                </Button>
              </Link>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-6 rounded-sm uppercase tracking-wider border-[#5865F2]/40 text-[#a8b0f7] hover:bg-[#5865F2]/10 hover:text-white hover:border-[#5865F2]/60"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {t("pre_launch_cta.cta_discord")}
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}