import { useEffect, useRef, useState } from "react";
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
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const links = panel?.querySelectorAll<HTMLElement>("a, button");
    links?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key !== "Tab" || !links?.length) return;
      const first = links[0];
      const last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onResize = () => { if (window.innerWidth > 1100) setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header className={`site-nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-nav-inner">
        <a href="/" className="site-nav-logo" aria-label={t("common.brand")}>
          PEAKGG
        </a>

        <nav className="site-nav-links" aria-label={t("nav.ariaMain")}>
          {NAV_LINKS.map((link) => (
            <a key={link.key} href={link.href} className="site-nav-link">
              {t(`nav.links.${link.key}`)}
            </a>
          ))}
        </nav>

        <div className="site-nav-actions">
          <a href="#signin" className="site-nav-signin">
            {t("nav.signIn")}
          </a>
          <a href="#enter" className="site-nav-cta">
            {t("nav.enterPeak")}
          </a>
          <button
            type="button"
            ref={toggleRef}
            className="site-nav-burger"
            aria-controls="mobile-navigation"
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
        <div ref={panelRef} id="mobile-navigation" className="site-nav-mobile" role="dialog" aria-modal="true" aria-label={t("nav.ariaMain")}>
          <button className="site-nav-mobile-close" onClick={() => { setOpen(false); toggleRef.current?.focus(); }}>{t("nav.menuClose")} ×</button>
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
