# PeakGG Homepage Final Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the approved PeakGG homepage into a coherent, accessible, performant final direction without changing its product or visual identity.

**Architecture:** Preserve the current section-component composition and server-component default. Restrict client state to navigation and dossier interaction; refine shared tokens and component states in the existing stylesheet.

**Tech Stack:** Next.js/vinext, React 19, TypeScript, CSS, `next/image`, Node test runner, headless Edge CDP browser QA.

**Spec:** User-approved final homepage refinement brief in the active conversation.

## Global Constraints

- Homepage only; no internal routes.
- Space Grotesk and JetBrains Mono only.
- Locked palette: `#050506`, `#090A0C`, `#111216`, `#191A1F`, `#F4F2EE`, `#96979D`, `#FF2638`, `#B5091B`, `#650812`.
- Preserve competitive × editorial × VALORANT-inspired × premium esports × cinematic direction.
- Motion uses transform/opacity, stays fast, and resolves under reduced motion.
- Hero image is prioritized; below-fold images remain lazy through `next/image` defaults.

---

### Task 1: Semantic navigation and dossier UX

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/home/Header.tsx`
- Modify: `components/home/Hero.tsx`
- Modify: `components/home/Squad.tsx`
- Modify: `app/globals.css`
- Test: `tests/home-art-direction.test.mjs`

- [ ] Add failing assertions for a skip link, semantic `h1`, active navigation state, and dossier arrow controls.
- [ ] Verify the assertions fail for the missing behavior.
- [ ] Add skip-to-content, `h1`, current-section observer, focus-contained mobile menu, keyboard/arrow dossier navigation, and visible mobile controls.
- [ ] Run unit assertions and browser interaction checks.

### Task 2: Visual hierarchy and image-purpose refinement

**Files:**
- Modify: `components/home/NextTournament.tsx`
- Modify: `components/home/TournamentWorld.tsx`
- Modify: `components/home/Community.tsx`
- Modify: `components/home/RankJourney.tsx`
- Modify: `app/globals.css`

- [ ] Strengthen Community Cup imagery and add concise event date metadata.
- [ ] Give all four event posters distinct compositions using purposeful environment/graphic treatments.
- [ ] Improve community image crop/contrast and transition into the footer.
- [ ] Increase rank progression legibility and Apex climax without adding portraits.

### Task 3: Performance and code-quality pass

**Files:**
- Modify: `app/globals.css`
- Modify as needed: `components/home/*.tsx`
- Test: `tests/home-art-direction.test.mjs`

- [ ] Remove unused motion-era selectors and eliminate `transition: all`/layout animation risks.
- [ ] Confirm stable keys, server-component defaults, image priorities, responsive sizes, and no unnecessary dependencies in the homepage bundle.
- [ ] Add or update structural assertions for locked palette, distinct posters, image loading, and accessible controls.

### Task 4: Critic review and verification

**Files:**
- Use: `tests/home-browser-audit.mjs`

- [ ] Review as creative director, UI, UX, frontend, motion, and accessibility specialist; fix only P0/P1 findings.
- [ ] Capture and inspect full-page renders at 1920×1080, 1440×1000, 1024×768, 430×932, and 390×844.
- [ ] Test all dossier states, mobile menu focus/escape, links, console errors, reduced motion, and horizontal overflow.
- [ ] Run `node --test`, `npm run lint`, `npm run build`, and `git diff --check` with fresh output.
