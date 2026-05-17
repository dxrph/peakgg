## Peak League — Full Competitive League System Rebuild

This is a large, multi-phase build. Below is the scoped plan to deliver a complete, production-grade Peak League system on top of the existing PeakGG codebase, reusing what's already there (we already have `leagues`, `league_seasons`, `league_divisions`, `league_registrations`, `league_standings`, `matches`, `match_results`, `match_disputes`, `match_ready_checks`, `coach_notes`, `teams`, `notifications`, plus admin role checks).

---

### 1. Database (migration)

Reuse existing tables. Add only what's missing:

- `league_seasons`: add `region text default 'EU'`, `match_format text default 'BO1'`, `playoff_match_format text default 'BO3'`, `team_limit int default 8`, `registration_status text default 'open'` ('open' | 'closed'), `visibility text default 'public'`, `schedule_status text default 'not_generated'` ('not_generated' | 'draft' | 'locked' | 'active' | 'completed'), `is_founding_season boolean default false`.
- `league_registrations`: add `is_founding_team boolean default false`, `seed int`. Add UNIQUE (season_id, team_id) to block duplicate apps.
- `matches`: already has `season_id`, `division_id`, `matchday`, `team_a/b`, `score_a/b`, `result_status`, `winner_id`, `bracket_position`, `next_match_id`. Add `stage text default 'regular_season'` ('regular_season' | 'playoff_semi' | 'playoff_final'), `rounds_a int`, `rounds_b int`, `proof_url text`, `confirmation_team_id uuid` (which team still needs to confirm).
- `league_hall_of_fame` (new): `id, season_id, champion_team_id, runner_up_team_id, mvp_user_id, notes, created_at`.
- `league_badges` (new): `id, team_id, season_id, code (founding_team | champion | runner_up | best_record), label, awarded_at`.
- Triggers / RPCs:
  - `recalculate_league_standings(season_id)` — recomputes all standings rows from completed matches, including form (last 5).
  - `generate_league_schedule(season_id)` — single round-robin for N approved teams (circle method), 8 teams → 7 matchdays × 4 matches. Refuses if not exactly `team_limit` approved teams, or if any match in season is already `completed`. Writes matches with `stage='regular_season'`, `result_status='scheduled'`.
  - `generate_league_playoffs(season_id)` — reads top 4 from standings, creates 2 semis (#1v#4, #2v#3) linked via `next_match_id` to a Grand Final. Refuses unless all regular-season matches `completed`.
  - `submit_match_result(match_id, score_a, score_b, rounds_a, rounds_b, proof_url)` — captain only, sets `result_status='pending_confirmation'`, `confirmation_team_id` = opponent team.
  - `confirm_match_result(match_id)` — opponent captain only, sets `completed`, runs standings recalc, advances bracket if playoff.
  - `dispute_match_result(match_id, reason)` — opponent captain only, creates `match_disputes` row, sets `dispute_status='open'`.
  - `admin_resolve_dispute(...)`, `admin_void_match(...)`, `admin_force_complete(...)`.
- RLS:
  - Public read on all league_* and matches with `season_id is not null`.
  - Captains: update only matches involving their team and only via RPCs above (RPC uses `security definer`, validates `is_team_captain(auth.uid(), team_id)`).
  - Admins: full management via `has_role(..., 'admin')`.
  - Hall of fame & badges: public read, admin write.

### 2. Public Peak League page (`/leagues`)

Rebuild `src/pages/Leagues.tsx`:

- Hero: "PEAK LEAGUE" / "Europe's community-driven Valorant league." / "8 teams. 7 matchdays. Top 4 playoffs."
- CTAs: Apply With Your Team (→ team picker dialog, only if captain of a team), View Standings, View Schedule (scrolls to current season detail).
- Stat strip: 8 Teams · 7 Matchdays · BO1 Regular · Top 4 Playoffs · BO3 Finals · Founding Team Badge.
- Current Season card: season name, registration badge, "X/8 teams", progress bar, founding-team perks line, Apply / View Rules buttons.
- List of all seasons below (Hall of Fame entry for completed ones).

### 3. League Detail page (`/leagues/:slug`)

Rebuild `src/pages/LeagueDetail.tsx` with tab routing (`?tab=...`):

1. **Overview** — format, eligibility, points, playoff qualification, captain flow, founding benefits.
2. **Teams** — approved teams only, polished empty state.
3. **Standings** — full table with P, W, L, RW, RL, RD, Pts, Form (last 5). Sort: Pts → W → RD → RW → H2H.
4. **Schedule** — grouped by matchday, each match card with status pill and "View Match" link.
5. **Results** — completed only.
6. **Playoffs** — locked state until reg season completed; then bracket via existing `PlayoffBracket` component (extend to read new stage).
7. **Hall of Fame** — past champions, runners-up, founding teams, MVPs.
8. **Rules** — static markdown.
9. **Admin** — gated by `useUserRoles().isAdmin`, links to `/admin/peak-league`.

Match Details page: extend `src/pages/MatchDetail.tsx` to handle league matches — captain actions (submit/confirm/dispute) and admin overrides.

### 4. Team Dashboard

Extend `src/pages/TeamDashboard.tsx`:

- "Apply to Peak League" section showing current application status (Not Applied / Pending / Approved / Rejected / Waitlisted / Withdrawn).
- Upcoming league matches list, Submit Result / Confirm / Dispute dialogs wired to RPCs.

### 5. Admin Panel — Peak League

New route `/admin/peak-league` (add to `AdminSidebar`, replacing/coexisting with the existing AdminLeagues link), gated by `isAdmin`. Sub-tabs:

1. **Dashboard** — KPIs.
2. **Manage Season** — edit season fields, registration toggle, format/match-format/playoff size, status, visibility.
3. **Applications** — approve / reject / waitlist / message captain.
4. **Teams** — manual add/remove, suspend, change captain, points penalty, assign badges, disqualify.
5. **Schedule Generator** — confirmation modal; calls `generate_league_schedule` RPC; shows draft → Lock Schedule.
6. **Matches** — edit date/teams (pre-lock), set live, enter/correct result, void, reschedule.
7. **Results** — approve/edit/reject/force-complete.
8. **Disputes** — full resolution UI.
9. **Playoffs** — Generate Playoffs From Standings, edit seeds, enter results, publish champion, archive.
10. **Hall of Fame** — manage past records.
11. **Settings**.

### 6. Notifications

Hook notification inserts into each RPC: application submitted/approved/rejected, schedule generated, upcoming match (cron 24h reminder reusing existing edge function pattern), result submitted/confirmed/disputed, dispute resolved, playoffs generated, champion announced.

### 7. i18n, SEO, mobile

- All new strings added to `src/locales/{en,fr,it}/translation.json` under `league.*`.
- `SEO` component on every new page (title <60, desc <160, canonical).
- Mobile-first cards, sticky tabs, horizontal-scroll standings table on small viewports.
- Footer: add "Peak League" link.

### 8. Error prevention & QA

Hard guards (DB + UI) for every item in the user's 26-point QA list. Disabled buttons with tooltips when actions aren't allowed (e.g. "Need 8 approved teams to generate schedule").

---

### Technical specifics

- Tab routing: `useSearchParams` to avoid full re-renders.
- Standings sort handled inside the recalc RPC via `ORDER BY points DESC, wins DESC, round_diff DESC, rounds_won DESC` then written to `position` column.
- Schedule generator: classic circle method, deterministic seed by `season_id` hash for reproducible draft.
- All captain/admin mutations go through `security definer` RPCs — frontend never writes to `matches`/`league_standings` directly for league flows.
- Reuse `TeamLogo`, `StatusPill`, `StandingsTable`, `PlayoffBracket`, `MatchCard` where possible; extend rather than duplicate.

---

### Delivery order (one PR per phase, all in this run)

1. DB migration (schema + RPCs + RLS).
2. Public `/leagues` + `/leagues/:slug` rebuild.
3. Match Details captain/admin actions.
4. Team Dashboard application + match actions.
5. Admin panel `/admin/peak-league`.
6. Notifications + i18n + SEO + footer link.
7. QA pass against the 26-point checklist.

This is large — expect this to land across multiple file writes in a single run. No fake/demo data is seeded; everything starts empty with polished empty states.  

This plan is good and we want to keep the same production-grade approach, but we need one important correction before implementation:

Peak League must NOT be locked to exactly 8 teams.

The league must be dynamic and based on the number of teams that actually apply and get approved by admins.

So please update the previous plan with this logic:

- Captains apply with their team.

- Admin reviews applications.

- Admin approves valid teams.

- When registrations close, the system counts the approved teams.

- The system recommends the best format based on the approved team count.

- Admin confirms or manually overrides the format.

- Then the system generates schedule, standings, playoffs and matchdays.

Remove all hard dependencies on:

- exactly 8 teams

- X/8 teams

- “Need 8 approved teams to generate schedule”

- fixed 7 matchdays only

- fixed Top 4 playoffs only

Replace `team_limit` as a hard requirement with:

- min_team_count default 4

- max_team_count optional

- recommended_min_teams default 8

- recommended_max_teams default 12

- generated_format jsonb

- format_status: not_generated / generated / locked

Public page should show:

- Approved Teams: X

- Pending Applications: X

- Minimum Required Teams: 4

- Recommended Teams: 8–12

- Registration Status

- Format Status

- Schedule Status

Public copy:

“Peak League adapts to the teams that register. Once registrations close, the final format, schedule and playoffs are generated automatically.”

Dynamic format rules:

If approved teams are 4–7:

- Single Round-Robin

- Top 2 Final

- BO1 regular season

- BO3 final

If approved teams are 8–10:

- Single Round-Robin

- Top 4 Playoffs

- BO1 regular season

- BO3 semifinals and final

If approved teams are 11–14:

- Single Round-Robin

- Top 6 Playoffs

- Top 2 get semifinal seed advantage

- BO1 regular season

- BO3 playoffs

If approved teams are 16 or more:

- Recommend groups/divisions instead of one huge league

- Admin can choose:

  1. Two groups/divisions

  2. Full league

  3. Split into divisions

- Top teams qualify to playoffs

Odd team count rule:

If the number of approved teams is odd, the schedule generator must support bye weeks.

Example:

9 teams = 9 matchdays, 4 matches per matchday, 1 team on bye each matchday.

Schedule generator must:

- use only approved teams

- exclude pending/rejected teams

- support 4 to 20 teams

- support odd and even team counts

- prevent duplicate matches

- prevent a team from playing twice in one matchday

- never delete completed matches

- allow regeneration only before schedule is locked or before any match is completed

Admin panel must include a Format Builder section.

Format Builder should show:

- Approved teams count

- Pending applications count

- Recommended format

- Number of matchdays

- Number of total matches

- Playoff structure

- Warning if team count is too low

- Warning if team count is too high

Admin actions:

- Close registrations

- Reopen registrations

- Generate recommended format

- Manually override format

- Generate schedule

- Lock schedule

- Start season

Database/RPC update:

Replace the fixed `generate_league_schedule(season_id)` logic with:

1. `generate_league_format(season_id)`

- counts approved teams

- refuses if fewer than min_team_count

- recommends format based on team count

- writes generated_format to league_seasons

2. `generate_league_schedule(season_id)`

- reads approved teams

- reads generated_format

- supports bye weeks

- creates matchdays

- creates matches

- refuses if completed matches exist

QA must include:

- 3 approved teams → cannot start

- 4 approved teams → Top 2 Final format

- 7 approved teams → bye weeks work

- 8 approved teams → Top 4 playoffs

- 9 approved teams → bye weeks work

- 12 approved teams → Top 6 playoffs

- 16 approved teams → group/division recommendation

- pending teams are not included

- rejected teams are not included

- schedule has no duplicate matches

- no team plays twice in one matchday

- public page correctly shows generated format

Keep everything else from the previous plan:

- admin panel

- match details

- captain result submit/confirm/dispute

- public standings

- public results

- Hall of Fame

- badges

- notifications

- RLS/security

- polished empty states

- no fake/demo teams

- mobile UI

- SEO/i18n