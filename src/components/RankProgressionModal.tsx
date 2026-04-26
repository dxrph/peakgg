import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RANKS, getRankByElo, getEloProgress, type RankInfo } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";
import { useI18n } from "@/i18n";
import { Check } from "lucide-react";

export interface RankProgressionModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  elo: number;
  username?: string;
  isOwn?: boolean;
}

export default function RankProgressionModal({
  open,
  onOpenChange,
  elo,
  username,
  isOwn = true,
}: RankProgressionModalProps) {
  const { tRank } = useI18n();
  const current = getRankByElo(elo);
  const progress = getEloProgress(elo);
  const isApex = current.name === "Apex";
  const next = progress.nextRank;

  // Animate progress bar fill on open
  const [fillPct, setFillPct] = useState(0);
  useEffect(() => {
    if (open) {
      setFillPct(0);
      const t = window.setTimeout(() => setFillPct(progress.percent), 60);
      return () => window.clearTimeout(t);
    }
  }, [open, progress.percent]);

  const { t } = useI18n();
  const motivation = isApex
    ? t("rank.max_rank")
    : progress.percent >= 50
    ? t("rank.motivation_high")
    : t("rank.motivation_low");

  const topBorder = current.gradient ?? current.hex;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rank-modal max-w-[600px] sm:max-w-[600px] w-[calc(100%-2rem)] p-0 gap-0 border border-[#1E1E24] bg-[#0D0D0F] overflow-hidden rounded-xl"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
      >
        {/* Top accent border (rank-coloured) */}
        <div
          className="h-1 w-full"
          style={{ background: topBorder }}
          aria-hidden
        />

        <div className="px-6 pt-6 pb-5 space-y-5">
          {/* Section 1 — current rank */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="rank-glow flex items-center justify-center rounded-xl shrink-0"
                style={{
                  width: 80,
                  height: 80,
                  background: "rgba(15, 23, 42, 0.6)",
                  border: `1px solid ${current.hex}55`,
                  ["--rank-color" as any]: current.hex,
                }}
              >
                <RankBadge rank={current.name} size="lg" />
              </div>
              <div className="min-w-0">
                <div
                  className="font-display font-bold leading-none truncate"
                  style={{ fontSize: 28, color: current.hex }}
                >
                  {tRank(current.name)}
                </div>
                <div
                  className="font-display uppercase tracking-widest mt-2"
                  style={{ fontSize: 12, color: "#6B7280" }}
                >
                  {isOwn ? t("rank.current_rank") : t("rank.progression_other", { name: username ?? "—" })}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div
                className="font-display font-bold leading-none text-white"
                style={{ fontSize: 48 }}
              >
                {elo.toLocaleString("it-IT")}
              </div>
              <div
                className="font-display uppercase tracking-widest mt-1"
                style={{ fontSize: 11, color: "#6B7280" }}
              >
                ELO
              </div>
              {!isApex && next && (
                <div
                  className="font-display font-semibold mt-2"
                  style={{ fontSize: 12, color: current.hex }}
                >
                  {Math.max(0, progress.nextThreshold - elo)} {t("rank.elo_to_next")}
                </div>
              )}
            </div>
          </div>

          <div className="h-px w-full" style={{ background: "#1E1E24" }} />

          {/* Section 2 — rank grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RANKS.map((r) => {
              const state: "passed" | "current" | "locked" =
                r.tier < current.tier
                  ? "passed"
                  : r.tier === current.tier
                  ? "current"
                  : "locked";
              return (
                <RankCell
                  key={r.name}
                  rank={r}
                  state={state}
                  label={tRank(r.name)}
                  currentLabel={t("rank.current_badge")}
                />
              );
            })}
          </div>

          {/* Section 3 — progress bar */}
          <div className="pt-1">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <RankBadge rank={current.name} size="sm" />
                <span
                  className="font-display font-bold uppercase text-[11px] tracking-wider truncate"
                  style={{ color: current.hex }}
                >
                  {tRank(current.name)}
                </span>
              </div>
              {next ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="font-display font-bold uppercase text-[11px] tracking-wider truncate"
                    style={{ color: next.hex }}
                  >
                    {tRank(next.name)}
                  </span>
                  <RankBadge rank={next.name} size="sm" />
                </div>
              ) : (
                <span className="font-display font-bold uppercase text-[11px] tracking-wider text-[#9CA3AF]">
                  MAX
                </span>
              )}
            </div>

            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ background: "#1E1E24" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${isApex ? 100 : fillPct}%`,
                  background: next
                    ? `linear-gradient(90deg, ${current.hex}, ${next.hex})`
                    : current.gradient ?? current.hex,
                  transition: "width 0.8s ease-out",
                }}
              />
            </div>

            <div
              className="mt-2 text-center font-mono"
              style={{ fontSize: 13, color: "#9CA3AF" }}
            >
              {isApex
                ? `${elo.toLocaleString()} ELO — Apex tier`
                : `${elo} / ${progress.nextThreshold} — ${progress.percent}% ${t("rank.completed")}`}
            </div>
          </div>

          {/* Section 4 — motivational line */}
          <div
            className="text-center italic"
            style={{ fontSize: 13, color: "#6B7280" }}
          >
            {motivation}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RankCell({
  rank,
  state,
  label,
  currentLabel,
}: {
  rank: RankInfo;
  state: "passed" | "current" | "locked";
  label: string;
  currentLabel: string;
}) {
  const isCurrent = state === "current";
  const isLocked = state === "locked";
  const isPassed = state === "passed";

  return (
    <div
      className="relative rounded-lg flex flex-col items-center justify-center gap-1 py-3 px-2 transition-all"
      style={{
        background: isCurrent ? "#1B1B22" : "#16161A",
        border: `1px solid ${isCurrent ? rank.hex : "#1E1E24"}`,
        boxShadow: isCurrent ? `0 0 18px ${rank.hex}66, inset 0 0 0 1px ${rank.hex}33` : undefined,
        opacity: isLocked ? 0.35 : 1,
        filter: isLocked ? "grayscale(100%)" : undefined,
      }}
    >
      {isCurrent && (
        <span
          className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded font-display font-bold uppercase tracking-wider"
          style={{
            fontSize: 9,
            background: rank.hex,
            color: "#0D0D0F",
            letterSpacing: "0.08em",
          }}
        >
          {currentLabel}
        </span>
      )}
      <div style={{ width: 40, height: 40 }} className="flex items-center justify-center">
        <RankBadge rank={rank.name} size="md" />
      </div>
      <span
        className="font-display font-bold uppercase tracking-wider mt-1 leading-none text-center"
        style={{ fontSize: 11, color: isLocked ? "#6B7280" : rank.hex }}
      >
        {label}
      </span>
      <span
        className="font-mono leading-none text-center"
        style={{ fontSize: 10, color: "#6B7280" }}
      >
        {rank.maxElo > 9000 ? `${rank.minElo}+` : `${rank.minElo}-${rank.maxElo}`}
      </span>
      {isPassed && (
        <span
          className="absolute bottom-1.5 right-1.5 inline-flex items-center justify-center rounded-full"
          style={{ width: 14, height: 14, background: "#10B981" }}
          aria-label="Superato"
        >
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </span>
      )}
    </div>
  );
}
