import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mountain, BookOpen, Wrench, Flame, Brain, Gamepad2, Heart, Star, CheckCircle, XCircle, Clock, Crosshair, Target, Zap, Move, ChevronRight, ExternalLink, Info, Shield } from "lucide-react";

/* ─── Sub-tab for Per Gioco ─── */
type GameKey = "valorant" | "cs2" | "r6";

const gameColors: Record<GameKey, string> = {
  valorant: "text-primary",
  cs2: "text-accent",
  r6: "text-blue-400",
};

/* ─── Page ─── */
export default function AimGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
              <Mountain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">PEAKGG</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display font-semibold uppercase tracking-wider">
            ← Torna al sito
          </Link>
        </div>
      </nav>

      <main className="container pt-24 pb-16">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            <span className="text-primary">PeakGG</span> Aim Guide
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">La guida definitiva all'aim training per la community competitiva. Migliora la tua mira, scala le classifiche.</p>
        </div>

        <Tabs defaultValue="intro" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-secondary/50 p-1.5 rounded-lg mb-8">
            {[
              { v: "intro", icon: BookOpen, l: "Introduzione" },
              { v: "tools", icon: Wrench, l: "App & Strumenti" },
              { v: "warmup", icon: Flame, l: "Warm-Up" },
              { v: "theory", icon: Brain, l: "Aim Theory" },
              { v: "games", icon: Gamepad2, l: "Per Gioco" },
              { v: "mindset", icon: Heart, l: "Mindset & Salute" },
            ].map(({ v, icon: Icon, l }) => (
              <TabsTrigger key={v} value={v} className="flex-1 min-w-[140px] gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/40 border border-transparent">
                <Icon className="h-4 w-4" /> {l}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── 1. Introduzione ── */}
          <TabsContent value="intro"><IntroSection /></TabsContent>
          <TabsContent value="tools"><ToolsSection /></TabsContent>
          <TabsContent value="warmup"><WarmupSection /></TabsContent>
          <TabsContent value="theory"><TheorySection /></TabsContent>
          <TabsContent value="games"><GamesSection /></TabsContent>
          <TabsContent value="mindset"><MindsetSection /></TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        PeakGG © 2026 — Basato sulle risorse Voltaic • Guida scritta per la community competitiva
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════
   1. INTRODUZIONE
   ═══════════════════════════════════════════ */
function IntroSection() {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Cos'è l'Aim Training?</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground leading-relaxed space-y-3">
          <p>L'aim training è l'allenamento mirato del controllo del mouse tramite app dedicate come <span className="text-foreground font-semibold">KovaaK's</span> o <span className="text-foreground font-semibold">Aim Lab</span>.</p>
          <p>Pensa alla palestra: isoli le singole abilità (flick, tracking, switching), le alleni con ripetizione e feedback, poi applichi i miglioramenti in partita. Non sostituisce il gioco, lo potenzia.</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Cosa migliora</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              {["Consistenza nei colpi", "Lettura movimenti avversari", "Controllo mouse", "Velocità acquisizione target", "Micro-correzioni"].map(t => (
                <li key={t} className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{t}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive" /> Cosa NON migliora</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              {["Game sense", "Decision making", "Posizionamento mappa", "Comunicazione team", "Conoscenza mappe"].map(t => (
                <li key={t} className="flex items-start gap-2"><XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />{t}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-accent" /> Quanto tempo dedicare?</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2">
          <p><span className="text-foreground font-semibold">15-20 min</span> di warm-up prima di ogni sessione di gioco.</p>
          <p><span className="text-foreground font-semibold">30-60 min</span> per sessioni di aim training dedicate.</p>
          <p className="text-destructive/80">⚠️ Mai superare le 2 ore: rischio RSI (infiammazione) e rendimenti decrescenti.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   2. APP & STRUMENTI
   ═══════════════════════════════════════════ */
const apps = [
  {
    name: "KovaaK's 2.0",
    price: "€9.75 su Steam",
    badge: "⭐ CONSIGLIATO",
    badgeClass: "bg-accent/20 text-accent border-accent/40",
    desc: "L'aim trainer più completo e usato dai pro. Migliaia di scenari, playlist Voltaic integrate, statistiche dettagliate.",
    pros: ["Community enorme", "Scenari illimitati", "Playlist Voltaic", "Statistiche avanzate"],
    cons: ["A pagamento", "UI un po' datata"],
  },
  {
    name: "Aim Lab",
    price: "Gratuito su Steam",
    badge: "🆓 GRATUITO",
    badgeClass: "bg-green-500/20 text-green-400 border-green-500/40",
    desc: "Aim trainer gratuito con interfaccia moderna e analisi AI. Perfetto per iniziare.",
    pros: ["Gratuito", "UI moderna", "Profili game-specific", "Analisi AI"],
    cons: ["Meno scenari di KovaaK's", "Meno usato dai top aimer"],
  },
  {
    name: "Aimbeast",
    price: "€4.99 su Steam",
    badge: null,
    badgeClass: "",
    desc: "Alternativa leggera con features uniche e buon sistema di progressione.",
    pros: ["Prezzo basso", "Leggero", "Buona progressione"],
    cons: ["Community piccola", "Meno scenari"],
  },
];

function ToolsSection() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {apps.map(app => (
          <Card key={app.name} className="border-border hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">{app.name}</CardTitle>
                {app.badge && <Badge variant="outline" className={app.badgeClass}>{app.badge}</Badge>}
              </div>
              <CardDescription>{app.price}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{app.desc}</p>
              <div>
                <p className="text-xs font-semibold text-green-400 mb-1">PRO</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {app.pros.map(p => <li key={p} className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500 shrink-0" />{p}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-destructive mb-1">CONTRO</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {app.cons.map(c => <li key={c} className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-destructive shrink-0" />{c}</li>)}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> Il consiglio di PeakGG</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Se non hai mai fatto aim training, parti con <span className="text-foreground font-semibold">Aim Lab</span> (gratuito). Quando vorrai fare sul serio, passa a <span className="text-foreground font-semibold">KovaaK's</span> per le routine Voltaic.
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   3. WARM-UP
   ═══════════════════════════════════════════ */
const warmupPhases = [
  {
    title: "Fase 1 — Attivazione Base (5 min)",
    steps: [
      { scenario: "Smoothbot / Smoothsphere", type: "Precise Tracking", desc: "Movimenti ampi e fluidi per attivare il braccio" },
      { scenario: "Centering 90 Easy", type: "Reactive Tracking", desc: "Tracking orizzontale per scaldare il polso" },
    ],
  },
  {
    title: "Fase 2 — Precisione (5 min)",
    steps: [
      { scenario: "1w4ts Voltaic / Gridshot", type: "Static Click", desc: "Flick su target statici, linee dritte" },
      { scenario: "ww3t Voltaic", type: "Speed Switch", desc: "Switch veloce tra 3 target" },
    ],
  },
  {
    title: "Fase 3 — Game-Specific (5-10 min)",
    steps: [
      { scenario: "Deathmatch / T-Hunt", type: "In-Game", desc: "Sessione breve di warm-up nel tuo gioco" },
      { scenario: "Pasu Voltaic / Tamspeed", type: "Dynamic Click", desc: "Click timing su target in movimento" },
    ],
  },
];

const warmupRules = [
  "Non puntare al punteggio, serve per attivare i muscoli",
  "Parti lento, accelera gradualmente",
  "Se ti senti \"freddo\" dopo il warm-up, aggiungi 5 min di DM/T-Hunt",
  "Consistenza > Intensità: 15 minuti ogni giorno battono 2 ore una volta a settimana",
];

function WarmupSection() {
  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="space-y-3">
        {warmupPhases.map((phase, i) => (
          <AccordionItem key={i} value={`phase-${i}`} className="border border-border rounded-lg px-4 overflow-hidden">
            <AccordionTrigger className="font-display text-lg hover:no-underline">
              <span className="flex items-center gap-2"><Flame className="h-5 w-5 text-accent" />{phase.title}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pb-2">
                {phase.steps.map((s, j) => (
                  <div key={j} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-secondary/50 rounded-md p-3">
                    <span className="font-semibold text-foreground min-w-[200px]">{s.scenario}</span>
                    <Badge variant="outline" className="w-fit border-primary/30 text-primary text-xs">{s.type}</Badge>
                    <span className="text-muted-foreground text-sm">{s.desc}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-accent" /> Regole d'oro del Warm-Up</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            {warmupRules.map((r, i) => (
              <li key={i} className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-accent mt-0.5 shrink-0" />{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   4. AIM THEORY
   ═══════════════════════════════════════════ */
const aimCategories = [
  {
    emoji: "🔴",
    title: "Clicking",
    color: "border-primary/30",
    badges: ["Static Clicking", "Dynamic Clicking"],
    desc: "Eliminare bersagli con click singoli o multipli. La base in giochi tattici.",
    tip: "Mantieni ritmo costante, flick dritti, costruisci velocità mantenendo 95%+ accuracy.",
  },
  {
    emoji: "🔵",
    title: "Tracking",
    color: "border-blue-500/30",
    badges: ["Precise Tracking", "Reactive Tracking"],
    desc: "Tenere il mirino su un bersaglio in movimento continuo.",
    tip: "Non predire. Reagisci ai cambi di direzione. Concentrati sul bersaglio, non sul mirino.",
  },
  {
    emoji: "🟣",
    title: "Switching",
    color: "border-purple-500/30",
    badges: ["Speed Switch", "Evasive Switch"],
    desc: "Passare velocemente da un target all'altro con tracking breve.",
    tip: "Pensa sempre al prossimo target. Flick dritto, micro-correggi, passa al successivo.",
  },
  {
    emoji: "🟡",
    title: "Strafe Aim",
    color: "border-yellow-500/30",
    badges: ["Mirroring", "Anti-Mirroring"],
    desc: "Mirare mentre ti muovi.",
    tip: "Pratica sia mirroring che anti-mirroring. Movimento indipendente dalla mano del mouse.",
  },
];

const sensData = [
  { cat: "Clicking", range: "30-60 cm/360°" },
  { cat: "Tracking", range: "25-35 cm/360°" },
];

function TheorySection() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {aimCategories.map(cat => (
          <Card key={cat.title} className={`${cat.color}`}>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2"><span className="text-2xl">{cat.emoji}</span>{cat.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                {cat.badges.map(b => <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">{cat.desc}</p>
              <div className="bg-secondary/50 rounded-md p-3 text-sm">
                <span className="font-semibold text-accent">💡 Tip:</span>{" "}
                <span className="text-muted-foreground">{cat.tip}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Crosshair className="h-5 w-5 text-primary" /> Sensibilità Consigliata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sensData.map(s => (
            <div key={s.cat} className="flex items-center gap-4">
              <span className="font-semibold text-foreground w-24">{s.cat}</span>
              <Badge variant="outline" className="border-primary/30 text-primary">{s.range}</Badge>
            </div>
          ))}
          <div className="bg-secondary/50 rounded-md p-3 text-sm text-muted-foreground space-y-1 mt-2">
            <p><span className="text-foreground font-semibold">Punto di partenza universale:</span> ~30 cm/360° (es. 800 DPI, 0.30 Valorant)</p>
            <p><span className="text-accent">Nota:</span> la "muscle memory" è un mito. Puoi cambiare sensibilità senza problemi.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   5. PER GIOCO
   ═══════════════════════════════════════════ */
const gamesData: Record<GameKey, { label: string; setup: { sens: string; fov: string }; warmup: string[]; tips: string[] }> = {
  valorant: {
    label: "Valorant",
    setup: {
      sens: "0.2–0.5 a 800 DPI (35-80 cm/360°). TTK basso, precisione > tracking.",
      fov: "Fisso 103° orizzontale",
    },
    warmup: [
      "Deathmatch No Armor (5 min) — Solo headshot, crosshair placement",
      "The Range Practice (3 min) — Bots con strafing, one-tap",
      "KovaaK's/Aimlabs Static Dots (5 min) — 1w6ts o Gridshot per flick",
      "KovaaK's Pasu Voltaic (5 min) — Click timing su bersagli in movimento",
    ],
    tips: [
      "Crosshair placement > flick. Mirino a livello testa nei punti di contatto",
      "Pratica counter-strafing",
      "Prima pallottola precisa → allena il one-tap",
      "Usa la Range per spray pattern (Vandal, Phantom)",
      "DM solo headshot, ignora K/D",
    ],
  },
  cs2: {
    label: "CS2",
    setup: {
      sens: "1.0–2.5 a 400 DPI (35-70 cm/360°). Aim meccanico, spray pattern importanti.",
      fov: "90° verticale fisso",
    },
    warmup: [
      "Aim_botz Workshop Map (5 min) — 100 kill, headshot",
      "Deathmatch FFA (5 min) — Solo AK/M4, testa",
      "KovaaK's ww3t Voltaic (5 min) — Flick su target statici",
      "Recoil Master Workshop (3 min) — Pattern di spray",
    ],
    tips: [
      "Spray control fondamentale: 5-10 min/giorno su pattern AK e M4",
      "Pratica shoulder peek e jiggle peek",
      "Impara le prefire spots",
      "Sens generalmente più bassa che in Valorant",
      "Allena tracking per spray transfer",
    ],
  },
  r6: {
    label: "Rainbow Six Siege",
    setup: {
      sens: "7-12 in-game a 400 DPI. Separare ADS e hipfire.",
      fov: "80-90° consigliato",
    },
    warmup: [
      "T-Hunt Classic House (5 min) — Solo headshot",
      "T-Hunt Elimination Varied Maps (5 min) — Angoli stretti e pre-fire",
      "KovaaK's Tamspeed 2bp (5 min) — Click timing",
      "Aimlabs Microshot (3 min) — Micro-flick per angoli stretti",
    ],
    tips: [
      "Pratica \"slicing the pie\": un angolo alla volta",
      "ADS sens separata per ogni scope",
      "Quick-lean-peek (Q/E) per esporti meno",
      "Distruzione ambientale cambia gli angoli: spara attraverso superfici morbide",
      "Allena vertical aim: scontri tra piani diversi",
    ],
  },
};

function GamesSection() {
  const [game, setGame] = useState<GameKey>("valorant");
  const g = gamesData[game];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(Object.keys(gamesData) as GameKey[]).map(k => (
          <button
            key={k}
            onClick={() => setGame(k)}
            className={`px-4 py-2 rounded-md font-display font-semibold text-sm uppercase tracking-wider transition-colors border ${game === k
              ? `${gameColors[k]} border-current bg-current/10`
              : "text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {gamesData[k].label}
          </button>
        ))}
      </div>

      {/* Setup */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">⚙️ Setup — {g.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><span className="text-foreground font-semibold">Sensibilità:</span> {g.setup.sens}</p>
          <p><span className="text-foreground font-semibold">FOV:</span> {g.setup.fov}</p>
        </CardContent>
      </Card>

      {/* Warm-Up Specifico */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">🔥 Warm-Up Specifico — {g.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {g.warmup.map((w, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
                <span className="text-muted-foreground text-sm pt-1">{w}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* 5 Consigli Pro */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="font-display text-lg">🏆 5 Consigli Pro — {g.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {g.tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />{t}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   6. MINDSET & SALUTE
   ═══════════════════════════════════════════ */
function MindsetSection() {
  return (
    <div className="space-y-6">
      {/* Growth Mindset */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Growth Mindset</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-2">
              <h4 className="font-display font-semibold text-destructive">❌ Fixed Mindset</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {["Evita sfide", "Non impara dagli errori", "Si arrende facilmente", "\"Non sono portato\"", "Gioca per vincere"].map(t => (
                  <li key={t} className="flex items-center gap-2"><XCircle className="h-3 w-3 text-destructive shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 space-y-2">
              <h4 className="font-display font-semibold text-green-400">✅ Growth Mindset</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {["Abbraccia sfide", "Analizza errori", "Persistente", "\"Imparerò\"", "Gioca per migliorare"].map(t => (
                  <li key={t} className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500 shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salute & Postura */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Salute & Postura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              { emoji: "😴", title: "Sonno", desc: "7-9 ore. Influenza i tempi di reazione." },
              { emoji: "🏃", title: "Esercizio", desc: "30 min/giorno. Prepara il cervello ad apprendere." },
              { emoji: "🪑", title: "Postura", desc: "Schiena dritta, avambraccio parallelo, controlla ogni 30 min." },
              { emoji: "💧", title: "Idratazione", desc: "Bevi regolarmente, disidratazione peggiora concentrazione." },
            ].map(item => (
              <div key={item.title} className="bg-secondary/50 rounded-lg p-4 space-y-1">
                <p className="text-2xl">{item.emoji}</p>
                <h4 className="font-display font-semibold text-foreground">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Analisi */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Info className="h-5 w-5 text-accent" /> Auto-Analisi</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm space-y-2">
          <p>Registra le tue sessioni, riguardati e cerca pattern: shakiness, reazioni lente, over-flick, cattivo crosshair placement.</p>
          <p className="text-accent font-semibold">La pratica deliberata è più efficace del giocare scenari a caso.</p>
        </CardContent>
      </Card>
    </div>
  );
}
