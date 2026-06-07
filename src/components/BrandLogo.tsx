import logoAsset from "@/assets/peakgg-logo.png.asset.json";

type Props = {
  className?: string;
  alt?: string;
};

/**
 * Official PeakGG brand mark — painterly red mountain "M".
 * Use this everywhere the app shows the logo (navbar, footer, admin, loaders).
 */
export default function BrandLogo({ className = "h-8 w-8", alt = "PeakGG" }: Props) {
  return (
    <img
      src={logoAsset.url}
      alt={alt}
      className={`${className} object-contain select-none`}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
}