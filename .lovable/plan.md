# Unified Competitive Queue Architecture

Goal: one engine powers Open Cup + Ranked + future modes. Current 1v1 test and future 5v5 differ only by `teamSize` config — no rewrites later.

## 1. Config (frontend + DB)

`src/lib/feature-flags.ts` — replace ad-hoc flags with a single config object:

```ts
export type QueueMode = "open_cup" | "ranked";
export interface CompetitiveQueueConfig {
  mode: QueueMode;
  teamSize: 1 | 5;
  requiredPlayers: number;       // teamSize * 2
  allowSolo: boolean;
  allowParty: boolean;           // future: partial team
  allowFullTeam: boolean;        // future: full roster
  autoFillMissingPlayers: boolean;
  enabled: boolean;
}
export const competitiveQueues: Record<QueueMode, CompetitiveQueueConfig>
```

Today: both modes `teamSize=1, allowParty=false, allowFullTeam=false`. Switch later by editing this file only.

Mirror in DB via `platform_settings` row `competitive_queue_config` so RPCs read the same values (no hardcoded `1` in SQL).

## 2. Database (one migration)

**New tables:**

- `competitive_queue_groups` — id, mode, game, created_by, permanent_team_id (nullable, FK teams), source ('solo'|'party'|'team'), desired_team_size, current_party_size, status ('queued'|'matched'|'cancelled'|'expired'), created_at
- `competitive_queue_group_members` — id, group_id (FK groups, on delete cascade), user_id, role ('captain'|'player'|'fill'), accepted bool default true, created_at; unique(group_id, user_id); unique partial index on user_id WHERE group.status='queued' (one active queue per user)

**Reuse `match_rosters`** for participants — add columns:
- `side` text check in ('A','B')
- `queue_group_id` uuid nullable
- `is_fill` boolean default false
- `joined_from` text ('solo'|'party'|'team')
- relax `team_id` to nullable (so we don't need fake team UUIDs)

**Matches FK fix:** for competitive queue matches, leave `team_a_id`/`team_b_id` NULL. Participants live in `match_rosters` keyed by `match_id` + `side`. No more FK violations.

**RLS:**
- `competitive_queue_groups`: members read own group; creator/captain insert; creator/captain or admin delete (cancel)
- `competitive_queue_group_members`: read if own row or same group; captain/admin insert (only own team members for source='team'); self or captain or admin delete
- `match_rosters`: keep public read; allow insert via SECURITY DEFINER RPCs only (revoke direct insert for queue path)

## 3. RPCs (replace current `join_open_cup_queue`)

All `SECURITY DEFINER`, validate `auth.uid()`, read config from `platform_settings`.

- `enqueue_solo(_mode, _game)` — creates group with one member, snake-draft attempts match
- `enqueue_party(_mode, _game, _user_ids[])` — caller must be in list; creates partial group; size 2..teamSize-1
- `enqueue_full_team(_mode, _game, _team_id, _user_ids[])` — caller must be captain; all users must be active members of `_team_id`; size = teamSize
- `cancel_queue_group(_group_id)` — caller must be creator or admin; deletes group + members
- `try_match_queue(_mode, _game)` — internal: gathers `queued` groups, builds two sides keeping groups intact, fills with solo, balances by ELO snake-draft, on success: insert `matches` row (team_a/b NULL), insert `match_rosters` (side A + B, with `is_fill`/`joined_from`), update groups → `matched`, send `match_found` notifications to all participants, set `match_id`. Atomic via SERIALIZABLE or row locks on group rows.

Pre-checks for every enqueue:
- not banned
- not in active match (no `match_rosters` row in match where `status in ('pending','live','scheduled')`)
- not in another `queued` group
- all users same game
- all users authenticated

Friendly errors via `RAISE EXCEPTION 'PEAK_xxx: <msg>'` mapped to toast in UI — no raw RLS errors.

## 4. Edge function `update-match-result`

Already resolves participants from `match_rosters` first, then falls back. Remove the open_cup/team_id branching — always read `match_rosters` for queue matches (`team_a_id IS NULL`). Keep `claim_match_for_elo` lock and ELO floor at 0. ELO history row per participant including `is_fill` players. `source_type = mode` (`open_cup` or `ranked`).

## 5. Result flow (`submit_open_cup_result` / `confirm_open_cup_result`)

Rewrite as `submit_queue_match_result(_match_id, _winner_side)` and `confirm_queue_match_result(_match_id)`:
- submit: caller must be in `match_rosters` for that match; sets `submitted_by`, `submitted_at`, stores winner side
- confirm: caller must be in `match_rosters` on the OPPOSITE side; sets `status='completed'`, computes `winner_id` = first roster user_id on winning side (purely for legacy column), invokes edge function
- dispute: any participant on opposite side, before confirm

## 6. UI

- `src/pages/Tournaments.tsx` — copy reflects "1v1 Beta Test" today; CTA calls `enqueue_solo('open_cup', game)`
- `src/pages/Play.tsx` — Ranked card calls `enqueue_solo('ranked', game)`; same engine
- `src/pages/MatchDetail.tsx` — already uses `teamSize` discriminator; ensure roster grid renders `match_rosters` grouped by `side` (works for 1 and 5)
- `src/pages/TeamDashboard.tsx` — add disabled "Queue Team" button with tooltip "Available when 5v5 beta opens"
- `src/hooks/useMatchFoundListener.ts` — already notifies all participants via notifications table; no change

## 7. Backwards compatibility

- Keep existing `open_cup_queue` table for one release as legacy read-only, but new code only writes to `competitive_queue_groups`
- Existing in-flight matches keep working (edge function already handles `match_rosters` fallback)

## 8. QA — current 1v1

Two accounts → both call `enqueue_solo('open_cup', 'valorant')` → match created with `team_a_id=NULL`, two `match_rosters` rows side A/B → both notified + redirected → submit + confirm → ELO updates once, history rows for both, no FK error.

## 9. Switch to 5v5 later (mechanical)

1. Edit `competitiveQueues.open_cup.teamSize = 5` (and `allowParty`, `allowFullTeam = true`)
2. Update `platform_settings` row
3. Update copy on Tournaments/Play
4. Enable Team Dashboard "Queue Team" button

Backend, ELO, Match Room, notifications: zero changes.

## Files touched

- `supabase/migrations/<new>.sql` — tables, RLS, RPCs, function rewrites
- `src/lib/feature-flags.ts` — config object
- `src/pages/Tournaments.tsx` — call new `enqueue_solo`
- `src/pages/Play.tsx` — Ranked CTA → `enqueue_solo('ranked', ...)`
- `src/pages/MatchDetail.tsx` — small adjustments to read `match_rosters` exclusively for queue matches
- `src/pages/TeamDashboard.tsx` — disabled "Queue Team" CTA
- `supabase/functions/update-match-result/index.ts` — drop open_cup-specific branch, always prefer `match_rosters` when `team_a_id IS NULL`

## Out of scope (later)

- ELO-balancing algorithm beyond snake-draft (MVP is fine)
- Party invitations / accept flow (`accepted` column reserved)
- Region filtering
- Anti-smurf integration into matchmaking (still post-match recalc)

## Remaining blockers before public 5v5

- Party invite/accept UI
- Team Dashboard roster picker
- 5-card roster grid visual polish in Match Room
- Captain-only submit/confirm rule (today: any participant on side)
