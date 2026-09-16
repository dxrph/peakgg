import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n, { LOCALE_META, SUPPORTED_LOCALES, STORAGE_KEY, type SupportedLocale } from "./config";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Locale = SupportedLocale;

function normalize(l: string | undefined | null): Locale {
  if (!l) return "en";
  const base = l.toLowerCase().split("-")[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(base) ? (base as Locale) : "en";
}

/**
 * Bridges the auth profile with i18next: when a logged-in user has
 * a saved `language` preference, apply it (overrides browser/localStorage).
 */
function ProfileLocaleSync() {
  const { profile } = useAuth();
  useEffect(() => {
    if (!profile?.language) return;
    const next = normalize(profile.language);
    if (i18n.language?.split("-")[0] !== next) {
      i18n.changeLanguage(next);
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch {}
    }
  }, [profile?.language]);
  return null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Reflect locale on <html lang>
  useEffect(() => {
    const apply = () => { document.documentElement.lang = normalize(i18n.language); };
    apply();
    i18n.on("languageChanged", apply);
    return () => { i18n.off("languageChanged", apply); };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ProfileLocaleSync />
      {children}
    </I18nextProvider>
  );
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  tRank: (rank: string) => string;
}

/**
 * Backwards-compatible hook used across the app. Internally backed by i18next.
 * Also persists the choice to `profiles.language` when a user is logged in.
 */
export function useI18n(): I18nContextValue {
  const { t, i18n: i18next } = useTranslation();
  const { user } = useAuth();
  const locale = normalize(i18next.language);

  const setLocale = useCallback(
    (l: Locale) => {
      const next = normalize(l);
      void i18next.changeLanguage(next);
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch {}
      if (user?.id) {
        // Best-effort persistence; ignore errors silently.
        void supabase.from("profiles").update({ language: next }).eq("id", user.id);
      }
    },
    [i18next, user?.id]
  );

  return useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key, options) => t(key, options) as string,
    tRank: (rank) => t(`ranks.${rank}`, { defaultValue: rank }) as string,
  }), [locale, setLocale, t]);
}

export const LOCALES: { code: Locale; label: string; flag: string; name: string }[] =
  (SUPPORTED_LOCALES as readonly Locale[]).map((c) => LOCALE_META[c]);

export function translateRank(rank: string, locale: Locale): string {
  return (i18n.getFixedT(locale)(`ranks.${rank}`, { defaultValue: rank }) as string);
}

export { LOCALE_META };
export default i18n;