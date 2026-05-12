import { Link } from "react-router-dom";
import { format as fmtDate } from "date-fns";
import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy, Calendar, Users, MapPin, Globe, ChevronRight, ArrowLeft,
  ShieldCheck, Swords, Flag, Star, CheckCircle2, Megaphone, ListChecks,
  ScrollText, Server, Languages, Layers, Award, Sparkles,
} from "lucide-react";
import BracketView from "@/components/tournaments/BracketView";
import CommunityCupPanel from "@/components/tournaments/CommunityCupPanel";
import CommunityCupSignupDialog from "@/components/tournaments/CommunityCupSignupDialog";
import { DISCORD_INVITE } from "@/lib/links";
import { useAuth } from "@/hooks/useAuth";

type Tournament = {
  id: string; slug: string | null; name: string; status: string;
  start_date: string | null; timezone: string | null;
  max_teams: number; min_teams: number | null;
  short_description: string | null; description: string | null;
  prize_pool: string | null;
};

export default function CommunityCupDetail({ tournament }: { tournament: Tournament }) {
  const t = tournament;
  const { user } = useAuth();
  const [openSignup, setOpenSignup] = useState(false);

  const startDate = t.start_date
    ? `${fmtDate(new Date(t.start_date), "MMM d, yyyy — HH:mm")} ${t.timezone || ""}`.trim()
    : "Date to be announced";

  const statusMeta = STATUS_META[t.status] ?? { label: t.status, tone: "neutral" };

  const ctaLabel = (() => {
    switch (t.status) {
      case "registration_open": return "Register Your Team";
      case "registration_closed": return "Registrations Closed";
      case "checkin":
      case "checkin_open": return "Check In";
      case "live": return "View Bracket";
      case "completed": return "View Results";
      default: return "View Tournament";
    }
  })();
  const ctaDisabled = t.status === "registration_closed";

  const onPrimaryCta = () => {
    if (t.status === "registration_open" && user) { setOpenSignup(true); return; }
    if (t.status === "registration_open" && !user) { window.location.href = "/login"; return; }
    document.getElementById("community-cup-panel")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title={`${t.name} — PeakGG | Free EU VALORANT Community Tournament`}
        description="PeakGG Community Cup #1: a free EU VALORANT tournament for community 5-stacks, amateur players and rising teams."
        path={`/tournaments/${t.slug ?? t.id}`}
      />
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 gradient-hero pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse at 30% 20%, black 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(352 100% 62% / 0.22), transparent 60%)" }}
          />
          <div
            className="absolute -bottom-40 -left-20 w-[460px] h-[460px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(24 100% 63% / 0.14), transparent 60%)" }}
          />

          <div className="container relative pt-24 pb-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 font-body">
              <Link to="/tournaments" className="hover:text-foreground transition-colors flex items-center gap-1 uppercase tracking-wider">
                <ArrowLeft className="h-3 w-3" />Tournaments
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground uppercase tracking-wider">Community Cup #1</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-10 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <Badge variant="outline" className={`font-display uppercase tracking-wider ${statusToneClass(statusMeta.tone)}`}>
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />{statusMeta.label}
                  </Badge>
                  <Badge variant="secondary" className="font-display uppercase">Team Tournament</Badge>
                  <Badge variant="secondary" className="font-display uppercase">5v5</Badge>
                  <Badge variant="secondary" className="font-display uppercase">Community Cup</Badge>
                  <Badge variant="secondary" className="font-display uppercase">VALORANT</Badge>
                  <Badge variant="secondary" className="font-display uppercase">EU</Badge>
                </div>

                <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight leading-[1.05]">
                  PeakGG Community Cup <span className="text-primary">#1</span>
                </h1>
                <p className="text-lg md:text-xl text-foreground/85 font-body mt-4 max-w-2xl">
                  A free EU VALORANT tournament built for community teams, amateur players and rising 5-stacks.
                </p>
                <p className="text-base md:text-lg text-muted-foreground font-body mt-3 max-w-2xl">
                  Bring your 5-stack. Represent your community. Compete for the first PeakGG Community Cup title.
                </p>

                {/* Hero metadata grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-7 max-w-3xl">
                  <HeroMeta icon={<Calendar className="h-3.5 w-3.5" />} label="Date" value={startDate} />
                  <HeroMeta icon={<MapPin className="h-3.5 w-3.5" />} label="Region" value="Europe" />
                  <HeroMeta icon={<Server className="h-3.5 w-3.5" />} label="Server" value="EU" />
                  <HeroMeta icon={<Languages className="h-3.5 w-3.5" />} label="Language" value="English" />
                  <HeroMeta icon={<Users className="h-3.5 w-3.5" />} label="Teams" value={`Up to ${t.max_teams}`} />
                  <HeroMeta icon={<Layers className="h-3.5 w-3.5" />} label="Format" value="Single Elim." />
                  <HeroMeta icon={<Swords className="h-3.5 w-3.5" />} label="Matches" value="BO1" />
                  <HeroMeta icon={<Trophy className="h-3.5 w-3.5" />} label="Final" value="BO3" />
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-8">
                  <Button
                    variant="neon"
                    size="lg"
                    className="uppercase tracking-wider"
                    disabled={ctaDisabled}
                    onClick={onPrimaryCta}
                  >
                    {ctaLabel}
                  </Button>
                  <a href="#format">
                    <Button variant="neonOutline" size="lg" className="uppercase tracking-wider">
                      View Format
                    </Button>
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-3 font-body">
                  Free entry. Staff reviews every signup before approval.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TOP STATS STRIP */}
        <section className="container -mt-2 pt-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Game" value="VALORANT" />
            <StatCard label="Entry" value="Free" accent />
            <StatCard label="Team Size" value="5 + 2 subs" />
            <StatCard label="Slots" value={`${t.min_teams ?? 8}–${t.max_teams} teams`} />
            <StatCard label="Format" value="Single Elim." />
            <StatCard label="Final" value="BO3" />
          </div>
        </section>

        <div className="container py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN COLUMN */}
          <div className="lg:col-span-2 space-y-12">
            {/* My Team / Approved Teams / Register */}
            <section id="community-cup-panel">
              <CommunityCupPanel tournamentId={t.id} tournamentStatus={t.status} />
            </section>

            {/* About */}
            <Section
              icon={<Sparkles className="h-5 w-5 text-primary" />}
              title="About the Community Cup"
              kicker="Built for EU Community Teams"
            >
              <p className="text-muted-foreground font-body leading-relaxed">
                PeakGG Community Cup #1 is a free EU VALORANT tournament for community teams, amateur players and groups of friends who want to compete in a structured event. The goal is to give communities a clean way to participate, represent their players and connect with other teams across Europe.
              </p>
              <p className="text-muted-foreground font-body leading-relaxed mt-2">
                This is not a closed pro event. It is built for rising players, amateur teams and community-driven competition.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                <FeatureCard icon={<Flag className="h-5 w-5" />} title="Represent Your Community"
                  text="Bring a team from your Discord server, group or community and compete under your name." />
                <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Compete in a Clean Format"
                  text="Simple bracket, clear rules, captain communication and staff-reviewed registrations." />
                <FeatureCard icon={<Megaphone className="h-5 w-5" />} title="Get Visibility"
                  text="Winning teams and standout communities can be featured on PeakGG socials and future events." />
              </div>
            </Section>

            {/* Format */}
            <Section
              id="format"
              icon={<Layers className="h-5 w-5 text-primary" />}
              title="Tournament Format"
              kicker="From signup to grand final"
            >
              <ol className="space-y-3">
                {FORMAT_STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                    <span className="font-display text-primary text-xl w-7 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="font-display uppercase tracking-wide">{s.title}</p>
                      <p className="text-sm text-muted-foreground font-body mt-1">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                <BracketFormatCard title="8-Team Format" rows={[
                  ["Quarterfinals", "BO1"],
                  ["Semifinals", "BO1"],
                  ["Grand Final", "BO3"],
                ]} />
                <BracketFormatCard title="16-Team Format" rows={[
                  ["Round of 16", "BO1"],
                  ["Quarterfinals", "BO1"],
                  ["Semifinals", "BO1"],
                  ["Grand Final", "BO3"],
                ]} highlight />
              </div>
            </Section>

            {/* Community Participation */}
            <Section
              icon={<Users className="h-5 w-5 text-primary" />}
              title="How Communities Can Join"
              kicker="Three flexible ways to participate"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <OptionCard n={1} title="Community Team" text="Your community sends one 5-stack to represent the server." />
                <OptionCard n={2} title="Open Players" text="You share the event with interested players, and they register with their own team." />
                <OptionCard n={3} title="Participating Community" text="Your community is listed as participating/supporting without managing anything directly." />
              </div>
              <p className="text-xs text-muted-foreground font-body mt-4">
                Communities are not required to promote anything aggressively. The goal is to invite interested players in a respectful and organized way.
              </p>
            </Section>

            {/* Rules */}
            <Section
              icon={<ScrollText className="h-5 w-5 text-primary" />}
              title="Core Rules"
              kicker="Clean play, clear standards"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {RULES.map((r) => (
                  <div key={r} className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm font-body">{r}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-body mt-4">
                The full rulebook may be updated before the tournament starts. Captains will be notified of any important changes.
              </p>
            </Section>

            {/* Team Requirements */}
            <Section
              icon={<ListChecks className="h-5 w-5 text-primary" />}
              title="Team Requirements"
              kicker="What every captain needs"
            >
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground font-body mb-3">Each team must have:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                  {REQUIREMENTS.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm font-body">
                      <span className="text-primary mt-1">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            {/* Rewards */}
            <Section
              icon={<Award className="h-5 w-5 text-accent" />}
              title="Rewards & Visibility"
              kicker="Compete for recognition"
            >
              <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-transparent p-5">
                <p className="text-sm text-muted-foreground font-body">
                  This first edition focuses on competition, visibility and community recognition. Rewards may include:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  {REWARDS.map((r) => (
                    <div key={r} className="flex items-start gap-2 text-sm font-body">
                      <Star className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* Bracket */}
            <Section
              icon={<Trophy className="h-5 w-5 text-primary" />}
              title="Bracket"
              kicker="Single elimination"
            >
              <div className="rounded-lg border border-border bg-card p-6">
                {t.status === "live" || t.status === "completed" ? (
                  <BracketView tournamentId={t.id} />
                ) : (
                  <div className="text-center py-10">
                    <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-display text-lg">Bracket not live yet</p>
                    <p className="text-sm text-muted-foreground font-body mt-1 max-w-md mx-auto">
                      The bracket will be generated once enough teams are approved and check-in is completed.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-5 text-xs">
                      <Badge variant="secondary" className="font-display uppercase">BO1 until Grand Final</Badge>
                      <Badge variant="secondary" className="font-display uppercase">Grand Final BO3</Badge>
                      <Badge variant="secondary" className="font-display uppercase">{t.min_teams ?? 8}/{t.max_teams} teams</Badge>
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Registration Status */}
            <SidebarCard title="Registration Status" icon={<ShieldCheck className="h-4 w-4 text-primary" />}>
              <SideRow k="Status" v={<Badge variant="outline" className={`font-display ${statusToneClass(statusMeta.tone)}`}>{statusMeta.label}</Badge>} />
              <SideRow k="Slots" v={`Up to ${t.max_teams}`} />
              <SideRow k="Entry" v="Free" />
              <p className="text-xs text-muted-foreground font-body pt-1">Staff review required before approval.</p>
            </SidebarCard>

            {/* Quick Info */}
            <SidebarCard title="Quick Info" icon={<Globe className="h-4 w-4 text-primary" />}>
              <SideRow k="Game"     v="VALORANT" />
              <SideRow k="Region"   v="Europe" />
              <SideRow k="Server"   v="EU" />
              <SideRow k="Language" v="English" />
              <SideRow k="Format"   v="5v5" />
            </SidebarCard>

            {/* Rewards */}
            <SidebarCard title="Rewards" icon={<Trophy className="h-4 w-4 text-accent" />}>
              <ul className="space-y-1.5 text-sm font-body">
                <li className="flex items-start gap-2"><Star className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />Community Cup Champion title</li>
                <li className="flex items-start gap-2"><Star className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />PeakGG Champion role</li>
                <li className="flex items-start gap-2"><Star className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />Team/community spotlight</li>
                <li className="flex items-start gap-2"><Star className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />Future event priority</li>
              </ul>
            </SidebarCard>

            {/* Captain Checklist */}
            <SidebarCard title="Captain Checklist" icon={<ListChecks className="h-4 w-4 text-primary" />}>
              <ul className="space-y-1.5 text-sm font-body">
                <ChecklistRow text="Register team" />
                <ChecklistRow text="Join PeakGG Discord" />
                <ChecklistRow text="Wait for approval" />
                <ChecklistRow text="Check in before start" />
                <ChecklistRow text="Report results after matches" />
              </ul>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="block mt-3">
                <Button variant="neonOutline" size="sm" className="w-full">Join PeakGG Discord</Button>
              </a>
            </SidebarCard>

            {/* CTA Card */}
            <div className="rounded-xl border border-primary/40 bg-card p-5 neon-border">
              <h4 className="font-display text-lg">Ready to compete?</h4>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Register your 5-stack and represent your community in the first PeakGG Community Cup.
              </p>
              <Button
                variant="neon"
                className="w-full mt-4 uppercase tracking-wider"
                disabled={ctaDisabled}
                onClick={onPrimaryCta}
              >
                {ctaLabel}
              </Button>
            </div>
          </aside>
        </div>
      </main>

      <CommunityCupSignupDialog
        open={openSignup}
        onOpenChange={setOpenSignup}
        tournamentId={t.id}
      />
      <Footer />
    </div>
  );
}

/* ─────────── data ─────────── */

const STATUS_META: Record<string, { label: string; tone: "open" | "live" | "warn" | "done" | "neutral" }> = {
  collecting_interest: { label: "Collecting Interest", tone: "neutral" },
  registration_open:   { label: "Registration Open",   tone: "open" },
  registration_closed: { label: "Registrations Closed", tone: "warn" },
  checkin:             { label: "Check-in Open",       tone: "open" },
  checkin_open:        { label: "Check-in Open",       tone: "open" },
  live:                { label: "Live",                tone: "live" },
  completed:           { label: "Completed",           tone: "done" },
  upcoming:            { label: "Upcoming",            tone: "neutral" },
};

function statusToneClass(tone: string) {
  switch (tone) {
    case "open": return "border-success text-success";
    case "live": return "border-primary text-primary";
    case "warn": return "border-accent text-accent";
    case "done": return "border-muted-foreground text-muted-foreground";
    default: return "border-border text-foreground";
  }
}

const FORMAT_STEPS = [
  { title: "Registration", text: "Teams register for free. Every signup is reviewed by PeakGG staff before approval." },
  { title: "Team Approval", text: "Approved teams will appear publicly on the tournament page." },
  { title: "Check-In", text: "Captains must check in before the tournament starts. Teams that do not check in may lose their slot." },
  { title: "Bracket", text: "The bracket will be generated from approved/checked-in teams." },
  { title: "Matches", text: "BO1 matches until the Grand Final." },
  { title: "Grand Final", text: "The final match will be BO3." },
];

const RULES = [
  "All players must use their own Riot account.",
  "No cheating, scripting or third-party unfair tools.",
  "No account sharing.",
  "No fake results.",
  "No unauthorized player swaps.",
  "No intentional throwing.",
  "No extreme toxicity, harassment or hate speech.",
  "Captains must be reachable on Discord.",
  "Results must be reported with correct score information.",
  "Staff decisions are final in case of disputes.",
];

const REQUIREMENTS = [
  "5 main players",
  "Up to 2 substitutes",
  "1 captain",
  "Captain Discord username",
  "Captain email",
  "Riot IDs for all players",
  "All players available during the event schedule",
  "All players ready to join the PeakGG Discord",
];

const REWARDS = [
  "PeakGG Community Cup Champion title",
  "PeakGG Champion role",
  "Winner announcement post",
  "Team / community spotlight",
  "Priority invitation to future PeakGG events",
  "Exclusive badge when available",
  "Potential small prize/gift card depending on final setup",
];

/* ─────────── building blocks ─────────── */

function HeroMeta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/60 backdrop-blur-sm px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-display">
        {icon}{label}
      </div>
      <p className="text-sm font-display mt-0.5 truncate">{value}</p>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${accent ? "border-primary/40" : "border-border"}`}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">{label}</p>
      <p className={`font-display text-lg mt-1 ${accent ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

function Section({
  id, icon, title, kicker, children,
}: { id?: string; icon: React.ReactNode; title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-end justify-between gap-4 mb-5 border-b border-border pb-3">
        <div>
          {kicker && <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-display">{kicker}</p>}
          <h2 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-2 mt-1">
            {icon}{title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
      <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <p className="font-display text-base">{title}</p>
      <p className="text-sm text-muted-foreground font-body mt-1.5 leading-relaxed">{text}</p>
    </div>
  );
}

function BracketFormatCard({ title, rows, highlight }: { title: string; rows: [string, string][]; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-5 ${highlight ? "border-primary/40" : "border-border"}`}>
      <p className="font-display uppercase tracking-wide mb-3">{title}</p>
      <ul className="space-y-1.5">
        {rows.map(([k, v], i) => (
          <li key={k} className={`flex justify-between text-sm font-body ${i === rows.length - 1 ? "text-primary font-display" : ""}`}>
            <span>{k}</span><span className="text-muted-foreground">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OptionCard({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 relative overflow-hidden">
      <span className="absolute -top-3 -right-2 font-display text-6xl text-primary/10 select-none">{n}</span>
      <p className="text-[10px] uppercase tracking-widest text-primary font-display">Option {n}</p>
      <p className="font-display text-base mt-1">{title}</p>
      <p className="text-sm text-muted-foreground font-body mt-2 leading-relaxed">{text}</p>
    </div>
  );
}

function SidebarCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="font-display uppercase tracking-wide text-sm flex items-center gap-2 mb-3">{icon}{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function SideRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm font-body">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-display">{v}</span>
    </div>
  );
}
function ChecklistRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />{text}
    </li>
  );
}