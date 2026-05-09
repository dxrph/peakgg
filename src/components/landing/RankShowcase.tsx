import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import { RANKS, getRankByElo, type RankTier } from "@/lib/ranks";
import { Mountain, MapPin, ArrowRight, Trophy, Lock, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

const DESC_KEYS: Record<RankTier, string> = {
  Rookie: "desc_rookie",
  Iron: "desc_iron",
  Bronze: "desc_bronze",
  Silver: "desc_silver",
  Gold: "desc_gold",
  Platinum: "desc_platinum",
  Diamond: "desc_diamond",
  Elite: "desc_elite",
  Master: "desc_master",
  Apex: "desc_apex",
};

function unlockKey(tier: number): string {
  // Tournament tiers: Open Cup (all), Challenger (Silver=4), Championship (Diamond=7)
  if (tier >= 7) return "unlock_championship";
  if (tier >= 4) return "unlock_challenger";
  return "unlock_open_cup";
}

export default function RankShowcase() {
  const { user } = useAuth();
  const { t, tRank } = useI18n();
  const href = user ? "/play" : "/register";
  const [userElo, setUserElo] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState<RankTier | null>(null);

  // Fetch user's best ELO across games (used for "you are here" + progress to next).
  useEffect(() => {
    if (!user) {
      setUserElo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("player_stats")
        .select("elo")
        .eq("user_id", user.id);
      if (cancelled) return;
      const best = (data ?? []).reduce(
        (m: number, r: { elo: number | null }) => Math.max(m, r.elo ?? 0),
        0,
      );
      setUserElo(best || 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const userRank = useMemo(
    () => (typeof userElo === "number" ? getRankByElo(userElo) : null),
    [userElo],
  );

  // Default selection: user's current rank, fallback to Apex.
  useEffect(() => {
    if (selectedName) return;
    setSelectedName(userRank?.name ?? "Apex");
  }, [userRank, selectedName]);

  const selected = useMemo(
    () => RANKS.find((r) => r.name === selectedName) ?? RANKS[RANKS.length - 1],
    [selectedName],
  );
  const nextRank = RANKS.find((r) => r.tier === selected.tier + 1) ?? null;
  const eloToSelected =
    typeof userElo === "number" && userElo < selected.minElo
      ? selected.minElo - userElo
      : 0;
  const eloToNext =
    typeof userElo === "number" && nextRank && userElo < nextRank.minElo
      ? nextRank.minElo - userElo
      : 0;

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
          {userRank && typeof userElo === "number" && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#0a0a0a]/70 text-xs font-display tracking-wide">
              <span className="text-muted-foreground uppercase">{t("rank_showcase.your_rank")}:</span>
              <span className="font-bold uppercase" style={{ color: userRank.hex }}>
                {tRank(userRank.name)}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono tabular-nums">{userElo} ELO</span>
            </div>
          )}
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
                  const isSelected = selected.name === r.name;
                  const isUserRank = userRank?.name === r.name;
                  return (
                    <motion.div
                      key={r.name}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="relative snap-center"
                    >
                      {/* Premium clickable slot card */}
                      <button
                        type="button"
                        onClick={() => setSelectedName(r.name)}
                        aria-pressed={isSelected}
                        aria-label={`${tRank(r.name)} — ${r.minElo}${r.maxElo < 99999 ? `–${r.maxElo}` : "+"} ELO`}
                        className={`group relative w-full flex flex-col items-center text-center rounded-xl px-2 lg:px-3 pt-7 pb-4 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
                          isSelected
                            ? "-translate-y-1 shadow-[0_10px_36px_-12px_rgba(0,0,0,0.9)]"
                            : "hover:-translate-y-1 hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8)]"
                        } ${
                          isApex
                            ? "bg-gradient-to-b from-accent/10 via-[#0a0a0a]/80 to-[#050505]"
                            : "bg-gradient-to-b from-[#0e0e12]/85 to-[#06060a]/85"
                        }`}
                        style={{
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: isSelected
                            ? r.hex
                            : isApex
                            ? "hsl(var(--accent) / 0.4)"
                            : "rgba(255,255,255,0.06)",
                          boxShadow: isSelected
                            ? `0 0 0 1px ${r.hex}55, 0 0 28px -6px ${r.hex}88`
                            : undefined,
                        }}
                      >
                        {/* Top chip — Goal / You are here / Tier number */}
                        <span
                          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-display font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full border bg-[#0a0a0a] z-10 whitespace-nowrap inline-flex items-center gap-1"
                          style={{
                            color: isUserRank ? "#fff" : isApex ? "#FCD34D" : r.hex,
                            borderColor: isUserRank
                              ? r.hex
                              : isApex
                              ? "hsl(var(--accent) / 0.55)"
                              : `${r.hex}55`,
                            background: isUserRank ? `${r.hex}22` : "#0a0a0a",
                          }}
                        >
                          {isUserRank ? (
                            <>
                              <MapPin className="w-2.5 h-2.5" />
                              {t("rank_showcase.you_are_here")}
                            </>
                          ) : isApex ? (
                            t("rank_showcase.goal_label")
                          ) : (
                            `T${r.tier}`
                          )}
                        </span>

                        {/* Badge */}
                        <div
                          className={`relative ${isApex || isUserRank ? "rank-shimmer" : ""}`}
                          style={isApex || isUserRank ? { borderRadius: 12 } : undefined}
                        >
                          <RankBadge rank={r.name} size={isApex ? "lg" : "md"} forceProcedural />
                        </div>

                        <div
                          className="mt-3 font-display font-bold text-[11px] lg:text-sm tracking-[0.08em] uppercase whitespace-nowrap"
                          style={{ color: r.hex }}
                        >
                          {tRank(r.name)}
                        </div>

                        <div className="text-[9px] lg:text-[11px] text-muted-foreground/80 font-mono mt-1 whitespace-nowrap tabular-nums">
                          {r.minElo}{r.maxElo < 99999 ? `–${r.maxElo}` : "+"} <span className="opacity-50">ELO</span>
                        </div>

                        {/* Selected/hover underline accent */}
                        <div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] transition-all duration-300 rounded-full"
                          style={{
                            background: r.hex,
                            width: isSelected ? "70%" : 0,
                          }}
                        />
                        {!isSelected && (
                          <div
                            className="hidden lg:block absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-2/3 transition-all duration-300 rounded-full"
                            style={{ background: r.hex }}
                          />
                        )}
                      </button>
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

          {/* ─────────────── Details Panel ─────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mt-8 rounded-2xl overflow-hidden border bg-gradient-to-br from-[#0c0c10]/95 to-[#050507]/95 backdrop-blur-sm"
              style={{
                borderColor: `${selected.hex}55`,
                boxShadow: `0 24px 60px -28px ${selected.hex}66, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}
            >
              {/* Top accent stripe */}
              <div
                className="h-1 w-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${selected.hex}, transparent)`,
                }}
              />

              <div className="p-5 sm:p-7 grid gap-6 md:grid-cols-[auto,1fr,auto] items-start">
                {/* Left: large badge */}
                <div className="flex flex-col items-center md:items-start gap-2">
                  <RankBadge rank={selected.name} size="xl" forceProcedural />
                  <div className="text-[10px] uppercase font-display tracking-[0.2em] text-muted-foreground">
                    {t("rank_showcase.tier_label")} {selected.tier} / {RANKS.length}
                  </div>
                </div>

                {/* Middle: name + description + unlocks */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3
                      className="text-3xl md:text-4xl font-display font-extrabold tracking-tight uppercase"
                      style={{ color: selected.hex }}
                    >
                      {tRank(selected.name)}
                    </h3>
                    <span className="font-mono tabular-nums text-sm text-muted-foreground">
                      {selected.minElo}
                      {selected.maxElo < 99999 ? `–${selected.maxElo}` : "+"} ELO
                    </span>
                    {userRank?.name === selected.name && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-display font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          color: selected.hex,
                          borderColor: `${selected.hex}88`,
                          background: `${selected.hex}15`,
                        }}
                      >
                        <MapPin className="w-3 h-3" />
                        {t("rank_showcase.you_are_here")}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm md:text-base text-foreground/80 font-body max-w-2xl leading-relaxed">
                    {t(`rank_showcase.${DESC_KEYS[selected.name]}`)}
                  </p>

                  {/* Unlock chip */}
                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-display uppercase tracking-wide px-3 py-1.5 rounded-md border border-white/10 bg-black/40">
                    <Trophy className="w-3.5 h-3.5 text-accent" />
                    <span className="text-muted-foreground">{t("rank_showcase.unlocks")}:</span>
                    <span className="text-foreground/90">
                      {t(`rank_showcase.${unlockKey(selected.tier)}`)}
                    </span>
                  </div>
                </div>

                {/* Right: progress / next-rank panel */}
                <div className="md:w-[260px] lg:w-[300px] w-full rounded-xl border border-white/10 bg-black/40 p-4">
                  {typeof userElo === "number" ? (
                    <>
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-display text-muted-foreground">
                        <span>{t("rank_showcase.current_elo")}</span>
                        <span className="font-mono tabular-nums text-foreground/90 text-xs">
                          {userElo}
                        </span>
                      </div>

                      {/* progress bar inside selected rank range OR toward selected */}
                      <ProgressBar
                        userElo={userElo}
                        targetMin={selected.minElo}
                        targetMax={selected.maxElo < 99999 ? selected.maxElo : selected.minElo + 200}
                        color={selected.hex}
                      />

                      {/* Status line */}
                      <div className="mt-3 text-xs leading-relaxed">
                        {userElo >= selected.minElo && userElo <= selected.maxElo ? (
                          <span className="inline-flex items-center gap-1.5 text-success">
                            <Check className="w-3.5 h-3.5" />
                            {t("rank_showcase.you_are_here")}
                          </span>
                        ) : userElo < selected.minElo ? (
                          <span className="text-foreground/85">
                            <span className="text-muted-foreground">
                              {t("rank_showcase.to_reach", { rank: tRank(selected.name) })}:
                            </span>{" "}
                            <span className="font-mono font-bold tabular-nums" style={{ color: selected.hex }}>
                              +{eloToSelected}
                            </span>{" "}
                            <span className="text-muted-foreground uppercase tracking-wide text-[10px]">ELO</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Check className="w-3.5 h-3.5 text-success" />
                            {t("rank_showcase.you_are_here")}
                          </span>
                        )}
                      </div>

                      {/* Next rank line */}
                      {nextRank ? (
                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <RankBadge rank={nextRank.name} size="sm" forceProcedural />
                            <div className="min-w-0">
                              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-display">
                                {t("rank_showcase.next_rank")}
                              </div>
                              <div
                                className="text-xs font-display font-bold uppercase truncate"
                                style={{ color: nextRank.hex }}
                              >
                                {tRank(nextRank.name)}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                          <div className="text-right">
                            <div className="font-mono font-bold tabular-nums text-sm" style={{ color: nextRank.hex }}>
                              {eloToNext > 0 ? `+${eloToNext}` : "—"}
                            </div>
                            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-display">
                              ELO
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-white/10 text-xs text-foreground/80 inline-flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-accent" />
                          {t("rank_showcase.max_rank_reached")}
                        </div>
                      )}
                    </>
                  ) : (
                    /* No user — generic next-rank info */
                    <div className="text-xs">
                      <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Lock className="w-3.5 h-3.5" />
                        {t("rank_showcase.select_a_rank")}
                      </div>
                      {nextRank && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <RankBadge rank={nextRank.name} size="sm" forceProcedural />
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-display">
                                {t("rank_showcase.next_rank")}
                              </div>
                              <div
                                className="text-xs font-display font-bold uppercase"
                                style={{ color: nextRank.hex }}
                              >
                                {tRank(nextRank.name)}
                              </div>
                            </div>
                          </div>
                          <div className="font-mono tabular-nums text-xs text-muted-foreground">
                            {nextRank.minElo}+
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
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

/* Inline ELO progress bar — visualises user's ELO within the selected rank's window. */
function ProgressBar({
  userElo,
  targetMin,
  targetMax,
  color,
}: {
  userElo: number;
  targetMin: number;
  targetMax: number;
  color: string;
}) {
  const span = Math.max(1, targetMax - targetMin);
  const raw = ((userElo - targetMin) / span) * 100;
  const pct = Math.max(0, Math.min(100, raw));
  return (
    <div className="mt-2">
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}55, ${color})`,
            boxShadow: `0 0 12px ${color}88`,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono tabular-nums text-[10px] text-muted-foreground/80">
        <span>{targetMin}</span>
        <span>{targetMax}</span>
      </div>
    </div>
  );
}