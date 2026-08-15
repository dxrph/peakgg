type Props = {
  className?: string;
  alt?: string;
};

/**
 * PeakGG signal mark — a summit cut by a competitive ascent line.
 * Use this everywhere the app shows the logo (navbar, footer, admin, loaders).
 */
export default function BrandLogo({ className = "h-8 w-8", alt = "PeakGG" }: Props) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label={alt} className={`${className} select-none`}>
      <defs>
        <linearGradient id="peak-signal" x1="8" y1="54" x2="56" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff3656" />
          <stop offset="1" stopColor="#ff7a32" />
        </linearGradient>
      </defs>
      <path d="M7 51 28 10l8 17 5-9 16 33H46L34 28l-6 11-2-5-9 17H7Z" fill="url(#peak-signal)" />
      <path d="m18 46 10-18 5 10 6-11 8 19h-7l-3-8-5 10-5-10-4 8h-5Z" fill="#07070b" />
      <path d="M12 55h40" stroke="#ff3656" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}

