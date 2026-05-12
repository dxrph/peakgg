# Community Cup #1 — Today's Scope

You asked for a massive upgrade. To make it **usable today**, I'm splitting it into **Phase 1 (today)** and **Phase 2 (later)**. Phase 1 covers everything you marked as priority. Phase 2 holds advanced/automated features that risk breaking the live tournament.

---

## Phase 1 — Ship today

### A. Database (one migration)

Add to `tournaments`:

- `starts_at`, `ends_at`, `timezone` (default `Europe/Brussels`)
- `registration_opens_at`, `registration_closes_at`
- `checkin_opens_at`, `checkin_closes_at`
- `countdown_enabled` (bool, default true)
- `match_format_default` (text, default `BO1`)
- `match_format_final` (text, default `BO3`)
- `map_selection_mode` (text, default `admin_manual`)
- `result_confirmation_mode` (text, default `admin_manual`)
- `third_place_enabled` (bool), `forfeit_grace_minutes` (int, default 10)
- `tagline`, `rules_url`, `discord_url` (if missing)

Add to `tournament_team_signups`:

- `wants_permanent_team` (bool)
- `permanent_team_request_note` (text)
- `admin_note` (text, admin-only via RLS)

New table `tournament_map_pool`:
`id, tournament_id, map_name, is_active, display_order, image_url, created_at, updated_at`
RLS: public read of `is_active=true`; admin full write.

New table `match_map_veto`:
`id, match_id, tournament_id, mode, status, current_turn_team_id, selected_map, banned_maps jsonb, picked_maps jsonb, veto_log jsonb, started_at, completed_at`
RLS: public read; admin write; captains write only for their match (Phase 2 — for now admin-only writes).

(Match chat: skipped today — see Phase 2.)

### B. Registration form redesign (`CommunityCupSignupDialog.tsx`)

- Convert to a **4-step wizard** with progress indicator: Team → Captain → Players → Rules.
- Section cards, better spacing, helper text, sticky footer with Back/Next/Submit.
- Add **temporary roster explanation banner** at top + new agreement checkbox (`I understand this registration does not create a permanent PeakGG team`).
- Add optional **"interested in permanent team"** checkbox + note textarea.
- Mobile-responsive, scroll-friendly.
- Persist `wants_permanent_team` and `permanent_team_request_note`.

### C. Countdown

New `<TournamentCountdown />` component:

- Picks the most relevant target: check-in close > registration close > tournament start.
- Shows `Days · Hours · Minutes · Seconds` with a contextual label.
- Falls back to `"Date and time will be announced soon."` if `starts_at` is null.
- Mounted on `CommunityCupDetail` hero and on `Tournaments.tsx` featured card.

### D. Public page additions (`CommunityCupDetail.tsx`)

- Countdown block in hero.
- New **"Map Pool & Veto"** section: lists active maps from `tournament_map_pool`; if empty, shows the default VALORANT pool with label *"Default VALORANT map pool"*. Shows the configured `map_selection_mode` in human-readable form.
- Temporary roster explanation paragraph in the About / sidebar.

### E. Admin panel (`AdminCommunityCup.tsx` upgrade)

Tabs (today): **Overview · Settings · Registrations · Map Pool · Matches**.

- **Overview**: status cards (registrations by status, slots, countdown preview, map pool status, bracket status) + quick actions (open/close registration, open/close check-in, start, complete, generate bracket button — bracket button calls existing `generate_bracket` RPC).
- **Settings**: edit all new tournament fields above (dates, formats, modes, tagline, etc.) with save button. Status switcher kept.
- **Registrations**: keep existing approve/reject/waitlist; add column for "Wants permanent team" + note + admin_note editor + CSV export (already exists).
- **Map Pool**: list maps, add/remove/toggle active, reorder (up/down), reset to default VALORANT pool button. If no rows exist, "Initialize with VALORANT default" CTA.
- **Matches**: list tournament matches; per match → set map manually, set scores, pick winner, mark forfeit, advance winner. (Veto handled admin-manual today; auto captain veto in Phase 2.)

### F. Map veto — admin-manual today

Per your instruction *"If something is too complex, make it admin-manual first"*: today the admin selects the map per match from the active pool. The `match_map_veto` row is written so we can swap to captain veto in Phase 2 without schema changes.

---

## Phase 2 — Later (explicitly deferred)

- Captain-driven map veto UI (BO1 ban-until-one, BO3/BO5 pick-ban flows)
- Per-round format overrides
- Match chat + admin chat moderation tab
- Disputes tab dedicated to this tournament (existing global Disputes already works)
- Public Page customization tab, Rules & Rewards CMS tab, Logs/Audit tab
- Automated convert-roster-to-permanent-team flow
- Both-captains-confirm result mode

---

## Technical notes

- All new tables: RLS enabled, admin via existing `has_role(auth.uid(),'admin')`.
- Default VALORANT pool list lives in a TS constant + a "reset" admin action that upserts into `tournament_map_pool`.
- i18n: new strings added to EN/FR/IT translation files.
- No existing flow (registration insert, approval, bracket, RLS) is altered — only additive.

---

**Confirm and I'll execute Phase 1 in one pass** (1 migration + form rewrite + countdown + admin upgrades + public page section). Phase 2 stays queued. Yes, approve this plan.

Priority order:

1. Admin control panel for Community Cup #1

2. Countdown controlled by admin start date/time

3. Improved registration modal UX

4. Temporary tournament roster explanation + permanent team interest option

5. Map pool system with default VALORANT maps if no custom pool exists

6. Admin-manual map selection/veto first

7. Public map pool section on tournament page

8. Match settings controlled by admin: BO1/BO2/BO3/BO5, final format, forfeit time, result confirmation mode

Important:

Do not spend time on complex automation yet.

If something is too complex, make it admin-manual but clean and usable.

Do not break existing tournament registration, bracket, admin actions, or public tournament page.

Do not create fake/demo teams.

Make sure everything is usable today.