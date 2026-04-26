---
name: i18n system (i18next)
description: i18next + react-i18next setup with EN/IT/FR JSON locales, browser detection, localStorage + Supabase profiles.language sync, flag dropdown switcher in navbar
type: feature
---
i18n stack: `i18next` + `react-i18next` + `i18next-browser-languagedetector`. Config in `src/i18n/config.ts`, provider/wrapper in `src/i18n/index.tsx`. Locale JSONs at `src/locales/{en,it,fr}/translation.json` (single namespace `translation`).

Detection order: localStorage(`peakgg.locale`) → navigator → htmlTag. Fallback: `en`. `load: "languageOnly"` so `it-IT` → `it`. Supported: en, it, fr.

User profile sync: `profiles.language` text column (CHECK in en|it|fr, default 'en'). When a logged-in user is detected, `ProfileLocaleSync` overrides the local choice with the DB value. When the user changes language via `useI18n().setLocale`, both localStorage AND `profiles.language` are updated.

Backwards-compatible API kept: `useI18n()` returns `{ locale, setLocale, t, tRank }` so existing call sites (Navbar, RankBadge, RankProgressionModal, etc.) keep working. New code should prefer `useTranslation()` from react-i18next directly. `tRank(name)` is sugar for `t('ranks.' + name)`.

Switcher: `src/components/LanguageSwitcher.tsx` — flag emoji + locale label (🇮🇹 IT / 🇬🇧 EN / 🇫🇷 FR), full names in dropdown, check mark on active. Mounted in `Navbar` (desktop top-right + inside mobile menu).

Translation key namespaces in JSONs: `nav`, `auth`, `profile`, `rank`, `tournaments`, `board`, `team`, `notifications`, `common`, `ui`, `ranks`. When adding new UI strings, add the key to ALL THREE locale files; never hardcode user-visible text.

French rank translations: Rookie→Recrue, Silver→Argent, Gold→Or, Platinum→Platine, Diamond→Diamant, Master→Maître. Italian: Bronze→Bronzo, Silver→Argento, Gold→Oro, Platinum→Platino, Diamond→Diamante, Master→Maestro. Bronze (FR) and Apex (all) stay identical.
