# PeakGG Competitive Finalization — Implementation Plan

Three phases. No DB schema changes unless required for a bug. Keep `teamSize = 1`. No fake data, no ELO formula changes.

## Phase 1 — Stabilize the current 1v1 loop

### 1.1 Queue state hook (`src/hooks/useCompetitiveSession.ts`, new)

Single source of truth for the user's competitive session. Polls every 5s + reacts to realtime on `open_cup_queue` and `match_rosters`. Returns:

```
{ status, mode, game, teamSize, queueRow, activeMatchId, joinedAt, refresh, cancel }
status ∈ idle | queued | match_found | in_match | pending_confirmation | disputed | completed
```

- `queued` = row exists in `open_cup_queue` for user
- `match_found` / `in_match` / `pending_confirmation` / `disputed` = derived from latest `matches` row joined via `match_rosters` where `user_id = me` and `status != completed`
- `cancel()` calls `cancel_open_cup_queue` RPC
- Used by `Play`, `Tournaments`, `GlobalActiveBar`, `MatchDetail`

### 1.2 Queue Lobby polish (`Play.tsx`, `Tournaments.tsx`)

- Already using `QueueLobby`. Wire it through `useCompetitiveSession`.
- "Join" button while `status === 'queued'` → no-op + toast "Already searching" instead of error.
- Refresh-safe (driven by polled hook, not local state).

### 1.3 Global Active Session Bar (`src/components/competitive/GlobalActiveBar.tsx`, new)

- Sticky bar above content (below navbar) on all authed routes except the Match Room itself.
- Visible when `status !== idle`.
- Variants:
  - queued → "Open Cup Queue · {Game} · Searching {mm:ss}" + Cancel + Open
  - match_found → "Match Found" + Open Match (pulse animation)
  - in_match / pending_confirmation / disputed → "Open Cup Match · {status copy}" + Open Match
- Mounted once in `App.tsx` inside `<AuthProvider>`.

### 1.4 Match Room polish (`MatchDetail.tsx`)

Existing layout is mostly there. Adjustments:

- Header: kind badge ("Open Cup Beta" / "Ranked Beta"), "1v1 Test Queue" badge, game, status pill, short id (`#${id.slice(0,8)}`), created-at relative.
- For queue matches (kind in open_cup/ranked) with null teams: render Player A / Player B cards from `match_rosters` (avatar, username, rank badge, ELO) instead of "Team A / Team B".
- Show ELO delta after `elo_processed_at` is set (read from `elo_history`).
- Remove dead empty space; chat panel always rendered for queue matches.

### 1.5 Submit / Confirm / Dispute state machine (already mostly in place)

Verify:

- `result_status = 'pending_confirmation'` → submitter sees waiting card; opponent sees Confirm + Dispute + Open Ticket.
- Confirm result button always present when applicable, never "nothing to confirm".
- Submit modal: winner cards, disabled until pick, loading + toast.

### 1.6 Centralized status copy (`src/lib/competitive-status.ts`, new)

Map `result_status` + `status` → label, color, helper text. Used by Match Room, GlobalActiveBar, QueueLobby.

## Phase 2 — Competitive Pyramid Page

### 2.1 Repurpose `Tournaments.tsx` as the unified competitive hub

Sections (top → bottom):

1. **Hero** — "Start in Open Cup. Climb with ELO. Unlock Challenger. Qualify for Championship." + subtitle.
2. **My Progress card** — current ELO, RankBadge, current tier, progress bar to next tier, ELO needed, leaderboard rank if available. Hidden for logged-out.
3. **GlobalActiveBar context** (if active) — already global, but reinforced here with bigger card.
4. **Tier 1 — Open Cup** card: Open Beta badge, "1v1 Test Queue" sub-label, CTA "Join Open Cup Queue" → wires existing `enqueue_solo` RPC. Future-format note.
5. **Tier 2 — Challenger Series** card: Locked / 1200 ELO requirement. If user ELO ≥ 1200: "Eligible · Coming Soon" green state with "Join Discord" CTA. Else locked state with progress mini-bar.
6. **Tier 3 — Peak Championship** card: Invite-only, 1800 ELO. Same eligibility logic.
7. **How it works** — 3 short steps.

### 2.2 `Play.tsx` route

- Redirect `/play` → `/tournaments` (using `<Navigate replace>`), OR keep as the Open Cup-only quick-queue surface that mirrors the Tier 1 card. Choose redirect to enforce single hub.
- The existing "Ranked" UI: remove. Replace any "Ranked" CTA with copy "PeakGG ranked progression happens through Open Cup."

## Phase 3 — One active competitive state

### 3.1 Guard in `useCompetitiveSession.enqueue()` wrapper

- Before calling `enqueue_solo`, check current `status`. If not `idle`:
  - status `queued` → toast "Already in queue" + open lobby
  - status `match_found`/`in_match`/etc → modal "You already have an active competitive session" with Open Match / Cancel Queue actions.
- Catch PG `23505` and treat as already-queued (already done).

### 3.2 Modal `ActiveSessionModal.tsx` (new)

Reusable, opened by guard. Two CTAs based on status.

## Phase 4 — 5v5 readiness (no behavior change)

- Keep `competitiveQueues` config-driven. Add code comment block in `feature-flags.ts` listing the exact switch points: `teamSize: 1 → 5`, `requiredPlayers: 2 → 10`, `allowParty/allowFullTeam` flags.
- Make `MatchDetail` render N player cards per side from `match_rosters` (already a list-driven render — verify it doesn't hardcode `[0]`).
- No DB or RPC change.

## Mobile QA

After implementation, verify with viewport 375 wide:

- GlobalActiveBar wraps gracefully (stacks Cancel below text)
- Pyramid tier cards: 1 column, no overflow
- Match Room: player cards stack, action panel full-width
- Submit / Dispute modals: scrollable, max-height 90vh

## Files to add

- `src/hooks/useCompetitiveSession.ts`
- `src/components/competitive/GlobalActiveBar.tsx`
- `src/components/competitive/ActiveSessionModal.tsx`
- `src/components/competitive/TierCard.tsx`
- `src/components/competitive/MyProgressCard.tsx`
- `src/lib/competitive-status.ts`

## Files to edit

- `src/App.tsx` — mount `GlobalActiveBar`
- `src/pages/Tournaments.tsx` — pyramid layout
- `src/pages/Play.tsx` — redirect or simplified mirror
- `src/pages/MatchDetail.tsx` — header polish, player cards from `match_rosters` for queue matches, ELO delta display
- `src/components/competitive/QueueLobby.tsx` — minor copy alignment

## Out of scope (explicitly NOT doing)

Team ELO, seasons, decay, map veto, BO3/BO5, prize pools, dodge cooldown, party queue, full team queue, switching to 5v5, Challenger/Championship backends, ELO formula changes, RLS changes, fake data.

## Deliverable after implementation

A single message answering all 18 output points from the request. Approved.

Keep this implementation scoped exactly as planned.

Extra requirements before shipping:

1. Do not break the current working queue → match → submit → confirm → ELO flow.

2. Do not change ELO formula.

3. Do not switch to 5v5 yet.

4. Do not implement party/full team queue yet.

5. Do not add fake data.

6. Do not write temporary team IDs into [matches.team](http://matches.team)_a_id/team_b_id.

7. Queue matches must keep using match_rosters.side = A/B.

8. /play should redirect to /tournaments to avoid splitting Ranked from Open Cup.

9. Ranked copy should say: “PeakGG ranked progression happens through Open Cup.”

10. GlobalActiveBar must appear across the site when queued/match active, but not duplicate inside Match Room.

11. If user is already queued, never show a raw error; show lobby/active session state.

12. If user has active match, show Open Match.

13. MatchDetail must render queue matches from match_rosters, not Team A / Team B.

14. ELO delta should only show real elo_history data, no fake deltas.

15. Mobile must be checked at 375px.

After implementation, provide:

- exact files updated

- whether /play redirects to /tournaments

- how GlobalActiveBar behaves

- how one-active-state guard works

- queue/match/result/ELO QA result

- remaining blockers before Phase 2/5v5