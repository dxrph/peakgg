import { Link } from "react-router-dom";
import { MessageCircle, Instagram, Youtube, Twitch, Music2, Twitter, ArrowRight } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getActiveSocials, type SocialKey } from "@/lib/links";

const SOCIAL_ICON: Record<SocialKey, React.ComponentType<{ className?: string }>> = {
  discord: MessageCircle,
  x: Twitter,
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  twitch: Twitch,
};

type FooterLink = { label: string; to?: string; href?: string };

const COMPETE_LINKS: FooterLink[] = [
  { label: "Tournaments", to: "/tournaments" },
  { label: "Open Cups", to: "/tournaments?tier=open-cup" },
  { label: "Teams", to: "/teams" },
  { label: "Find Players", to: "/free-agents" },
  { label: "Ranks", to: "/leaderboard" },
];

const RESOURCES_LINKS: FooterLink[] = [
  { label: "FAQ", to: "/faq" },
  { label: "How ELO Works", to: "/elo" },
  { label: "Rules", to: "/terms" },
  { label: "Contact", to: "/contact" },
];

export default function Footer({ hideCta = false }: { hideCta?: boolean } = {}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const socials = getActiveSocials();

  const discordSocial = socials.find((s) => s.key === "discord");
  const BETA_LINKS: FooterLink[] = [
    { label: "Join Beta", to: user ? "/dashboard" : "/register" },
    discordSocial
      ? { label: "Discord Community", href: discordSocial.url }
      : { label: "Discord Community", to: "/contact" },
    { label: "Community Cup #1", to: "/tournaments" },
    { label: "Report Feedback", to: "/contact" },
  ];

  const columns: { title: string; items: FooterLink[] }[] = [
    { title: t("footer.compete", { defaultValue: "Compete" }), items: COMPETE_LINKS },
    { title: t("footer.resources", { defaultValue: "Resources" }), items: RESOURCES_LINKS },
    { title: t("footer.beta", { defaultValue: "Beta" }), items: BETA_LINKS },
  ];

  const renderLink = (l: FooterLink) =>
    l.href ? (
      <a
        href={l.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-primary transition-colors font-body"
      >
        {l.label}
      </a>
    ) : (
      <Link
        to={l.to ?? "#"}
        className="text-sm text-muted-foreground hover:text-primary transition-colors font-body"
      >
        {l.label}
      </Link>
    );

  return (
    <footer className="border-t border-border bg-background mt-8">
      {/* Pre-footer CTA */}
      {!hideCta && (
      <section className="relative overflow-hidden border-b border-border bc-rules">
        <div className="container relative z-10 py-16 md:py-20 flex flex-col items-center text-center">
          <span className="bc-chip border-primary/40 text-primary mb-5">
            {t("footer.cta_eyebrow", { defaultValue: "Closed Beta — Europe" })}
          </span>
          <h2 className="bc-display text-5xl md:text-7xl mb-4">
            {t("footer.cta_title_pre", { defaultValue: "Ready to" })}{" "}
            <span className="text-primary text-glow-red">
              {t("footer.cta_title_accent", { defaultValue: "Compete" })}
            </span>
            ?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mb-8 font-body">
            {t("footer.cta_subtitle", {
              defaultValue:
                "Find teammates, join tournaments and climb the PeakGG ladder.",
            })}
          </p>
          <Link to={user ? "/dashboard" : "/register"}>
            <Button size="xl" className="rounded-none font-display font-bold uppercase tracking-[0.18em]">
              <BrandLogo className="mr-2 h-5 w-5" />
              {user
                ? t("footer.cta_dashboard", { defaultValue: "Go to Dashboard" })
                : t("footer.cta_button", { defaultValue: "Join Beta" })}
              <ArrowRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
      )}

      {/* Columns */}
      <div className="container py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <div className="flex items-center gap-2.5 mb-5">
              <BrandLogo className="h-9 w-9 drop-shadow-[0_0_12px_rgba(255,70,85,0.45)]" />
              <span className="font-display font-bold text-xl text-primary tracking-wider">
                PEAKGG
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed mb-6 max-w-sm">
              {t("footer.mission", {
                defaultValue:
                  "Competitive Valorant platform for players who want to find teammates, play tournaments and climb the Peak ranks.",
              })}
            </p>
            <div className="flex items-center gap-2">
              {socials.map((s) => {
                const Icon = SOCIAL_ICON[s.key];
                return (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="w-9 h-9 rounded-none border border-border bg-transparent flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/60 hover:shadow-[0_0_18px_hsl(var(--primary)/0.25)] transition-all"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2 lg:col-span-2">
              <h4 className="mb-5">
                <span className="bc-rail">{col.title}</span>
              </h4>
              <ul className="space-y-3">
                {col.items.map((item) => (
                  <li key={item.label}>{renderLink(item)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <p className="text-xs text-muted-foreground font-body">
            {t("footer.copyright", { defaultValue: "© 2026 PeakGG. All rights reserved." })}
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground font-body">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              {t("navmap.privacy", { defaultValue: "Privacy" })}
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              {t("navmap.terms", { defaultValue: "Terms" })}
            </Link>
            <span className="hidden md:inline opacity-60">
              {t("footer.disclaimer", {
                defaultValue: "Not affiliated with Riot Games.",
              })}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
