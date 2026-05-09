import { getRankByElo, getRankByName, type RankInfo, type RankTier } from "@/lib/ranks";
import { useI18n } from "@/i18n";
import rookieEmblem from "@/assets/ranks/rookie.png";
import { useRankDefinitions, getCachedEmblemUrl } from "@/hooks/useRankDefinitions";
import { useState } from "react";

/** Map of ranks that use a custom uploaded PNG asset instead of the procedural SVG emblem. */
const CUSTOM_EMBLEMS: Partial<Record<RankTier, string>> = {
  Rookie: rookieEmblem,
};

/**
 * RankBadge — premium SVG rank emblem for PeakGG.
 *
 * All 10 emblems are inline SVG (no raster PNGs) → infinitely scalable,
 * truly transparent, and impossible to perceive as "pasted square images".
 *
 * Drive it by:
 *   <RankBadge elo={1750} />              ← derives rank from ELO (preferred)
 *   <RankBadge rank="Diamond" />          ← explicit rank name
 *
 * Sizes:  xs 20 · sm 28 · md 44 · lg 80 · xl 104
 */
export interface RankBadgeProps {
  elo?: number;
  rank?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  showElo?: boolean;
  className?: string;
  /** Force the procedural SVG emblem even for ranks that have a custom uploaded asset.
   *  Useful where we need a perfectly consistent set (e.g. the rank progression showcase). */
  forceProcedural?: boolean;
}

const SIZE_PX: Record<NonNullable<RankBadgeProps["size"]>, number> = {
  xs: 20,
  sm: 28,
  md: 44,
  lg: 88,
  xl: 120,
};

export default function RankBadge({
  elo,
  rank,
  size = "md",
  showLabel = false,
  showElo = false,
  className = "",
  forceProcedural = false,
}: RankBadgeProps) {
  const info: RankInfo =
    typeof elo === "number" ? getRankByElo(elo) : getRankByName(rank ?? "Rookie");
  const px = SIZE_PX[size];
  const labelSize =
    size === "xs" || size === "sm"
      ? "text-[10px]"
      : size === "md"
      ? "text-xs"
      : "text-sm";
  const { tRank } = useI18n();
  const localizedName = tRank(info.name);
  const isApex = info.name === "Apex";
  // Subscribe so we re-render when defs load (cheap — single shared cache).
  useRankDefinitions();
  const dbEmblem = forceProcedural ? null : getCachedEmblemUrl(info.name);
  const localFallback = forceProcedural ? undefined : CUSTOM_EMBLEMS[info.name];
  const [imgFailed, setImgFailed] = useState(false);
  const customSrc = !forceProcedural && !imgFailed ? (dbEmblem ?? localFallback) : undefined;

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      title={`${localizedName}${typeof elo === "number" ? ` · ${elo} ELO` : ""}`}
    >
      {customSrc ? (
        // Custom official emblem — no frame, no glow, no background.
        // Square container, object-contain, fully transparent, with breathing space.
        <span
          className="relative inline-flex items-center justify-center transition-transform duration-200 hover:scale-[1.05]"
          style={{ width: px, height: px, padding: Math.max(2, Math.round(px * 0.06)) }}
        >
          <img
            src={customSrc}
            alt={`${localizedName} rank emblem`}
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
            onError={() => setImgFailed(true)}
          />
        </span>
      ) : (
        <span
          className="rank-badge-emblem relative inline-flex items-center justify-center transition-transform duration-200 hover:scale-[1.05]"
          style={{
            width: px,
            height: px,
            filter: `drop-shadow(0 0 ${Math.round(px * 0.22)}px ${info.hex}${
              isApex ? "dd" : "66"
            }) drop-shadow(0 ${Math.max(2, Math.round(px * 0.04))}px ${Math.max(4, Math.round(px * 0.06))}px rgba(0,0,0,0.7))`,
          }}
        >
          <RankEmblem rank={info} size={px} />
        </span>
      )}
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
/* Reusable size variants (semantic)                                   */
/* ------------------------------------------------------------------ */

export const RankBadgeLarge = (p: Omit<RankBadgeProps, "size">) => (
  <RankBadge {...p} size="lg" />
);
export const RankBadgeMedium = (p: Omit<RankBadgeProps, "size">) => (
  <RankBadge {...p} size="md" />
);
export const RankBadgeCompact = (p: Omit<RankBadgeProps, "size">) => (
  <RankBadge {...p} size="sm" />
);

/* ================================================================== */
/* SVG EMBLEM SYSTEM                                                  */
/*                                                                     */
/* All emblems share a hexagonal shield silhouette — same DNA, with    */
/* progressively richer interior detail as the rank rises.             */
/* Rendered as inline SVG → transparent, scalable, no pasted-image    */
/* feel. Each tier introduces a distinctive central glyph.             */
/* ================================================================== */

/**
 * Premium "aegis shield" silhouette — sharper hex-shield hybrid with
 * chamfered shoulders and a pointed crest. Aggressive esports feel,
 * instantly readable as a competitive rank emblem (not a hex, not a pill).
 */
// Outer silhouette — chamfered top corners, gentle waist, pointed bottom crest
const SHIELD_OUTER =
  "M50 2 L72 6 L92 14 L92 40 C92 60 84 76 70 88 L50 99 L30 88 C16 76 8 60 8 40 L8 14 L28 6 Z";
// Metal shoulder ring (between outer rim and inner plate)
const SHIELD_RIM =
  "M50 8 L70 12 L87 18 L87 40 C87 58 80 72 67 83 L50 93 L33 83 C20 72 13 58 13 40 L13 18 L30 12 Z";
// Inner mounted plate (dark glass interior)
const SHIELD_INNER =
  "M50 15 L67 18 L82 24 L82 40 C82 55 76 67 64 76 L50 85 L36 76 C24 67 18 55 18 40 L18 24 L33 18 Z";

function darken(hex: string, amt = 0.4): string {
  const h = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * (1 - amt)));
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * (1 - amt)));
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * (1 - amt)));
  return `rgb(${r},${g},${b})`;
}
function lighten(hex: string, amt = 0.3): string {
  const h = hex.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) + (255 - parseInt(h.slice(0, 2), 16)) * amt));
  const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) + (255 - parseInt(h.slice(2, 4), 16)) * amt));
  const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) + (255 - parseInt(h.slice(4, 6), 16)) * amt));
  return `rgb(${r},${g},${b})`;
}

interface EmblemProps {
  rank: RankInfo;
  size: number;
}

function RankEmblem({ rank, size }: EmblemProps) {
  const Glyph = GLYPHS[rank.name];
  const id = `rk-${rank.name.toLowerCase()}`;
  const c = rank.hex;
  const dark = darken(c, 0.55);
  const deep = darken(c, 0.82);
  const light = lighten(c, 0.45);
  const bright = lighten(c, 0.72);
  const isApex = rank.name === "Apex";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${rank.name} rank emblem`}
      className="block"
    >
      <defs>
        {/* Outer metallic rim — multi-stop for richer chrome feel */}
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bright} />
          <stop offset="18%" stopColor={light} />
          <stop offset="55%" stopColor={c} />
          <stop offset="85%" stopColor={dark} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
        {/* Inner bevel groove — a dark recessed ring between rim and plate */}
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.95" />
          <stop offset="50%" stopColor={dark} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#000" stopOpacity="1" />
        </linearGradient>
        {/* Interior dark glass with rank-tinted glow at top */}
        <radialGradient id={`${id}-glass`} cx="50%" cy="28%" r="82%">
          <stop offset="0%" stopColor={c} stopOpacity="0.55" />
          <stop offset="38%" stopColor={dark} stopOpacity="0.55" />
          <stop offset="70%" stopColor="#0a0a0e" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#000" stopOpacity="1" />
        </radialGradient>
        {/* Top shine sweep — sharper highlight band */}
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Subtle hex texture pattern, clipped to inner plate */}
        <pattern id={`${id}-tex`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
          <path d="M3 0 L6 1.5 L6 4.5 L3 6 L0 4.5 L0 1.5 Z" fill="none" stroke={light} strokeWidth="0.25" strokeOpacity="0.18" />
        </pattern>
        {/* Clip mask so shine + texture respect inner plate silhouette */}
        <clipPath id={`${id}-clip`}>
          <path d={SHIELD_INNER} />
        </clipPath>
      </defs>

      {/* 1. Outer chrome rim */}
      <path d={SHIELD_OUTER} fill={`url(#${id}-rim)`} />
      {/* 2. Bright top edge highlight */}
      <path
        d={SHIELD_OUTER}
        fill="none"
        stroke={bright}
        strokeOpacity="0.85"
        strokeWidth="0.6"
      />
      {/* 3. Recessed bevel groove */}
      <path d={SHIELD_RIM} fill={`url(#${id}-bevel)`} />
      {/* 4. Dark glass mounted plate */}
      <path d={SHIELD_INNER} fill={`url(#${id}-glass)`} />
      {/* 5. Hex texture inside the plate (very subtle) */}
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="0" y="0" width="100" height="100" fill={`url(#${id}-tex)`} />
      </g>
      {/* 6. Inner accent ring */}
      <path
        d={SHIELD_INNER}
        fill="none"
        stroke={light}
        strokeOpacity="0.7"
        strokeWidth="0.8"
      />
      {/* 7. Glyph — clipped to plate */}
      <g clipPath={`url(#${id}-clip)`}>{Glyph({ color: c, light, dark })}</g>
      {/* 8. Top shine sweep over everything */}
      <path d={SHIELD_INNER} fill={`url(#${id}-shine)`} />
      {/* 9. Tier color pip on crest (skipped on Apex which has corona) */}
      {!isApex && (
        <circle cx="50" cy="11" r="1.6" fill={bright} opacity="0.95" />
      )}
      {/* Apex extra: gold corona + crown spikes */}
      {isApex && (
        <>
          <path
            d={SHIELD_OUTER}
            fill="none"
            stroke="#FCD34D"
            strokeOpacity="0.7"
            strokeWidth="1.4"
          />
          <path
            d="M42 6 L46 1 L50 5 L54 1 L58 6"
            fill="none"
            stroke="#FCD34D"
            strokeOpacity="0.9"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

/* -------- Per-rank glyphs (centered in 100x100 viewBox) ---------- */

interface GlyphCtx {
  color: string;
  light: string;
  dark: string;
}
type GlyphFn = (ctx: GlyphCtx) => JSX.Element;

// 1. ROOKIE — single small chevron
const RookieGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path d="M35 58 L50 44 L65 58" stroke={light} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="68" r="2.2" fill={color} />
  </g>
);

// 2. IRON — heavy bar with rivets
const IronGlyph: GlyphFn = ({ color, light, dark }) => (
  <g>
    <rect x="30" y="44" width="40" height="14" rx="1.5" fill={color} stroke={dark} strokeWidth="1.2" />
    <rect x="30" y="44" width="40" height="4" fill={light} opacity="0.4" />
    <circle cx="36" cy="51" r="1.8" fill={dark} />
    <circle cx="64" cy="51" r="1.8" fill={dark} />
    <path d="M28 62 L72 62" stroke={light} strokeWidth="1.2" opacity="0.5" />
  </g>
);

// 3. BRONZE — two stacked chevrons
const BronzeGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path d="M30 56 L50 40 L70 56" stroke={light} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M34 66 L50 52 L66 66" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
  </g>
);

// 4. SILVER — three chevrons
const SilverGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path d="M30 50 L50 36 L70 50" stroke={light} strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 60 L50 46 L68 60" stroke={light} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    <path d="M34 70 L50 56 L66 70" stroke={color} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
  </g>
);

// 5. GOLD — laurel star / sunburst
const GoldGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path
      d="M50 28 L55 44 L72 44 L58 54 L63 70 L50 60 L37 70 L42 54 L28 44 L45 44 Z"
      fill={color}
      stroke={light}
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M50 36 L52.5 46 L62 46 L54.5 52 L57 62 L50 56 L43 62 L45.5 52 L38 46 L47.5 46 Z"
      fill={light}
      opacity="0.55"
    />
  </g>
);

// 6. PLATINUM — angular tech crystal
const PlatinumGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path d="M50 28 L70 50 L50 72 L30 50 Z" fill={color} stroke={light} strokeWidth="1.4" />
    <path d="M50 28 L50 72" stroke={light} strokeWidth="1" opacity="0.7" />
    <path d="M30 50 L70 50" stroke={light} strokeWidth="1" opacity="0.7" />
    <path d="M40 40 L60 60" stroke={light} strokeWidth="0.6" opacity="0.45" />
    <path d="M60 40 L40 60" stroke={light} strokeWidth="0.6" opacity="0.45" />
    <circle cx="50" cy="50" r="3" fill={light} />
  </g>
);

// 7. DIAMOND — gem facets
const DiamondGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path d="M34 38 L66 38 L74 50 L50 76 L26 50 Z" fill={color} stroke={light} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M26 50 L74 50" stroke={light} strokeWidth="1" opacity="0.85" />
    <path d="M34 38 L42 50 L50 76" stroke={light} strokeWidth="0.8" fill="none" opacity="0.7" />
    <path d="M66 38 L58 50 L50 76" stroke={light} strokeWidth="0.8" fill="none" opacity="0.7" />
    <path d="M42 50 L58 50" stroke={light} strokeWidth="0.6" opacity="0.5" />
  </g>
);

// 8. ELITE — winged shield
const EliteGlyph: GlyphFn = ({ color, light }) => (
  <g>
    {/* wings */}
    <path d="M22 46 L34 44 L30 52 L20 50 Z" fill={color} opacity="0.85" />
    <path d="M78 46 L66 44 L70 52 L80 50 Z" fill={color} opacity="0.85" />
    {/* shield */}
    <path
      d="M50 32 L66 40 L66 56 C66 66 58 72 50 76 C42 72 34 66 34 56 L34 40 Z"
      fill={color}
      stroke={light}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M50 40 L50 70" stroke={light} strokeWidth="1" opacity="0.7" />
    <path d="M40 52 L60 52" stroke={light} strokeWidth="1" opacity="0.7" />
  </g>
);

// 9. MASTER — royal crown
const MasterGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path
      d="M28 60 L34 38 L44 52 L50 32 L56 52 L66 38 L72 60 Z"
      fill={color}
      stroke={light}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <rect x="28" y="62" width="44" height="6" rx="1" fill={color} stroke={light} strokeWidth="1.2" />
    <circle cx="50" cy="32" r="3" fill={light} />
    <circle cx="34" cy="38" r="2.2" fill={light} opacity="0.85" />
    <circle cx="66" cy="38" r="2.2" fill={light} opacity="0.85" />
  </g>
);

// 10. APEX — flame triangle peak
const ApexGlyph: GlyphFn = ({ color, light }) => (
  <g>
    {/* outer triangle */}
    <path
      d="M50 22 L78 76 L22 76 Z"
      fill={color}
      stroke={light}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* inner inverted notch */}
    <path
      d="M50 50 L66 76 L34 76 Z"
      fill="#0a0a0c"
      stroke={light}
      strokeWidth="1"
      strokeLinejoin="round"
    />
    {/* flame highlight */}
    <path
      d="M50 30 L60 56 L50 50 L40 56 Z"
      fill={light}
      opacity="0.85"
    />
    <circle cx="50" cy="42" r="2.2" fill="#fff" />
  </g>
);

const GLYPHS: Record<RankTier, GlyphFn> = {
  Rookie: RookieGlyph,
  Iron: IronGlyph,
  Bronze: BronzeGlyph,
  Silver: SilverGlyph,
  Gold: GoldGlyph,
  Platinum: PlatinumGlyph,
  Diamond: DiamondGlyph,
  Elite: EliteGlyph,
  Master: MasterGlyph,
  Apex: ApexGlyph,
};
