# Peak League — Final Pre-Launch Features

Scope: 3 systems only. No redesigns. No changes to existing RLS/RPC behavior — only additions.

---

## 1. Database Migration (single migration)

### New tables

**team_chat_messages**
- id, team_id, channel ('general' | 'match_prep' | 'announcements'), user_id, content, pinned (bool), created_at
- RLS: team members read/write, captain/coach update pinned, owner/captain delete

**match_chat_messages**
- id, match_id, user_id, content, created_at
- RLS: read+write for team_a/team_b members, coaches, admins

**match_ready_checks**
- id, match_id, team_id, user_id, ready (bool), updated_at, unique(match_id, team_id)
- RLS: captain of team writes own row; anyone reads

**team_invitations**
- id, team_id, invited_user_id, invited_by, status ('pending'|'accepted'|'rejected'), created_at, decided_at
- RLS: captain creates/cancels; invited user reads + updates own status

### Schema additions
- `coach_notes`: add `visibility` already exists ('team'); extend allowed values to include 'captains_only', 'coaches_only' (text — no enum change needed)
- `team_members`: ensure `role` text supports 'captain', 'coach', 'member' (already free text)
- `matches`: add `lobby_code text`, `server_info text`
- `league_seasons`: already has `playoff_size`. Add `playoffs_started_at timestamptz`, `champion_team_id uuid`
- `trophies`: already exists for champion award

### New RPCs

- `set_match_ready(_match_id, _ready boolean)`: captain only; upserts row; if both teams ready → set match `result_status='live'`, `status='in_progress'`; if either unreadies → revert to 'scheduled'.
- `start_playoffs(_season_id)`: admin only; freeze standings; pick top 4 by standings; create semifinal matches (1v4, 2v3) with `result_status='scheduled'`, `matchday=999` (playoff marker), `bracket_position` 1/2; create grand final with `next_match_id` linkage; set season `playoffs_started_at`.
- Reuse existing `advance_bracket_winner` trigger to auto-advance winners (already exists for tournaments — extend or create league variant).
- `award_league_champion(_season_id)`: when grand final confirmed, insert trophy + champion badge, set `champion_team_id`.
- `invite_to_team(_team_id, _user_id)`: captain only.
- `respond_team_invite(_invitation_id, _accept boolean)`: invited user; on accept, insert into team_members.
- `set_team_member_role(_team_id, _user_id, _role)`: captain only.
- `remove_team_member(_team_id, _user_id)`: captain only; cannot remove captain.

### Triggers
- On `matches` UPDATE, when `result_status` becomes 'confirmed'/'admin_resolved' AND it's the grand final (no `next_match_id` AND season has `playoffs_started_at`), call `award_league_champion`.
- Extend `advance_bracket_winner` to also fire for league playoff matches (currently checks `tournament_id`).

### Realtime
- ALTER PUBLICATION supabase_realtime ADD TABLE team_chat_messages, match_chat_messages, match_ready_checks.
- REPLICA IDENTITY FULL on those tables.

---

## 2. Frontend

### New pages
- `src/pages/TeamDashboard.tsx` at `/teams/:teamId/dashboard` (and alias `/team-dashboard` redirects to user's first captained team)
  - Tabs: Overview, Roster, League, Matches, Applications, Coach Notes, Team Chat, Settings
  - Permission gating via `is_team_captain` / `is_team_member` checks loaded once
- Each tab as a small subcomponent in `src/components/team-dashboard/`

### Match page additions (`src/pages/MatchDetail.tsx`)
- Add Match Chat panel (realtime)
- Add Ready Check buttons for captains
- Add lobby code / server info input (captain edit)
- Show "MATCH LIVE" banner when `result_status='live'`

### Playoffs UI
- New tab "Playoffs" in `src/pages/LeagueDetail.tsx`
- Bracket component `src/components/leagues/PlayoffBracket.tsx`: 2 semis + final, status pills, winner highlight, champion crown
- Admin "Start Playoffs" button in `AdminLeagues.tsx`

### Routing
- Add routes in `App.tsx`:
  - `/teams/:teamId/dashboard` → `TeamDashboard` (Protected)
  - `/team-dashboard` → redirect helper
- Add "Manage / Dashboard" link from existing TeamDetail manage page.

### i18n
- Add new keys to en/fr/it translation files for new labels (chat tabs, ready check, playoff stages).

---

## 3. QA After Implementation

Run through manually via preview:
- Captain creates team → opens dashboard → all tabs render
- Member sees read-only roster/settings
- Admin starts playoffs → bracket renders → confirm semifinal → winner advances → confirm final → champion + trophy awarded
- Two captains hit Ready → match goes Live → one unreadies → returns to Scheduled
- Match chat: only members + admin can post, others get RLS error
- Mobile (375px): tabs stack, bracket scrolls horizontally
- No console/network errors on /admin/leagues, /leagues/:id, /matches/:id, /teams/:id/dashboard

---

## Delivery order

1. Run migration (all DB changes in one file).
2. Build TeamDashboard page + subcomponents.
3. Add match chat + ready check to MatchDetail.
4. Build playoff bracket + Start Playoffs admin action.
5. Wire navigation + i18n.
6. QA pass.

Estimated: large but bounded — no scope creep beyond the 3 listed systems.
