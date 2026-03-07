import { getEloProgress, getRankByElo } from "@/lib/ranks";
import { Progress } from "@/components/ui/progress";

interface EloProgressBarProps {
  elo: number;
  className?: string;
}

export default function EloProgressBar({ elo, className = "" }: EloProgressBarProps) {
  const rank = getRankByElo(elo);
  const progress = getEloProgress(elo);

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-display font-semibold" style={{ color: rank.hex }}>
          {rank.name}
        </span>
        {progress.nextRank && (
          <span className="text-xs text-muted-foreground font-body">
            {elo} / {progress.nextThreshold} to reach {progress.nextRank.name}
          </span>
        )}
        {!progress.nextRank && (
          <span className="text-xs text-muted-foreground font-body">Max Rank</span>
        )}
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress.percent}%`,
            background: rank.name === "Apex"
              ? "linear-gradient(90deg, #ff4655, #ffd700)"
              : rank.hex,
          }}
        />
      </div>
    </div>
  );
}
