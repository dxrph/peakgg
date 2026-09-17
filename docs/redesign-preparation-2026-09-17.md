# PeakGG — preparazione redesign
Data: 2026-09-17
Stato: proposta di direzione, da valutare visivamente; non approvata e non pubblicata.

## Obiettivo
Rendere immediatamente comprensibili tre azioni: trovare un torneo, trovare una squadra, seguire la propria progressione. Esperienza competitiva VALORANT, EN/FR/IT, con contenuti reali.

## Riferimenti osservati
- https://damngoodbrands.com/ : titolo dominante, alto contrasto, navigazione essenziale. Riprendere la gerarchia, non gli oggetti decorativi.
- https://white-desert.com/ : immagine immersiva, pochi elementi sopra il visual, spazi ampi. Riprendere composizione e respiro.
- https://www.challengermode.com/portal : proposta spiegata chiaramente e prodotto visibile. La pagina osservata è il portale commerciale, non la dashboard autenticata.

## Direzione proposta
Carbone #101112, bianco caldo #F4F1EB, rosso #FF493E.
Il rosso identifica azioni primarie e dettagli distintivi; non ogni contenitore.
Su pulsanti rosso chiaro verificare il contrasto: preferire testo scuro; bianco solo su rosso più scuro verificato.
Logo esistente: mantenere il marchio. Nel concept raster la scritta PeakGG è un segnaposto.
Instrument Sans per titoli, testi e controlli. JetBrains Mono solo per punteggi, orari e dati.
Eliminare la sovrapposizione di font e CSS storici quando si implementa la nuova base.
Titoli in forma normale; maiuscolo solo per brevi etichette.
Desktop: contenuto max 1320 px, margini 48–64 px, griglia 12 colonne.
Mobile: margini 20 px, una colonna, controlli almeno 44 px.
Scala spazi: 4, 8, 12, 16, 24, 32, 48, 64, 96.
Titolo hero: clamp(44px, 6.5vw, 96px), interlinea 0.98–1.04.
Testi: 16–18 px, interlinea 1.5–1.65. Etichette minimo 12 px.
Raggi: 4 px controlli, 8 px pannelli prodotto. Bordi sottili; niente ombre luminose seriali.
Focus visibile, contrasto AA, reduced-motion, niente scroll forzato.

## Homepage e testi di base
1. Navigazione: Tornei / Trova squadra / Classifica; Accedi / Inizia.
2. Hero: “Il tuo team. La prossima sfida.”
   Sottotitolo: “Trova la tua squadra e scendi in campo.”
   Azione principale: Esplora i tornei. Secondaria: Trova squadra.
   Contesto: VALORANT / Community competitiva.
3. Tornei: “Si gioca qui.” Elenco ordinato con gioco, regione, data, formato e stato reali.
   Se non ci sono eventi pubblicati: “I prossimi tornei saranno annunciati qui.”
   Community Cup / Open Scrim nel concept sono esempi illustrativi, non eventi annunciati.
4. Squadra: “Il quinto potresti essere tu.” Ruolo, lingua, disponibilità e livello.
   Mostrare profili reali e stato vuoto se nessuno corrisponde ai filtri.
5. Progressione: sette ranghi PeakGG, criteri trasparenti, separazione dal rank Riot.
6. Community e footer: un invito semplice, supporto e documenti effettivi.

## Asset preparati e necessari
Preparati in conversazione:
- Sfondo originale: architettura tattica con ingresso rosso, spazio scuro a sinistra.
- Concept raster desktop: navigazione, hero e inizio sezione tornei.

L'immagine è una creazione originale, non una mappa ufficiale né una schermata VALORANT.
Il concept è illustrativo; non dimostra funzioni, responsive, contrasto o performance.

Per implementazione:
- Riutilizzare il logo originale, verificarne nitidezza e variante chiara/scura.
- Esportare lo sfondo in WebP/AVIF a 1920/1280/768 px, con dimensioni dichiarate.
- Hero mobile: ritaglio sul portale, testo sopra area scura separata; non ridurre il desktop.
- Obiettivo peso hero desktop <=350 KB e mobile <=180 KB, verificando qualità.
- Pittogrammi e ranghi come SVG; testo e pulsanti sempre HTML.
- Copertine eventi mediante un template tipografico coerente con dati veri.
- Nessuna necessità di generare una diversa immagine per ogni blocco.
- Per eventuali personaggi VALORANT usare risorse con provenienza e condizioni d'uso verificate.
- Nessun video necessario al primo rilascio.

## Pagine e stati da disegnare prima del rilascio
Homepage; elenco/dettaglio torneo; ricerca giocatori; squadra; profilo;
login/registrazione/reset; dashboard; match room; amministrazione.
Per ogni flusso: caricamento, vuoto, errore, successo, autorizzazione mancante.
Responsive da controllare a 390, 768 e 1440 px; tastiera e zoom al 200%.
Traduzioni EN/FR/IT complete, incluse validazioni, navigazione ed email.

## Gate di pubblicazione
Il dominio peakgg.net risulta già pubblico dall'audit precedente.
Il repository e il sito live osservato non rappresentano ancora lo stesso runtime.

1. Identificare il database effettivo; riconciliare gli schemi senza reset dei dati.
2. Verificare permessi dei profili, amministrazione, risultati e registrazioni.
3. Provare registrazione, conferma email, login esistente, reset e logout con account di test.
4. Provare creazione squadra, inviti, cinque titolari, iscrizione e capienza torneo.
5. Provare invio e conferma avversaria dei risultati e gestione controversie.
6. Collegare elenchi/dashboard a dati reali; eliminare attività e statistiche simulate.
7. Completare contenuti informativi e documenti per il servizio effettivamente offerto.
8. Verificare desktop/mobile, immagini, errori, accessibilità e performance.
9. Verificare configurazione del dominio, HTTPS, redirect autenticazione e email.
10. Preparare release identificabile e rollback; pubblicare solo le funzioni verificate.

Le correzioni tecniche precedenti sono nella bozza PR #4:
https://github.com/dxrph/peakgg/pull/4
52 test, lint, typecheck e build passavano all'audit; non equivalgono a test end-to-end sul database live.
