import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import it from "./locales/it.json";

export const resources = {
  en: { translation: en },
  it: { translation: it },
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "it"],
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export default i18n;
