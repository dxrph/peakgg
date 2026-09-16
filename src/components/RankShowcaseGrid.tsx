import RankBadge from "@/components/RankBadge";
import { RANKS } from "@/lib/ranks";
import { useI18n } from "@/i18n";

/**
 * RankShowcaseGrid — preview grid showing all 7 PeakGG ranks on a dark
 * background. Designed for marketing pages, the ELO explainer, and admin
 * design QA. Pure presentation: no data fetching, no side effects.
 */
export interface RankShowcaseGridProps {
  /** Badge size for each tile. Defaults to "lg" (88px). */
  size?: "md" | "lg" | "xl";
  /** Show the ELO range under each badge. */
  showRange?: boolean;
  className?: string;
}

export default function RankShowcaseGrid({
  size = "lg",
  showRange = true,
  className = "",
}: RankShowcaseGridProps) {
  const { tRank } = useI18n();
  return (
    <div
      className={`rounded-2xl border border-border/60 bg-gradient-to-b from-[#0a0a0c] to-[#050505] p-6 sm:p-8 ${className}`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6">
        {RANKS.map((r) => (
          <div
            key={r.name}
            className="group flex flex-col items-center text-center gap-3 rounded-xl border border-border/40 bg-background/40 px-2 py-4 transition-colors hover:border-primary/40"
          >
            <RankBadge rank={r.name} size={size} />
            <div className="flex flex-col leading-tight">
              <span
                className="font-display font-bold tracking-wider text-sm"
                style={{ color: r.hex }}
              >
                {tRank(r.name)}
              </span>
              {showRange && (
                <span className="font-mono text-[10px] text-muted-foreground mt-0.5">
                  {r.name === "Apex"
                    ? `${r.minElo.toLocaleString()}+ ELO`
                    : `${r.minElo.toLocaleString()}–${r.maxElo.toLocaleString()}`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
