## Obiettivo

Pulire e rendere "casual-friendly" il sito per il lancio. Target: gamer 16-22 al primo torneo. Linguaggio diretto, niente gergo, percorso ovvio dal primo click alla prima partita.

## Principi guida (applicati dappertutto)

1. **Una sola azione primaria per pagina** — il pulsante più importante è grande, rosso neon, sempre visibile.
2. **Empty states amichevoli** — invece di tabelle vuote: illustrazione + frase semplice + bottone "fai questo".
3. **Copy umano** — "Trova partita" invece di "Avvia matchmaking", "Il tuo livello" invece di "ELO 1247".
4. **Tooltip ovunque c'è gergo** — ELO, Tier, Bracket, Seed, ecc.
5. **Stati di caricamento** con skeleton, mai schermo bianco.
6. **Mobile first** — touch target min 44px, niente hover-only.

## Fase 1 — Homepage (landing pubblica)

Obiettivo: in 5 secondi il visitatore capisce *cosa* è PeakGG, *per chi*, e *cosa fare*.

- **HeroSection**: titolo più semplice ("Tornei VALORANT, gratis, ogni sera"), sottotitolo che spiega in 1 riga ("Iscriviti, gioca contro player del tuo livello, vinci premi"), 1 CTA primaria gigante ("Gioca gratis"), 1 secondaria ("Guarda come funziona" → scroll).
- **HowItWorks**: ridurre a 3 step illustrati grandi (1. Crea account → 2. Trova partita → 3. Sali di livello). Niente paragrafi lunghi.
- **LiveStatsBar**: rendere reali e leggibili (giocatori online ora, partite oggi, prossimo torneo). Se 0, fallback "Lancio in arrivo".
- **RankShowcase**: aggiungere riga "Dove sarai tu?" con CTA per registrarsi.
- **TopPlayersWeek**: empty state se non ci sono dati ("La leaderboard parte al lancio — sii il primo").
- **CTASection finale**: un solo bottone enorme + 1 frase rassicurante ("Gratis. Niente carta. 30 secondi per iniziare.").
- **Navbar landing**: ridurre voci, mettere "Gioca gratis" sempre a destra.
- **Footer**: già fatto, controllo solo che i link funzionino.

## Fase 2 — Onboarding nuovo utente

Oggi: dopo registrazione l'utente atterra senza sapere cosa fare.

- **Welcome screen** dopo prima registrazione: card a tutto schermo con 3 step "Completa il profilo (avatar + Riot ID) → Trova un team o gioca solo → Prima partita". Skip sempre disponibile.
- **Dashboard** mostra una card "Inizia qui" finché i 3 step non sono completi (avatar caricato, Riot ID inserito, prima partita giocata).
- **Tooltip first-time** sui termini ELO, Rank, Tier al primo accesso a /play e /leaderboard.
- **Banner "Riot ID mancante"** persistente finché non lo aggiunge.

## Fase 3 — Pulizia pagine principali

### /play (Matchmaking)
- Bottone unico gigante "TROVA PARTITA" al centro.
- Spiegare in 1 riga sotto: "Cerchiamo 9 giocatori del tuo livello. Tempo medio: 2 min."
- Stati chiari: Idle → Cercando (con timer + animazione) → Match trovato (countdown 30s con suono) → In partita.
- Empty state: se nessun match in coda, "Nessuno in coda ora — torna tra poco o iscriviti a un torneo".

### /tournaments + /tournaments/:id
- Lista: card più grandi con thumbnail, premio in evidenza, bottone "Iscriviti" diretto, contatore "X/16 team iscritti".
- Filtri semplici: "Aperto a tutti" / "Per il mio livello" / "Solo / In team".
- Detail page: timeline visuale (Iscrizioni → Check-in → Bracket → Finale), regole in accordion, bracket leggibile su mobile.

### /teams + /teams/:id
- Lista: due CTA primarie in cima — "Crea team" e "Cerca team da unire" (LFP board).
- Empty state se utente non ha team: card grande "Non hai ancora un team — creane uno o uniscine uno esistente".
- Detail: roster visuale con avatar grandi, ELO medio, ultimi match, bottone chat team.

### /profile/:username + /dashboard
- Dashboard: header con avatar + nome + rank tier badge GIGANTE + ELO + barra progresso al prossimo tier.
- Sezione "Prossimi step" se onboarding incompleto.
- Sezione "Le tue statistiche" con 4 numeri grandi (Win rate, Match giocati, Best streak, Coins).
- Sezione "Ultime partite" con 5 card.
- Profile pubblico: stessa cosa ma senza "Prossimi step".

### /leaderboard
- Riga "Tu sei qui" sempre visibile in alto/in basso (sticky).
- Top 3 con corone già ok, ma rendere più grandi e celebrative.
- Empty state se nessun giocatore in classifica per il filtro corrente.

## Fase 4 — Componenti trasversali

- **EmptyState component** riutilizzabile (icona, titolo, descrizione, CTA).
- **LoadingSkeleton** sostituisce gli spinner ovunque (liste, tabelle, card).
- **InfoTooltip** wrapper per spiegare gergo (ELO, Tier, Seed, Bracket).
- **PageHeader** unificato: breadcrumb + titolo + azione primaria.
- **OnboardingChecklist** card riutilizzabile.

## Fase 5 — Copywriting i18n (EN/FR/IT)

Riscrivere le stringhe più tecniche in casual:
- "Initiate matchmaking" → "Trova partita / Find match / Trouver un match"
- "Tournament bracket" → "Tabellone / Bracket / Tableau"
- "ELO Rating" → "Il tuo livello / Your level / Ton niveau"
- Tutti i messaggi di errore in linguaggio umano ("Ops, qualcosa è andato storto. Riprova" invece di codici).

## Fase 6 — Mobile + performance check finale

- Test ogni pagina a 375px (iPhone SE) e 414px.
- Sidebar diventa bottom nav fissa con 5 icone (Home, Play, Tornei, Team, Profilo).
- Touch target minimi su tutti i bottoni.
- Lazy load delle pagine pesanti (Admin, AimGuide).

## Cosa NON faccio (per ridurre rischi)

- Non tocco il sistema ELO/matchmaking edge functions (logica backend).
- Non tocco il sistema auth (appena fixato).
- Non tocco /admin/* (rimane in EN come deciso).
- Non aggiungo nuove feature: solo polish, copy, UX, empty states, onboarding.

## Stima

Una sessione lunga concentrata su Fase 1 + 2 + componenti trasversali (4-5). Poi una seconda sessione per Fase 3 (pagine principali) + 5 (copy i18n) + 6 (mobile check). Te lo divido in 2 step così vedi i risultati incrementalmente.

## Tecnico (per chi sviluppa)

- Nuovi componenti in `src/components/ui/empty-state.tsx`, `src/components/ui/page-header.tsx`, `src/components/ui/info-tooltip.tsx`, `src/components/onboarding/OnboardingChecklist.tsx`, `src/components/onboarding/WelcomeModal.tsx`.
- Hook `useOnboardingProgress()` che legge profilo (avatar, riot_id, matches_played) e ritorna step completati.
- Update di tutti e 3 i file `src/locales/{en,fr,it}/translation.json` per le nuove stringhe casual.
- Modifiche concentrate in: `landing/HeroSection.tsx`, `landing/HowItWorksSection.tsx`, `landing/CTASection.tsx`, `landing/Navbar.tsx`, `pages/Dashboard.tsx`, `pages/Play.tsx`, `pages/Tournaments.tsx`, `pages/TournamentDetail.tsx`, `pages/Teams.tsx`, `pages/TeamDetail.tsx`, `pages/Profile.tsx`, `pages/Leaderboard.tsx`.
- Nessuna migration DB necessaria.
