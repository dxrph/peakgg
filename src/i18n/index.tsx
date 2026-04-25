import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { RankTier } from "@/lib/ranks";

export type Locale = "en" | "fr" | "it";

type Dict = {
  ranks: Record<RankTier, string>;
  ui: { language: string };
};

const DICTS: Record<Locale, Dict> = {
  en: {
    ranks: {
      Rookie: "Rookie",
      Bronze: "Bronze",
      Silver: "Silver",
      Gold: "Gold",
      Platinum: "Platinum",
      Diamond: "Diamond",
      Master: "Master",
      Apex: "Apex",
    },
    ui: { language: "Language" },
  },
  fr: {
    ranks: {
      Rookie: "Recrue",
      Bronze: "Bronze",
      Silver: "Argent",
      Gold: "Or",
      Platinum: "Platine",
      Diamond: "Diamant",
      Master: "Maître",
      Apex: "Apex",
    },
    ui: { language: "Langue" },
  },
  it: {
    ranks: {
      Rookie: "Rookie",
      Bronze: "Bronzo",
      Silver: "Argento",
      Gold: "Oro",
      Platinum: "Platino",
      Diamond: "Diamante",
      Master: "Maestro",
      Apex: "Apex",
    },
    ui: { language: "Lingua" },
  },
};

const STORAGE_KEY = "peakgg.locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  tRank: (rank: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectInitial(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (saved && DICTS[saved]) return saved;
  const nav = window.navigator.language.toLowerCase();
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("it")) return "it";
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitial());

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTS[locale];
    return {
      locale,
      setLocale,
      t: (key: string) => {
        const parts = key.split(".");
        let cur: any = dict;
        for (const p of parts) cur = cur?.[p];
        return typeof cur === "string" ? cur : key;
      },
      tRank: (rank: string) => dict.ranks[rank as RankTier] ?? rank,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components don't crash if provider is missing.
    return {
      locale: "en",
      setLocale: () => {},
      t: (k) => k,
      tRank: (r) => DICTS.en.ranks[r as RankTier] ?? r,
    };
  }
  return ctx;
}

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "it", label: "IT" },
];

export function translateRank(rank: string, locale: Locale): string {
  return DICTS[locale]?.ranks[rank as RankTier] ?? rank;
}