import { getRankByElo, getRankByName, type RankInfo, type RankTier } from "@/lib/ranks";
import { useI18n } from "@/i18n";
import rookiePng from "@/assets/ranks/rookie.png";
import bronzePng from "@/assets/ranks/bronze.png";
import silverPng from "@/assets/ranks/silver.png";
import goldPng from "@/assets/ranks/gold.png";
import platinumPng from "@/assets/ranks/platinum.png";
import diamondPng from "@/assets/ranks/diamond.png";
import masterPng from "@/assets/ranks/master.png";
import apexPng from "@/assets/ranks/apex.png";

const RANK_IMAGES: Record<RankTier, string> = {
  Rookie: rookiePng,
  Bronze: bronzePng,
  Silver: silverPng,
  Gold: goldPng,
  Platinum: platinumPng,
  Diamond: diamondPng,
  Master: masterPng,
  Apex: apexPng,
};

/**
 * RankBadge — visual icon + (optional) label for a player or team rank.
 *
 * Two ways to drive it:
 *   <RankBadge elo={1750} />              ← derives rank from ELO (preferred)
 *   <RankBadge rank="Diamond" />          ← uses an explicit rank name
 *
 * Sizes:  sm = 20px · md = 32px · lg = 64px
 */
export interface RankBadgeProps {
  /** Live ELO — when provided, rank is always derived from this value. */
  elo?: number;
  /** Explicit rank name (used only when `elo` is not provided). */
  rank?: string;
  size?: "sm" | "md" | "lg";
  /** Show rank name next to the icon. */
  showLabel?: boolean;
  /** Legacy: append numeric ELO under the label. */
  showElo?: boolean;
  className?: string;
}

const SIZE_PX: Record<NonNullable<RankBadgeProps["size"]>, number> = {
  sm: 20,
  md: 32,
  lg: 64,
};

export default function RankBadge({
  elo,
  rank,
  size = "md",
  showLabel = false,
  showElo = false,
  className = "",
}: RankBadgeProps) {
  const info: RankInfo =
    typeof elo === "number" ? getRankByElo(elo) : getRankByName(rank ?? "Rookie");
  const px = SIZE_PX[size];
  const labelSize = size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm";
  const { tRank } = useI18n();
  const localizedName = tRank(info.name);

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      title={`${localizedName}${typeof elo === "number" ? ` · ${elo} ELO` : ""}`}
    >
      <span
        className="rank-badge-icon relative inline-flex items-center justify-center rounded-lg transition-all duration-200"
        style={{
          width: px,
          height: px,
          background: "rgba(15, 23, 42, 0.55)",
          border: `1px solid ${info.hex}55`,
          padding: Math.max(2, Math.floor(px * 0.12)),
          ["--rank-glow" as any]: info.hex,
        }}
      >
        <RankIcon rank={info} px={px - Math.max(4, Math.floor(px * 0.24))} />
      </span>
      {(showLabel || showElo) && (
        <span className={`flex flex-col leading-tight font-display font-bold ${labelSize}`}>
          <span style={{ color: info.hex }}>{localizedName}</span>
          {showElo && typeof elo === "number" && (
            <span className="font-mono opacity-70 text-muted-foreground">{elo}</span>
          )}
        </span>
      )}
    </span>
  );
}

export { RankBadge };

/* ------------------------------------------------------------------ */
/* Inline SVG icons — one per tier. No external assets.               */
/* ------------------------------------------------------------------ */

function RankIcon({ rank, px }: { rank: RankInfo; px: number }) {
  const src = RANK_IMAGES[rank.name];
  return (
    <img
      src={src}
      alt={`${rank.name} rank`}
      width={px}
      height={px}
      className="object-contain select-none pointer-events-none"
      style={{ width: px, height: px, filter: `drop-shadow(0 0 6px ${rank.hex}66)` }}
      draggable={false}
      loading="lazy"
    />
  );
}

interface IconProps {
  size: number;
  info: RankInfo;
}

const RookieIcon = ({ size, info }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 2 L21 5 V12 C21 17 17 21 12 22 C7 21 3 17 3 12 V5 Z"
      fill={`${info.hex}33`}
      stroke={info.hex}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const BronzeIcon = ({ size, info }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 2 L21 5 V12 C21 17 17 21 12 22 C7 21 3 17 3 12 V5 Z"
      fill={`${info.hex}55`}
      stroke={info.hex}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M12 5 L18 7 V12 C18 15.5 15.3 18.5 12 19.2 C8.7 18.5 6 15.5 6 12 V7 Z"
      fill="none"
      stroke={info.hex}
      strokeWidth="1"
      strokeLinejoin="round"
      opacity="0.8"
    />
  </svg>
);

const SilverIcon = ({ size, info }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <defs>
      <linearGradient id="silver-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E5E7EB" />
        <stop offset="100%" stopColor={info.hex} />
      </linearGradient>
    </defs>
    <path
      d="M12 2 L21 5 V12 C21 17 17 21 12 22 C7 21 3 17 3 12 V5 Z"
      fill="url(#silver-grad)"
      fillOpacity="0.45"
      stroke={info.hex}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M12 7.5 L13.4 10.7 L16.8 11 L14.2 13.2 L15 16.5 L12 14.8 L9 16.5 L9.8 13.2 L7.2 11 L10.6 10.7 Z"
      fill="#F8FAFC"
      stroke={info.hex}
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
  </svg>
);

const GoldIcon = ({ size, info }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <defs>
      <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor={info.hex} />
      </linearGradient>
    </defs>
    <path
      d="M12 4 L20.5 6.5 V12 C20.5 16.6 17 20.4 12 21.5 C7 20.4 3.5 16.6 3.5 12 V6.5 Z"
      fill="url(#gold-grad)"
      fillOpacity="0.55"
      stroke={info.hex}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M7 10 L9 13 L12 9 L15 13 L17 10 V14 H7 Z"
      fill={info.hex}
      stroke="#92400E"
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
    <circle cx="7" cy="10" r="1" fill="#FCD34D" />
    <circle cx="12" cy="9" r="1" fill="#FCD34D" />
    <circle cx="17" cy="10" r="1" fill="#FCD34D" />
  </svg>
);

const PlatinumIcon = ({ size, info }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <defs>
      <linearGradient id="plat-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#67E8F9" />
        <stop offset="100%" stopColor={info.hex} />
      </linearGradient>
    </defs>
    <path d="M12 2 L20 9 L12 22 L4 9 Z" fill="url(#plat-grad)" stroke={info.hex} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M12 2 L12 22" stroke="#ECFEFF" strokeWidth="0.8" opacity="0.7" />
    <path d="M4 9 L20 9" stroke="#ECFEFF" strokeWidth="0.8" opacity="0.7" />
    <path d="M8 5 L12 9 L16 5" stroke="#ECFEFF" strokeWidth="0.6" opacity="0.6" fill="none" />
  </svg>
);

const DiamondIcon = ({ size, info }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <defs>
      <linearGradient id="diam-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#93C5FD" />
        <stop offset="100%" stopColor={info.hex} />
      </linearGradient>
    </defs>
    <path d="M6 4 H18 L22 9 L12 22 L2 9 Z" fill="url(#diam-grad)" stroke={info.hex} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M2 9 H22" stroke="#DBEAFE" strokeWidth="0.8" opacity="0.85" />
    <path d="M6 4 L12 22 L18 4" stroke="#DBEAFE" strokeWidth="0.6" opacity="0.7" fill="none" />
    <path d="M9 4 L12 9 L15 4" stroke="#DBEAFE" strokeWidth="0.5" opacity="0.6" fill="none" />
  </svg>
);

const MasterIcon = ({ size, info }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <defs>
      <linearGradient id="master-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#C4B5FD" />
        <stop offset="100%" stopColor={info.hex} />
      </linearGradient>
    </defs>
    <path
      d="M3 9 L6 14 L9 6 L12 13 L15 6 L18 14 L21 9 L20 19 H4 Z"
      fill="url(#master-grad)"
      stroke={info.hex}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <rect x="4" y="18" width="16" height="2" rx="0.5" fill={info.hex} />
    <circle cx="6" cy="14" r="1.1" fill="#F5F3FF" />
    <circle cx="12" cy="13" r="1.3" fill="#FCD34D" />
    <circle cx="18" cy="14" r="1.1" fill="#F5F3FF" />
  </svg>
);

const ApexIcon = ({ size }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <defs>
      <linearGradient id="apex-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
      <linearGradient id="apex-flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="60%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
    </defs>
    <path
      d="M12 2 C13 5 16 6 16 10 C16 12 14.5 13 12 13 C9.5 13 8 12 8 10 C8 7 10 6 12 2 Z"
      fill="url(#apex-flame)"
      stroke="#EF4444"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    <path
      d="M3 13 L6 18 L9 12 L12 17 L15 12 L18 18 L21 13 L20 22 H4 Z"
      fill="url(#apex-grad)"
      stroke="#EF4444"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <rect x="4" y="20.5" width="16" height="1.5" rx="0.5" fill="#EF4444" />
    <circle cx="12" cy="17" r="1.2" fill="#FCD34D" />
  </svg>
);

const ICONS: Record<RankTier, (p: IconProps) => JSX.Element> = {
  Rookie: RookieIcon,
  Bronze: BronzeIcon,
  Silver: SilverIcon,
  Gold: GoldIcon,
  Platinum: PlatinumIcon,
  Diamond: DiamondIcon,
  Master: MasterIcon,
  Apex: ApexIcon,
};