# Peak League — Competitive League Ecosystem

A persistent league system (not a one-off tournament) inspired by Serie A / Champions League. MVP ships **Peak League Season 0 Beta**: 8 teams, round robin, top 4 to playoffs, BO3 grand final. Architecture supports future divisions, promotion/relegation, and multi-season history.

Given the size, I'll deliver this in **3 sequential phases**, each independently usable. After phase 1 (DB + read-only league pages) the user can already see Peak League live; phases 2 and 3 add captain workflows and admin tooling.

---

## Phase 1 — Foundation (DB, Public League Browsing)

### Database (single migration)

New tables (all RLS-enabled, public-read where listed):

- `leagues` — name, slug, game, description, rules_md, reward_text, status (`draft|registration_open|registration_closed|ongoing|playoffs|completed`), max_teams, min_roster_size, banner_url. **Public read.**
- `league_seasons` — league_id, name (e.g. "Season 0 Beta"), season_number, format (`round_robin|playoffs|hybrid`), starts_at, ends_at, registration_deadline, playoff_size, status. **Public read.**
- `league_divisions` — season_id, name, tier (1=top), capacity. (Season 0 has one division.) **Public read.**
- `league_registrations` — season_id, division_id, team_id, status (`pending|approved|rejected|withdrawn`), submitted_by, decided_by, decided_at. Captain-write, admin-decide, public-read approved.
- `league_standings` — division_id, team_id, played, wins, draws, losses, points, round_diff, form (text[5]), position. Auto-created on approval, auto-updated on confirmed matches. **Public read.** Service/admin write.
- `matches` (extend existing): add `season_id`, `division_id`, `matchday`, `scheduled_at`, `result_status` (`scheduled|live|awaiting_result|pending_confirmation|confirmed|disputed|admin_resolved|cancelled`), `submitted_by`, `submitted_at`, `confirmed_by`, `confirmed_at`. Keep current `team_a_id/team_b_id/score_a/score_b/status` for backward compat.
- `match_results` — match_id, submitted_by_team_id, score_a, score_b, map, notes, screenshot_url, created_at. Captain insert.
- `match_disputes` — match_id, opened_by, reason, evidence_url, status (`open|resolved|rejected`), resolved_by, resolution_note.
- `match_rosters` — match_id, team_id, user_id, role (`starter|sub|coach`). Captain manages.
- `coach_notes` — team_id, author_id, match_id (nullable), title, body, visibility (`team|coach_only`).
- `trophies` — team_id, season_id, kind (`champion|runner_up|semifinalist|playoff|participation`), awarded_at.

Extend `team_members.role` enum usage to support `captain|member|coach` (keep text column, validate in app).

### RPCs (SECURITY DEFINER)

- `register_team_for_season(_season_id, _team_id)` — checks captain, min roster, no duplicate, season open.
- `approve_league_registration(_registration_id)` — admin only, creates `league_standings` row.
- `submit_match_result(_match_id, _score_a, _score_b, _map, _notes, _screenshot)` — captain of one team; sets match `pending_confirmation`.
- `confirm_match_result(_match_id)` — captain of *opponent* team; sets `confirmed`, calls `recompute_standings_for_match`.
- `dispute_match_result(_match_id, _reason, _evidence)` — opposing captain; sets `disputed`, freezes standings.
- `admin_resolve_match(_match_id, _score_a, _score_b, _winner_team_id)` — admin; sets `admin_resolved`, recomputes standings.
- `recompute_standings_for_division(_division_id)` — full recompute from confirmed/admin_resolved matches.
- `generate_round_robin_fixtures(_season_id, _division_id, _start_date, _days_between)` — admin; circle method, 1 game per matchday per team.
- `generate_playoff_bracket(_season_id, _division_id)` — admin; seeds top N by standings into existing bracket structure (reuses `matches.bracket_position` / `next_match_id` already in schema).
- `award_season_trophies(_season_id)` — admin; champion/runner-up/semifinalists.

### Frontend pages (Phase 1)

- `/leagues` — list cards (name, game, season, team count, status pill, reward, CTA).
- `/leagues/:leagueId` — tabs: Overview, Standings, Schedule, Teams, Playoffs, Rules, Stats. Read-only for non-captains. Conditional "Register Team" CTA if user is captain of an eligible team.
- `/leagues/:leagueId/standings` — football table (Pos, Logo, Team, P, W, D, L, Pts, RD, Form last 5). Top 4 highlighted as playoff zone, bottom rows as future relegation zone, current user team row glows.
- `/leagues/:leagueId/schedule` — grouped by matchday, match cards with status pills, link to match page.
- Footer + nav: add "Peak League" link.

### Demo seed (Season 0 Beta)

A separate idempotent SQL seed (run by admin via button in Phase 3, or manually) inserting:
- 1 league "Peak League", 1 season "Season 0 Beta", 1 division "Premier".
- Marker columns so demo rows can be deleted later (`is_demo boolean default false`).

i18n EN/FR/IT keys for all new copy.

---

## Phase 2 — Match Workflow + Team Dashboard

### Pages

- `/matches/:matchId` — Team A vs Team B header cards, score, matchday, map, scheduled time, status pill, rosters list (from `match_rosters`), coach line, comments thread (reuse existing `team_messages` pattern scoped per match → new lightweight `match_messages` or reuse), clip embeds if `clips.match_id` exists. Action buttons gated by role:
  - Captain (submitter side): Submit Result
  - Captain (opposite side): Confirm / Dispute
  - Admin: Edit / Resolve / Cancel
- `/team-dashboard` (or `/teams/:teamId/dashboard` for the user's primary team) — tabs: Overview, Roster, League, Matches, Applications, Coach Notes, Settings.
  - Overview: identity, current standing card, next match countdown, last 3 results.
  - Roster: members with role chips, captain controls (invite, remove, role change).
  - League: registration status, points, division, "Register to open league" button.
  - Matches: upcoming / past / pending confirmations / disputed.
  - Applications: list of `team_join_requests` with accept/reject (already exists in schema).
  - Coach Notes: list + create modal (captain or coach).
  - Settings: link to existing `/teams/:teamId/manage`.

### Components

- `StandingsTable`, `MatchCard`, `MatchdayGroup`, `StatusPill`, `TeamMiniCard`, `FormDots` (W/D/L circles), `ScoreSubmitDialog`, `DisputeDialog`, `RosterPicker`.

---

## Phase 3 — Admin League Console

`/admin/leagues` (RoleGuard `admin`) with sub-tabs:

- Leagues & Seasons CRUD (create league, create season, set deadlines, change status).
- Registrations queue (approve/reject, see roster snapshot).
- Fixtures (button: Generate Round Robin → calls RPC; manual edit dates inline).
- Matches list (filter by status, edit, force-resolve, cancel).
- Disputes queue (review evidence, resolve with score override).
- Standings (manual recompute button per division, manual point adjustment with audit log).
- Playoffs (Start Playoffs → seeds bracket; uses existing `BracketView`).
- Close Season (finalize, awards trophies, sets `completed`).
- Admin Logs (existing `admin_logs` table, filter by `target_type` containing `league|match|registration`).
- Demo Data: "Seed Season 0 Beta" / "Wipe Demo" buttons.

Add admin sidebar entry "Peak League".

---

## Technical Notes

- All new tables: RLS on; public SELECT for `leagues`, `league_seasons`, `league_divisions`, approved `league_registrations`, `league_standings`, `matches`, `trophies`. Captain-scoped writes via `is_team_captain(uid, team_id)` SECURITY DEFINER helper. Admin via existing `has_role`.
- Reuse existing `matches` table — additive columns only, no breaking change to current tournament/scrim flow.
- Round-robin: classic circle method, fixed pivot. For odd team counts, one bye per matchday (not used in MVP since N=8).
- Standings recompute: pure function over confirmed matches → simpler than incremental, avoids drift bugs.
- Realtime: subscribe to `matches` and `league_standings` on standings/schedule pages so scores update live.
- Mobile: standings table → horizontal scroll with sticky team col; match cards stack; team dashboard tabs become a `Select` on `<md`.
- Follow workspace rules: TS only, RLS on, EN/FR/IT i18n, mobile responsive, dark theme tokens (no raw colors), SEO meta on public pages, footer link.

---

## Delivery Order in this loop

1. Run **migration** for all Peak League tables + RPCs + helper functions (Phase 1 + 2 + 3 schema in one go so types regenerate once).
2. Build Phase 1 pages (`/leagues`, `/leagues/:id` with tabs, standings, schedule).
3. Build Phase 2 (`/matches/:id` workflow, `/team-dashboard`).
4. Build Phase 3 (`/admin/leagues` console + demo seed buttons).
5. Add nav + footer links, i18n keys, SEO tags. Verify build.

I'll start by executing the migration (it requires your approval), then proceed through the phases without further check-ins unless something blocks me.