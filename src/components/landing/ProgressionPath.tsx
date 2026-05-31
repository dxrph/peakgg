import { Link } from "react-router-dom";
import { Trophy, TrendingUp, Shield, Lock, Crown, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ProgressionPathProps {
  /** Optional eyebrow + heading override (tournaments page uses different copy). */
  variant?: "default" | "compact";
  className?: string;
}

const STEPS = [
  {
    icon: Trophy,
    title: "1. Join an Open Cup",
    body: "Free entry, no team required. Queue solo or with friends and get matched.",
    accent: "text-success border-success/40",
  },
  {
    icon: TrendingUp,
    title: "2. Earn ELO every match",
    body: "Beat stronger teams → bigger ELO gain. Lose to weaker teams → bigger ELO loss. Scrims don't affect your official rank.",
    accent: "text-primary border-primary/40",
  },
  {
    icon: Shield,
    title: "3. Climb the 7 Peak Ranks",
    body: "Rookie → Contender → Rival → Expert → Elite → Master → Apex. Your rank is derived live from your ELO.",
    accent: "text-accent border-accent/40",
  },
  {
    icon: Lock,
    title: "4. Unlock Challenger Series",
    body: "Reach Rival rank (1000 ELO) or finish an Open Cup to qualify for Tier 2 events.",
    accent: "text-accent border-accent/40",
  },
  {
    icon: Crown,
    title: "5. Reach Elite, qualify for Peak Championship",
    body: "Hit Elite (2000 ELO) or complete the Challenger Series to enter PeakGG's flagship Tier 3 events.",
    accent: "text-primary border-primary/40",
  },
];

export default function ProgressionPath({ variant = "default", className = "" }: ProgressionPathProps) {
  return (
    <section className={`relative ${className}`}>
      <div className="text-center mb-8 md:mb-10">
        <Badge
          variant="outline"
          className="mb-3 border-primary/40 text-primary font-display tracking-widest text-[10px] uppercase"
        >
          How PeakGG works
        </Badge>
        <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
          ONE PATH. <span className="text-primary text-glow-red">FROM ROOKIE TO APEX.</span>
        </h2>
        {variant === "default" && (
          <p className="mt-3 text-sm md:text-base text-muted-foreground font-body max-w-2xl mx-auto">
            Every match you play earns ELO. Your ELO sets your Peak Rank. Your Peak Rank unlocks bigger tournaments.
            That's the whole system — no hidden mechanics.
          </p>
        )}
      </div>

      {/* Mobile: vertical timeline. Desktop: horizontal flow. */}
      <ol className="relative flex flex-col md:flex-row md:items-stretch gap-4 md:gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="flex-1 flex md:flex-col items-stretch gap-3 md:gap-0 relative">
              <Card
                className={`flex-1 p-4 md:p-5 bg-card border ${step.accent} hover:border-primary/60 transition-colors`}
              >
                <div className="flex md:flex-col items-start md:items-start gap-3">
                  <div
                    className={`h-10 w-10 shrink-0 rounded-lg border ${step.accent} bg-background/60 flex items-center justify-center`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-bold uppercase tracking-wider text-sm text-foreground leading-tight">
                      {step.title}
                    </div>
                    <p className="mt-1.5 text-xs font-body text-muted-foreground leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Card>
              {i < STEPS.length - 1 && (
                <>
                  {/* Desktop arrow */}
                  <div className="hidden md:flex items-center justify-center w-4 shrink-0 text-primary/60">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  {/* Mobile arrow */}
                  <div className="md:hidden flex justify-center text-primary/60">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-body text-muted-foreground">
        <Link to="/elo" className="text-primary hover:underline font-display uppercase tracking-widest">
          How ELO is calculated →
        </Link>
        <span className="hidden sm:inline">·</span>
        <Link to="/leaderboard" className="text-primary hover:underline font-display uppercase tracking-widest">
          See the live leaderboard →
        </Link>
      </div>
    </section>
  );
}
