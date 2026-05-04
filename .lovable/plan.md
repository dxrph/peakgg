
# Fase 5 — Seasons, Bracket, Premi, Copy

Stripe rimandato. Implemento tutto il resto in un colpo solo.

## 1. Ranked Seasons

**DB (migration)**
- `seasons` (id, name, slug, starts_at, ends_at, active bool, soft_reset_factor numeric default 0.5, created_at)
- `season_results` (id, season_id, user_id, game, final_elo, final_rank, placement, trophies_awarded, peak_coins_awarded, created_at) — snapshot fine stagione
- `profile_season_badges` (id, user_id, season_id, badge_label, badge_color) — badge mostrato sul profilo
- Vincolo: solo una stagione `active=true` alla volta (unique partial index)
- RLS: lettura pubblica, scrittura solo admin
- Funzione SQL `close_season(season_id uuid)` SECURITY DEFINER:
  1. snapshot top players in `season_results` con placement + premi
  2. assegna trophies + peak_coins (insert in `peak_coins_transactions`)
  3. crea `profile_season_badges` per top 100
  4. soft reset: `UPDATE player_stats SET elo = GREATEST(1000, ROUND(1000 + (elo - 1000) * soft_reset_factor))`
  5. `seasons.active = false`, crea nuova stagione opzionale
- Funzione `start_season(name, starts_at, ends_at)` admin only

**UI Admin** — `src/pages/admin/sections/AdminSeasons.tsx`
- Lista stagioni (attiva + storico)
- Crea nuova stagione (form: nome, date, soft_reset_factor)
- Bottone "Chiudi stagione" con conferma → chiama `close_season`
- Tabella `season_results` per stagione chiusa
- Voce sidebar "Stagioni" (admin only)

**UI Pubblica**
- `SeasonBanner` in cima a `/leaderboard` e `/dashboard`: nome stagione + countdown fine
- Badge stagione su `Profile` (es. "🏆 Apex - Season 1")

## 2. Bracket Builder visuale

**DB (migration)**
- Aggiungere a `matches`: `round int`, `bracket_position int`, `bracket_side text` (winner/loser per double elim), `next_match_id uuid` (riferimento al match successivo)
- Funzione `generate_bracket(tournament_id, type)`:
  - Legge `tournament_entries` (status='confirmed')
  - Shuffle o seed se `seeding_enabled`
  - Inserisce match round 1, poi round 2..N con `next_match_id` collegato
  - Supporta `single_elim` e `double_elim`
- Trigger `advance_bracket_winner` su `matches`: quando `status='completed'` e ha `next_match_id`, popola `team_a_id`/`team_b_id` del prossimo match nello slot giusto

**UI**
- Componente `BracketView` in `src/components/tournaments/BracketView.tsx`: layout colonne per round, linee SVG che collegano i match, responsive (orizzontale desktop, verticale mobile)
- In `/tournaments/:id`: tab "Tabellone" con `BracketView`
- In `/admin/tournaments`: bottone "Genera Bracket" sul tournament dopo che le iscrizioni sono chiuse

## 3. Premi automatici fine torneo

**DB (migration)**
- Funzione `award_tournament_prizes(tournament_id)`:
  - Determina placement dai match finali del bracket
  - Aggiorna `tournament_entries.placement` e `points_earned`
  - Insert in `peak_coins_transactions` per top 3 (configurabile per tournament tier: Open 50/30/20, Challenger 200/100/50, Championship 1000/500/250)
  - Aggiorna `profiles.trophies` (top 1: +5, top 2: +3, top 3: +1)
  - Crea `notifications` per i vincitori
- Trigger su `matches`: quando si completa la finale (max round, no `next_match_id`), chiama `award_tournament_prizes`

## 4. Copy i18n casual (EN/FR/IT)

Update di `src/locales/{en,fr,it}/translation.json`:
- Tutte le label tipo "Initiate matchmaking", "ELO Rating", "Tournament Bracket" → versione casual
- Messaggi errore generici umani
- Aggiunte chiavi nuove per Seasons + Bracket UI
- Audit con `rg ">[A-Z][a-z]+" src/pages src/components/landing` per stanare stringhe hardcoded più grossolane e portarle in i18n

## 5. Memoria

Aggiungere voce in `mem://index.md`:
- `[Ranked Seasons](mem://features/ranked-seasons)` — snapshot fine stagione, soft reset 50%, badge persistente
- `[Bracket System](mem://features/bracket-system)` — single/double elim, auto-advance via trigger, premi automatici per tier

## File toccati / creati

**Nuovi**
- `supabase/migrations/<ts>_seasons_bracket_rewards.sql`
- `src/pages/admin/sections/AdminSeasons.tsx`
- `src/components/tournaments/BracketView.tsx`
- `src/components/seasons/SeasonBanner.tsx`
- `src/components/seasons/SeasonBadge.tsx`
- `mem://features/ranked-seasons.md`, `mem://features/bracket-system.md`

**Modificati**
- `src/App.tsx` (route `/admin/seasons`)
- `src/components/admin/AdminSidebar.tsx` (voce Stagioni)
- `src/pages/admin/sections/AdminTournaments.tsx` (bottone Genera Bracket)
- `src/pages/TournamentDetail.tsx` (tab Tabellone)
- `src/pages/Leaderboard.tsx`, `src/pages/Dashboard.tsx` (SeasonBanner)
- `src/pages/Profile.tsx` (SeasonBadge)
- `src/locales/{en,fr,it}/translation.json`
- `mem://index.md`

## Cosa NON faccio in questa fase

- Stripe / pagamenti (rimandato come richiesto)
- Modifiche al sistema ELO live (i match correnti continuano a funzionare uguale)
- Modifiche auth / OAuth callback
