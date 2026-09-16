import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Map as MapIcon, Shuffle } from "lucide-react";
import { DEFAULT_VALORANT_MAP_POOL, MAP_SELECTION_MODE_LABEL } from "@/lib/valorant-maps";

type Props = { tournamentId: string; mapSelectionMode?: string | null };

export default function MapPoolSection({ tournamentId, mapSelectionMode }: Props) {
  const [maps, setMaps] = useState<{ map_name: string; image_url: string | null }[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("tournament_map_pool" as never)
        .select("map_name, image_url, display_order, is_active")
        .eq("tournament_id", tournamentId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (cancelled) return;
      const rows = (data ?? []) as never as { map_name: string; image_url: string | null }[];
      if (rows.length === 0) {
        setMaps(DEFAULT_VALORANT_MAP_POOL.map((m) => ({ map_name: m, image_url: null })));
        setIsDefault(true);
      } else {
        setMaps(rows);
        setIsDefault(false);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tournamentId]);

  const modeLabel = MAP_SELECTION_MODE_LABEL[mapSelectionMode ?? "admin_manual"] ?? "Admin selects map manually";

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" />
          <p className="font-display uppercase tracking-wide">Active Map Pool</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
          <Shuffle className="h-3.5 w-3.5 text-accent" />
          <span>Map selection: <span className="font-display text-foreground">{modeLabel}</span></span>
        </div>
      </div>

      {isDefault && (
        <p className="text-xs text-muted-foreground font-body mb-3">
          Default VALORANT map pool — staff has not customized the pool for this tournament.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {maps.map((m) => (
            <div key={m.map_name} className="rounded-md border border-border bg-secondary/30 px-3 py-2.5 text-center">
              <p className="font-display uppercase tracking-wide text-sm">{m.map_name}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground font-body mt-4">
        Match maps will be selected based on the tournament veto/draw mode shown above.
      </p>
    </div>
  );
}