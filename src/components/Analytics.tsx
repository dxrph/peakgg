import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    loadGA?: () => void;
    __GA_ID__?: string;
    __gaLoaded?: boolean;
  }
}

/**
 * Tracks SPA pageviews on every React Router location change.
 * Only fires if GA has been loaded (i.e. cookie consent accepted).
 * To enable analytics at runtime after consent:
 *   localStorage.setItem('cookieConsent', 'accepted');
 *   window.loadGA?.();
 */
export default function Analytics() {
  const location = useLocation();

  useEffect(() => {
    try {
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("cookieConsent") === "accepted" &&
        !window.__gaLoaded &&
        typeof window.loadGA === "function"
      ) {
        window.loadGA();
      }
    } catch {
      /* noop */
    }

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      // Defer slightly so document.title (set by react-helmet) is up to date.
      const t = window.setTimeout(() => {
        window.gtag?.("event", "page_view", {
          page_title: document.title,
          page_location: window.location.href,
          page_path: location.pathname + location.search,
        });
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, [location]);

  return null;
}
