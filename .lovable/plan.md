## Phase 2 — Community Cup #1 Match-Day System

Build on top of Phase 1 (no rewrites). Goal: every bracket match becomes a playable match room with veto, chat, result reporting, disputes, and full admin override.

### Scope summary

1. **Match Room page** at `/tournaments/community-cup-1/matches/:matchId`
2. **Captain map veto** (admin manual / random / BO1 / BO3) on top of `match_map_veto`
3. **Match chat** (`match_chat_messages`) — captains + admin + system events
4. **Captain result reporting** + admin confirm/override
5. **Disputes** from match room
6. **Admin Matches tab upgrade** (full per-match controls)
7. **Per-round BO format overrides** (per-match minimum)
8. **Public live bracket polish** (status badges, View Match button)

### Database changes

`**matches` (add columns)**

- `selected_map text`, `map_selection_mode text`, `veto_status text` (`not_started|veto_pending|map_selected|locked`)
- `result_screenshot_url text`, `result_notes text`, `reported_by_user_id uuid`
- `chat_locked boolean default false`, `admin_note text`
- `bo_format text` (per-match override; falls back to tournament default)

`**match_map_veto**` — verify columns: `mode, status, current_turn_team_id, current_turn_signup_id, selected_map, banned_maps jsonb, picked_maps jsonb, veto_log jsonb, started_at, completed_at`. Add what's missing.

`**match_chat_messages**` — already exists for queue chat. Verify it supports tournament matches (`match_id` FK to `matches`). Add `is_system_message bool`, `sender_role text` if missing.

**RPCs (SECURITY DEFINER, server-side validation)**

- `start_match_veto(_match_id, _mode)` — admin only
- `captain_ban_map(_match_id, _map)` — checks current turn = caller's team's signup
- `captain_pick_map(_match_id, _map)` — same
- `complete_match_veto(_match_id, _selected_map)` — admin or auto when 1 left
- `reset_match_veto(_match_id)` — admin
- `submit_tournament_match_result(_match_id, _score_a, _score_b, _screenshot, _notes)` — captain of A or B
- `admin_confirm_tournament_result(_match_id)` — admin; advances winner via existing bracket logic
- `open_tournament_match_dispute(_match_id, _reason, _description, _evidence)` — captain
- `set_match_chat_locked(_match_id, _locked)` — admin

**RLS**

- `matches`: captains (signup approved + member of team_a/team_b) can SELECT their match details; public sees basic fields via existing patterns
- `match_map_veto`: SELECT public for the match; UPDATE only via RPC
- `match_chat_messages`: SELECT for captains+admins of that match (or all if `chat_locked=false` and admin allows public); INSERT for captains+admin via RPC/policy

### Frontend

**New files**

- `src/pages/CommunityCupMatchRoom.tsx` — match room page
- `src/components/tournaments/match-room/MatchHeader.tsx`
- `src/components/tournaments/match-room/MapVetoPanel.tsx` (active pool, banned, picked, current turn, log, captain action buttons)
- `src/components/tournaments/match-room/MatchChatPanel.tsx` (reuses chat patterns from `MatchChat.tsx`)
- `src/components/tournaments/match-room/ResultReportForm.tsx`
- `src/components/tournaments/match-room/DisputeDialog.tsx`
- `src/components/tournaments/match-room/AdminMatchControls.tsx`
- `src/lib/match-veto.ts` — client helpers (turn calc, BO3 step machine)

**Edits**

- `src/pages/CommunityCupDetail.tsx` — bracket cards get "View Match" button + status badges (LIVE / Veto / Pending / Disputed)
- `src/components/tournaments/BracketView.tsx` — link match cards to match room
- `src/pages/admin/sections/AdminCommunityCup.tsx` — Matches tab gets per-match: Open Room / Start Veto / Reset / Force Map / Set Status / Edit Score / Confirm / Forfeit / Dispute / Lock Chat / BO override
- `src/App.tsx` — add route

### Microcopy & states

- Disabled buttons + tooltips: "Not your turn", "Veto not started yet", "Only your team's captain can act"
- Toasts on every mutation
- Loading skeletons, empty states, error boundaries

### Out of scope (deferred again)

- Both-captains-confirm result mode (kept admin-confirm)
- Automated permanent-team conversion
- Veto timers (soft only, no auto-action)
- Per-round (vs per-match) BO/veto-mode editor — per-match override is enough for today

### Migration order

1. Migration: add columns + tables + RPCs + RLS
2. Build Match Room shell + routing
3. Veto panel + RPCs wired
4. Chat panel
5. Result reporting + dispute
6. Admin controls upgrade
7. Public bracket polish + status badges

Approve and I'll start with the migration.Approve this plan.

Important priorities:

1. Build additively on Phase 1.

2. Do not rewrite the existing tournament, registration, admin, countdown or map pool systems.

3. Keep admin override available for every match action.

4. If captain-driven veto is too complex, ship admin-manual + BO1 veto first.

5. Match room, result reporting and admin confirmation are more important than advanced BO3/BO5 veto.

6. Keep all private captain/admin data protected.

7. Do not create fake/demo teams.

8. Keep the build stable and usable today.

&nbsp;