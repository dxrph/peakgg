# PeakGG Homepage — Editorial Broadcast Redesign

## Scope

Rebuild only the public `/` homepage as one dark, art-directed Valorant broadcast story. Preserve all existing routes, account behavior, protected flows, backend schema, tournament logic, admin/dashboard pages, and the PeakGG wordmark.

## Implementation

1. **Create a homepage-only visual shell**
   - Replace the current light `pg-*` homepage composition with a scoped near-black/off-white/Peak-red system.
   - Keep global/shared page styling unchanged unless a small shared primitive is required by the homepage.
   - Add consistent section numbering, hairline rules, corner marks, crosshairs, red slashes, mono metadata, keyboard focus states, and reduced-motion fallbacks.

2. **Refactor the homepage into eight focused modules**
   - `01 Hero`: asymmetric 12-column, cinematic masked local artwork, oversized headline, side metadata, CTAs, compact still strip.
   - `02 Live Signal`: thin broadcast ticker with live/upcoming fixture summaries, EU status, player signal, and mobile snap scrolling.
   - `03 Featured Tournament`: irregular Open Cup split, real/fallback tournament details, functional compact bracket progression, editorial side annotations.
   - `04 Rank Is Identity`: seven-rank exhibition rail using the existing rank model, with Apex emphasized and a safe featured-player readout.
   - `05 Find Your Five`: product preview with five compact roster slots, roles/ranks/languages/availability, plus player/team CTAs.
   - `06 Match Point`: spacious cinematic interlude with a dramatic round/timestamp treatment and restrained copy.
   - `07 Upcoming Tournaments`: editorial schedule table with date, event, capacity/status and links, backed by existing public tournament data with controlled fallbacks.
   - `08 Enter Peak / Footer`: memorable closing statement and compact functional legal/social/navigation area.

3. **Reuse existing assets and safe data**
   - Reuse local PeakGG imagery (`peakRaster` artwork and existing repo images) with dark masks and deliberate crops; no new visual style or external hotlinks.
   - Reuse `RANKS`, auth state, public tournament queries, safe public player fields, social links, and existing route destinations.
   - Never expose email or other private profile data.

4. **Internationalization and accessibility**
   - Add complete EN/FR/IT keys for every new homepage string.
   - Keep semantic heading order, landmark structure, descriptive image text where needed, ARIA labels, visible focus states, and acceptable contrast.
   - Recompose intentionally at approximately 390px rather than merely stacking desktop blocks.

5. **Performance and motion**
   - Use CSS-only masked reveals, subtle 8–20px movement, ticker motion, image clip reveals, and bracket line drawing.
   - Limit animation to key moments, disable it under `prefers-reduced-motion`, lazy-load below-the-fold images, and avoid adding animation libraries.

## Files expected to change

- `src/pages/Index.tsx`
- Focused modules under `src/components/home/` (reuse/refactor existing files; add only the missing chapter modules)
- A homepage-scoped stylesheet under `src/` and its import
- `src/locales/en/translation.json`
- `src/locales/fr/translation.json`
- `src/locales/it/translation.json`

No backend, migration, auth, admin, dashboard, or unrelated route files will be changed.

## Validation

- Run the repository TypeScript check, lint, tests, and production build scripts that exist.
- Verify `/` in Chromium at 1440px desktop and 390px mobile, including horizontal strips, CTA destinations, overflow, console errors, and reduced-motion behavior.
- Fix only regressions introduced by this homepage work and report exact commands, results/counts, files changed, reused assets/data, and any pre-existing failures separately.
