import { getRankByElo, type RankInfo } from "@/lib/ranks";
import { Badge } from "@/components/ui/badge";

interface RankBadgeProps {
  elo: number;
  size?: "sm" | "md" | "lg";
  showElo?: boolean;
}

const sizeClasses = {
  sm: "text-[10px] px-1.5 py-0",
  md: "text-xs px-2 py-0.5",
  lg: "text-sm px-3 py-1",
};

export default function RankBadge({ elo, size = "md", showElo = false }: RankBadgeProps) {
  const rank = getRankByElo(elo);
  const isApex = rank.name === "Apex";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-display font-bold border ${sizeClasses[size]}`}
      style={{
        color: rank.hex,
        borderColor: `${rank.hex}40`,
        background: isApex
          ? "linear-gradient(135deg, #ff465520, #ffd70020)"
          : `${rank.hex}15`,
      }}
    >
      <RankIcon rank={rank} size={size} />
      {rank.name}
      {showElo && <span className="font-mono opacity-70">{elo}</span>}
    </span>
  );
}

function RankIcon({ rank, size }: { rank: RankInfo; size: string }) {
  const s = size === "sm" ? 10 : size === "md" ? 12 : 16;
  // Geometric sharp icons for each tier
  const shapes: Record<string, JSX.Element> = {
    Rookie: <polygon points="6,1 11,11 1,11" />,
    Contender: <polygon points="6,0 12,6 6,12 0,6" />,
    Rival: <polygon points="6,0 12,4 10,12 2,12 0,4" />,
    Expert: <polygon points="6,0 12,4 12,10 6,12 0,10 0,4" />,
    Elite: <polygon points="6,0 8,4 12,4 9,7 10,12 6,9 2,12 3,7 0,4 4,4" />,
    Master: <><polygon points="6,0 8,4 12,4 9,7 10,12 6,9 2,12 3,7 0,4 4,4" /><circle cx="6" cy="6" r="2" /></>,
    Apex: <><polygon points="6,0 8,4 12,4 9,7 10,12 6,9 2,12 3,7 0,4 4,4" /><polygon points="6,2 8,5 6,4 4,5" /></>,
  };

  return (
    <svg width={s} height={s} viewBox="0 0 12 12" fill={rank.hex} opacity={0.9}>
      {shapes[rank.name]}
    </svg>
  );
}

export { RankBadge };
