import { Link } from "react-router-dom";
import { Mountain, MessageCircle } from "lucide-react";
import { useI18n } from "@/i18n";
import { footerByCategory, resolvePath, type NavItem } from "@/config/navigation";
import { DISCORD_INVITE } from "@/lib/links";

export default function Footer() {
  const { t } = useI18n();
  const tr = (item: NavItem) => t(item.labelKey, { defaultValue: item.label });

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
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-display uppercase tracking-wider text-[#a8b0f7] hover:text-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> {t("footer.discord", { defaultValue: "Discord" })}
            </a>
          </div>
          {sections.map((sec) => (
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
