import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import { DISCORD_INVITE } from "@/lib/links";
import { useI18n } from "@/i18n";

interface DiscordCTAProps {
  variant?: "section" | "inline";
  className?: string;
}

/**
 * Reusable Discord call-to-action.
 * - "section": full-width banner section for landing pages.
 * - "inline":  compact card to drop inside other pages (Tournaments, Teams, ...).
 */
export default function DiscordCTA({ variant = "section", className = "" }: DiscordCTAProps) {
  const { t } = useI18n();

  const title = t("discord_cta.title");
  const subtitle = t("discord_cta.subtitle");
  const button = t("discord_cta.button");

  if (variant === "inline") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-[#5865F2]/40 bg-gradient-to-br from-[#5865F2]/15 via-background to-background p-5 sm:p-6 ${className}`}
      >
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#5865F2]/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-md bg-[#5865F2] flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg uppercase tracking-wide">{title}</h3>
              <p className="text-sm text-muted-foreground font-body mt-0.5">{subtitle}</p>
            </div>
          </div>
          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Button className="bg-[#5865F2] hover:bg-[#4752c4] text-white border-0 w-full sm:w-auto">
              <MessageCircle className="mr-2 h-4 w-4" />
              {button}
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <section className={`py-20 relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#5865F2]/10 via-background to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#5865F2]/15 blur-[140px] pointer-events-none" />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-[#5865F2]/40 bg-[#5865F2]/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#5865F2] animate-pulse" />
            <span className="text-xs text-[#8a93f5] font-display font-semibold tracking-[0.2em] uppercase">
              {t("discord_cta.eyebrow")}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight uppercase mb-4">
            {title}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground font-body max-w-2xl mx-auto mb-8">
            {subtitle}
          </p>
          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
            <Button
              size="xl"
              className="bg-[#5865F2] hover:bg-[#4752c4] text-white border-0 rounded-sm uppercase tracking-wider"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              {button}
              <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}