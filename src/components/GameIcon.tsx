import { GameId, getGameById } from "@/lib/ranks";

interface GameIconProps {
  game: GameId;
  size?: number; // px
  className?: string;
  withShadow?: boolean;
}

/**
 * Renders the official logo of a supported game.
 * NEVER replace these with custom inline SVGs.
 */
export default function GameIcon({ game, size = 24, className = "", withShadow = true }: GameIconProps) {
  const info = getGameById(game);
  return (
    <img
      src={info.iconUrl}
      alt={`${info.name} logo`}
      width={size}
      height={size}
      loading="lazy"
      className={`inline-block object-contain ${className}`}
      style={{
        width: size,
        height: size,
        filter: withShadow ? "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" : undefined,
      }}
    />
  );
}