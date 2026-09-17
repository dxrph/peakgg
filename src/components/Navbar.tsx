import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import "../styles/navbar.css";

const NAV_LINKS = [
  { key: "compete", href: "#compete" },
  { key: "tournaments", href: "#tournaments" },
  { key: "players", href: "#players" },
  { key: "teams", href: "#teams" },
  { key: "community", href: "#community" },
] as const;

export default function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`site-nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-nav-inner">
        <a href="/" className="site-nav-logo" aria-label={t("common.brand")}>
          PEAK<span>GG</span>
        </a>

        <nav className="site-nav-links" aria-label={t("nav.ariaMain")}>
          {NAV_LINKS.map((link) => (
            <a key={link.key} href={link.href} className="site-nav-link">
              {t(`nav.links.${link.key}`)}
            </a>
          ))}
        </nav>

        <div className="site-nav-actions">
          <button type="button" className="site-nav-iconbtn" aria-label={t("nav.search")}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </button>
          <a href="#signin" className="site-nav-signin">
            {t("nav.signIn")}
          </a>
          <a href="#enter" className="site-nav-cta">
            {t("nav.enterPeak")}
          </a>
          <button
            type="button"
            className="site-nav-burger"
            aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {open && (
        <div className="site-nav-mobile" role="dialog" aria-label={t("nav.ariaMain")}>
          <nav className="site-nav-mobile-links">
            {NAV_LINKS.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="site-nav-mobile-link"
                onClick={() => setOpen(false)}
              >
                {t(`nav.links.${link.key}`)}
              </a>
            ))}
          </nav>
          <div className="site-nav-mobile-actions">
            <a href="#signin" className="site-nav-mobile-signin" onClick={() => setOpen(false)}>
              {t("nav.signIn")}
            </a>
            <a href="#enter" className="site-nav-cta" onClick={() => setOpen(false)}>
              {t("nav.enterPeak")}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
