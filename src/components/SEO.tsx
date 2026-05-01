import { Helmet } from "react-helmet-async";

const SITE_URL = "https://peakgg.net";
const DEFAULT_OG = `${SITE_URL}/og-image.png`;

export interface SEOProps {
  title: string;
  description: string;
  path?: string;          // e.g. "/tournaments"
  keywords?: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

export default function SEO({
  title,
  description,
  path = "/",
  keywords,
  image = DEFAULT_OG,
  noindex,
  jsonLd,
}: SEOProps) {
  const url = `${SITE_URL}${path}`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="PeakGG" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="en_GB" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@peakgg" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
