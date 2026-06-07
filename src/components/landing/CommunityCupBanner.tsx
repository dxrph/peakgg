import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Calendar, Users, Sparkles, Mountain, Globe2, Ticket, Swords } from "lucide-react";
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
    <section className="container py-8 md:py-12">
      <div
        className="group relative overflow-hidden rounded-[20px] p-[1px] transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary)/0.75), hsl(var(--accent)/0.45) 45%, hsl(var(--primary)/0.15) 100%)",
        }}
      >
        {/* Inner card */}
        <div className="relative overflow-hidden rounded-[19px] bg-gradient-to-br from-[#0c0a0e] via-[#0a0709] to-[#070506] transition-shadow duration-200 group-hover:shadow-[0_24px_60px_-20px_rgba(255,70,85,0.45)]">
          {/* Glow blobs */}
          <div
            className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full pointer-events-none transition-opacity duration-300 opacity-90 group-hover:opacity-100"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.28), transparent 62%)" }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-[320px] h-[320px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, hsl(var(--accent)/0.16), transparent 65%)" }}
          />
          {/* Title radial highlight */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[360px] h-[220px] rounded-full pointer-events-none opacity-60"
            style={{ background: "radial-gradient(ellipse, hsl(var(--primary)/0.08), transparent 70%)" }}
          />
          {/* Shine sweep on hover */}
          <div
            aria-hidden
            className="absolute inset-y-0 -left-1/3 w-1/3 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-[420%] transition-all duration-[1100ms] ease-out"
            style={{
              background:
                "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
            }}
          />
          {/* Subtle corner accents */}
          <span aria-hidden className="absolute top-3 left-3 h-3.5 w-3.5 border-t border-l border-primary/50" />
          <span aria-hidden className="absolute bottom-3 right-3 h-3.5 w-3.5 border-b border-r border-primary/50" />

          {/* Faint grid */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative p-6 md:p-8 lg:p-9 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
            {/* Trophy emblem */}
            <div className="relative shrink-0">
              <div
                className="absolute -inset-2 rounded-2xl opacity-70 blur-xl pointer-events-none"
                style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.35), transparent 70%)" }}
              />
              <div className="relative h-16 w-16 md:h-[88px] md:w-[88px] rounded-2xl bg-gradient-to-br from-primary/20 to-primary/[0.04] border border-primary/45 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-shadow duration-200 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_28px_rgba(255,70,85,0.35)]">
                <Trophy className="h-8 w-8 md:h-11 md:w-11 text-primary drop-shadow-[0_0_10px_rgba(255,70,85,0.5)]" />
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Eyebrow */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-primary/45 bg-primary/[0.10] backdrop-blur-sm text-[10px] uppercase tracking-[0.22em] font-display font-bold text-primary">
                  <Mountain className="h-3 w-3" />
                  PeakGG Signature Event
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.22em] font-display font-bold border backdrop-blur-sm ${
                    isLive
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                      : isSoon
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-primary/45 bg-primary/[0.08] text-primary"
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
              <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold leading-[1.02] uppercase tracking-tight text-white/95 [text-shadow:0_2px_18px_rgba(0,0,0,0.5)]">
                {t.name}
              </h2>
              <p className="text-sm md:text-[15px] text-muted-foreground mt-2.5 max-w-2xl line-clamp-2 font-body leading-relaxed">
                {t.short_description ??
                  "The first PeakGG community tournament. Free entry, EU-only, 5-stack VALORANT. Be part of day one."}
              </p>

              {/* Meta strip */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] md:text-xs font-display uppercase tracking-[0.14em]">
                <span className="inline-flex items-center gap-1.5 text-foreground/85">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {dateLabel}
                </span>
                <span aria-hidden className="hidden sm:inline h-1 w-1 rounded-full bg-primary/40" />
                <span className="inline-flex items-center gap-1.5 text-foreground/85">
                  <Swords className="h-3.5 w-3.5 text-primary" />
                  {t.format ?? "5v5 Single Elim"}
                </span>
                <span aria-hidden className="hidden sm:inline h-1 w-1 rounded-full bg-primary/40" />
                <span className="inline-flex items-center gap-1.5 text-foreground/85">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  {t.max_teams ? `${t.max_teams} teams` : "Open roster"}
                </span>
                <span aria-hidden className="hidden sm:inline h-1 w-1 rounded-full bg-primary/40" />
                <span className="inline-flex items-center gap-1.5 text-foreground/85">
                  <Globe2 className="h-3.5 w-3.5 text-primary" />
                  EU Europe
                </span>
                <span aria-hidden className="hidden sm:inline h-1 w-1 rounded-full bg-primary/40" />
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-primary/40 bg-primary/[0.10] text-primary font-bold">
                  <Ticket className="h-3.5 w-3.5" />
                  Free Entry
                </span>
              </div>
            </div>

            {/* Countdown + CTA */}
            <div className="w-full lg:w-auto flex flex-col items-stretch lg:items-end gap-3 shrink-0 lg:min-w-[240px]">
              {countdown && (
                <div className="flex items-center gap-2">
                  {(["d", "h", "m", "s"] as const).map((k) => (
                    <div
                      key={k}
                      className="min-w-[54px] px-2 py-1.5 rounded-md border border-white/10 bg-black/55 backdrop-blur-sm text-center"
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
              <Link to={`/tournaments/${t.slug ?? t.id}`} className="relative w-full lg:w-auto">
                <span
                  aria-hidden
                  className="absolute -inset-1 rounded-lg blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-200 pointer-events-none"
                  style={{ background: "linear-gradient(95deg, #FF4655, #FF8A3D)" }}
                />
                <Button
                  size="lg"
                  className="relative group/cta w-full lg:w-auto h-[54px] px-8 rounded-lg uppercase tracking-wider font-display font-bold text-base text-white border-0 shadow-[0_0_24px_rgba(255,70,85,0.35)] hover:shadow-[0_0_42px_rgba(255,70,85,0.6)] hover:-translate-y-0.5 hover:brightness-110 transition-all duration-200"
                  style={{
                    backgroundImage:
                      "linear-gradient(95deg, #FF4655 0%, #FF6A3F 55%, #FF8A3D 100%)",
                  }}
                >
                  {isSoon ? "Get Notified" : isLive ? "Watch Live" : "View Tournament"}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover/cta:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}