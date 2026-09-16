import { useState } from "react";
import { getRankByElo, getRankByName, type RankInfo, type RankTier } from "@/lib/ranks";
import { useI18n } from "@/i18n";
import { useRankDefinitions, getCachedEmblemUrl } from "@/hooks/useRankDefinitions";

/**
 * Official PeakGG rank artwork. These bundled PNGs are the SINGLE source of
 * truth for rank visuals across the platform. If an asset ever fails to load
 * we fall back to the procedural SVG emblem below so the UI never breaks.
 */
/**
 * RankBadge — premium SVG rank emblem for PeakGG.
 *
 * Each of the 7 ranks has a UNIQUE outer silhouette and a UNIQUE central glyph
 * so the progression is instantly readable from a 20px leaderboard row up to
 * a 120px hero placement.
 *
 * Drive it by:
 *   <RankBadge elo={1750} />              ← derive rank from ELO (preferred)
 *   <RankBadge rank="Elite" />            ← explicit rank name (legacy names also work)
 *
 * Sizes:  xs 20 · sm 28 · md 44 · lg 88 · xl 120
 */
export interface RankBadgeProps {
  elo?: number;
  rank?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  showElo?: boolean;
  className?: string;
  /** Force the procedural SVG even when a custom emblem_url is configured. */
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

  // Re-render when rank_definitions load (admin-configured emblem URLs).
  useRankDefinitions();
  const [imgFailed, setImgFailed] = useState(false);
  // Prefer the bundled official artwork; fall back to a DB-configured emblem
  // (legacy) and finally to the procedural SVG if everything fails to load.
  const dbEmblem = forceProcedural ? null : getCachedEmblemUrl(info.name);
  const customSrc = !forceProcedural && !imgFailed ? dbEmblem ?? null : null;

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      title={`${localizedName}${typeof elo === "number" ? ` · ${elo} ELO` : ""}`}
    >
      {customSrc ? (
        <span
          className="relative inline-flex items-center justify-center transition-transform duration-200 hover:scale-[1.05]"
          style={{
            width: px,
            height: px,
            filter: `drop-shadow(0 0 ${Math.round(px * 0.18)}px ${info.hex}${
              isApex ? "cc" : "55"
            }) drop-shadow(0 ${Math.max(1, Math.round(px * 0.03))}px ${Math.max(
              3,
              Math.round(px * 0.05),
            )}px rgba(0,0,0,0.6))`,
          }}
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
              isApex ? "dd" : "55"
            }) drop-shadow(0 ${Math.max(2, Math.round(px * 0.04))}px ${Math.max(
              4,
              Math.round(px * 0.06),
            )}px rgba(0,0,0,0.7))`,
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

export const RankBadgeLarge   = (p: Omit<RankBadgeProps, "size">) => <RankBadge {...p} size="lg" />;
export const RankBadgeMedium  = (p: Omit<RankBadgeProps, "size">) => <RankBadge {...p} size="md" />;
export const RankBadgeCompact = (p: Omit<RankBadgeProps, "size">) => <RankBadge {...p} size="sm" />;

/* ================================================================== */
/* SVG EMBLEM SYSTEM                                                  */
/*                                                                     */
/* Each tier has its OWN outer silhouette (the most readable signal at */
/* leaderboard sizes) and its OWN central glyph. All silhouettes share */
/* a 100×100 viewBox and the same metallic rim → bevel → dark-glass    */
/* plate → glyph → shine stack so they read as one identity system.    */
/* ================================================================== */

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

interface Silhouette {
  outer: string; // outermost chrome rim
  rim: string;   // recessed bevel groove
  inner: string; // dark glass mounted plate
}

/* ----------------------------- silhouettes ----------------------------- */

// 1. ROOKIE — soft rounded shield. Calm, beginner.
const SIL_ROOKIE: Silhouette = {
  outer: "M50 4 C72 4 92 12 92 28 L92 50 C92 74 74 92 50 98 C26 92 8 74 8 50 L8 28 C8 12 28 4 50 4 Z",
  rim:   "M50 10 C70 10 87 17 87 30 L87 50 C87 70 71 86 50 92 C29 86 13 70 13 50 L13 30 C13 17 30 10 50 10 Z",
  inner: "M50 17 C67 17 82 22 82 32 L82 50 C82 66 68 80 50 85 C32 80 18 66 18 50 L18 32 C18 22 33 17 50 17 Z",
};

// 2. CONTENDER — hexagon. Stable, geometric.
const SIL_CONTENDER: Silhouette = {
  outer: "M50 3 L92 25 L92 75 L50 97 L8 75 L8 25 Z",
  rim:   "M50 10 L87 30 L87 70 L50 90 L13 70 L13 30 Z",
  inner: "M50 18 L82 35 L82 65 L50 82 L18 65 L18 35 Z",
};

// 3. RIVAL — angular pentagon battle shield (flat top, point down).
const SIL_RIVAL: Silhouette = {
  outer: "M10 8 L90 8 L90 50 L50 98 L10 50 Z",
  rim:   "M16 14 L84 14 L84 50 L50 90 L16 50 Z",
  inner: "M22 22 L78 22 L78 50 L50 82 L22 50 Z",
};

// 4. EXPERT — kite shield (taller, pointed crest top, pointed crest bottom).
const SIL_EXPERT: Silhouette = {
  outer: "M50 2 L88 26 L82 70 L50 98 L18 70 L12 26 Z",
  rim:   "M50 10 L82 30 L77 66 L50 91 L23 66 L18 30 Z",
  inner: "M50 18 L76 34 L72 62 L50 84 L28 62 L24 34 Z",
};

// 5. ELITE — chamfered octagonal medal. Clean, premium.
const SIL_ELITE: Silhouette = {
  outer: "M30 4 L70 4 L96 30 L96 70 L70 96 L30 96 L4 70 L4 30 Z",
  rim:   "M34 11 L66 11 L89 34 L89 66 L66 89 L34 89 L11 66 L11 34 Z",
  inner: "M38 19 L62 19 L81 38 L81 62 L62 81 L38 81 L19 62 L19 38 Z",
};

// 6. MASTER — aegis with shoulder horns (wide top, pointed bottom).
const SIL_MASTER: Silhouette = {
  outer:
    "M50 3 L72 6 L92 14 L96 28 L88 36 L92 48 C92 70 76 86 50 99 C24 86 8 70 8 48 L12 36 L4 28 L8 14 L28 6 Z",
  rim:
    "M50 10 L70 13 L87 20 L87 30 L82 36 L87 48 C87 66 73 80 50 92 C27 80 13 66 13 48 L18 36 L13 30 L13 20 L30 13 Z",
  inner:
    "M50 18 L67 21 L82 26 L80 36 L82 48 C82 62 70 74 50 85 C30 74 18 62 18 48 L20 36 L18 26 L33 21 Z",
};

// 7. APEX — pointed crest with crown spikes (legendary silhouette).
const SIL_APEX: Silhouette = {
  outer:
    "M50 1 L58 6 L66 1 L72 8 L80 4 L84 14 L92 14 L92 42 C92 64 80 80 64 90 L50 99 L36 90 C20 80 8 64 8 42 L8 14 L16 14 L20 4 L28 8 L34 1 L42 6 Z",
  rim:
    "M50 12 L70 15 L87 20 L87 42 C87 62 76 76 64 84 L50 92 L36 84 C24 76 13 62 13 42 L13 20 L30 15 Z",
  inner:
    "M50 19 L67 22 L82 27 L82 42 C82 58 73 70 62 76 L50 84 L38 76 C27 70 18 58 18 42 L18 27 L33 22 Z",
};

const SILHOUETTES: Record<RankTier, Silhouette> = {
  Rookie:    SIL_ROOKIE,
  Contender: SIL_CONTENDER,
  Rival:     SIL_RIVAL,
  Expert:    SIL_EXPERT,
  Elite:     SIL_ELITE,
  Master:    SIL_MASTER,
  Apex:      SIL_APEX,
};

/* ------------------------------ emblem -------------------------------- */

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
  const sil = SILHOUETTES[rank.name];
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
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={bright} />
          <stop offset="18%"  stopColor={light} />
          <stop offset="55%"  stopColor={c} />
          <stop offset="85%"  stopColor={dark} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.95" />
          <stop offset="50%"  stopColor={dark} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#000" stopOpacity="1" />
        </linearGradient>
        <radialGradient id={`${id}-glass`} cx="50%" cy="28%" r="82%">
          <stop offset="0%"   stopColor={c}   stopOpacity="0.55" />
          <stop offset="38%"  stopColor={dark} stopOpacity="0.55" />
          <stop offset="70%"  stopColor="#0a0a0e" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#000"  stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {isApex && (
          <linearGradient id={`${id}-apexrim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#FCD34D" />
            <stop offset="50%"  stopColor="#FF8C42" />
            <stop offset="100%" stopColor="#FF4655" />
          </linearGradient>
        )}
        <pattern id={`${id}-tex`} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M3 0 L6 1.5 L6 4.5 L3 6 L0 4.5 L0 1.5 Z" fill="none" stroke={light} strokeWidth="0.25" strokeOpacity="0.18" />
        </pattern>
        <clipPath id={`${id}-clip`}>
          <path d={sil.inner} />
        </clipPath>
      </defs>

      {/* 1. Outer chrome rim — Apex uses the legendary gradient */}
      <path d={sil.outer} fill={isApex ? `url(#${id}-apexrim)` : `url(#${id}-rim)`} />
      {/* 2. Bright top edge highlight */}
      <path d={sil.outer} fill="none" stroke={bright} strokeOpacity="0.85" strokeWidth="0.6" />
      {/* 3. Recessed bevel groove */}
      <path d={sil.rim} fill={`url(#${id}-bevel)`} />
      {/* 4. Dark glass mounted plate */}
      <path d={sil.inner} fill={`url(#${id}-glass)`} />
      {/* 5. Subtle hex texture inside the plate */}
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="0" y="0" width="100" height="100" fill={`url(#${id}-tex)`} />
      </g>
      {/* 6. Inner accent ring */}
      <path d={sil.inner} fill="none" stroke={light} strokeOpacity="0.7" strokeWidth="0.8" />
      {/* 7. Glyph — clipped to plate */}
      <g clipPath={`url(#${id}-clip)`}>{Glyph({ color: c, light, dark })}</g>
      {/* 8. Top shine sweep over everything */}
      <path d={sil.inner} fill={`url(#${id}-shine)`} />
      {/* 9. Apex extra: gold corona arc + crown sparks */}
      {isApex && (
        <>
          <path d={sil.outer} fill="none" stroke="#FCD34D" strokeOpacity="0.85" strokeWidth="1.4" />
          <circle cx="50" cy="6" r="1.6" fill="#FCD34D" />
          <circle cx="34" cy="9"  r="1.1" fill="#FCD34D" opacity="0.9" />
          <circle cx="66" cy="9"  r="1.1" fill="#FCD34D" opacity="0.9" />
        </>
      )}
    </svg>
  );
}

/* -------------------------- per-rank glyphs --------------------------- */
/* All glyphs use the 100×100 viewBox; the plate clipping keeps them    */
/* visually balanced inside each unique silhouette.                     */

interface GlyphCtx {
  color: string;
  light: string;
  dark: string;
}
type GlyphFn = (ctx: GlyphCtx) => JSX.Element;

// 1. ROOKIE — single small chevron.
const RookieGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path d="M35 60 L50 46 L65 60" stroke={light} strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="70" r="2.2" fill={color} />
  </g>
);

// 2. CONTENDER — twin chevrons + a small upward spark.
const ContenderGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path d="M30 56 L50 40 L70 56" stroke={light} strokeWidth="3.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M34 68 L50 54 L66 68" stroke={color} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    <circle cx="50" cy="32" r="2" fill={light} />
  </g>
);

// 3. RIVAL — crossed sabres / X mark with central rivet.
const RivalGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path d="M30 30 L70 70" stroke={light} strokeWidth="4" strokeLinecap="round" />
    <path d="M70 30 L30 70" stroke={light} strokeWidth="4" strokeLinecap="round" />
    <path d="M30 30 L70 70" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
    <path d="M70 30 L30 70" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
    <circle cx="50" cy="50" r="4" fill="#0a0a0c" stroke={light} strokeWidth="1.4" />
  </g>
);

// 4. EXPERT — 4-point compass star.
const ExpertGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path
      d="M50 24 L56 46 L78 50 L56 54 L50 76 L44 54 L22 50 L44 46 Z"
      fill={color}
      stroke={light}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M50 34 L53 47 L66 50 L53 53 L50 66 L47 53 L34 50 L47 47 Z"
      fill={light}
      opacity="0.55"
    />
    <circle cx="50" cy="50" r="2.2" fill="#0a0a0c" />
  </g>
);

// 5. ELITE — laurel wreath enclosing a star.
const EliteGlyph: GlyphFn = ({ color, light, dark }) => (
  <g>
    {/* laurel wreath */}
    <path
      d="M28 50 C28 35 38 26 50 26 C62 26 72 35 72 50 C72 65 62 74 50 74 C38 74 28 65 28 50 Z"
      fill="none"
      stroke={light}
      strokeWidth="1.4"
      opacity="0.85"
    />
    <path d="M32 40 L26 36 M32 50 L24 50 M32 60 L26 64" stroke={light} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M68 40 L74 36 M68 50 L76 50 M68 60 L74 64" stroke={light} strokeWidth="1.4" strokeLinecap="round" />
    {/* central star */}
    <path
      d="M50 36 L54 47 L66 47 L56 54 L60 66 L50 58 L40 66 L44 54 L34 47 L46 47 Z"
      fill={color}
      stroke={dark}
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
  </g>
);

// 6. MASTER — royal crown with three jewels.
const MasterGlyph: GlyphFn = ({ color, light }) => (
  <g>
    <path
      d="M26 62 L32 36 L44 52 L50 30 L56 52 L68 36 L74 62 Z"
      fill={color}
      stroke={light}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <rect x="26" y="64" width="48" height="7" rx="1.2" fill={color} stroke={light} strokeWidth="1.2" />
    <circle cx="50" cy="30" r="3.2" fill={light} />
    <circle cx="32" cy="36" r="2.2" fill={light} opacity="0.9" />
    <circle cx="68" cy="36" r="2.2" fill={light} opacity="0.9" />
    <path d="M30 68 L70 68" stroke="#0a0a0c" strokeWidth="1" opacity="0.6" />
  </g>
);

// 7. APEX — flame-peak summit (mountain + flame highlight).
const ApexGlyph: GlyphFn = ({ light }) => (
  <g>
    {/* outer triangular peak filled with the legendary gradient via apexrim ref */}
    <path
      d="M50 22 L80 76 L20 76 Z"
      fill="url(#rk-apex-apexrim)"
      stroke="#FCD34D"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* inner inverted notch (the dark valley) */}
    <path
      d="M50 50 L66 76 L34 76 Z"
      fill="#0a0a0c"
      stroke={light}
      strokeWidth="1"
      strokeLinejoin="round"
    />
    {/* flame highlight at the summit */}
    <path
      d="M50 28 L60 56 L50 50 L40 56 Z"
      fill="#FCD34D"
      opacity="0.95"
    />
    <circle cx="50" cy="40" r="2.4" fill="#fff" />
  </g>
);

const GLYPHS: Record<RankTier, GlyphFn> = {
  Rookie:    RookieGlyph,
  Contender: ContenderGlyph,
  Rival:     RivalGlyph,
  Expert:    ExpertGlyph,
  Elite:     EliteGlyph,
  Master:    MasterGlyph,
  Apex:      ApexGlyph,
};

