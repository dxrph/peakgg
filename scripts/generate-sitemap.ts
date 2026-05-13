import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://peakgg.net";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://xgpxzvujrlzokqswgqyd.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncHh6dnVqcmx6b2txc3dncXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NjM2MzEsImV4cCI6MjA4ODIzOTYzMX0.7y5kYBh3j2zzs_C6IibXmUeT-d2wTEqLdm1ioKRrSqU";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

/* ───────── Static routes ───────── */
const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/play", changefreq: "daily", priority: "0.9" },
  { path: "/tournaments", changefreq: "daily", priority: "0.9" },
  { path: "/teams", changefreq: "weekly", priority: "0.8" },
  { path: "/leaderboard", changefreq: "daily", priority: "0.8" },
  { path: "/scrims", changefreq: "daily", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/login", changefreq: "monthly", priority: "0.4" },
  { path: "/register", changefreq: "monthly", priority: "0.4" },
  { path: "/dashboard", changefreq: "weekly", priority: "0.6" },
  { path: "/play/legacy", changefreq: "weekly", priority: "0.5" },
  { path: "/leagues", changefreq: "weekly", priority: "0.8" },
  { path: "/aim-guide", changefreq: "monthly", priority: "0.6" },
  { path: "/free-agents", changefreq: "daily", priority: "0.6" },
  { path: "/elo", changefreq: "monthly", priority: "0.6" },
  { path: "/coming-soon", changefreq: "weekly", priority: "0.3" },
  { path: "/notifications", changefreq: "weekly", priority: "0.4" },
  { path: "/settings", changefreq: "monthly", priority: "0.4" },
];

async function fetchDynamicRoutes(): Promise<SitemapEntry[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const entries: SitemapEntry[] = [];
  const today = new Date().toISOString().split("T")[0];

  /* Leagues (public) */
  try {
    const { data: leagues } = await supabase.from("leagues").select("id, slug, updated_at");
    if (leagues && leagues.length > 0) {
      for (const l of leagues) {
        const path = l.slug ? `/leagues/${encodeURIComponent(l.slug as string)}` : `/leagues/${l.id}`;
        entries.push({
          path,
          lastmod: (l.updated_at as string)?.split("T")[0] || today,
          changefreq: "weekly",
          priority: "0.7",
        });
      }
    }
  } catch { /* ignore */ }

  /* Tournaments */
  try {
    const { data: tournaments } = await supabase
      .from("tournaments")
      .select("id, slug, updated_at")
      .in("status", ["active", "open_registration", "in_progress", "completed"]);
    if (tournaments && tournaments.length > 0) {
      for (const t of tournaments) {
        const path = t.slug ? `/tournaments/${t.slug}` : `/tournaments/${t.id}`;
        entries.push({
          path,
          lastmod: (t.updated_at as string)?.split("T")[0] || today,
          changefreq: "daily",
          priority: "0.8",
        });
      }
    }
  } catch { /* ignore */ }

  /* Teams */
  try {
    const { data: teams } = await supabase.from("teams").select("id, updated_at");
    if (teams && teams.length > 0) {
      for (const t of teams) {
        entries.push({
          path: `/teams/${t.id}`,
          lastmod: (t.updated_at as string)?.split("T")[0] || today,
          changefreq: "weekly",
          priority: "0.6",
        });
      }
    }
  } catch { /* ignore */ }

  /* Profiles */
  try {
    const { data: profiles } = await supabase.from("profiles").select("username, updated_at").not("username", "is", null);
    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        entries.push({
          path: `/profile/${encodeURIComponent(p.username as string)}`,
          lastmod: (p.updated_at as string)?.split("T")[0] || today,
          changefreq: "weekly",
          priority: "0.5",
        });
      }
    }
  } catch { /* ignore */ }

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) => {
    const lines = [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
    ];
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
    if (e.priority) lines.push(`    <priority>${e.priority}</priority>`);
    lines.push(`  </url>`);
    return lines.join("\n");
  });

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const dynamicEntries = await fetchDynamicRoutes();
  const allEntries = [...staticEntries, ...dynamicEntries];

  /* Sort for consistency */
  allEntries.sort((a, b) => a.path.localeCompare(b.path));

  /* Deduplicate by path */
  const seen = new Set<string>();
  const unique = allEntries.filter((e) => {
    if (seen.has(e.path)) return false;
    seen.add(e.path);
    return true;
  });

  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(unique));
  console.log(`sitemap.xml written (${unique.length} entries, ${dynamicEntries.length} dynamic)`);
}

main().catch((err) => {
  console.error("Sitemap generation failed:", err);
  process.exit(1);
});
