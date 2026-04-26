import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RANKS, getRankByElo, getEloProgress, type RankInfo } from "@/lib/ranks";
import RankBadge from "@/components/RankBadge";
import { useI18n } from "@/i18n";
import { Trophy } from "lucide-react";

export interface RankProgressionModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  elo: number;
  /** Optional username — when present and not own profile, title becomes "Progressione di X" */
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

  const title = isOwn ? "La tua progressione" : `Progressione di ${username ?? "—"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl animate-scale-in">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
        </DialogHeader>

        {/* Current rank — large central display */}
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <RankBadge elo={elo} size="lg" />
          <div className="font-display font-bold text-2xl" style={{ color: current.hex }}>
            {tRank(current.name)}
          </div>
          <div className="font-display font-bold text-3xl">
            {elo.toLocaleString("it-IT")}{" "}
            <span className="text-base text-muted-foreground tracking-widest">ELO</span>
          </div>
        </div>

        {/* Horizontal rank progression */}
        <div className="relative mt-2 -mx-2 overflow-x-auto">
          <div className="flex items-start justify-between gap-2 px-2 min-w-[640px] relative">
            {/* connector line */}
            <div className="absolute left-2 right-2 top-[26px] h-[2px] bg-border" />
            {RANKS.map((r) => (
              <RankNode
                key={r.name}
                rank={r}
                state={
                  r.tier < current.tier
                    ? "passed"
                    : r.tier === current.tier
                    ? "current"
                    : "locked"
                }
                label={tRank(r.name)}
              />
            ))}
          </div>
        </div>

        {/* Distance to next rank */}
        <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-4">
          {isApex ? (
            <div className="text-center font-display font-bold text-base">
              Hai raggiunto il rango massimo{" "}
              <Trophy className="inline h-4 w-4 text-yellow-400 -mt-1" /> 🏆
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm font-body mb-2">
                <span>
                  Sei a{" "}
                  <span className="font-display font-bold text-foreground">
                    {Math.max(0, progress.nextThreshold - elo)} ELO
                  </span>{" "}
                  da{" "}
                  <span
                    className="font-display font-bold"
                    style={{ color: progress.nextRank?.hex }}
                  >
                    {progress.nextRank ? tRank(progress.nextRank.name) : "—"}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {progress.percent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress.percent}%`,
                    background: current.gradient ?? current.hex,
                  }}
                />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground font-mono text-right">
                {elo} / {progress.nextThreshold}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RankNode({
  rank,
  state,
  label,
}: {
  rank: RankInfo;
  state: "passed" | "current" | "locked";
  label: string;
}) {
  const isCurrent = state === "current";
  const isLocked = state === "locked";
  return (
    <div
      className={`relative flex flex-col items-center gap-1 transition-all ${
        isLocked ? "opacity-40" : "opacity-100"
      } ${isCurrent ? "scale-110" : ""}`}
      style={{ flex: "0 0 auto", width: 70 }}
    >
      <div
        className={`relative z-10 rounded-lg ${
          isCurrent ? "ring-2 ring-offset-2 ring-offset-background" : ""
        }`}
        style={
          isCurrent
            ? {
                boxShadow: `0 0 18px ${rank.hex}99`,
                ["--tw-ring-color" as any]: rank.hex,
              }
            : undefined
        }
      >
        <RankBadge rank={rank.name} size="sm" />
      </div>
      <span
        className="font-display font-bold text-[11px] mt-1 text-center leading-tight"
        style={{ color: isLocked ? undefined : rank.hex }}
      >
        {label}
      </span>
      <span className="font-mono text-[9px] text-muted-foreground leading-tight text-center">
        {rank.maxElo > 9000 ? `${rank.minElo}+` : `${rank.minElo}-${rank.maxElo}`}
      </span>
    </div>
  );
}
