import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import { RANKS } from "@/lib/ranks";
import { Mountain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";

export default function RankShowcase() {
  const { user } = useAuth();
  const { t, tRank } = useI18n();
  const href = user ? "/play" : "/register";
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]/60" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 800px 500px at 90% 80%, hsl(var(--primary) / 0.12), transparent 65%)",
        }}
      />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            {t("rank_showcase.title_pre")} <span className="text-primary text-glow-red">{t("rank_showcase.title_accent")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground font-body max-w-xl mx-auto">
            {t("rank_showcase.subtitle")}
          </p>
        </motion.div>

        <div className="relative max-w-6xl mx-auto">
          {/* Horizontal scroll container — keeps all 10 ranks on a single line, no awkward wrap. */}
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
            <div className="relative min-w-[760px] lg:min-w-0">
              {/* Connecting progression line — sits behind badges, aligned to badge centers */}
              <div className="absolute top-[44px] left-[3%] right-[3%] h-px bg-gradient-to-r from-transparent via-primary/30 to-accent/40" />

              <div className="grid grid-cols-10 gap-x-2 lg:gap-x-3 gap-y-6">
                {RANKS.map((r, i) => {
                  const isApex = r.name === "Apex";
                  return (
                    <motion.div
                      key={r.name}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="relative flex flex-col items-center text-center px-1 pt-4"
                    >
                      {isApex && (
                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] font-display font-bold tracking-widest text-accent uppercase bg-[#0a0a0a] px-2 py-0.5 rounded-full border border-accent/40 z-10 whitespace-nowrap">
                          {t("rank_showcase.goal_label")}
                        </span>
                      )}
                      <div
                        className={`relative ${isApex ? "rank-shimmer" : ""}`}
                        style={isApex ? { borderRadius: 12 } : undefined}
                      >
                        <RankBadge rank={r.name} size={isApex ? "lg" : "md"} forceProcedural />
                      </div>
                      <div
                        className="mt-3 font-display font-bold text-[11px] lg:text-sm tracking-wide whitespace-nowrap"
                        style={{ color: r.hex }}
                      >
                        {tRank(r.name)}
                      </div>
                      <div className="text-[9px] lg:text-[11px] text-muted-foreground font-mono mt-0.5 whitespace-nowrap">
                        {r.minElo}{r.maxElo < 99999 ? `–${r.maxElo}` : "+"}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-14">
          <Link to={href}>
            <Button
              variant="neon"
              size="xl"
              className="rounded-md hover:shadow-[0_0_30px_hsl(var(--primary)/0.55),0_0_70px_hsl(var(--primary)/0.25)] transition-shadow"
            >
              <Mountain className="mr-2 h-5 w-5" />
              {t("rank_showcase.cta")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}