import { cn } from "@/lib/utils";

interface FlagIconProps {
  code: string;
  className?: string;
}

/**
 * Real SVG flags rendered as inline components to avoid emoji rendering
 * issues on Windows/Chrome. Sized via `className` (defaults to h-4 w-6).
 */
export default function FlagIcon({ code, className }: FlagIconProps) {
  const cls = cn("inline-block rounded-sm overflow-hidden shadow-sm", className ?? "h-4 w-6");

  switch (code) {
    case "en":
    case "gb":
      return (
        <svg className={cls} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <clipPath id="flag-uk-clip">
            <path d="M0,0 v30 h60 v-30 z" />
          </clipPath>
          <clipPath id="flag-uk-clip2">
            <path d="M30,15 h30 v15 z M30,15 v15 h-30 z M30,15 h-30 v-15 z M30,15 v-15 h30 z" />
          </clipPath>
          <g clipPath="url(#flag-uk-clip)">
            <rect width="60" height="30" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag-uk-clip2)" stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </g>
        </svg>
      );
    case "fr":
      return (
        <svg className={cls} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden>
          <rect width="1" height="2" x="0" fill="#0055A4" />
          <rect width="1" height="2" x="1" fill="#FFFFFF" />
          <rect width="1" height="2" x="2" fill="#EF4135" />
        </svg>
      );
    case "it":
      return (
        <svg className={cls} viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden>
          <rect width="1" height="2" x="0" fill="#009246" />
          <rect width="1" height="2" x="1" fill="#FFFFFF" />
          <rect width="1" height="2" x="2" fill="#CE2B37" />
        </svg>
      );
    default:
      return null;
  }
}