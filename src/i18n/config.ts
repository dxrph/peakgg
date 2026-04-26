import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "@/locales/en/translation.json";
import it from "@/locales/it/translation.json";
import fr from "@/locales/fr/translation.json";

export const SUPPORTED_LOCALES = ["en", "it", "fr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_META: Record<SupportedLocale, { code: SupportedLocale; label: string; flag: string; name: string }> = {
  en: { code: "en", label: "EN", flag: "🇬🇧", name: "English" },
  it: { code: "it", label: "IT", flag: "🇮🇹", name: "Italiano" },
  fr: { code: "fr", label: "FR", flag: "🇫🇷", name: "Français" },
};

export const STORAGE_KEY = "peakgg.locale";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        it: { translation: it },
        fr: { translation: fr },
      },
      fallbackLng: "en",
      supportedLngs: SUPPORTED_LOCALES as unknown as string[],
      load: "languageOnly",
      nonExplicitSupportedLngs: true,
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        lookupLocalStorage: STORAGE_KEY,
        caches: ["localStorage"],
      },
      returnNull: false,
    });
}

export default i18n;