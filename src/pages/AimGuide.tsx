import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mountain, BookOpen, Wrench, Flame, Brain, Gamepad2, Heart, Star, CheckCircle, XCircle, Clock, Crosshair, Zap, ChevronRight, Target, Info } from "lucide-react";
import { useI18n } from "@/i18n";
import { getAimGuideContent, type AimGameKey, type AimGuideContent } from "@/data/aim-guide";

const gameColors: Record<AimGameKey, string> = {
  valorant: "text-primary",
  cs2: "text-accent",
  r6: "text-blue-400",
};

export default function AimGuidePage() {
  const { locale } = useI18n();
  const c = getAimGuideContent(locale);

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
              <Mountain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">PEAKGG</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display font-semibold uppercase tracking-wider">
            {c.back_to_site}
          </Link>
        </div>
      </nav>

      <main className="container pt-24 pb-16">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            <span className="text-primary">{c.title_pre}</span> {c.title_post}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{c.hero_subtitle}</p>
        </div>

        <Tabs defaultValue="intro" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-secondary/50 p-1.5 rounded-lg mb-8">
            {[
              { v: "intro", icon: BookOpen, l: c.tabs.intro },
              { v: "tools", icon: Wrench, l: c.tabs.tools },
              { v: "warmup", icon: Flame, l: c.tabs.warmup },
              { v: "theory", icon: Brain, l: c.tabs.theory },
              { v: "games", icon: Gamepad2, l: c.tabs.games },
              { v: "mindset", icon: Heart, l: c.tabs.mindset },
            ].map(({ v, icon: Icon, l }) => (
              <TabsTrigger key={v} value={v} className="flex-1 min-w-[140px] gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/40 border border-transparent">
                <Icon className="h-4 w-4" /> {l}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="intro"><IntroSection c={c} /></TabsContent>
          <TabsContent value="tools"><ToolsSection c={c} /></TabsContent>
          <TabsContent value="warmup"><WarmupSection c={c} /></TabsContent>
          <TabsContent value="theory"><TheorySection c={c} /></TabsContent>
          <TabsContent value="games"><GamesSection c={c} /></TabsContent>
          <TabsContent value="mindset"><MindsetSection c={c} /></TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        {c.footer}
      </footer>
    </div>
  );
}

function IntroSection({ c }: { c: AimGuideContent }) {
  const i = c.intro;
  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> {i.what_title}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground leading-relaxed space-y-3">
          <p>{i.what_p1_pre}<span className="text-foreground font-semibold">KovaaK's</span> / <span className="text-foreground font-semibold">Aim Lab</span>{i.what_p1_post}</p>
          <p>{i.what_p2}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> {i.pros_title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              {i.pros_items.map(t => (
                <li key={t} className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{t}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive" /> {i.cons_title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              {i.cons_items.map(t => (
                <li key={t} className="flex items-start gap-2"><XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />{t}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-accent" /> {i.time_title}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2">
          <p><span className="text-foreground font-semibold">{i.time_warmup_strong}</span>{i.time_warmup_rest}</p>
          <p><span className="text-foreground font-semibold">{i.time_session_strong}</span>{i.time_session_rest}</p>
          <p className="text-destructive/80">{i.time_warning}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ToolsSection({ c }: { c: AimGuideContent }) {
  const t = c.tools;
  const badgeClasses = ["bg-accent/20 text-accent border-accent/40", "bg-green-500/20 text-green-400 border-green-500/40", ""];
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {t.apps.map((app, idx) => (
          <Card key={app.name} className="border-border hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg">{app.name}</CardTitle>
                {app.badge && <Badge variant="outline" className={badgeClasses[idx] ?? ""}>{app.badge}</Badge>}
              </div>
              <CardDescription>{app.price}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">{app.desc}</p>
              <div>
                <p className="text-xs font-semibold text-green-400 mb-1">{t.pros_label}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {app.pros.map(p => <li key={p} className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-500 shrink-0" />{p}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-destructive mb-1">{t.cons_label}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {app.cons.map(co => <li key={co} className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-destructive shrink-0" />{co}</li>)}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> {t.advice_title}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {t.advice_pre}<span className="text-foreground font-semibold">{t.advice_strong1}</span>{t.advice_mid}<span className="text-foreground font-semibold">{t.advice_strong2}</span>{t.advice_post}
        </CardContent>
      </Card>
    </div>
  );
}

function WarmupSection({ c }: { c: AimGuideContent }) {
  const w = c.warmup;
  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="space-y-3">
        {w.phases.map((phase, i) => (
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
          <CardTitle className="font-display text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-accent" /> {w.rules_title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            {w.rules.map((r, i) => (
              <li key={i} className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-accent mt-0.5 shrink-0" />{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function TheorySection({ c }: { c: AimGuideContent }) {
  const th = c.theory;
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {th.categories.map(cat => (
          <Card key={cat.title} className={cat.color}>
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2"><span className="text-2xl">{cat.emoji}</span>{cat.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                {cat.badges.map(b => <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">{cat.desc}</p>
              <div className="bg-secondary/50 rounded-md p-3 text-sm">
                <span className="font-semibold text-accent">{th.tip_label}</span>{" "}
                <span className="text-muted-foreground">{cat.tip}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Crosshair className="h-5 w-5 text-primary" /> {th.sens_title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {th.sens_data.map(s => (
            <div key={s.cat} className="flex items-center gap-4">
              <span className="font-semibold text-foreground w-24">{s.cat}</span>
              <Badge variant="outline" className="border-primary/30 text-primary">{s.range}</Badge>
            </div>
          ))}
          <div className="bg-secondary/50 rounded-md p-3 text-sm text-muted-foreground space-y-1 mt-2">
            <p><span className="text-foreground font-semibold">{th.sens_universal_label}</span> {th.sens_universal_value}</p>
            <p><span className="text-accent">{th.sens_note_label}</span> {th.sens_note_text}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GamesSection({ c }: { c: AimGuideContent }) {
  const [game, setGame] = useState<AimGameKey>("valorant");
  const g = c.games.data[game];
  const labels = c.games;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(Object.keys(labels.data) as AimGameKey[]).map(k => (
          <button
            key={k}
            onClick={() => setGame(k)}
            className={`px-4 py-2 rounded-md font-display font-semibold text-sm uppercase tracking-wider transition-colors border ${game === k
              ? `${gameColors[k]} border-current bg-current/10`
              : "text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {labels.data[k].label}
          </button>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">{labels.setup_label} — {g.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><span className="text-foreground font-semibold">{labels.sens_label}</span> {g.setup.sens}</p>
          <p><span className="text-foreground font-semibold">{labels.fov_label}</span> {g.setup.fov}</p>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">{labels.warmup_label} — {g.label}</CardTitle>
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

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="font-display text-lg">{labels.tips_label} — {g.label}</CardTitle>
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

function MindsetSection({ c }: { c: AimGuideContent }) {
  const m = c.mindset;
  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> {m.growth_title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-2">
              <h4 className="font-display font-semibold text-destructive">{m.fixed_title}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {m.fixed_items.map(t => (
                  <li key={t} className="flex items-center gap-2"><XCircle className="h-3 w-3 text-destructive shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 space-y-2">
              <h4 className="font-display font-semibold text-green-400">{m.growth_subtitle}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {m.growth_items.map(t => (
                  <li key={t} className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500 shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> {m.health_title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {m.health_items.map(item => (
              <div key={item.title} className="bg-secondary/50 rounded-lg p-4 space-y-1">
                <p className="text-2xl">{item.emoji}</p>
                <h4 className="font-display font-semibold text-foreground">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2"><Info className="h-5 w-5 text-accent" /> {m.self_title}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm space-y-2">
          <p>{m.self_p1}</p>
          <p className="text-accent font-semibold">{m.self_p2}</p>
        </CardContent>
      </Card>
    </div>
  );
}
