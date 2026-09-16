import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, Zap, ArrowRight } from "lucide-react";

interface NextTournamentHeroProps {
  name: string;
  game: string;
  date: Date;
  prize: string;
  format: string;
  slots: string;
  tier: string;
  href?: string;
}

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s };
}

export default function NextTournamentHero({
  name, game, date, prize, format, slots, tier, href = "#",
}: NextTournamentHeroProps) {
  const [t, setT] = useState(() => diff(date));
  useEffect(() => {
    const id = setInterval(() => setT(diff(date)), 1000);
    return () => clearInterval(id);
  }, [date]);

  const Cell = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center min-w-[58px] sm:min-w-[72px] rounded-md border border-primary/30 bg-background/40 backdrop-blur px-2 py-2 sm:py-3">
      <span className="font-display text-2xl sm:text-3xl text-primary leading-none tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-display">
        {label}
      </span>
    </div>
  );

  return (
    <section className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8 mb-8">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(hsl(var(--primary))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="gradient-primary border-0 text-primary-foreground font-display uppercase tracking-wider">
              <Zap className="h-3 w-3 mr-1" /> Next Up
            </Badge>
            <Badge variant="outline" className="font-display uppercase border-primary/40 text-primary">{tier}</Badge>
            <Badge variant="secondary" className="font-display uppercase">{game}</Badge>
            <Badge variant="outline" className="font-display">{format}</Badge>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl uppercase tracking-tight">{name}</h2>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm font-body text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{slots} teams</span>
            <span className="flex items-center gap-1.5 text-accent"><Trophy className="h-4 w-4" /><span className="text-accent font-semibold">{prize}</span></span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={href}>
              <Button variant="neon" size="lg" className="uppercase tracking-wider">
                Register Team <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to={href}>
              <Button variant="neonOutline" size="lg" className="uppercase tracking-wider">
                View Details
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <Cell value={t.d} label="Days" />
          <Cell value={t.h} label="Hours" />
          <Cell value={t.m} label="Min" />
          <Cell value={t.s} label="Sec" />
        </div>
      </div>
    </section>
  );
}