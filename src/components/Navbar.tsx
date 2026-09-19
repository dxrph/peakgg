import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";

import "../styles/navbar.css";

const NAV_LINKS = [
  { key: "compete", href: "#compete" },
  { key: "tournaments", href: "#tournaments" },
  { key: "players", href: "#players" },
  { key: "teams", href: "#teams" },
  { key: "community", href: "#community" },
] as const;

interface NavbarProps { onSearch: () => void; onAuth: (mode: "signin" | "signup") => void }

export default function Navbar({ onSearch, onAuth }: NavbarProps) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY >= (document.getElementById("compete")?.offsetHeight ?? 720) - 56);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
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
          <button type="button" className="site-nav-iconbtn" onClick={onSearch} aria-label={t("nav.search")}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg></button>
          <button type="button" className="site-nav-signin" onClick={() => session ? undefined : onAuth("signin")}>
            {session ? t("nav.account") : t("nav.signIn")}
          </button>
          <button type="button" className="site-nav-cta" onClick={() => onAuth("signup")}>
            {t("nav.enterPeak")}
          </button>
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
            <button type="button" className="site-nav-mobile-signin" onClick={() => { setOpen(false); session ? undefined : onAuth("signin"); }}>
              {session ? t("nav.account") : t("nav.signIn")}
            </button>
            <button type="button" className="site-nav-cta" onClick={() => { setOpen(false); onAuth("signup"); }}>
              {t("nav.enterPeak")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
