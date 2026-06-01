import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Calendar, Users, Sparkles, Mountain } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type CupRow = {
  id: string;
  slug: string | null;
  name: string;
  status: string;
  short_description: string | null;
  start_date: string | null;
  max_teams: number | null;
  format: string | null;
};

const STATUS_META: Record<string, { label: string; tone: "live" | "open" | "soon" | "closed" }> = {
  registration_open:   { label: "Registrations Open", tone: "open" },
  registration_closed: { label: "Registrations Closed", tone: "closed" },
  checkin:             { label: "Check-in Open", tone: "live" },
  checkin_open:        { label: "Check-in Open", tone: "live" },
  live:                { label: "Live Now", tone: "live" },
  collecting_interest: { label: "Coming Soon", tone: "soon" },
  upcoming:            { label: "Coming Soon", tone: "soon" },
  scheduled:           { label: "Coming Soon", tone: "soon" },
};

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (Number.isNaN(diff) || diff <= 0) return null;
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s };
}

export default function CommunityCupBanner() {
  const { data: t } = useQuery<CupRow | null>({
    queryKey: ["community-cup-1-banner"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, slug, name, status, short_description, start_date, max_teams, format")
        .eq("slug", "community-cup-1")
        .maybeSingle();
      return (data as CupRow | null) ?? null;
    },
  });

  const countdown = useCountdown(t?.start_date ?? null);

  if (!t || t.status === "completed") return null;

  const meta = STATUS_META[t.status] ?? { label: t.status, tone: "soon" as const };
  const isSoon = meta.tone === "soon";
  const isLive = meta.tone === "live";

  const dateLabel = t.start_date
    ? new Date(t.start_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date TBA";

  return (
    <section className="container py-7 md:py-9">
      <div
        className="group relative overflow-hidden rounded-2xl p-[1px]"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary)/0.7), hsl(var(--accent)/0.5) 45%, hsl(var(--primary)/0.2) 100%)",
        }}
      >
        {/* Inner card */}
        <div className="relative overflow-hidden rounded-[15px] bg-gradient-to-br from-[#0c0a0e] via-[#0a0709] to-[#070506]">
          {/* Glow blobs */}
          <div
            className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.22), transparent 60%)" }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(var(--accent)/0.16), transparent 65%)" }}
          />

          {/* Faint grid */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          {/* Animated sheen */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background:
                "linear-gradient(110deg, transparent 40%, hsl(var(--primary)/0.18) 50%, transparent 60%)",
              animation: "ccSheen 3s ease-in-out infinite",
            }}
          />
          <style>{`
            @keyframes ccSheen { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }
            @keyframes ccPulseRing {
              0%   { transform: scale(0.9); opacity: 0.6; }
              80%  { transform: scale(1.4); opacity: 0; }
              100% { transform: scale(1.4); opacity: 0; }
            }
          `}</style>

          <div className="relative p-5 md:p-7 flex flex-col lg:flex-row items-start lg:items-center gap-5 lg:gap-7">
            {/* Trophy emblem */}
            <div className="relative shrink-0">
              <span
                aria-hidden
                className="absolute inset-0 rounded-2xl border border-primary/50"
                style={{ animation: "ccPulseRing 2.4s ease-out infinite" }}
              />
              <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/10 border border-primary/50 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.35)]">
                <Trophy className="h-8 w-8 md:h-10 md:w-10 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.7)]" />
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Eyebrow */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-primary/40 bg-primary/10 text-[10px] uppercase tracking-[0.2em] font-display font-bold text-primary">
                  <Mountain className="h-3 w-3" />
                  PeakGG Signature Event
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.2em] font-display font-bold border ${
                    isLive
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                      : isSoon
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-primary/40 bg-primary/5 text-primary"
                  }`}
                >
                  {isLive && (
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                  )}
                  {isSoon && <Sparkles className="h-3 w-3" />}
                  {meta.label}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold leading-tight uppercase tracking-tight">
                {t.name}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-1.5 max-w-2xl line-clamp-2 font-body">
                {t.short_description ??
                  "The first PeakGG community tournament. Free entry, EU-only, 5-stack VALORANT. Be part of day one."}
              </p>

              {/* Meta strip */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-display uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5 text-foreground/85">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {dateLabel}
                </span>
                <span className="hidden sm:inline w-px h-3 bg-border" />
                <span className="inline-flex items-center gap-1.5 text-foreground/85">
                  <Trophy className="h-3.5 w-3.5 text-primary" />
                  {t.format ?? "5v5 Single Elim"}
                </span>
                <span className="hidden sm:inline w-px h-3 bg-border" />
                <span className="inline-flex items-center gap-1.5 text-foreground/85">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {t.max_teams ? `${t.max_teams} teams` : "Open roster"}
                </span>
                <span className="hidden sm:inline w-px h-3 bg-border" />
                <span className="text-foreground/85">🇪🇺 Europe</span>
                <span className="hidden sm:inline w-px h-3 bg-border" />
                <span className="text-primary font-bold">Free Entry</span>
              </div>
            </div>

            {/* Countdown + CTA */}
            <div className="w-full lg:w-auto flex flex-col items-stretch lg:items-end gap-3 shrink-0">
              {countdown && (
                <div className="flex items-center gap-2">
                  {(["d", "h", "m", "s"] as const).map((k) => (
                    <div
                      key={k}
                      className="min-w-[52px] px-2 py-1.5 rounded-md border border-white/10 bg-black/50 text-center"
                    >
                      <div className="font-mono tabular-nums text-base md:text-lg font-bold text-foreground leading-none">
                        {String(countdown[k]).padStart(2, "0")}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-display mt-0.5">
                        {k === "d" ? "Days" : k === "h" ? "Hrs" : k === "m" ? "Min" : "Sec"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link to={`/tournaments/${t.slug ?? t.id}`} className="w-full lg:w-auto">
                <Button
                  variant="neon"
                  size="lg"
                  className="w-full lg:w-auto uppercase tracking-wider shadow-[0_0_24px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_38px_hsl(var(--primary)/0.6)]"
                >
                  {isSoon ? "Get Notified" : isLive ? "Watch Live" : "View Tournament"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}