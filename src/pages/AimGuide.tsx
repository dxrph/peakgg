import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Mountain, BookOpen, Wrench, Flame, Brain, Gamepad2, Heart, Star,
  CheckCircle, XCircle, Clock, Crosshair, Zap, ChevronRight, Target, Info,
  Sparkles, Users, Trophy, Swords, Compass, ArrowRight, Activity,
  ExternalLink, MousePointer2, Move, Timer, Wand2, Repeat, Gauge, CalendarDays,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { getAimGuideContent, type AimGameKey, type AimGuideContent } from "@/data/aim-guide";
import { cn } from "@/lib/utils";

const gameColors: Record<AimGameKey, string> = {
  valorant: "text-primary",
  cs2: "text-accent",
  r6: "text-blue-400",
};

const TABS = [
  { v: "intro", icon: BookOpen, key: "intro" as const },
  { v: "tools", icon: Wrench, key: "tools" as const },
  { v: "warmup", icon: Flame, key: "warmup" as const },
  { v: "theory", icon: Brain, key: "theory" as const },
  { v: "games", icon: Gamepad2, key: "games" as const },
  { v: "mindset", icon: Heart, key: "mindset" as const },
];

const AUDIENCE = [
  { icon: Sparkles, title: "New FPS Players", desc: "Build strong fundamentals from the start." },
  { icon: Activity, title: "Ranked Grinders", desc: "Improve consistency and confidence." },
  { icon: Trophy, title: "Competitive Players", desc: "Refine routines and training quality." },
  { icon: Crosshair, title: "Aim Trainer Users", desc: "Add structure to your practice." },
];

const ROADMAP = [
  { n: "01", title: "Start with the basics", desc: "Understand what aim training is — and isn't." },
  { n: "02", title: "Pick the right tools", desc: "Choose KovaaK's, Aim Lab or in-game ranges." },
  { n: "03", title: "Build your warm-up", desc: "A 10–15 min routine that primes your hands." },
  { n: "04", title: "Learn aim theory", desc: "Flicking, tracking, switching, micro-adjust." },
  { n: "05", title: "Apply by game", desc: "Tune sens, FOV and habits per title." },
  { n: "06", title: "Stay consistent", desc: "Health, mindset and weekly practice cycles." },
];

const HERO_STATS = [
  { label: "Modules", value: "6" },
  { label: "Level", value: "Beginner+" },
  { label: "Format", value: "Practical" },
  { label: "Per game", value: "VAL · CS2 · R6" },
];

/* --------------------------- New local content --------------------------- */

const CORE_SKILLS = [
  { icon: Wand2, title: "Flicking", desc: "Fast movement from one target/angle to another. Useful for angle clearing, target switching and reactive shots." },
  { icon: Move, title: "Tracking", desc: "Keeping your crosshair on a moving target. Critical in Apex, Overwatch, The Finals and some spray situations in CS/Valorant." },
  { icon: Timer, title: "Click Timing", desc: "Clicking accurately at the correct moment. Essential for Valorant, CS2 and any precision weapon." },
  { icon: MousePointer2, title: "Micro-Corrections", desc: "Small adjustments after your crosshair is close to the target. Vital in Valorant and CS2." },
  { icon: Repeat, title: "Target Switching", desc: "Moving quickly between multiple enemies. Useful in clutches, retakes and multi-kill fights." },
  { icon: Gauge, title: "Smoothness", desc: "Controlled mouse movement without shaking or overflicking. Drives long-term consistency and crosshair control." },
];

type ToolLink = { label: string; href: string };
type ToolCard = {
  name: string;
  price: string;
  best: string;
  why: string;
  tone: "primary" | "accent" | "success";
  links: ToolLink[];
};

const RECOMMENDED_TOOLS: ToolCard[] = [
  {
    name: "Aimlabs",
    price: "Free · Steam / Epic",
    best: "Beginners, free training, quick routines, FPS-specific playlists.",
    why: "Free aim trainer with many scenarios, analysis tools and easy access through Steam and Epic.",
    tone: "primary",
    links: [
      { label: "Official Site", href: "https://aimlabs.com/" },
      { label: "Steam", href: "https://store.steampowered.com/app/714010/Aimlabs/" },
      { label: "Epic Games", href: "https://store.epicgames.com/p/aimlabs" },
    ],
  },
  {
    name: "KovaaK's",
    price: "Paid · Steam",
    best: "Serious aim training, custom scenarios, advanced mouse-control practice.",
    why: "Highly customizable aim trainer with a massive scenario library and community playlists.",
    tone: "accent",
    links: [
      { label: "Official Site", href: "https://kovaaks.com/" },
      { label: "Steam", href: "https://store.steampowered.com/app/824270/KovaaKs/" },
    ],
  },
  {
    name: "Voltaic",
    price: "Free benchmarks & app",
    best: "Benchmarks, structured routines, progress tracking and improvement community.",
    why: "Voltaic provides benchmark systems, routines and a community built around measurable FPS improvement.",
    tone: "success",
    links: [
      { label: "Official Site", href: "https://voltaic.gg/" },
      { label: "Voltaic App", href: "https://app.voltaic.gg/" },
    ],
  },
];

const SEVEN_DAY_PLAN = [
  { day: "Day 1", title: "Baseline", desc: "Set your sensitivity and run baseline benchmarks." },
  { day: "Day 2", title: "Precision", desc: "Micro-corrections + deathmatch." },
  { day: "Day 3", title: "Control", desc: "Tracking and smoothness + in-game range." },
  { day: "Day 4", title: "Speed", desc: "Flicking + click timing." },
  { day: "Day 5", title: "Transfer", desc: "Game-specific routine focused on your main FPS." },
  { day: "Day 6", title: "Re-test", desc: "Benchmark again and note weaknesses." },
  { day: "Day 7", title: "Compete", desc: "Light warm-up and ranked focus." },
];

export default function AimGuidePage() {
  const { locale } = useI18n();
  const c = getAimGuideContent(locale);
  const [tab, setTab] = useState<string>("intro");

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
              <Mountain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">PEAKGG</span>
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display font-semibold uppercase tracking-wider"
          >
            {c.back_to_site}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid-faint opacity-40 pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 15% 0%, hsl(352 100% 62% / 0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 90% 100%, hsl(24 100% 63% / 0.14), transparent 60%)",
          }}
        />
        <div className="container relative pt-28 pb-16 md:pt-32 md:pb-20">
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-14 items-end">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] font-display font-semibold uppercase tracking-[0.18em] mb-5">
                <Sparkles className="h-3 w-3" /> PeakGG Learning Hub
              </div>
              <h1 className="font-display font-bold tracking-tight text-4xl md:text-6xl lg:text-[4.25rem] leading-[1.02] mb-5">
                <span className="text-foreground">PeakGG</span>{" "}
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  Aim Guide
                </span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                The definitive training system for players who want{" "}
                <span className="text-foreground font-semibold">better mechanics</span>,{" "}
                <span className="text-foreground font-semibold">cleaner mouse control</span> and{" "}
                <span className="text-foreground font-semibold">more consistency</span> in competitive FPS.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="gradient-primary text-primary-foreground font-display uppercase tracking-wider shadow-[0_8px_30px_-8px_hsl(352_100%_62%/0.6)]"
                  onClick={() => {
                    setTab("intro");
                    document.getElementById("sections")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Target className="h-4 w-4 mr-2" /> Start Learning
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border/80 bg-card/40 hover:bg-card/80 font-display uppercase tracking-wider"
                  onClick={() => document.getElementById("sections")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <Compass className="h-4 w-4 mr-2" /> Browse Sections
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-muted-foreground hover:text-accent font-display uppercase tracking-wider"
                  onClick={() =>
                    document.getElementById("recommended-tools")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <Wrench className="h-4 w-4 mr-2" /> Recommended Tools
                </Button>
              </div>
            </div>

            {/* Right — summary card */}
            <div className="relative">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/40 via-transparent to-accent/30 opacity-60 blur-[2px]" />
              <div className="relative rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-6 md:p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-xs font-display uppercase tracking-[0.15em] text-muted-foreground">
                    <Star className="h-3.5 w-3.5 text-accent" /> Guide Summary
                  </div>
                  <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                    Free
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {HERO_STATS.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-lg border border-border/50 bg-background/50 p-3.5"
                    >
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">
                        {s.label}
                      </div>
                      <div className="mt-1 font-display font-bold text-lg text-foreground">{s.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-border/50 space-y-2.5 text-sm">
                  {[
                    "Warm-up + theory + health",
                    "Per-game setups: VAL / CS2 / R6",
                    "Practical, no fluff",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-14 md:py-16 space-y-16">
        {/* WHO THIS IS FOR */}
        <section>
          <SectionHead
            eyebrow="Audience"
            title="Who this guide is for"
            sub="Whatever your level, the routines and theory scale with you."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AUDIENCE.map((a) => (
              <div
                key={a.title}
                className="group relative rounded-xl border border-border/60 bg-card/50 p-5 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-base text-foreground mb-1">{a.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW TO USE */}
        <section>
          <SectionHead
            eyebrow="Roadmap"
            title="How to use this guide"
            sub="A 6-step path from theory to consistent in-game results."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROADMAP.map((r, i) => (
              <div
                key={r.n}
                className="relative rounded-xl border border-border/60 bg-gradient-to-br from-card/60 to-card/20 p-5 overflow-hidden"
              >
                <div className="absolute top-3 right-3 font-display text-3xl font-bold text-primary/20">
                  {r.n}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-primary/15 text-primary text-xs font-bold font-display flex items-center justify-center">
                    {i + 1}
                  </span>
                  <h3 className="font-display font-semibold text-foreground">{r.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTIONS / TABS */}
        <section id="sections" className="scroll-mt-20">
          <SectionHead
            eyebrow="The Guide"
            title="Six modules. One system."
            sub="Switch between sections — each is focused, practical and self-contained."
          />

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            {/* Sticky tabs */}
            <div className="sticky top-16 z-30 -mx-4 px-4 py-3 mb-8 bg-background/85 backdrop-blur-xl border-b border-border/60">
              <TabsList className="w-full h-auto bg-transparent p-0 flex gap-2 overflow-x-auto no-scrollbar justify-start md:justify-center">
                {TABS.map(({ v, icon: Icon, key }) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className={cn(
                      "shrink-0 h-10 px-4 rounded-full border border-border/60 bg-card/40 text-muted-foreground gap-2",
                      "hover:text-foreground hover:border-border transition-all",
                      "data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-primary/50",
                      "data-[state=active]:shadow-[0_0_22px_-6px_hsl(352_100%_62%/0.55)]",
                      "font-display uppercase tracking-wider text-xs"
                    )}
                  >
                    <Icon className="h-4 w-4" /> {c.tabs[key]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="intro"><IntroSection c={c} /></TabsContent>
            <TabsContent value="tools"><ToolsSection c={c} /></TabsContent>
            <TabsContent value="warmup"><WarmupSection c={c} /></TabsContent>
            <TabsContent value="theory"><TheorySection c={c} /></TabsContent>
            <TabsContent value="games"><GamesSection c={c} /></TabsContent>
            <TabsContent value="mindset"><MindsetSection c={c} /></TabsContent>
          </Tabs>
        </section>

        {/* CORE AIM SKILLS */}
        <section id="core-skills" className="scroll-mt-32">
          <SectionHead
            eyebrow="Fundamentals"
            title="Core aim skills"
            sub="The six mechanics every FPS player should train. Each one transfers directly into ranked play."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CORE_SKILLS.map((s) => (
              <div
                key={s.title}
                className="group rounded-xl border border-border/60 bg-card/50 p-5 hover:border-primary/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-base text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RECOMMENDED TOOLS (external links) */}
        <section id="recommended-tools" className="scroll-mt-32">
          <SectionHead
            eyebrow="Recommended Tools"
            title="Train with the right software"
            sub="The three platforms most competitive FPS players rely on. All links open the official sources."
          />
          <div className="grid md:grid-cols-3 gap-5">
            {RECOMMENDED_TOOLS.map((tool) => (
              <Panel key={tool.name} tone={tool.tone} className="flex flex-col">
                <div className="p-5 border-b border-border/40 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-foreground">{tool.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{tool.price}</p>
                  </div>
                  <Wrench className={cn(
                    "h-5 w-5",
                    tool.tone === "primary" && "text-primary",
                    tool.tone === "accent" && "text-accent",
                    tool.tone === "success" && "text-green-400",
                  )} />
                </div>
                <div className="p-5 space-y-4 flex-1 flex flex-col">
                  <div>
                    <p className="text-[10px] font-display uppercase tracking-wider text-accent mb-1.5">
                      Best for
                    </p>
                    <p className="text-sm text-muted-foreground">{tool.best}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-display uppercase tracking-wider text-primary mb-1.5">
                      Why use it
                    </p>
                    <p className="text-sm text-muted-foreground">{tool.why}</p>
                  </div>
                  <div className="mt-auto pt-2 flex flex-wrap gap-2">
                    {tool.links.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border/60 bg-background/60 text-xs font-display uppercase tracking-wider text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        {l.label} <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          <Panel tone="primary" className="mt-5 bg-gradient-to-br from-primary/5 to-transparent">
            <PanelHead icon={Star} title="Which one should I use?" tone="primary" />
            <ul className="px-5 pb-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span><span className="text-foreground font-semibold">Aimlabs</span> — free, simple and fast routines.</span></li>
              <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span><span className="text-foreground font-semibold">KovaaK's</span> — deeper customization and serious aim training.</span></li>
              <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span><span className="text-foreground font-semibold">Voltaic</span> — benchmarks, ranks, routines and measurable progress tracking.</span></li>
            </ul>
          </Panel>
        </section>

        {/* 7-DAY PLAN */}
        <section id="seven-day-plan" className="scroll-mt-32">
          <SectionHead
            eyebrow="Quick Start"
            title="7-Day Aim Reset Plan"
            sub="One week to rebuild fundamentals, re-test your baseline and walk into ranked with a clear plan."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SEVEN_DAY_PLAN.map((d, i) => (
              <div
                key={d.day}
                className="relative rounded-xl border border-border/60 bg-gradient-to-br from-card/60 to-card/20 p-5 overflow-hidden"
              >
                <div className="absolute top-3 right-3 font-display text-3xl font-bold text-accent/20">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="h-4 w-4 text-accent" />
                  <span className="text-[11px] font-display uppercase tracking-[0.18em] text-accent">
                    {d.day}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">{d.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        {c.footer}
      </footer>
    </div>
  );
}

/* ----------------------------- Shared blocks ----------------------------- */

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-7 md:mb-9">
      <div className="text-[11px] font-display font-semibold uppercase tracking-[0.2em] text-accent mb-2">
        {eyebrow}
      </div>
      <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground">{title}</h2>
      {sub && <p className="mt-2 text-muted-foreground max-w-2xl">{sub}</p>}
    </div>
  );
}

function Panel({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "primary" | "accent" | "success" | "danger";
}) {
  const tones: Record<string, string> = {
    default: "border-border/60",
    primary: "border-primary/30",
    accent: "border-accent/30",
    success: "border-green-500/25",
    danger: "border-destructive/30",
  };
  return (
    <div className={cn("rounded-xl border bg-card/50 backdrop-blur-sm", tones[tone], className)}>
      {children}
    </div>
  );
}

function PanelHead({
  icon: Icon,
  title,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone?: "primary" | "accent" | "success" | "danger";
}) {
  const tones: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    success: "text-green-400 bg-green-500/10 border-green-500/20",
    danger: "text-destructive bg-destructive/10 border-destructive/20",
  };
  return (
    <div className="flex items-center gap-3 p-5 pb-3">
      <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center", tones[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-display font-semibold text-lg text-foreground">{title}</h3>
    </div>
  );
}

/* --------------------------------- Intro --------------------------------- */

function IntroSection({ c }: { c: AimGuideContent }) {
  const i = c.intro;
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <Panel tone="primary" className="overflow-hidden">
          <div className="p-6 md:p-7">
            <div className="text-[11px] font-display uppercase tracking-[0.2em] text-primary mb-2">
              Module 01
            </div>
            <h3 className="font-display font-bold text-2xl mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> {i.what_title}
            </h3>
            <div className="space-y-3 text-muted-foreground leading-relaxed max-w-prose">
              <p>
                {i.what_p1_pre}
                <span className="text-foreground font-semibold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                  KovaaK's
                </span>{" "}
                /{" "}
                <span className="text-foreground font-semibold px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                  Aim Lab
                </span>
                {i.what_p1_post}
              </p>
              <p>{i.what_p2}</p>
            </div>
          </div>
        </Panel>

        <Panel tone="accent" className="overflow-hidden">
          <div className="p-6 md:p-7 h-full flex flex-col">
            <div className="text-[11px] font-display uppercase tracking-[0.2em] text-accent mb-2">
              Concept
            </div>
            <h4 className="font-display font-bold text-xl mb-3">Aim Training = Mechanics Gym</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Isolated reps to train specific motor skills you reuse in-game.
            </p>
            <ul className="mt-auto space-y-2.5">
              {["Flicking", "Tracking", "Switching", "Micro-corrections"].map((t) => (
                <li
                  key={t}
                  className="flex items-center justify-between text-sm border-b border-border/40 pb-2 last:border-0"
                >
                  <span className="text-foreground font-medium">{t}</span>
                  <ChevronRight className="h-4 w-4 text-accent" />
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Panel tone="success">
          <PanelHead icon={CheckCircle} title={i.pros_title} tone="success" />
          <ul className="px-5 pb-5 space-y-2.5">
            {i.pros_items.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel tone="danger">
          <PanelHead icon={XCircle} title={i.cons_title} tone="danger" />
          <ul className="px-5 pb-5 space-y-2.5">
            {i.cons_items.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel tone="accent">
        <PanelHead icon={Clock} title={i.time_title} tone="accent" />
        <div className="px-5 pb-5 grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-background/40 border border-border/40 p-4">
            <div className="text-xs uppercase tracking-wider text-accent font-display mb-1">Warm-up</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">{i.time_warmup_strong}</span>
              {i.time_warmup_rest}
            </p>
          </div>
          <div className="rounded-lg bg-background/40 border border-border/40 p-4">
            <div className="text-xs uppercase tracking-wider text-accent font-display mb-1">Session</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">{i.time_session_strong}</span>
              {i.time_session_rest}
            </p>
          </div>
          <div className="sm:col-span-2 rounded-lg bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive/90 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{i.time_warning}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* --------------------------------- Tools --------------------------------- */

function ToolsSection({ c }: { c: AimGuideContent }) {
  const t = c.tools;
  const badgeClasses = [
    "bg-accent/15 text-accent border-accent/40",
    "bg-green-500/15 text-green-400 border-green-500/40",
    "bg-muted text-muted-foreground border-border",
  ];
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-5">
        {t.apps.map((app, idx) => (
          <Panel key={app.name} className="overflow-hidden hover:border-primary/40 transition-colors">
            <div className="p-5 border-b border-border/40 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">{app.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{app.price}</p>
              </div>
              {app.badge && (
                <Badge variant="outline" className={cn("text-[10px]", badgeClasses[idx] ?? "")}>
                  {app.badge}
                </Badge>
              )}
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">{app.desc}</p>
              <div>
                <p className="text-[10px] font-display uppercase tracking-wider text-green-400 mb-1.5">
                  {t.pros_label}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {app.pros.map((p) => (
                    <li key={p} className="flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-display uppercase tracking-wider text-destructive mb-1.5">
                  {t.cons_label}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {app.cons.map((co) => (
                    <li key={co} className="flex items-center gap-1.5">
                      <XCircle className="h-3 w-3 text-destructive shrink-0" />
                      {co}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Panel tone="primary" className="bg-gradient-to-br from-primary/5 to-transparent">
        <PanelHead icon={Star} title={t.advice_title} tone="primary" />
        <p className="px-5 pb-5 text-muted-foreground leading-relaxed">
          {t.advice_pre}
          <span className="text-foreground font-semibold">{t.advice_strong1}</span>
          {t.advice_mid}
          <span className="text-foreground font-semibold">{t.advice_strong2}</span>
          {t.advice_post}
        </p>
      </Panel>
    </div>
  );
}

/* -------------------------------- Warm-up -------------------------------- */

function WarmupSection({ c }: { c: AimGuideContent }) {
  const w = c.warmup;
  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="space-y-3">
        {w.phases.map((phase, i) => (
          <AccordionItem
            key={i}
            value={`phase-${i}`}
            className="border border-border/60 rounded-xl px-5 overflow-hidden bg-card/40 backdrop-blur-sm"
          >
            <AccordionTrigger className="font-display text-base md:text-lg hover:no-underline py-4">
              <span className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 text-accent flex items-center justify-center text-xs font-bold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {phase.title}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-3">
                {phase.steps.map((s, j) => (
                  <div
                    key={j}
                    className="grid sm:grid-cols-[200px_auto_1fr] gap-2 sm:gap-3 items-center bg-background/40 border border-border/40 rounded-lg p-3"
                  >
                    <span className="font-semibold text-foreground text-sm">{s.scenario}</span>
                    <Badge variant="outline" className="w-fit border-primary/30 text-primary text-[10px]">
                      {s.type}
                    </Badge>
                    <span className="text-muted-foreground text-sm">{s.desc}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Panel tone="accent">
        <PanelHead icon={Zap} title={w.rules_title} tone="accent" />
        <ul className="px-5 pb-5 grid sm:grid-cols-2 gap-2">
          {w.rules.map((r, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-muted-foreground bg-background/40 border border-border/40 rounded-lg p-3"
            >
              <ChevronRight className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* --------------------------------- Theory -------------------------------- */

function TheorySection({ c }: { c: AimGuideContent }) {
  const th = c.theory;
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-5">
        {th.categories.map((cat) => (
          <Panel key={cat.title} className={cn("overflow-hidden", cat.color)}>
            <div className="p-5 border-b border-border/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-background/50 border border-border/40 flex items-center justify-center text-2xl">
                  {cat.emoji}
                </div>
                <h3 className="font-display font-bold text-lg">{cat.title}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.badges.map((b) => (
                  <Badge key={b} variant="secondary" className="text-[10px]">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground">{cat.desc}</p>
              <div className="rounded-lg bg-background/40 border border-border/40 p-3 text-sm">
                <span className="font-display font-semibold text-accent uppercase text-[10px] tracking-wider">
                  {th.tip_label}
                </span>
                <p className="mt-1 text-muted-foreground">{cat.tip}</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHead icon={Crosshair} title={th.sens_title} tone="primary" />
        <div className="px-5 pb-5 space-y-2">
          {th.sens_data.map((s) => (
            <div
              key={s.cat}
              className="flex items-center justify-between bg-background/40 border border-border/40 rounded-lg p-3"
            >
              <span className="font-display font-semibold text-foreground text-sm">{s.cat}</span>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {s.range}
              </Badge>
            </div>
          ))}
          <div className="rounded-lg bg-background/40 border border-border/40 p-4 text-sm text-muted-foreground space-y-1.5 mt-2">
            <p>
              <span className="text-foreground font-semibold">{th.sens_universal_label}</span>{" "}
              {th.sens_universal_value}
            </p>
            <p>
              <span className="text-accent">{th.sens_note_label}</span> {th.sens_note_text}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* --------------------------------- Games --------------------------------- */

function GamesSection({ c }: { c: AimGuideContent }) {
  const [game, setGame] = useState<AimGameKey>("valorant");
  const g = c.games.data[game];
  const labels = c.games;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(labels.data) as AimGameKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setGame(k)}
            className={cn(
              "px-4 h-10 rounded-full font-display font-semibold text-xs uppercase tracking-wider transition-all border",
              game === k
                ? `${gameColors[k]} border-current bg-current/10 shadow-[0_0_18px_-6px_currentColor]`
                : "text-muted-foreground border-border/60 bg-card/40 hover:text-foreground hover:border-border"
            )}
          >
            {labels.data[k].label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel tone="primary">
          <PanelHead icon={Swords} title={`${labels.setup_label} — ${g.label}`} tone="primary" />
          <div className="px-5 pb-5 space-y-2">
            <div className="rounded-lg bg-background/40 border border-border/40 p-3 text-sm">
              <span className="text-foreground font-semibold">{labels.sens_label}</span>{" "}
              <span className="text-muted-foreground">{g.setup.sens}</span>
            </div>
            <div className="rounded-lg bg-background/40 border border-border/40 p-3 text-sm">
              <span className="text-foreground font-semibold">{labels.fov_label}</span>{" "}
              <span className="text-muted-foreground">{g.setup.fov}</span>
            </div>
          </div>
        </Panel>

        <Panel tone="accent">
          <PanelHead icon={Flame} title={`${labels.warmup_label} — ${g.label}`} tone="accent" />
          <ol className="px-5 pb-5 space-y-2.5">
            {g.warmup.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-3 bg-background/40 border border-border/40 rounded-lg p-3"
              >
                <span className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground pt-1">{w}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel tone="primary">
        <PanelHead icon={ArrowRight} title={`${labels.tips_label} — ${g.label}`} tone="primary" />
        <ul className="px-5 pb-5 grid sm:grid-cols-2 gap-2">
          {g.tips.map((t, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-muted-foreground bg-background/40 border border-border/40 rounded-lg p-3"
            >
              <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* --------------------------------- Mindset ------------------------------- */

function MindsetSection({ c }: { c: AimGuideContent }) {
  const m = c.mindset;
  return (
    <div className="space-y-6">
      <Panel>
        <PanelHead icon={Brain} title={m.growth_title} tone="primary" />
        <div className="px-5 pb-5 grid md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-2">
            <h4 className="font-display font-semibold text-destructive flex items-center gap-2">
              <XCircle className="h-4 w-4" /> {m.fixed_title}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              {m.fixed_items.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-destructive shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-4 space-y-2">
            <h4 className="font-display font-semibold text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {m.growth_subtitle}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              {m.growth_items.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-green-400 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHead icon={Heart} title={m.health_title} tone="primary" />
        <div className="px-5 pb-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {m.health_items.map((item) => (
            <div
              key={item.title}
              className="rounded-lg bg-background/40 border border-border/40 p-4 space-y-1"
            >
              <p className="text-2xl">{item.emoji}</p>
              <h4 className="font-display font-semibold text-foreground text-sm">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel tone="accent" className="bg-gradient-to-br from-accent/5 to-transparent">
        <PanelHead icon={Info} title={m.self_title} tone="accent" />
        <div className="px-5 pb-5 text-sm text-muted-foreground space-y-2 max-w-prose">
          <p>{m.self_p1}</p>
          <p className="text-accent font-semibold">{m.self_p2}</p>
        </div>
      </Panel>
    </div>
  );
}
