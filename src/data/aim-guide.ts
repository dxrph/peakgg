import type { SupportedLocale } from "@/i18n/config";

export type AimGameKey = "valorant" | "cs2" | "r6";

export interface AimGuideContent {
  back_to_site: string;
  title_pre: string;
  title_post: string;
  hero_subtitle: string;
  footer: string;
  tabs: {
    intro: string;
    tools: string;
    warmup: string;
    theory: string;
    games: string;
    mindset: string;
  };
  intro: {
    what_title: string;
    what_p1_pre: string;
    what_p1_post: string;
    what_p2: string;
    pros_title: string;
    pros_items: string[];
    cons_title: string;
    cons_items: string[];
    time_title: string;
    time_warmup_strong: string;
    time_warmup_rest: string;
    time_session_strong: string;
    time_session_rest: string;
    time_warning: string;
  };
  tools: {
    apps: {
      name: string;
      price: string;
      badge: string | null;
      desc: string;
      pros: string[];
      cons: string[];
    }[];
    pros_label: string;
    cons_label: string;
    advice_title: string;
    advice_pre: string;
    advice_strong1: string;
    advice_mid: string;
    advice_strong2: string;
    advice_post: string;
  };
  warmup: {
    phases: { title: string; steps: { scenario: string; type: string; desc: string }[] }[];
    rules_title: string;
    rules: string[];
  };
  theory: {
    categories: { emoji: string; title: string; color: string; badges: string[]; desc: string; tip: string }[];
    sens_title: string;
    sens_data: { cat: string; range: string }[];
    sens_universal_label: string;
    sens_universal_value: string;
    sens_note_label: string;
    sens_note_text: string;
    tip_label: string;
  };
  games: {
    setup_label: string;
    sens_label: string;
    fov_label: string;
    warmup_label: string;
    tips_label: string;
    data: Record<AimGameKey, { label: string; setup: { sens: string; fov: string }; warmup: string[]; tips: string[] }>;
  };
  mindset: {
    growth_title: string;
    fixed_title: string;
    fixed_items: string[];
    growth_subtitle: string;
    growth_items: string[];
    health_title: string;
    health_items: { emoji: string; title: string; desc: string }[];
    self_title: string;
    self_p1: string;
    self_p2: string;
  };
}

const it: AimGuideContent = {
  back_to_site: "← Torna al sito",
  title_pre: "PeakGG",
  title_post: "Aim Guide",
  hero_subtitle: "La guida definitiva all'aim training per la community competitiva. Migliora la tua mira, scala le classifiche.",
  footer: "PeakGG © 2026 — Basato sulle risorse Voltaic • Guida scritta per la community competitiva",
  tabs: { intro: "Introduzione", tools: "App & Strumenti", warmup: "Warm-Up", theory: "Aim Theory", games: "Per Gioco", mindset: "Mindset & Salute" },
  intro: {
    what_title: "Cos'è l'Aim Training?",
    what_p1_pre: "L'aim training è l'allenamento mirato del controllo del mouse tramite app dedicate come ",
    what_p1_post: ".",
    what_p2: "Pensa alla palestra: isoli le singole abilità (flick, tracking, switching), le alleni con ripetizione e feedback, poi applichi i miglioramenti in partita. Non sostituisce il gioco, lo potenzia.",
    pros_title: "Cosa migliora",
    pros_items: ["Consistenza nei colpi", "Lettura movimenti avversari", "Controllo mouse", "Velocità acquisizione target", "Micro-correzioni"],
    cons_title: "Cosa NON migliora",
    cons_items: ["Game sense", "Decision making", "Posizionamento mappa", "Comunicazione team", "Conoscenza mappe"],
    time_title: "Quanto tempo dedicare?",
    time_warmup_strong: "15-20 min",
    time_warmup_rest: " di warm-up prima di ogni sessione di gioco.",
    time_session_strong: "30-60 min",
    time_session_rest: " per sessioni di aim training dedicate.",
    time_warning: "⚠️ Mai superare le 2 ore: rischio RSI (infiammazione) e rendimenti decrescenti.",
  },
  tools: {
    apps: [
      { name: "KovaaK's 2.0", price: "€9.75 su Steam", badge: "⭐ CONSIGLIATO", desc: "L'aim trainer più completo e usato dai pro. Migliaia di scenari, playlist Voltaic integrate, statistiche dettagliate.", pros: ["Community enorme", "Scenari illimitati", "Playlist Voltaic", "Statistiche avanzate"], cons: ["A pagamento", "UI un po' datata"] },
      { name: "Aim Lab", price: "Gratuito su Steam", badge: "🆓 GRATUITO", desc: "Aim trainer gratuito con interfaccia moderna e analisi AI. Perfetto per iniziare.", pros: ["Gratuito", "UI moderna", "Profili game-specific", "Analisi AI"], cons: ["Meno scenari di KovaaK's", "Meno usato dai top aimer"] },
      { name: "Aimbeast", price: "€4.99 su Steam", badge: null, desc: "Alternativa leggera con features uniche e buon sistema di progressione.", pros: ["Prezzo basso", "Leggero", "Buona progressione"], cons: ["Community piccola", "Meno scenari"] },
    ],
    pros_label: "PRO",
    cons_label: "CONTRO",
    advice_title: "Il consiglio di PeakGG",
    advice_pre: "Se non hai mai fatto aim training, parti con ",
    advice_strong1: "Aim Lab",
    advice_mid: " (gratuito). Quando vorrai fare sul serio, passa a ",
    advice_strong2: "KovaaK's",
    advice_post: " per le routine Voltaic.",
  },
  warmup: {
    phases: [
      { title: "Fase 1 — Attivazione Base (5 min)", steps: [
        { scenario: "Smoothbot / Smoothsphere", type: "Precise Tracking", desc: "Movimenti ampi e fluidi per attivare il braccio" },
        { scenario: "Centering 90 Easy", type: "Reactive Tracking", desc: "Tracking orizzontale per scaldare il polso" },
      ]},
      { title: "Fase 2 — Precisione (5 min)", steps: [
        { scenario: "1w4ts Voltaic / Gridshot", type: "Static Click", desc: "Flick su target statici, linee dritte" },
        { scenario: "ww3t Voltaic", type: "Speed Switch", desc: "Switch veloce tra 3 target" },
      ]},
      { title: "Fase 3 — Game-Specific (5-10 min)", steps: [
        { scenario: "Deathmatch / T-Hunt", type: "In-Game", desc: "Sessione breve di warm-up nel tuo gioco" },
        { scenario: "Pasu Voltaic / Tamspeed", type: "Dynamic Click", desc: "Click timing su target in movimento" },
      ]},
    ],
    rules_title: "Regole d'oro del Warm-Up",
    rules: [
      "Non puntare al punteggio, serve per attivare i muscoli",
      "Parti lento, accelera gradualmente",
      "Se ti senti \"freddo\" dopo il warm-up, aggiungi 5 min di DM/T-Hunt",
      "Consistenza > Intensità: 15 minuti ogni giorno battono 2 ore una volta a settimana",
    ],
  },
  theory: {
    categories: [
      { emoji: "🔴", title: "Clicking", color: "border-primary/30", badges: ["Static Clicking", "Dynamic Clicking"], desc: "Eliminare bersagli con click singoli o multipli. La base in giochi tattici.", tip: "Mantieni ritmo costante, flick dritti, costruisci velocità mantenendo 95%+ accuracy." },
      { emoji: "🔵", title: "Tracking", color: "border-blue-500/30", badges: ["Precise Tracking", "Reactive Tracking"], desc: "Tenere il mirino su un bersaglio in movimento continuo.", tip: "Non predire. Reagisci ai cambi di direzione. Concentrati sul bersaglio, non sul mirino." },
      { emoji: "🟣", title: "Switching", color: "border-purple-500/30", badges: ["Speed Switch", "Evasive Switch"], desc: "Passare velocemente da un target all'altro con tracking breve.", tip: "Pensa sempre al prossimo target. Flick dritto, micro-correggi, passa al successivo." },
      { emoji: "🟡", title: "Strafe Aim", color: "border-yellow-500/30", badges: ["Mirroring", "Anti-Mirroring"], desc: "Mirare mentre ti muovi.", tip: "Pratica sia mirroring che anti-mirroring. Movimento indipendente dalla mano del mouse." },
    ],
    sens_title: "Sensibilità Consigliata",
    sens_data: [{ cat: "Clicking", range: "30-60 cm/360°" }, { cat: "Tracking", range: "25-35 cm/360°" }],
    sens_universal_label: "Punto di partenza universale:",
    sens_universal_value: "~30 cm/360° (es. 800 DPI, 0.30 Valorant)",
    sens_note_label: "Nota:",
    sens_note_text: "la \"muscle memory\" è un mito. Puoi cambiare sensibilità senza problemi.",
    tip_label: "💡 Tip:",
  },
  games: {
    setup_label: "⚙️ Setup",
    sens_label: "Sensibilità:",
    fov_label: "FOV:",
    warmup_label: "🔥 Warm-Up Specifico",
    tips_label: "🏆 5 Consigli Pro",
    data: {
      valorant: { label: "Valorant", setup: { sens: "0.2–0.5 a 800 DPI (35-80 cm/360°). TTK basso, precisione > tracking.", fov: "Fisso 103° orizzontale" },
        warmup: ["Deathmatch No Armor (5 min) — Solo headshot, crosshair placement", "The Range Practice (3 min) — Bots con strafing, one-tap", "KovaaK's/Aimlabs Static Dots (5 min) — 1w6ts o Gridshot per flick", "KovaaK's Pasu Voltaic (5 min) — Click timing su bersagli in movimento"],
        tips: ["Crosshair placement > flick. Mirino a livello testa nei punti di contatto", "Pratica counter-strafing", "Prima pallottola precisa → allena il one-tap", "Usa la Range per spray pattern (Vandal, Phantom)", "DM solo headshot, ignora K/D"] },
      cs2: { label: "CS2", setup: { sens: "1.0–2.5 a 400 DPI (35-70 cm/360°). Aim meccanico, spray pattern importanti.", fov: "90° verticale fisso" },
        warmup: ["Aim_botz Workshop Map (5 min) — 100 kill, headshot", "Deathmatch FFA (5 min) — Solo AK/M4, testa", "KovaaK's ww3t Voltaic (5 min) — Flick su target statici", "Recoil Master Workshop (3 min) — Pattern di spray"],
        tips: ["Spray control fondamentale: 5-10 min/giorno su pattern AK e M4", "Pratica shoulder peek e jiggle peek", "Impara le prefire spots", "Sens generalmente più bassa che in Valorant", "Allena tracking per spray transfer"] },
      r6: { label: "Rainbow Six Siege", setup: { sens: "7-12 in-game a 400 DPI. Separare ADS e hipfire.", fov: "80-90° consigliato" },
        warmup: ["T-Hunt Classic House (5 min) — Solo headshot", "T-Hunt Elimination Varied Maps (5 min) — Angoli stretti e pre-fire", "KovaaK's Tamspeed 2bp (5 min) — Click timing", "Aimlabs Microshot (3 min) — Micro-flick per angoli stretti"],
        tips: ["Pratica \"slicing the pie\": un angolo alla volta", "ADS sens separata per ogni scope", "Quick-lean-peek (Q/E) per esporti meno", "Distruzione ambientale cambia gli angoli: spara attraverso superfici morbide", "Allena vertical aim: scontri tra piani diversi"] },
    },
  },
  mindset: {
    growth_title: "Growth Mindset",
    fixed_title: "❌ Fixed Mindset",
    fixed_items: ["Evita sfide", "Non impara dagli errori", "Si arrende facilmente", "\"Non sono portato\"", "Gioca per vincere"],
    growth_subtitle: "✅ Growth Mindset",
    growth_items: ["Abbraccia sfide", "Analizza errori", "Persistente", "\"Imparerò\"", "Gioca per migliorare"],
    health_title: "Salute & Postura",
    health_items: [
      { emoji: "😴", title: "Sonno", desc: "7-9 ore. Influenza i tempi di reazione." },
      { emoji: "🏃", title: "Esercizio", desc: "30 min/giorno. Prepara il cervello ad apprendere." },
      { emoji: "🪑", title: "Postura", desc: "Schiena dritta, avambraccio parallelo, controlla ogni 30 min." },
      { emoji: "💧", title: "Idratazione", desc: "Bevi regolarmente, disidratazione peggiora concentrazione." },
    ],
    self_title: "Auto-Analisi",
    self_p1: "Registra le tue sessioni, riguardati e cerca pattern: shakiness, reazioni lente, over-flick, cattivo crosshair placement.",
    self_p2: "La pratica deliberata è più efficace del giocare scenari a caso.",
  },
};

const en: AimGuideContent = {
  back_to_site: "← Back to site",
  title_pre: "PeakGG",
  title_post: "Aim Guide",
  hero_subtitle: "The definitive aim training guide for the competitive community. Sharpen your aim, climb the ladder.",
  footer: "PeakGG © 2026 — Based on Voltaic resources • Guide written for the competitive community",
  tabs: { intro: "Introduction", tools: "Apps & Tools", warmup: "Warm-Up", theory: "Aim Theory", games: "By Game", mindset: "Mindset & Health" },
  intro: {
    what_title: "What is Aim Training?",
    what_p1_pre: "Aim training is targeted mouse-control practice using dedicated apps like ",
    what_p1_post: ".",
    what_p2: "Think of it as the gym: you isolate individual skills (flick, tracking, switching), train them with reps and feedback, then bring the gains into your matches. It doesn't replace the game — it amplifies it.",
    pros_title: "What it improves",
    pros_items: ["Shot consistency", "Reading enemy movement", "Mouse control", "Target acquisition speed", "Micro-corrections"],
    cons_title: "What it does NOT improve",
    cons_items: ["Game sense", "Decision making", "Map positioning", "Team comms", "Map knowledge"],
    time_title: "How much time should I spend?",
    time_warmup_strong: "15-20 min",
    time_warmup_rest: " warm-up before every gaming session.",
    time_session_strong: "30-60 min",
    time_session_rest: " for dedicated aim training sessions.",
    time_warning: "⚠️ Never go past 2 hours: risk of RSI (inflammation) and diminishing returns.",
  },
  tools: {
    apps: [
      { name: "KovaaK's 2.0", price: "€9.75 on Steam", badge: "⭐ RECOMMENDED", desc: "The most complete aim trainer, used by pros. Thousands of scenarios, built-in Voltaic playlists, detailed stats.", pros: ["Huge community", "Unlimited scenarios", "Voltaic playlists", "Advanced stats"], cons: ["Paid", "Slightly dated UI"] },
      { name: "Aim Lab", price: "Free on Steam", badge: "🆓 FREE", desc: "Free aim trainer with a modern UI and AI analysis. Perfect to get started.", pros: ["Free", "Modern UI", "Game-specific profiles", "AI analysis"], cons: ["Fewer scenarios than KovaaK's", "Less used by top aimers"] },
      { name: "Aimbeast", price: "€4.99 on Steam", badge: null, desc: "A lightweight alternative with unique features and a solid progression system.", pros: ["Low price", "Lightweight", "Good progression"], cons: ["Small community", "Fewer scenarios"] },
    ],
    pros_label: "PROS",
    cons_label: "CONS",
    advice_title: "PeakGG's tip",
    advice_pre: "If you've never done aim training, start with ",
    advice_strong1: "Aim Lab",
    advice_mid: " (free). When you want to get serious, switch to ",
    advice_strong2: "KovaaK's",
    advice_post: " for the Voltaic routines.",
  },
  warmup: {
    phases: [
      { title: "Phase 1 — Base activation (5 min)", steps: [
        { scenario: "Smoothbot / Smoothsphere", type: "Precise Tracking", desc: "Wide, smooth movements to activate the arm" },
        { scenario: "Centering 90 Easy", type: "Reactive Tracking", desc: "Horizontal tracking to warm up the wrist" },
      ]},
      { title: "Phase 2 — Precision (5 min)", steps: [
        { scenario: "1w4ts Voltaic / Gridshot", type: "Static Click", desc: "Flicks on static targets, straight lines" },
        { scenario: "ww3t Voltaic", type: "Speed Switch", desc: "Fast switching between 3 targets" },
      ]},
      { title: "Phase 3 — Game-specific (5-10 min)", steps: [
        { scenario: "Deathmatch / T-Hunt", type: "In-Game", desc: "Short warm-up session in your game" },
        { scenario: "Pasu Voltaic / Tamspeed", type: "Dynamic Click", desc: "Click timing on moving targets" },
      ]},
    ],
    rules_title: "Warm-Up golden rules",
    rules: [
      "Don't chase the score — it's about activating the muscles",
      "Start slow, ramp up gradually",
      "If you still feel \"cold\" after the warm-up, add 5 min of DM/T-Hunt",
      "Consistency > intensity: 15 minutes daily beats 2 hours once a week",
    ],
  },
  theory: {
    categories: [
      { emoji: "🔴", title: "Clicking", color: "border-primary/30", badges: ["Static Clicking", "Dynamic Clicking"], desc: "Eliminate targets with single or multiple clicks. The foundation in tactical games.", tip: "Keep a steady rhythm, straight flicks, build speed while keeping 95%+ accuracy." },
      { emoji: "🔵", title: "Tracking", color: "border-blue-500/30", badges: ["Precise Tracking", "Reactive Tracking"], desc: "Keep your crosshair on a continuously moving target.", tip: "Don't predict. React to direction changes. Focus on the target, not the crosshair." },
      { emoji: "🟣", title: "Switching", color: "border-purple-500/30", badges: ["Speed Switch", "Evasive Switch"], desc: "Snap quickly from one target to another with brief tracking.", tip: "Always think about the next target. Straight flick, micro-correct, move on." },
      { emoji: "🟡", title: "Strafe Aim", color: "border-yellow-500/30", badges: ["Mirroring", "Anti-Mirroring"], desc: "Aiming while you move.", tip: "Train both mirroring and anti-mirroring. Movement independent from mouse hand." },
    ],
    sens_title: "Recommended Sensitivity",
    sens_data: [{ cat: "Clicking", range: "30-60 cm/360°" }, { cat: "Tracking", range: "25-35 cm/360°" }],
    sens_universal_label: "Universal starting point:",
    sens_universal_value: "~30 cm/360° (e.g. 800 DPI, 0.30 Valorant)",
    sens_note_label: "Note:",
    sens_note_text: "\"muscle memory\" is a myth. You can change sensitivity without issues.",
    tip_label: "💡 Tip:",
  },
  games: {
    setup_label: "⚙️ Setup",
    sens_label: "Sensitivity:",
    fov_label: "FOV:",
    warmup_label: "🔥 Game-specific warm-up",
    tips_label: "🏆 5 Pro tips",
    data: {
      valorant: { label: "Valorant", setup: { sens: "0.2–0.5 at 800 DPI (35-80 cm/360°). Low TTK, precision > tracking.", fov: "Fixed 103° horizontal" },
        warmup: ["Deathmatch No Armor (5 min) — Headshots only, crosshair placement", "The Range Practice (3 min) — Bots with strafing, one-tap", "KovaaK's/Aimlabs Static Dots (5 min) — 1w6ts or Gridshot for flicks", "KovaaK's Pasu Voltaic (5 min) — Click timing on moving targets"],
        tips: ["Crosshair placement > flick. Crosshair at head height on contact angles", "Practice counter-strafing", "First bullet accuracy → train the one-tap", "Use the Range for spray patterns (Vandal, Phantom)", "DM headshots only, ignore K/D"] },
      cs2: { label: "CS2", setup: { sens: "1.0–2.5 at 400 DPI (35-70 cm/360°). Mechanical aim, spray patterns matter.", fov: "Fixed 90° vertical" },
        warmup: ["Aim_botz Workshop Map (5 min) — 100 kills, headshots", "Deathmatch FFA (5 min) — AK/M4 only, head", "KovaaK's ww3t Voltaic (5 min) — Flicks on static targets", "Recoil Master Workshop (3 min) — Spray patterns"],
        tips: ["Spray control is essential: 5-10 min/day on AK and M4 patterns", "Practice shoulder peek and jiggle peek", "Learn the prefire spots", "Sens usually lower than Valorant", "Train tracking for spray transfer"] },
      r6: { label: "Rainbow Six Siege", setup: { sens: "7-12 in-game at 400 DPI. Separate ADS and hipfire.", fov: "80-90° recommended" },
        warmup: ["T-Hunt Classic House (5 min) — Headshots only", "T-Hunt Elimination Varied Maps (5 min) — Tight angles and pre-fire", "KovaaK's Tamspeed 2bp (5 min) — Click timing", "Aimlabs Microshot (3 min) — Micro-flicks for tight angles"],
        tips: ["Practice \"slicing the pie\": one angle at a time", "Separate ADS sens per scope", "Quick-lean-peek (Q/E) to expose less", "Environmental destruction changes angles: shoot through soft surfaces", "Train vertical aim: fights between floors"] },
    },
  },
  mindset: {
    growth_title: "Growth Mindset",
    fixed_title: "❌ Fixed Mindset",
    fixed_items: ["Avoids challenges", "Doesn't learn from mistakes", "Gives up easily", "\"I'm just not built for this\"", "Plays to win"],
    growth_subtitle: "✅ Growth Mindset",
    growth_items: ["Embraces challenges", "Analyzes mistakes", "Persistent", "\"I'll learn\"", "Plays to improve"],
    health_title: "Health & Posture",
    health_items: [
      { emoji: "😴", title: "Sleep", desc: "7-9 hours. Affects reaction times." },
      { emoji: "🏃", title: "Exercise", desc: "30 min/day. Primes the brain to learn." },
      { emoji: "🪑", title: "Posture", desc: "Straight back, forearm parallel, check it every 30 min." },
      { emoji: "💧", title: "Hydration", desc: "Drink regularly — dehydration kills focus." },
    ],
    self_title: "Self-Analysis",
    self_p1: "Record your sessions, watch them back and look for patterns: shakiness, slow reactions, over-flicks, bad crosshair placement.",
    self_p2: "Deliberate practice is more effective than playing random scenarios.",
  },
};

const fr: AimGuideContent = {
  back_to_site: "← Retour au site",
  title_pre: "PeakGG",
  title_post: "Aim Guide",
  hero_subtitle: "Le guide ultime de l'aim training pour la communauté compétitive. Affûte ta visée, grimpe au classement.",
  footer: "PeakGG © 2026 — Basé sur les ressources Voltaic • Guide rédigé pour la communauté compétitive",
  tabs: { intro: "Introduction", tools: "Apps & Outils", warmup: "Warm-Up", theory: "Aim Theory", games: "Par jeu", mindset: "Mindset & Santé" },
  intro: {
    what_title: "C'est quoi l'Aim Training ?",
    what_p1_pre: "L'aim training est l'entraînement ciblé du contrôle de la souris via des applis dédiées comme ",
    what_p1_post: ".",
    what_p2: "Pense à la salle de sport : tu isoles chaque compétence (flick, tracking, switching), tu l'entraînes avec répétition et feedback, puis tu appliques les progrès en match. Ça ne remplace pas le jeu, ça l'amplifie.",
    pros_title: "Ce que ça améliore",
    pros_items: ["Constance des tirs", "Lecture des mouvements adverses", "Contrôle souris", "Vitesse d'acquisition de cible", "Micro-corrections"],
    cons_title: "Ce que ça n'améliore PAS",
    cons_items: ["Game sense", "Prise de décision", "Placement sur la map", "Communication d'équipe", "Connaissance des maps"],
    time_title: "Combien de temps y consacrer ?",
    time_warmup_strong: "15-20 min",
    time_warmup_rest: " de warm-up avant chaque session de jeu.",
    time_session_strong: "30-60 min",
    time_session_rest: " pour les sessions d'aim training dédiées.",
    time_warning: "⚠️ Ne jamais dépasser 2 heures : risque de TMS (inflammation) et rendements décroissants.",
  },
  tools: {
    apps: [
      { name: "KovaaK's 2.0", price: "9,75 € sur Steam", badge: "⭐ RECOMMANDÉ", desc: "L'aim trainer le plus complet, utilisé par les pros. Des milliers de scénarios, playlists Voltaic intégrées, stats détaillées.", pros: ["Énorme communauté", "Scénarios illimités", "Playlists Voltaic", "Stats avancées"], cons: ["Payant", "UI un peu datée"] },
      { name: "Aim Lab", price: "Gratuit sur Steam", badge: "🆓 GRATUIT", desc: "Aim trainer gratuit avec UI moderne et analyse IA. Parfait pour démarrer.", pros: ["Gratuit", "UI moderne", "Profils par jeu", "Analyse IA"], cons: ["Moins de scénarios que KovaaK's", "Moins utilisé par les top aimers"] },
      { name: "Aimbeast", price: "4,99 € sur Steam", badge: null, desc: "Alternative légère avec des features uniques et un bon système de progression.", pros: ["Prix bas", "Léger", "Bonne progression"], cons: ["Petite communauté", "Moins de scénarios"] },
    ],
    pros_label: "POUR",
    cons_label: "CONTRE",
    advice_title: "Le conseil PeakGG",
    advice_pre: "Si tu n'as jamais fait d'aim training, commence avec ",
    advice_strong1: "Aim Lab",
    advice_mid: " (gratuit). Quand tu voudras passer au sérieux, bascule sur ",
    advice_strong2: "KovaaK's",
    advice_post: " pour les routines Voltaic.",
  },
  warmup: {
    phases: [
      { title: "Phase 1 — Activation de base (5 min)", steps: [
        { scenario: "Smoothbot / Smoothsphere", type: "Precise Tracking", desc: "Mouvements amples et fluides pour activer le bras" },
        { scenario: "Centering 90 Easy", type: "Reactive Tracking", desc: "Tracking horizontal pour échauffer le poignet" },
      ]},
      { title: "Phase 2 — Précision (5 min)", steps: [
        { scenario: "1w4ts Voltaic / Gridshot", type: "Static Click", desc: "Flicks sur cibles statiques, lignes droites" },
        { scenario: "ww3t Voltaic", type: "Speed Switch", desc: "Switch rapide entre 3 cibles" },
      ]},
      { title: "Phase 3 — Spécifique au jeu (5-10 min)", steps: [
        { scenario: "Deathmatch / T-Hunt", type: "In-Game", desc: "Courte session de warm-up dans ton jeu" },
        { scenario: "Pasu Voltaic / Tamspeed", type: "Dynamic Click", desc: "Timing de clic sur cibles en mouvement" },
      ]},
    ],
    rules_title: "Les règles d'or du Warm-Up",
    rules: [
      "Ne vise pas le score, ça sert à activer les muscles",
      "Commence lentement, accélère progressivement",
      "Si tu te sens encore \"froid\" après le warm-up, ajoute 5 min de DM/T-Hunt",
      "Constance > Intensité : 15 minutes par jour valent mieux que 2 heures une fois par semaine",
    ],
  },
  theory: {
    categories: [
      { emoji: "🔴", title: "Clicking", color: "border-primary/30", badges: ["Static Clicking", "Dynamic Clicking"], desc: "Éliminer des cibles avec un ou plusieurs clics. La base sur les jeux tactiques.", tip: "Garde un rythme constant, flicks droits, monte en vitesse en restant à 95%+ d'accuracy." },
      { emoji: "🔵", title: "Tracking", color: "border-blue-500/30", badges: ["Precise Tracking", "Reactive Tracking"], desc: "Garder le viseur sur une cible en mouvement continu.", tip: "Ne prédis pas. Réagis aux changements de direction. Concentre-toi sur la cible, pas sur le viseur." },
      { emoji: "🟣", title: "Switching", color: "border-purple-500/30", badges: ["Speed Switch", "Evasive Switch"], desc: "Passer rapidement d'une cible à l'autre avec un tracking court.", tip: "Pense toujours à la cible suivante. Flick droit, micro-correction, on enchaîne." },
      { emoji: "🟡", title: "Strafe Aim", color: "border-yellow-500/30", badges: ["Mirroring", "Anti-Mirroring"], desc: "Viser pendant que tu te déplaces.", tip: "Travaille mirroring et anti-mirroring. Mouvement indépendant de la main de souris." },
    ],
    sens_title: "Sensibilité recommandée",
    sens_data: [{ cat: "Clicking", range: "30-60 cm/360°" }, { cat: "Tracking", range: "25-35 cm/360°" }],
    sens_universal_label: "Point de départ universel :",
    sens_universal_value: "~30 cm/360° (ex. 800 DPI, 0.30 Valorant)",
    sens_note_label: "Note :",
    sens_note_text: "la \"muscle memory\" est un mythe. Tu peux changer de sensibilité sans souci.",
    tip_label: "💡 Tip :",
  },
  games: {
    setup_label: "⚙️ Setup",
    sens_label: "Sensibilité :",
    fov_label: "FOV :",
    warmup_label: "🔥 Warm-Up spécifique",
    tips_label: "🏆 5 conseils pro",
    data: {
      valorant: { label: "Valorant", setup: { sens: "0.2–0.5 à 800 DPI (35-80 cm/360°). TTK bas, précision > tracking.", fov: "Fixe 103° horizontal" },
        warmup: ["Deathmatch No Armor (5 min) — Headshots uniquement, crosshair placement", "The Range Practice (3 min) — Bots avec strafing, one-tap", "KovaaK's/Aimlabs Static Dots (5 min) — 1w6ts ou Gridshot pour les flicks", "KovaaK's Pasu Voltaic (5 min) — Timing de clic sur cibles mobiles"],
        tips: ["Crosshair placement > flick. Viseur à hauteur de tête sur les angles de contact", "Travaille le counter-strafe", "Première balle précise → entraîne le one-tap", "Utilise la Range pour les patterns (Vandal, Phantom)", "DM headshots uniquement, ignore le K/D"] },
      cs2: { label: "CS2", setup: { sens: "1.0–2.5 à 400 DPI (35-70 cm/360°). Aim mécanique, patterns importants.", fov: "Fixe 90° vertical" },
        warmup: ["Aim_botz Workshop Map (5 min) — 100 kills, tête", "Deathmatch FFA (5 min) — AK/M4 uniquement, tête", "KovaaK's ww3t Voltaic (5 min) — Flicks sur cibles statiques", "Recoil Master Workshop (3 min) — Patterns de spray"],
        tips: ["Le spray control est fondamental : 5-10 min/jour sur AK et M4", "Travaille shoulder peek et jiggle peek", "Apprends les prefire spots", "Sensibilité généralement plus basse que sur Valorant", "Travaille le tracking pour les spray transfers"] },
      r6: { label: "Rainbow Six Siege", setup: { sens: "7-12 en jeu à 400 DPI. Sépare ADS et hipfire.", fov: "80-90° recommandé" },
        warmup: ["T-Hunt Classic House (5 min) — Headshots uniquement", "T-Hunt Elimination Varied Maps (5 min) — Angles serrés et pre-fire", "KovaaK's Tamspeed 2bp (5 min) — Timing de clic", "Aimlabs Microshot (3 min) — Micro-flicks pour angles serrés"],
        tips: ["Travaille \"slicing the pie\" : un angle à la fois", "Sens ADS séparée par scope", "Quick-lean-peek (Q/E) pour t'exposer moins", "La destruction change les angles : tire à travers les surfaces molles", "Travaille le vertical aim : duels entre étages"] },
    },
  },
  mindset: {
    growth_title: "Growth Mindset",
    fixed_title: "❌ Fixed Mindset",
    fixed_items: ["Évite les défis", "N'apprend pas de ses erreurs", "Abandonne facilement", "\"Je ne suis pas fait pour ça\"", "Joue pour gagner"],
    growth_subtitle: "✅ Growth Mindset",
    growth_items: ["Embrasse les défis", "Analyse les erreurs", "Persistant", "\"Je vais apprendre\"", "Joue pour progresser"],
    health_title: "Santé & Posture",
    health_items: [
      { emoji: "😴", title: "Sommeil", desc: "7-9 heures. Influe sur les temps de réaction." },
      { emoji: "🏃", title: "Exercice", desc: "30 min/jour. Prépare le cerveau à apprendre." },
      { emoji: "🪑", title: "Posture", desc: "Dos droit, avant-bras parallèle, vérifie toutes les 30 min." },
      { emoji: "💧", title: "Hydratation", desc: "Bois régulièrement, la déshydratation tue la concentration." },
    ],
    self_title: "Auto-analyse",
    self_p1: "Enregistre tes sessions, regarde-les et cherche les patterns : shakiness, réactions lentes, over-flicks, mauvais crosshair placement.",
    self_p2: "La pratique délibérée est plus efficace que jouer des scénarios au hasard.",
  },
};

const dict: Record<SupportedLocale, AimGuideContent> = { it, en, fr };

export function getAimGuideContent(locale: SupportedLocale): AimGuideContent {
  return dict[locale] ?? dict.en;
}