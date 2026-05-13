## Community Cup Match Room — Polish, Map Pool, ELO Integration

Large multi-area request. This plan groups the work into safe, shippable phases so we can land the highest-impact items first without breaking Open Cup, ELO, or RLS.

### Phase 1 — ELO integration for Community Cup (highest priority)

- Reuse the existing `update-match-result` edge function. No new formula.
- Extend the function's allowed `match.kind` set to also process `tournament` / `community_cup` matches (currently it processes any `completed` match with `winner_id`, but `source_type` in `elo_history` is set to `match.kind` — we ensure `kind` is set to `community_cup` for these matches).
- Trigger: when staff confirms a Community Cup result and the match transitions to `status='completed'` with a `winner_id`, call `update-match-result` from the client (admin confirm action) the same way Open Cup does.
- Participant resolution: function already falls back to `match_rosters` (queue path), then `team_a_id/team_b_id` → `team_members`. Community Cup signups are not real `teams`, so we add a third fallback: if `signup_a_id`/`signup_b_id` are set, read users from `tournament_team_signup_members` (or equivalent roster table) and tag them with side A/B based on which signup won.
- If no real users are attached → function returns early without faking ELO. UI shows "ELO will apply when registered players are attached".
- Idempotency preserved via `claim_match_for_elo` RPC + `elo_processed_at`.
- Frontend: new `EloStatusPanel` showing Pending / Frozen (disputed) / Processed / Not applicable, reading `elo_processed_at` and `elo_history` rows for `match_id`.

### Phase 2 — Map pool & images completion

- Audit `VALORANT_MAP_SPLASH` keys vs the default map pool. Bind URL appears stale — refresh splash URLs from valorant-api.com and add `Corrode` placeholder slot.
- Map card fallback: gradient + map name centered (no broken-image icon). `onError` already swaps to fallback — confirm and tighten styles.
- Make pool fully data-driven from `tournament_map_pool` with `DEFAULT_VALORANT_MAP_POOL` fallback. Already largely in place; just ensure ordering and `is_active` filter.

### Phase 3 — Map mode actions (admin manual + random)

- Admin Manual: existing select-map flow remains. Add clear "Selected" highlight on the map card and persist to `matches.selected_map`.
- Random Map: new "Randomize Map" button (staff only) — picks random active pool entry, writes `selected_map`, logs admin action.
- Captain Veto BO1: keep dropdown option but show disabled state with copy "Captain veto requires veto-phase RPCs — coming soon" if mode is selected without backing implementation.

### Phase 4 — Match Setup / Lobby polish

- LobbyPanel already exists. Add: copy-to-clipboard toast, locked/private state for non-participants (mask code as `••••••`), staff edit form for `lobby_code` + `server_info`.
- "Host assignment not implemented yet" hint when staff opens edit panel.

### Phase 5 — Result reporting + dispute visibility

- Result panel: pre-fill selected map, show submitter + timestamp + screenshot link + status pill.
- After staff confirms, call `update-match-result` (Phase 1) and surface success.
- Dispute button visible to participants in result panel + a dedicated "Report Issue" button with reason dropdown (wrong score / no-show / lobby / map / toxicity / cheating / technical / other). Inserts into `match_disputes` and notifies admins (existing flow).
- Disputed → ELO frozen banner.

### Phase 6 — Match Summary + Rules polish

- Replace generic "Not selected" with actionable empty states ("Map not selected — staff must select or randomize").
- Rules: keep accordion, tighten copy into 4 sections (Lobby, Reporting, Disputes, Conduct), add "VCT-inspired competitive rules" subtitle + Riot disclaimer.

### Phase 7 — UI polish + mobile QA

- Map grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, consistent aspect ratio, gradient overlay, status ring (selected = primary, banned = muted/strike, picked = accent).
- Tighten hero spacing, status badges, right column density.
- 375px sweep: stacked hero, map grid 2-col, lobby copy full-width, dispute dialog scrollable.

### Out of scope / deferred

- True captain BO1/BO3 veto phase (requires new RPCs + turn enforcement). Shown as disabled with copy.
- Host assignment flow.
- Switching Open Cup public queue to 5v5.

### Technical notes

- No new ELO formula. No schema migration in Phase 1 (uses existing `elo_processed_at`, `elo_history`, `match_rosters`). If Community Cup signups don't have a roster table, we treat them as "not applicable yet".
- All write actions go through existing RLS (admin-only for setup edits, captain/staff for results, captain for disputes).
- All new strings added to EN/FR/IT i18n files.

### Recommended shipping order this turn

Given credit constraints, ship **Phase 1 + Phase 2 + Phase 3 (admin manual + random only)** + minimal Phase 4 polish (copy, masked code) and Phase 5 dispute button. Defer remaining UI polish + captain veto implementation to a follow-up.

Reply with **approve** to proceed, or tell me which phases to drop/add.