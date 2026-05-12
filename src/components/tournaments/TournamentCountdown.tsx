import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type Props = {
  startsAt: string | null;
  registrationClosesAt?: string | null;
  checkinClosesAt?: string | null;
  countdownEnabled?: boolean;
  status?: string;
  className?: string;
  compact?: boolean;
};

function diff(target: Date) {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export default function TournamentCountdown({
  startsAt,
  registrationClosesAt,
  checkinClosesAt,
  countdownEnabled = true,
  status,
  className = "",
  compact = false,
}: Props) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!countdownEnabled) return;
    const id = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [countdownEnabled]);

  if (!countdownEnabled) return null;

  // Pick most relevant target
  let label = "Tournament starts in";
  let target: Date | null = null;

  if ((status === "checkin" || status === "checkin_open") && checkinClosesAt) {
    label = "Check-in closes in";
    target = new Date(checkinClosesAt);
  } else if (status === "registration_open" && registrationClosesAt) {
    label = "Registration closes in";
    target = new Date(registrationClosesAt);
  } else if (startsAt) {
    label = "Tournament starts in";
    target = new Date(startsAt);
  }

  if (!target) {
    return (
      <div className={`rounded-lg border border-border bg-card/60 backdrop-blur-sm px-4 py-3 ${className}`}>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-display">
          <Clock className="h-3 w-3" />Schedule
        </div>
        <p className="text-sm font-display mt-1">Date and time will be announced soon.</p>
      </div>
    );
  }

  const d = diff(target);
  if (!d) {
    return (
      <div className={`rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 ${className}`}>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary font-display">
          <Clock className="h-3 w-3" />{label.replace(" in", "")}
        </div>
        <p className="text-sm font-display mt-1 text-primary">Now</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs font-mono ${className}`}>
        <Clock className="h-3 w-3 text-accent" />
        <span className="text-muted-foreground">{label}</span>
        <span className="font-display text-foreground">
          {d.d > 0 ? `${d.d}d ` : ""}{String(d.h).padStart(2, "0")}h {String(d.m).padStart(2, "0")}m
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-primary/30 bg-card/60 backdrop-blur-sm px-4 py-3 ${className}`}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary font-display">
        <Clock className="h-3 w-3" />{label}
      </div>
      <div className="flex items-baseline gap-3 mt-2">
        <Unit n={d.d} u="days" />
        <Sep />
        <Unit n={d.h} u="hours" />
        <Sep />
        <Unit n={d.m} u="min" />
        <Sep />
        <Unit n={d.s} u="sec" />
      </div>
    </div>
  );
}

function Unit({ n, u }: { n: number; u: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-display font-bold tabular-nums leading-none">{String(n).padStart(2, "0")}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-display mt-1">{u}</div>
    </div>
  );
}
function Sep() {
  return <span className="text-2xl md:text-3xl font-display text-muted-foreground/40 leading-none">:</span>;
}