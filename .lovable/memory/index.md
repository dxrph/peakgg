# Project Memory

## Core
PeakGG: Multi-game platform (VALORANT, CS2, R6) targeting Europe (Europe/Brussels timezone).
Broadcast Studio UI: matte graphite base, primary red #ff4655, orange accent, lime ONLY for LIVE. Barlow Condensed (display/numbers), Rajdhani (labels), DM Sans (body). Sharp corners (radius .25rem), hairline borders, no glow/purple/paper-torn effects.
Stack: React 18, Supabase (RLS, Edge Functions for Elo/Matchmaking), Tailwind.
Constraint: DO NOT upgrade Radix UI beyond React 18 compatible versions (e.g., Accordion 1.2.2).
Unified ELO system for overall ranking, but separate performance stats per game.

## Memories
- [Broadcast design system](mem://design/broadcast-system) — .bc-* primitives, tokens, homepage module architecture
- [Style & Language](mem://stile/estetica-e-lingua) — Dark Cyberpunk design, colors, fonts, UI language
- [Layout & Navigation](mem://stile/layout-e-navigazione) — Mobile-first sidebar/bottom nav, global game switcher
- [Tech Stack](mem://tech/stack-tecnologico) — React+Vite, Supabase integration, Stripe planned
- [React Dependencies Constraint](mem://tech/vincoli-dipendenze-react) — Radix UI version pinning for React 18
- [Backend Architecture](mem://tech/architettura-backend) — Edge functions for matchmaking and Elo calculation
- [Database Schema](mem://database/schema-entita) — Supabase RLS, REPLICA IDENTITY FULL for Realtime chat
- [Auth Flow](mem://auth/flusso-autenticazione) — Email/Social login + mandatory Riot ID onboarding
- [Anti-Smurf System](mem://logica/sistema-anti-smurf) — Risk score 0-100, queues by verification, penalty ladder
- [ELO Mechanics](mem://logica/meccaniche-elo) — Point values (+25 win, -15 loss, +10 scrim), 14-day decay
- [Rank System](mem://features/rank-system) — 8 tiers Rookie→Bronze→Silver→Gold→Platinum→Diamond→Master→Apex, inline SVG icons, derive from live ELO
- [i18n Rank Tiers](mem://i18n/rank-tiers) — EN/FR/IT translations for tier names, LanguageSwitcher in navbar, locale persisted
- [Matchmaking & Disputes](mem://logica/matchmaking-e-dispute) — Game flow phases, captain confirmation, dispute logic
- [Gameplay Flow](mem://features/gameplay-flow) — 30s match found countdown, bracket types, 30m check-in
- [Multi-Game Support](mem://features/multi-game-support) — Global game switcher filtering content dynamically
- [Tournament Progression](mem://features/tournament-progression) — 3-tier node tree, TP points, Solo/Team entry
- [Scrims](mem://features/scrims) — Practice matches filtering, +10 ELO reward, hidden Discord links
- [Chat System](mem://features/sistema-chat) — Global/Game/Team channels, 1 msg/sec limit, floating widget UX
- [Leaderboard UX](mem://features/leaderboard-ux) — Persistent current user row, top 3 crown icons
- [Admin Panel](mem://features/pannello-amministrazione) — Multi-tab dashboard for users, tournaments, disputes, audits
- [Aim Guide](mem://features/aim-guide) — 6-section interactive training guide with per-game setups
