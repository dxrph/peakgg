# PeakGG

AGISCI COME: Product Manager + UX/UI Designer + Full-Stack Architect.

OBIETTIVO: creare un sito web professionale tipo Faceit per VALORANT (multi-game in futuro) con:

- profili player, ranking Elo interno, matchmaking 5v5, creazione team, tornei, hub community

- anti-smurf multilivello e sistema moderazione/ban robusto

- admin panel completo

LINGUA UI: Italiano (con supporto i18n per EN/FR in futuro)

TARGET: EU (Europe) – timezone Europe/Brussels

STILE: moderno, competitivo, premium (dark UI), mobile-first ma ottimo su desktop.

TECH STACK RICHIESTO:

Frontend: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui

Auth/DB: Supabase (Auth + Postgres + Row Level Security)

Realtime: Supabase Realtime/Websocket per lobby matchmaking + notifiche

Storage: Supabase Storage per avatar/loghi team/screenshot

Payments (fase 2): Stripe

Logging: audit log per azioni sensibili

Deployment: Vercel

--------------------------------------------

1) INFORMATION ARCHITECTURE (PAGINE)

--------------------------------------------

A) Landing

- Hero “Competitive matchmaking & tournaments for VALORANT”

- CTA: “Connetti Riot ID / Accedi”

- Sezioni: come funziona, features (Matchmaking / Tornei / Team / Anti-smurf), leaderboard preview, testimonianze (placeholder)

- Footer con policy, contatti, social

B) Auth

- login/signup con Supabase

- onboarding: selezione nickname sito + collegamento Riot ID (mock per ora)

- checklist “verifica account” (anti-smurf)

C) Dashboard (dopo login)

- card: Elo attuale, rank interno, last matches, stato verifica, reputazione

- CTA: “Trova Match” + “Crea Team” + “Iscriviti Torneo”

- notifiche realtime (inviti team, match found, report)

D) Profile Player /public/:username

- stats (K/D, winrate, HS%, impact score), rank, badges, reputazione

- cronologia match + dettagli (tabella)

- grafici performance (senza colori custom)

- area “Verifica” con stato e livello

E) Leaderboards

- Top players (global + filtri: rank, region, last 7/30 days)

- Top teams

F) Matchmaking

- Modalità: SoloQ / TeamQ

- Selezione ruolo preferito (Duelist/Initiator/Controller/Sentinel/Flex)

- Queue UI: tempo stimato, regole, cancel

- Lobby pre-match: roster, map veto (fase 2), ready check, link “server/party instructions”

- Risultato match + conferma score + dispute flow

G) Teams

- Lista team + ricerca

- Pagina team: roster, ruoli, elo team, match history

- Funzioni: crea team, inviti, gestione ruoli, logo

- Team queue

H) Tournaments

- Lista tornei: daily/weekly/monthly

- pagina torneo: regole, bracket, partecipanti, check-in, risultati

- Formati: single elim + double elim + swiss (abilita swiss fase 2)

- check-in richiesto (anti-smurf + anti-ghost)

- gestione dispute e report

I) Community Hub

- feed post (testo + immagini)

- commenti

- guide/annunci

- integrazione “clip upload” (fase 2)

J) Support / Report

- crea ticket

- report player / smurf / toxic

- tracking stato ticket

K) Admin Panel (solo admin)

- gestione utenti, team, tornei, match

- flags anti-smurf + risk score

- ban/suspend/mute

- dispute center

- audit log

--------------------------------------------

2) CORE FEATURES (MVP + foundation)

--------------------------------------------

MATCHMAKING:

- Algoritmo base: match 10 player con Elo simile + constraint:

  - max differenza elo team vs team

  - evitare “new accounts” vs high verified quando possibile

  - considerare role preference (soft)

- Stato match: queued -> found -> lobby -> ongoing -> reported -> verified -> closed

- Score submission: entrambi i capitani confermano; se mismatch -> dispute

ELO:

- Elo iniziale 1000

- Placement: prime 5 partite con K-factor alto

- K-factor dinamico in base a verification level e risk score

- Decay: dopo 14 giorni inattività (soft, -x al giorno)

- Leaderboard stagionale (fase 2)

TEAM SYSTEM:

- ruoli: owner/captain/member

- inviti + join request

- team elo separato

TOURNAMENTS:

- creazione tornei da admin

- iscrizione team o player

- bracket auto

- check-in + no-show rules

REPUTATION & BEHAVIOR:

- reputazione 0-100

- penalità: report confermati, abbandoni, dispute perse, tossicità

- reward: partite senza report, conferme veloci, verifiche complete

--------------------------------------------

3) ANTI-SMURF SYSTEM (MULTI-LAYER) - FONDAMENTALE

--------------------------------------------

Implementare un "Smurf Risk Score" (0-100) con segnali:

A) ACCOUNT VERIFICATION LEVEL:

- Level 0: email verified

- Level 1: phone verified (OTP)

- Level 2: Riot account linked (mock ora, pronto per API)

- Level 3: “Trusted” (manual review / KYC opzionale per cash tournaments)

B) ACCOUNT AGE & ACTIVITY:

- data creazione account sito

- numero match completati

- comportamento in coda (dodge/leave)

C) DEVICE & NETWORK FINGERPRINT (privacy-aware):

- hash device/browser + hash IP subnet (non salvare IP raw se possibile)

- rilevare multi-account patterns (stesso device, pattern login)

- limitare creazione account sospetta

D) PERFORMANCE ANOMALY DETECTION:

- se nelle prime 10 partite:

  - winrate altissimo + impact score altissimo

  - HS% fuori soglia + K/D troppo alto

  - streak prolungate

=> aumenta risk score e riduce K-factor o blocca queue “verified-only”

E) QUEUE RULES:

- “Verified Queue” accesso solo da verification level >=2 e risk score basso

- “Newcomer Queue” per level <2 con limitazioni

- Tornei: richiedere Level >=2 (minimo) e risk score < soglia

F) MANUAL REVIEW & REPORT FLOW:

- report smurf con prove (screenshot/clip)

- admin queue: decisione -> penalty

- penalty ladder:

  - warning -> elo lock -> queue ban -> permaban

G) SMURF PREVENTION UX:

- mostra stato verifica (badge)

- incentivi: più verifica = più accesso a tornei / queue premium / rewards

--------------------------------------------

4) DATABASE (SUPABASE POSTGRES) - TABELLE

--------------------------------------------

- profiles: id (auth uid), username, avatar_url, country, created_at, verification_level, reputation_score, smurf_risk_score, is_banned, ban_reason

- riot_accounts: profile_id, riot_id, region, puuid (nullable), linked_at, verified (bool)

- teams: id, name, tag, logo_url, owner_id, created_at, elo

- team_members: team_id, profile_id, role (owner/captain/member), joined_at, status

- queues: id, mode (solo/team), status, created_at

- queue_entries: id, queue_id, profile_id, team_id nullable, role_pref, elo_snapshot, risk_snapshot, created_at

- matches: id, mode, status, started_at, ended_at, map, region, tournament_id nullable, created_by

- match_players: match_id, profile_id, team_side (A/B), role, stats_json, confirmed_score(bool)

- match_results: match_id, score_a, score_b, confirmed_by_a, confirmed_by_b, dispute_status

- tournaments: id, name, format, start_at, rules, entry_type (solo/team), min_verification_level, max_risk_score, status

- tournament_entries: tournament_id, team_id/profile_id, checked_in, status

- reports: id, reporter_id, reported_id, match_id nullable, type (smurf/toxic/cheat/other), evidence_url, status, created_at

- penalties: id, profile_id, type (mute/ban/elo_lock), start_at, end_at, reason, created_by

- notifications: id, profile_id, type, payload_json, read_at, created_at

- audit_logs: id, actor_id, action, target_type, target_id, payload_json, created_at

RLS:

- profiles: read public basic, write solo owner

- matches: read partecipanti + admin

- reports: solo reporter/admin

- admin panel: solo role=admin (use custom claim / supabase role table)

--------------------------------------------

5) UI/UX REQUIREMENTS

--------------------------------------------

- Dark theme default, toggle light/dark

- Componenti: shadcn (Card, Table, Dialog, Tabs, Badge, Toast)

- Layout: sidebar su desktop, bottom nav su mobile

- Pagine con skeleton loading

- Stati vuoti curati (empty state)

- Notifiche realtime (toast + bell icon)

- Accessibilità base (focus, contrasto, aria)

--------------------------------------------

6) API / LOGIC (IMPLEMENTA FUNZIONI)

--------------------------------------------

- Elo update: calcolo dopo match confirmed

- Risk score update: ad ogni match + ad ogni login

- Reputazione update: leave/dodge/report confermati

- Matchmaking service:

  - endpoint /api/queue/join, /leave

  - matching loop server-side (cron o server action)

  - crea match quando trova 10 player validi

- Dispute system:

  - se punteggi non combaciano -> apre dispute

  - admin decide

--------------------------------------------

7) ROADMAP (MOSTRA NEL PROGETTO)

--------------------------------------------

PHASE 1 (MVP): auth, profili, elo, soloQ matchmaking base, team base, tornei single elim, report/ban, admin panel base.

PHASE 2: verified queue, advanced analytics, map veto, swiss format, premium + stripe, clip upload.

PHASE 3: multi-game support + plugin config giochi.

--------------------------------------------

8) OUTPUT RICHIESTO

--------------------------------------------

Genera:

- progetto Next.js pronto

- schema DB SQL per Supabase

- RLS policies

- seed data per testing

- UI completa con pagine definite

- API routes / server actions per matchmaking, match results, reports, tournaments

- README con setup step-by-step

IMPORTANTE:

- Non lasciare placeholder generici: implementa flussi end-to-end almeno per MVP.

- Metti dati mock per Riot API per ora ma struttura pronta per integrazione reale.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://peakgg.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2aac5a10-24d7-4b05-a659-3bc2e84dc378).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
