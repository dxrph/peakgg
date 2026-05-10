## Competitive UX Polish Plan

A scoped pass to make the working competitive loop feel professional, without touching the queue/match/ELO engine, RLS, or formula.

### What I'll change

**1. Match Room rework — `src/pages/MatchDetail.tsx**`

- New top header: mode badge (Open Cup Beta / Ranked Beta), 1v1 Test Queue badge, game badge, status badge, short match ID, created time.
- New scoreboard: Player A card · centered score+VS · Player B card. Each card: avatar, username, rank badge, current ELO, ELO delta (after completion), winner/loser highlight, ready/result chip.
- Three columns below on desktop / stacked on mobile: Action panel (submit/confirm/dispute) · Instructions · Communication panel.
- Footer no longer touches the cards (proper min-height + spacing).
- Mobile: single column, full-width buttons, no horizontal overflow.

**2. Result voting state machine (frontend only)**
Drives off existing `matches` columns: `submitted_by`, `submitted_at`, `result_status`, `winner_id`, `score_a/b`, `confirmed_at`.

- State A (no result): both see **Submit Result**.
- State B (`pending_confirmation`): submitter sees "Waiting for opponent confirmation" + summary; opponent sees opponent's submission + **Confirm Result** / **Dispute Result**.
- State C (`completed`): final scoreboard + ELO delta.
- State D (`disputed`): "Under admin review" banner; admin sees resolve tools.
- Fix: opponent never sees "nothing to confirm" when a pending submission exists — UI is driven by `result_status`, not by who submitted last.

**3. Submit Result modal polish**

- Two large winner cards ("I won" / "Opponent won") with selected highlight.
- Submit button disabled until pick; loading state; success/error toast; auto-close + page refresh on success.
- Helper line: "Recorded as 1–0. Opponent must confirm before ELO updates."

**4. Dispute / Call Admin**

- Reuse existing `match_disputes` table (already has RLS for open-cup participants and team captains). Add a dispute modal on Match Room for participants of queue matches.
- Reasons dropdown (Wrong result, No-show, Toxic, Cheating, Tech issue, ELO not updated, Other) + optional message + optional evidence URL.
- On submit: insert into `match_disputes`, also flip `matches.result_status` to `disputed` via a small RPC (already-existing `submit_open_cup_result` path can be left alone; add a new RPC `open_match_dispute` that sets status + inserts notification rows for admins).
- Success toast "Dispute opened. An admin will review this match." Both participants see a Disputed banner on the page.

**5. Admin Resolve panel**

- On Match Room when `isAdmin`, render an Admin tools card: participants, current submitted result, open disputes, ELO processed flag.
- "Resolve Match" modal: pick winner, score fields, required reason, optional notes, warning if ELO already processed, confirm step.
- Calls existing `admin_resolve_open_cup_match` RPC; resolves any open dispute rows; inserts notifications for both players.

**6. Match Chat**

- `MatchChat` already exists and works for participants (RLS via `can_access_match_chat`). Wire it into the Match Room's communication panel for queue matches. Empty state: "No messages yet. Use match chat to coordinate."

**7. Unified queue state hook — `src/hooks/useCompetitiveQueueState.ts**` (new)

- Inputs: `mode` ("ranked" | "open_cup"), `game`.
- Polls + subscribes to `competitive_queue_groups` (own row), `match_rosters` (active match), `matches.status`.
- Returns: `{ status: "idle" | "queued" | "match_found" | "in_match" | "loading", group, matchId, elapsedSeconds, cancel(), error }`.
- Single source of truth; consumed by Play and Tournaments.

**8. Queue Lobby component — `src/components/competitive/QueueLobby.tsx**` (new)

- Animated searching state, mode/game/size badges, current rank+ELO chip, elapsed timer, **Cancel Queue**.
- Footer note: "Do not close the page. We'll open your match automatically."
- Sub-note: "Final Open Cup format will be 5v5 solo queue."
- Match-found variant: "Match Found" with **Open Match** CTA + auto-redirect (already in `useMatchFoundListener`).

**9. Play & Tournaments queue UX**

- Replace the current "Find Match" toast/error path. If `useCompetitiveQueueState.status === "queued"` → render `<QueueLobby />` instead of the join CTA. If `"in_match"` → render an "Active Match" card with **Open Match**. If `"match_found"` → match-found card.
- Calling `enqueue_solo` while already queued won't toast an error — UI flips to lobby on optimistic update, and any 23505/duplicate error is swallowed and treated as "already queued".

**10. Notifications**

- Ensure `match_found`, `result_submitted`, `match_completed`, `dispute_opened`, `admin_resolved` all set `action_url = /matches/<id>`. Add the missing inserts inside `submit_open_cup_result`, `confirm_open_cup_result`, `admin_resolve_open_cup_match`, and the new `open_match_dispute` RPC. The frontend `NotificationsBell` already routes by `action_url`.

**11. Recent match label — `src/pages/Profile.tsx**`

- Replace "Unknown Map" fallback with `Open Cup 1v1` / `Ranked 1v1 Beta` derived from `matches.kind` when `team_a_id`/`team_b_id` are null.

**12. Status copy**

- Centralize human strings in `src/lib/competitive-status.ts` (queue + match + ELO labels) so Match Room, Lobby, and Profile stay consistent.

### Database changes (one migration)

- New RPC `open_match_dispute(_match_id, _reason, _message, _evidence_url)` — SECURITY DEFINER:
  - Verifies caller is a participant via `match_rosters` or legacy `player_a_id/player_b_id`.
  - Inserts into `match_disputes` (with safe `opened_by_team_id = NULL` allowed — relax CHECK if any).
  - Sets `matches.result_status = 'disputed'`.
  - Inserts notifications for opponent + admin role users.
- Allow `match_disputes.opened_by_team_id` to be nullable for queue matches (currently NOT NULL). Migration: `ALTER COLUMN ... DROP NOT NULL`. RLS already covers queue participants via the existing "Open cup participant opens dispute" policy — no policy change.
- Add notification inserts in existing RPCs (`submit_open_cup_result`, `confirm_open_cup_result`, `admin_resolve_open_cup_match`) for both sides via `match_rosters`.

### What I won't touch

- ELO formula, `update-match-result` math, queue/matchmaking engine, RLS rules beyond the one nullable column, fake teams, team_size (stays 1), and no fake data.

### QA checklist I'll run

- Two accounts: queue → match-found → both redirect → submit → confirm → ELO updates once.
- Submit then dispute → admin sees ticket → resolves → both notified → ELO processed once.
- Refresh /play and /tournaments while queued → lobby persists, no error.
- Mobile viewport: Match Room, Submit modal, Dispute modal, Queue Lobby.
- Profile recent match shows "Open Cup 1v1" instead of "Unknown Map".

Approve and I'll implement. Approved.

Proceed with this Competitive UX Polish pass.

Important extra requirements:

1. Do not break the working queue → match → submit → confirm → ELO flow.

2. Do not change ELO formula or matchmaking engine.

3. Do not switch to 5v5 yet.

4. Keep teamSize = 1 for testing.

5. Do not reintroduce fake teams or write fake IDs into [matches.team](http://matches.team)_a_id/team_b_id.

6. Queue matches must continue using match_rosters.side = A/B.

7. If a user is already queued, never show an error toast. Show the Queue Lobby instead.

8. If a user has an active match, show Open Match.

9. Dispute must work for queue matches, including 1v1.

10. Match Chat should only be visible to participants/admins.

11. Notifications must always link to /matches/:id.

12. Admin Resolve must not double-process ELO.

13. Profile recent match must show Open Cup 1v1 / Ranked 1v1 Beta, not Unknown Map.

14. Mobile must be tested carefully.

After implementation, give me exact QA steps for:

- normal result confirm

- dispute flow

- admin resolve

- already queued state

- active match state

- mobile match room

&nbsp;