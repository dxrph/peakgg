import { Link } from "react-router-dom";
import { Mountain, MessageCircle, Instagram, Youtube, Twitch, Music2, Twitter } from "lucide-react";
import { useI18n } from "@/i18n";
import { footerByCategory, resolvePath, type NavItem } from "@/config/navigation";
import { getActiveSocials, type SocialKey } from "@/lib/links";

const SOCIAL_ICON: Record<SocialKey, React.ComponentType<{ className?: string }>> = {
  discord: MessageCircle,
  x: Twitter,
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  twitch: Twitch,
};

export default function Footer() {
  const { t } = useI18n();
  const tr = (item: NavItem) => t(item.labelKey, { defaultValue: item.label });
  const socials = getActiveSocials();

  const renderItem = (item: NavItem) => (
    <li key={item.key} className="flex items-center gap-2">
      <Link to={resolvePath(item)} className="hover:text-primary transition-colors">
        {tr(item)}
      </Link>
      {item.comingSoon && (
        <span className="text-[8px] uppercase tracking-wider text-accent/80 border border-accent/30 rounded-sm px-1">
          Soon
        </span>
      )}
    </li>
  );

  const sections = [
    { key: "platform",  title: t("footer.platform",  { defaultValue: "Platform" }),  items: footerByCategory("platform") },
    { key: "tools",     title: t("footer.tools",     { defaultValue: "Tools" }),     items: footerByCategory("tools") },
    { key: "community", title: t("footer.community", { defaultValue: "Community" }), items: footerByCategory("community") },
    { key: "legal",     title: t("footer.legal",     { defaultValue: "Legal" }),     items: footerByCategory("legal") },
  ];

  return (
    <footer className="border-t border-border bg-card/30 py-12">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
                <Mountain className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-primary">PEAKGG</span>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">
              {t("footer.tagline")}
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
                    className="w-8 h-8 rounded-md border border-border bg-background/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
          {sections.filter(sec => sec.items.length > 0).map((sec) => (
            <div key={sec.key}>
              <h4 className="font-display font-bold mb-4 uppercase tracking-wider text-sm">{sec.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground font-body">
                {sec.items.map(renderItem)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground font-body">{t("footer.copyright")}</p>
          <p className="text-xs text-muted-foreground font-body">{t("footer.disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
