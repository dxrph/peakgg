# PeakGG Full Platform Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete database-backed PeakGG competitive platform and its public, authenticated, match-operation, leaderboard, and staff workflows.

**Architecture:** Keep vinext/Next App Router and the approved PeakGG visual shell. Add Supabase SSR authentication, a migration-driven Postgres/RLS backend, server-authorized domain operations, server-rendered route surfaces, and focused client interaction islands. Core competition mutations are database functions so validation, state changes, audit records, bracket advancement, and TP awards remain transactional.

**Tech Stack:** Next 16 App Router via vinext, React 19, TypeScript, Supabase Auth/Postgres/RLS/Realtime/Storage, CSS, Node test runner, ESLint.

**Spec:** `docs/peakgg-architecture.md` and the user-provided PeakGG Final Master Implementation Specification.

## Global Constraints

- Use only Big Shoulders, Instrument Sans, and JetBrains Mono.
- Use only the locked PeakGG black, paper, graphite, muted, and red palette.
- Do not expose service-role credentials or trust client-supplied identities, roles, winners, membership, or TP.
- Production paths use database data or honest empty states; development seeds remain isolated.
- Preserve current valid assets and migrations; there were no existing Supabase migrations at audit time.
- Every primary CTA must navigate, perform a real operation, or use disabled semantics.

---

### Task 1: Supabase foundation and schema

**Files:** Create `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `lib/supabase/database.types.ts`, `middleware.ts`, `supabase/config.toml`, and `supabase/migrations/202608230001_peakgg_platform.sql`. Modify `package.json`.

**Interfaces:** Produces typed clients, `updateSession(request)`, schema tables, RLS policies, storage policies, indexes, triggers, and security-definer competition functions.

- [ ] Write failing schema contract tests covering all required tables, enums, indexes, RLS, buckets, and RPC names.
- [ ] Run the tests and confirm missing schema contracts fail.
- [ ] Add Supabase packages and implement clients without service-role usage.
- [ ] Implement the additive migration, authorization helpers, transactional RPCs, and generated-compatible database types.
- [ ] Run schema tests and TypeScript build until green.

### Task 2: Domain rules and tests

**Files:** Create `lib/domain/auth.ts`, `lib/domain/teams.ts`, `lib/domain/tournaments.ts`, `lib/domain/matches.ts`, `lib/domain/points.ts`, and `tests/domain/*.test.mjs`.

**Interfaces:** Produces pure validation and state-machine functions shared by forms and server operations.

- [ ] Write failing tests for auth guards, team validation/capacity/invites, registration eligibility/duplication/roster lock, check-in, match confirmation/disputes, TP calculations, and admin authorization.
- [ ] Confirm every test fails for a missing behavior.
- [ ] Implement the smallest typed domain functions satisfying the exact rules.
- [ ] Run the domain and existing visual tests; refactor only while green.

### Task 3: Global product shell and states

**Files:** Modify `components/shared/SiteHeader.tsx`, `components/shared/SiteFooter.tsx`, `app/brand.css`; create `components/ui/*`, `components/auth/AuthProvider.tsx`, and `app/not-found.tsx`.

**Interfaces:** Produces authenticated nav, notification affordance, status/empty/loading/error components, dialogs, fields, buttons, and branded not-found/access-denied surfaces.

- [ ] Write failing shell/accessibility contract tests.
- [ ] Implement session-aware navigation and configured-link hiding.
- [ ] Implement reusable straight-geometry product primitives and focus behavior.
- [ ] Verify desktop/mobile navigation, scroll lock, reduced motion, and no dead links.

### Task 4: Authentication and onboarding

**Files:** Create route groups/pages/actions for `/login`, `/register`, `/forgot-password`, `/onboarding`, `/profile`, and `/settings` plus auth components.

**Interfaces:** Produces real email/password registration/login/reset, validated internal return URLs, mandatory onboarding, profile editing, and sign-out.

- [ ] Write failing validation/action tests.
- [ ] Implement server-side actions and inline error contracts.
- [ ] Build responsive branded forms and password recovery callback handling.
- [ ] Verify protected-route redirects and configured/unconfigured states.

### Task 5: Public discovery and profiles

**Files:** Create `/play`, `/players`, `/players/[username]`, `/teams`, `/teams/[slug]`, `/leaderboard`, `/ranks`, `/about`, `/privacy`, and `/terms`; create `PlayerCard`, `TeamCard`, `ProfileHeader`, and `LeaderboardRow`.

**Interfaces:** Produces query-backed public directories, URL filters, honest empty states, profile/team history, and ledger-derived leaderboards.

- [ ] Write failing route/copy/filter tests.
- [ ] Implement typed read queries and not-found handling.
- [ ] Implement responsive editorial directories and tables.
- [ ] Verify all public navigation paths and empty database behavior.

### Task 6: Team lifecycle

**Files:** Create `/teams/create`, `/dashboard/team`, team actions/components, invite/application notification operations, and confirmation dialogs.

**Interfaces:** Produces create, invite, accept/decline, apply, roster movement, leadership changes, leave, transfer, and disband flows backed by protected RPCs.

- [ ] Write failing action tests for ownership and capacity edge cases.
- [ ] Implement team forms and protected mutations.
- [ ] Implement roster/application/invite management and destructive confirmations.
- [ ] Verify captain/co-captain/member permission boundaries.

### Task 7: Tournament discovery, detail, and registration

**Files:** Reconcile `/tournaments`; create `/tournaments/[slug]`, tournament tabs, registration flow components/actions, and `/dashboard/tournaments`.

**Interfaces:** Produces database-backed discovery, state-aware CTA logic, four-step registration, waitlist, roster snapshots, roster management, and check-in.

- [ ] Write failing CTA, registration, roster, concurrency, and check-in tests.
- [ ] Replace production seed dependency with query results and explicit development-only adapter.
- [ ] Implement public detail tabs and one focused registration flow.
- [ ] Implement registration/check-in RPC calls and dashboard state actions.
- [ ] Verify closure-during-flow, duplicate, full-capacity, and roster-lock errors.

### Task 8: Bracket and match room

**Files:** Create bracket components, `/matches/[id]`, `/dashboard/matches`, match actions, result flow, dispute flow, and realtime chat client.

**Interfaces:** Produces single-elimination bracket rendering, participant access checks, ready states, chat, participation capture, result submission/confirmation, and dispute creation.

- [ ] Write failing bracket/match lifecycle tests.
- [ ] Implement match authorization and query layer.
- [ ] Implement responsive match room tabs and Realtime chat.
- [ ] Connect transactional result confirmation and dispute operations.
- [ ] Verify no duplicate submission or premature bracket advancement.

### Task 9: Dashboard and notifications

**Files:** Create `/dashboard`, `/dashboard/notifications`, dashboard modules, notification actions, and navbar notification panel.

**Interfaces:** Produces personal next-action dashboard, real summaries, unread count, mark-read, and mark-all-read.

- [ ] Write failing dashboard relevance and notification tests.
- [ ] Implement user-scoped queries and actions.
- [ ] Build responsive modules with all exact empty-state copy.
- [ ] Verify notification links resolve to valid internal routes.

### Task 10: Admin control room

**Files:** Create all `/admin` routes, `AdminSidebar`, `AdminTable`, `AdminActionDialog`, tournament wizard, management tabs, bracket controls, disputes, moderation, announcements, and audit UI.

**Interfaces:** Produces server-protected staff operations using role checks and audited RPCs.

- [ ] Write failing admin authorization and audit contract tests.
- [ ] Implement server guard and control-room shell.
- [ ] Implement the exact eight-step tournament wizard and chronology validation.
- [ ] Implement registrations, bracket, matches, disputes, users, teams, announcements, and audit screens/actions.
- [ ] Verify every privileged mutation requires the correct role and audit reason.

### Task 11: Homepage data integration

**Files:** Modify approved homepage components only to connect exact CTAs and real tournament data while preserving section hierarchy and visual art direction.

**Interfaces:** Produces the exact eleven-section homepage, nearest-published-event query, published circuit, session-aware hero CTA, and labeled match-room product preview.

- [ ] Write failing homepage route/action/data tests.
- [ ] Reconcile the existing sections to the exact locked order and copy.
- [ ] Connect real data and honest empty states without fake activity.
- [ ] Visual-regression review against the approved PeakGG art direction.

### Task 12: End-to-end validation and documentation

**Files:** Update tests, `docs/peakgg-architecture.md`, and `docs/peakgg-local-setup.md` only where implementation evidence requires correction.

**Interfaces:** Produces verified local setup and completion evidence.

- [ ] Apply migrations to a disposable local Supabase instance and verify constraints, indexes, RLS, functions, and storage policies.
- [ ] Exercise the visitor-to-leaderboard and admin event loops in Chromium at all five target viewports.
- [ ] Check primary routes for overflow, accessibility, dead CTAs, console errors, and asset failures.
- [ ] Run the complete automated suite, `npm run lint`, `npm run build`, and `git diff --check`.
- [ ] Report every genuine external-configuration blocker precisely.
