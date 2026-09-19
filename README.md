# PeakGG

Frontend Vite + React + TypeScript della nuova homepage PeakGG. Il branch di lavoro è `main`.

## Avvio e controlli

Node.js 22.12+ (oppure 24 LTS) e npm. Usare npm e `package-lock.json`: i vecchi lockfile Bun sono stati rimossi per evitare installazioni di versioni divergenti. `nvm use` seleziona Node 24.

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

Il sito statico viene generato in `dist/`. Il provider di hosting deve riscrivere le richieste delle pagine su `index.html` per il routing SPA. I font sono inclusi nel bundle locale, senza richieste a Google Fonts.

## Stato reale del prodotto

Questa versione è un'anteprima della homepage: navigazione, sezioni informative, menu mobile e pagina 404. Il torneo nell'hero è un esempio grafico. Non ci sono conteggi live, iscrizioni, ricerca, trailer, login, classifiche o directory giocatori/team funzionanti nel frontend attuale. Il file SVG dell'hero è ancora un segnaposto; il sito non riproduce ancora lo screenshot di riferimento.

Le traduzioni disponibili sono inglese e italiano; la lingua iniziale è inglese. La selezione della lingua non è ancora esposta nell'interfaccia.

## Backend presente nel repository

`supabase/migrations/` e `supabase/functions/` contengono il backend precedente. La loro presenza non dimostra che schema, funzioni o cron siano aggiornati nell'ambiente pubblico. Il typecheck npm copre frontend e configurazione Vite, non sostituisce `deno check` delle Edge Functions né test di integrazione con un database locale.

Gli endpoint interni `tournament-reminder-24h` e `process-email-queue` richiedono `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`. La chiave deve restare esclusivamente sul server e nel cron, mai in variabili `VITE_*` o codice frontend. Prima di distribuire queste funzioni verificare che il cron usi la credenziale server configurata. Il controllo JWT del gateway rimane abilitato.

## Verifiche ancora necessarie prima del lancio

- Verifica visiva nel browser a 390, 1440 e 1920 px: misure di BELONG., assenza di overflow, immagini e interazioni. I test DOM non verificano il layout.
- Collegamento del frontend alle funzionalità reali di autenticazione, tornei, team e classifiche.
- ELO: `update-match-result` reclama il match prima di scrivere separatamente statistiche e storico. Un errore intermedio può lasciare risultati parziali; serve un'elaborazione transazionale, con test di concorrenza e retry su database di sviluppo.
- Privilegi SQL: la migrazione `20260919162000_restrict_elo_claim_execution.sql` limita `claim_match_for_elo` a service_role. È preparata nel repository, non applicata al database. Validarla su ambiente di sviluppo prima del deploy e riesaminare anche gli altri RPC SECURITY DEFINER.
- Verifica e distribuzione controllata delle Edge Functions; nessuna migrazione o distribuzione Supabase viene eseguita dalla build frontend.
- Verifica del dominio, DNS, rewrite SPA, header HTTP e pubblicazione Lovable. Un commit su GitHub non equivale a una pubblicazione verificata.

La sitemap in `public/sitemap.xml` è statica: aggiornarla quando cambiano le pagine pubbliche. La build non scarica più implicitamente `tsx` e non modifica la sitemap tracciata.
