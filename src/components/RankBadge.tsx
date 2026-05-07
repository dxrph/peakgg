import { getRankByElo, getRankByName, type RankInfo, type RankTier } from "@/lib/ranks";
import { useI18n } from "@/i18n";
import rookieEmblem from "@/assets/ranks/rookie.png";

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
  lg: 80,
  xl: 104,
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
  const customSrc = forceProcedural ? undefined : CUSTOM_EMBLEMS[info.name];

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
          />
        </span>
      ) : (
        <span
          className="rank-badge-emblem relative inline-flex items-center justify-center transition-transform duration-200 hover:scale-[1.05]"
          style={{
            width: px,
            height: px,
            filter: `drop-shadow(0 0 ${Math.round(px * 0.18)}px ${info.hex}${
              isApex ? "cc" : "77"
            }) drop-shadow(0 2px 4px rgba(0,0,0,0.55))`,
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
 * Premium "aegis shield" silhouette — a hex-shield hybrid with
 * subtly arched flanks and a pointed crest, instantly readable as
 * a competitive rank emblem (not a hexagon, not a generic pill).
 */
const SHIELD_OUTER =
  "M50 3 C66 3 84 8 92 14 C92 36 92 56 86 70 C78 86 64 94 50 99 C36 94 22 86 14 70 C8 56 8 36 8 14 C16 8 34 3 50 3 Z";
const SHIELD_RIM =
  "M50 9 C64 9 80 13 87 18 C87 38 87 56 82 68 C75 82 63 89 50 94 C37 89 25 82 18 68 C13 56 13 38 13 18 C20 13 36 9 50 9 Z";
const SHIELD_INNER =
  "M50 16 C62 16 76 19 82 24 C82 40 82 56 78 66 C72 78 62 85 50 89 C38 85 28 78 22 66 C18 56 18 40 18 24 C24 19 38 16 50 16 Z";

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
  const deep = darken(c, 0.78);
  const light = lighten(c, 0.45);
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
        {/* Outer metallic rim */}
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="45%" stopColor={c} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
        {/* Inner bevel ring */}
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={dark} />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
        {/* Interior dark glass */}
        <radialGradient id={`${id}-glass`} cx="50%" cy="32%" r="78%">
          <stop offset="0%" stopColor={c} stopOpacity="0.45" />
          <stop offset="55%" stopColor="#0b0b0f" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#000" stopOpacity="1" />
        </radialGradient>
        {/* Top shine sweep */}
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Clip mask so shine respects shield silhouette */}
        <clipPath id={`${id}-clip`}>
          <path d={SHIELD_INNER} />
        </clipPath>
      </defs>

      {/* Outer shield rim */}
      <path d={SHIELD_OUTER} fill={`url(#${id}-rim)`} />
      {/* Bevel band */}
      <path d={SHIELD_RIM} fill={`url(#${id}-bevel)`} />
      {/* Dark glass interior */}
      <path d={SHIELD_INNER} fill={`url(#${id}-glass)`} />
      {/* Inner thin accent stroke */}
      <path
        d={SHIELD_INNER}
        fill="none"
        stroke={light}
        strokeOpacity="0.6"
        strokeWidth="0.7"
      />
      {/* Glyph (clipped to shield silhouette) */}
      <g clipPath={`url(#${id}-clip)`}>{Glyph({ color: c, light, dark })}</g>
      {/* Top shine sweep */}
      <path d={SHIELD_INNER} fill={`url(#${id}-shine)`} />
      {/* Apex extra: subtle gold corona */}
      {isApex && (
        <path
          d={SHIELD_OUTER}
          fill="none"
          stroke="#FCD34D"
          strokeOpacity="0.5"
          strokeWidth="1.2"
        />
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
