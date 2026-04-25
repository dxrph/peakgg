---
name: i18n rank tier labels
description: EN/FR/IT translations for the 8 rank tiers, language switcher in navbar, locale persisted in localStorage
type: feature
---
Rank tier names are translated via `src/i18n/index.tsx` (`useI18n().tRank(name)`). Supported locales: en, fr, it. Locale persisted at `localStorage["peakgg.locale"]` and reflected on `<html lang>`. Switcher: `src/components/LanguageSwitcher.tsx` mounted in `Navbar`. RankBadge always renders the localized tier name; the canonical English name from `RANKS` remains the source of truth in code/DB.

French translations: Rookie→Recrue, Silver→Argent, Gold→Or, Platinum→Platine, Diamond→Diamant, Master→Maître. Bronze and Apex stay identical.
How to apply: when adding new tier-related UI, read the label via `tRank(info.name)`; never hardcode tier strings for display.