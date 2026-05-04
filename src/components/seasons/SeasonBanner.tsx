import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Clock } from "lucide-react";

type Season = { id: string; name: string; ends_at: string };

function timeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "terminata";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  if (d > 0) return `${d}g ${h}h`;
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function SeasonBanner() {
  const [season, setSeason] = useState<Season | null>(null);
  useEffect(() => {
    supabase.from("seasons").select("id, name, ends_at").eq("active", true).maybeSingle()
      .then(({ data }) => setSeason((data as Season) ?? null));
  }, []);
  if (!season) return null;
  return (
    <div className="rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent px-4 py-3 flex items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-5 w-5 text-primary" />
        <div>
          <p className="font-display uppercase tracking-widest text-xs text-muted-foreground">Stagione attiva</p>
          <p className="font-display text-lg">{season.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono">{timeLeft(season.ends_at)}</span>
      </div>
    </div>
  );
}