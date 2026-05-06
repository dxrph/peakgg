import { Link } from "react-router-dom";
import { Mountain } from "lucide-react";
import { useI18n } from "@/i18n";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border bg-card/30 py-12">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
                <Mountain className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-primary">PEAKGG</span>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 uppercase tracking-wider text-sm">{t("footer.platform")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-body">
              <li><Link to="/play" className="hover:text-primary transition-colors">{t("footer.matchmaking")}</Link></li>
              <li><Link to="/tournaments" className="hover:text-primary transition-colors">{t("footer.tournaments")}</Link></li>
              <li><Link to="/leaderboard" className="hover:text-primary transition-colors">{t("footer.leaderboard")}</Link></li>
              <li><Link to="/teams" className="hover:text-primary transition-colors">{t("footer.teams")}</Link></li>
              <li><Link to="/scrims" className="hover:text-primary transition-colors">{t("footer.scrims")}</Link></li>
              <li><Link to="/free-agents" className="hover:text-primary transition-colors">Free Agents</Link></li>
              <li><Link to="/elo" className="hover:text-primary transition-colors">{t("footer.elo_explained")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 uppercase tracking-wider text-sm">{t("footer.company")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-body">
              <li><Link to="/about" className="hover:text-primary transition-colors">{t("footer.about")}</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">{t("footer.faq")}</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">{t("footer.contact")}</Link></li>
              <li><a href="https://discord.gg/peakgg" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{t("footer.discord")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-bold mb-4 uppercase tracking-wider text-sm">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground font-body">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">{t("footer.privacy")}</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">{t("footer.terms")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground font-body">{t("footer.copyright")}</p>
          <p className="text-xs text-muted-foreground font-body">{t("footer.disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
