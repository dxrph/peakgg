# PeakGG — verifica del 16 settembre 2026

## Stato verificato

- Repository: `dxrph/peakgg`, `main` = `264ef49efa12234984868a831f584696c6ebba42`.
- Lovable: progetto `2aac5a10-24d7-4b05-a659-3bc2e84dc378`; `latest_commit_sha` coincide con GitHub. Lo screenshot salvato fa riferimento a `6add82e5`: non prova che il codice corrente sia diverso.
- `peakgg.net` mostra ancora il frontend precedente: struttura, testi e percorsi differenti da `app/` nel repository attuale. SHA del deployment live non determinato.
- Il commit locale citato in precedenza, `8ba5ce8`, non è risolvibile su questo repository GitHub. Non è stato ripristinato nessun branch alternativo a caso.
- Le istruzioni Lovable descrivono React/Vite/Tailwind e il backend precedente. Il codice attuale usa React 19, App Router tramite vinext, server actions e Supabase SSR.
- Il link pubblico Tournaments porta al login per un visitatore anonimo; il form live offre anche Google, assente nel nuovo form del repository. Il flusso autenticato non è stato eseguito.
- Il database è abilitato secondo Lovable. Due query SQL di sola lettura non sono riuscite; la seconda riporta `499 request_cancelled`. Nessuna lettura delle tabelle live, nessuna modifica dei dati, delle policy o delle migrazioni applicate.
- Il connettore Supabase elenca un progetto inattivo, ma non è dimostrato che sia quello di PeakGG: non va riattivato o modificato sulla base del nome.
- Nessuna esecuzione GitHub Actions risulta nella lista del repository.

## Correzioni preparate nel branch di audit

1. Corretti i tre errori TypeScript rilevati: controllo del tipo ruolo nel middleware e tipi Vite per `import.meta.env`.
2. Corretti errori lint nel selettore rank e nel timer dello storage anteprima; aggiunto aggiornamento del rank su navigazione indietro/avanti.
3. Aggiunta `/auth/callback` per scambiare il codice PKCE con una sessione, necessaria ai link email SSR.
4. Registrazione: se Supabase richiede conferma email, mostra il messaggio di conferma invece di entrare in onboarding senza sessione.
5. Recupero password: destinazione email attraverso callback; conferma password, validazione server e verifica dell'utente prima della modifica.
6. Reindirizzamenti dopo login/iscrizione: validazione centralizzata dei percorsi interni, compresi backslash e separatori codificati.
7. Preservati i cookie aggiornati quando il middleware reindirizza il visitatore.
8. Supportata `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, mantenendo la compatibilità con `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
9. Creazione team: Invio nei passaggi intermedi non invia più il modulo finale; pulsante finale disabilitato durante il salvataggio, etichette collegate ai campi, limite nome 60 caratteri anche nella validazione server. Il logo resta una sola anteprima, dichiarata nel riepilogo.
10. Aggiunti test eseguibili sui flussi auth con servizi simulati; nessuna email o utenza di test è stata creata in produzione.

## Problemi ancora aperti

Le priorità seguenti riguardano il sorgente esaminato. Non attestano che il sito live esponga gli stessi problemi.

| Priorità | File/area | Riscontro e intervento necessario |
|---|---|---|
| P0 — blocca pubblicazione | `supabase/migrations/202608230001_peakgg_platform.sql`, `202608230004_profile_and_dispute_privacy.sql`, `src/integrations/supabase/types.ts` | Schema nuovo e precedente mescolati. La 001 crea direttamente `profiles`, `teams` e altri oggetti; la 004 usa colonne (`display_name`, `discord_username`, ecc.), tabella `match_disputes` e funzioni assenti nella 001. I tipi precedenti hanno ruoli minuscoli, mentre il codice nuovo richiede maiuscoli. Serve lo schema live e la cronologia migrazioni per preparare un aggiornamento conservativo. Non eseguire reset né applicare questa sequenza alla cieca. |
| P1 — autorizzazioni | `202608230001_peakgg_platform.sql`, policy `own profile update` | Controlla la proprietà della riga, ma non limita le colonne modificabili. Se non esistono ulteriori restrizioni live, l'utente può modificare anche stato account/verifica Riot definiti nello schema nuovo. Verificare grants/trigger e separare campi amministrativi. |
| P1 — risultati | `202608230002_security_hardening.sql`, `confirm_match_result` | Esclude il medesimo autore, ma ammette altri partecipanti della stessa squadra; manca il requisito di conferma del capitano avversario. Verificare funzione live e correggere con test su due squadre. |
| P1 — iscrizioni/partite | `202608230001_peakgg_platform.sql`, RPC | Registrazione controlla la dimensione totale ma non esattamente cinque titolari; la lista d'attesa ignora `waitlist_enabled`. La submission risultato non impone leadership né verifica i cinque partecipanti; l'aggiornamento stato può interessare zero righe dopo l'inserimento. Verificare e correggere lato database, non soltanto nel form. |
| P1 — flusso torneo | `app/tournaments/page.tsx`, `data/tournaments.ts` | Sei eventi locali con conteggi e date statiche; alcuni risultano ancora aperti pur avendo date passate. I dettagli fanno fallback agli stessi eventi demo. Collegare elenco, dettaglio e iscrizione a una sorgente live unica. |
| P1 — admin | `components/admin/AdminPage.tsx`, `app/admin/tournaments/new/page.tsx` | Tabelle vuote predefinite; il form nuovo torneo non ha action di salvataggio/pubblicazione. Annunci disabilitati. Completare letture, mutazioni, permessi e audit. |
| P1 — dashboard | `app/dashboard/team/page.tsx`, `app/dashboard/tournaments/page.tsx` | Mostrano sempre stati vuoti, anche se l'utente avesse già un team o iscrizioni. Collegare a dati reali con gestione errori. |
| P1 — giocatori | `components/players/PlayersDirectory.tsx`, `lib/internal-pages-models.mjs` | 36 giocatori generati; i profili dettaglio invece interrogano Supabase. Le schede possono portare a 404. Il rank demo è scelto indipendentemente dall'ELO. Sostituire con profili pubblici reali e mostrare campi verificati correttamente. |
| P1 — identità esistente | `lib/auth/actions.ts` e schema legacy | Il nuovo frontend offre email/password, mentre le istruzioni precedenti richiedevano preservare magic link e Google se configurati. Inventariare i provider live prima di sostituire il sito. |
| P2 — team | `components/teams/CreateTeamWizard.tsx`, `app/teams/create/actions.ts` | Logo visualizzato ma non caricato o salvato. Gestione roster, inviti/candidature e pagine team incomplete. Completare dopo la riconciliazione schema/policy storage. |
| P2 — progressione | `app/leaderboard/page.tsx`, RPC conferma risultato | Classifica statica; la conferma risultato non implementa l'avanzamento bracket e gli accrediti descritti in `docs/peakgg-architecture.md`. Distinguere requisiti e funzionalità effettive. |
| P2 — contenuti | Sito live; `app/privacy/page.tsx`, `app/terms/page.tsx`; i18n | Nel live: “10 rank” ma sette tier, italiano/inglese mischiati, beta “closed” dichiarata aperta senza invito. Nel nuovo codice i testi sono soprattutto inglesi; privacy e termini sono brevi segnaposto. Ripristinare EN/FR/IT e completare i contenuti prima del lancio. |

## Condizioni di verifica auth prima del merge/deploy

- Configurare l'origine corretta in `NEXT_PUBLIC_SITE_URL` per ogni ambiente.
- Nel progetto Supabase effettivo, autorizzare gli URL callback esatti di produzione/preview, inclusi i parametri di ritorno necessari. La modifica a `supabase/config.toml` riguarda solo l'ambiente locale; non aggiorna il dashboard live.
- Controllare i template email correnti: il callback implementato usa il flusso PKCE `code`. Template personalizzati che inviano `token_hash` richiedono il corrispondente handler verificato.
- Provare conferma account e reset password in staging, stesso browser e browser diverso, con link validi/scaduti e senza divulgare credenziali.
- Provare due squadre e ruoli distinti per iscrizione, roster, check-in, invio/conferma/contestazione risultato; verificare gli effetti nel database.
- La segnalazione Critical di agosto resta da recuperare nel pannello Security Lovable: non è stata marcata risolta da questa verifica.

## Validazione

- Prima delle correzioni: tre errori TypeScript, due errori lint; build capace di terminare nonostante i problemi dei controlli separati.
- Dopo le correzioni: **52/52 test passati; typecheck, lint e build terminati con exit code 0**, eseguiti separatamente. I test auth simulano Supabase e non sono una prova end-to-end del backend live.
- Il browser ha letto il sito pubblico; l'anteprima Lovable richiede login. Il browser remoto non apre localhost. L'avvio dev locale fallisce su `uv_interface_addresses` nel plugin Cloudflare di questo ambiente, anche con bind a loopback. Nessun audit visuale post-correzione dichiarato.
- Le correzioni sono proposte su branch/PR dedicato, senza sostituire il design, pubblicare il nuovo frontend o alterare dati esistenti.

## Prossimo blocco di lavoro

Recuperare schema, policy, funzioni e cronologia migrazioni del database PeakGG effettivo tramite Lovable Cloud o una connessione Supabase al progetto corretto; confrontarli con il codice. Solo dopo scegliere gli adattamenti, completare un percorso torneo end-to-end e rivedere la homepage mantenendo il riferimento visivo concordato.
