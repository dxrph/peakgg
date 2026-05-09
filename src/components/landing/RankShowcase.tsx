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

        <div className="relative max-w-7xl mx-auto">
          {/* Horizontal scroll-snap on mobile, fluid grid on desktop. */}
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pb-3 snap-x snap-mandatory lg:snap-none">
            <div className="relative min-w-[920px] lg:min-w-0">
              {/* Connecting progression rail — sits behind cards, aligned to badge centers */}
              <div
                className="absolute left-[4%] right-[4%] h-[2px] pointer-events-none"
                style={{
                  top: 78,
                  background:
                    "linear-gradient(90deg, transparent 0%, hsl(var(--border)) 12%, hsl(var(--primary) / 0.45) 55%, hsl(var(--accent) / 0.7) 92%, transparent 100%)",
                  boxShadow: "0 0 18px hsl(var(--primary) / 0.18)",
                }}
              />
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
                      className="relative snap-center"
                    >
                      {/* Premium slot card */}
                      <div
                        className={`group relative flex flex-col items-center text-center rounded-xl px-2 lg:px-3 pt-7 pb-4 transition-all duration-300 ${
                          isApex
                            ? "bg-gradient-to-b from-accent/10 via-[#0a0a0a]/80 to-[#050505] border border-accent/40 shadow-[0_0_28px_-6px_hsl(var(--accent)/0.45)]"
                            : "bg-gradient-to-b from-[#0e0e12]/85 to-[#06060a]/85 border border-white/[0.06] hover:border-white/[0.14] hover:-translate-y-1 hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8)]"
                        }`}
                        style={
                          !isApex
                            ? ({
                                ["--rank-glow" as any]: r.hex,
                              } as React.CSSProperties)
                            : undefined
                        }
                      >
                        {/* Tier number chip */}
                        <span
                          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-display font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full border bg-[#0a0a0a] z-10 whitespace-nowrap"
                          style={{
                            color: isApex ? "#FCD34D" : r.hex,
                            borderColor: isApex ? "hsl(var(--accent) / 0.55)" : `${r.hex}55`,
                          }}
                        >
                          {isApex ? t("rank_showcase.goal_label") : `T${r.tier}`}
                        </span>

                        {/* Badge */}
                        <div
                          className={`relative ${isApex ? "rank-shimmer" : ""}`}
                          style={isApex ? { borderRadius: 12 } : undefined}
                        >
                          <RankBadge rank={r.name} size={isApex ? "lg" : "md"} forceProcedural />
                        </div>

                        {/* Name */}
                        <div
                          className="mt-3 font-display font-bold text-[11px] lg:text-sm tracking-[0.08em] uppercase whitespace-nowrap"
                          style={{ color: r.hex }}
                        >
                          {tRank(r.name)}
                        </div>

                        {/* ELO range */}
                        <div className="text-[9px] lg:text-[11px] text-muted-foreground/80 font-mono mt-1 whitespace-nowrap tabular-nums">
                          {r.minElo}{r.maxElo < 99999 ? `–${r.maxElo}` : "+"} <span className="opacity-50">ELO</span>
                        </div>

                        {/* Hover underline accent (desktop) */}
                        {!isApex && (
                          <div
                            className="hidden lg:block absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-2/3 transition-all duration-300 rounded-full"
                            style={{ background: r.hex }}
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile scroll hint */}
          <div className="mt-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground/60 font-display lg:hidden">
            ← {t("rank_showcase.subtitle")} →
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