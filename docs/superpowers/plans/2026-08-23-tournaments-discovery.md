# PeakGG Tournament Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete public `/tournaments` discovery page with functional local filters, responsive editorial presentation, and safe future-route CTA states.

**Architecture:** Keep the route server-rendered and isolate only navigation/filter-sheet state in client components. Store typed seeded tournament data and pure filter functions separately from UI, then compose focused page sections around a shared header/footer language.

**Tech Stack:** React 19, Next App Router compatibility through Vinext, TypeScript, CSS, `next/image`, Node test runner, Playwright/CDP browser QA.

**Spec:** `docs/superpowers/specs/2026-08-23-peakgg-tournaments-discovery-design.md`

## Global Constraints

- Preserve the approved homepage and locked PeakGG black/red/paper brand.
- Do not build tournament detail, registration, bracket, match room, leaderboard, admin, or unrelated routes.
- Every visible filter must operate on the local dataset.
- Future CTAs must not create broken navigation.
- Product motion remains fast, restrained, and reduced-motion safe.

---

### Task 1: Tournament domain and regression contract

**Files:**
- Create: `data/tournaments.ts`
- Create: `tests/tournaments-page.test.mjs`

**Interfaces:**
- Produces: `Tournament`, `TournamentFilters`, `tournaments`, `defaultTournamentFilters`, `filterTournaments(items, filters)`.

- [ ] Write static and behavior tests for six seeded events, unique visuals/variants, filter combinations, empty results, and absence of a slug route.
- [ ] Run `node --test tests/tournaments-page.test.mjs` and confirm failure because the route/data do not exist.
- [ ] Implement the typed dataset and pure filtering function.
- [ ] Run the focused test and confirm domain tests pass while route tests remain red.

### Task 2: Shared product shell

**Files:**
- Create: `components/shared/SiteHeader.tsx`
- Create: `components/shared/SiteFooter.tsx`
- Modify: `components/home/Header.tsx`
- Modify: `components/home/Footer.tsx`
- Create: `app/tournaments/page.tsx`

**Interfaces:**
- `SiteHeader({activePage, mode})` supports homepage anchors and product-route links without changing homepage visuals.
- `SiteFooter({topHref})` supplies consistent navigation with `/tournaments` as the real tournament destination.

- [ ] Extend the failing test with active navigation, one `h1`, skip link, footer, and no detail route assertions.
- [ ] Implement backwards-compatible shared shell wrappers and the minimal route composition.
- [ ] Run focused and homepage tests; both must pass their shell assertions.

### Task 3: Functional discovery experience

**Files:**
- Create: `components/tournaments/TournamentDiscovery.tsx`
- Create: `components/tournaments/TournamentCard.tsx`

**Interfaces:**
- Consumes `Tournament[]` and pure filter helpers.
- Produces category tabs, native secondary filters, result count, filtered collection, reset, empty state, and accessible mobile sheet.

- [ ] Add failing assertions for all category tabs, filter labels, reset, modal semantics, and card generation from data.
- [ ] Implement state derivation during render, focus return/trap, Escape close, body scroll lock, and actual filter/reset actions.
- [ ] Run focused tests and confirm green.

### Task 4: Editorial page sections

**Files:**
- Create: `components/tournaments/TournamentsHero.tsx`
- Create: `components/tournaments/FeaturedTournament.tsx`
- Create: `components/tournaments/CompetitionFlow.tsx`
- Create: `components/tournaments/CompetitionBenefits.tsx`
- Create: `components/tournaments/TournamentsFinalCta.tsx`
- Modify: `app/tournaments/page.tsx`

**Interfaces:**
- Server components consume configured tournament data and emit semantic sections with safe CTA states.

- [ ] Add failing content/structure assertions for hero, featured event metadata, lifecycle, benefits, CTA, and seeded-content disclosure.
- [ ] Implement all sections and page metadata.
- [ ] Run focused tests and confirm green.

### Task 5: PeakGG visual system and responsive art direction

**Files:**
- Create: `app/tournaments/tournaments.css`
- Modify: `app/tournaments/page.tsx`

**Interfaces:**
- Route-scoped `.tournaments-page` styling; no homepage selector changes required.

- [ ] Add failing assertions for route-scoped stylesheet, responsive breakpoints, reduced motion, focus states, stable image ratios, and mobile sheet rules.
- [ ] Implement the compact hero, featured broadcast composition, varied editorial cards, paper information rhythm, desktop/tablet/mobile layouts, and restrained motion.
- [ ] Run lint, build, focused tests, homepage tests, and `git diff --check`.

### Task 6: Browser QA and design critique

**Files:**
- Create: `tests/tournaments-browser-audit.mjs`

**Interfaces:**
- Automated local-browser report for required viewports, controls, errors, images, overflow, and modal behavior.

- [ ] Start the development server and inspect 1920×1080, 1440×1000, 1024×768, 430×932, and 390×844.
- [ ] Test tabs, filters, reset, empty state, mobile sheet, keyboard focus, CTA hrefs, images, console, and reduced motion.
- [ ] Perform creative-director/product/player/frontend critique and fix only material findings.
- [ ] Re-run fresh lint, build, all tests, browser QA, and `git diff --check` before reporting.
