import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://peakgg.net";
const today = new Date().toISOString().split("T")[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

writeFileSync(resolve(process.cwd(), "public/sitemap.xml"), xml, "utf8");
console.log("sitemap.xml generated");
