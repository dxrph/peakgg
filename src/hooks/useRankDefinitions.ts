import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RANKS, type RankTier } from "@/lib/ranks";

export interface RankDefinitionRow {
  rank_key: string;
  rank_name: string;
  min_elo: number;
  max_elo: number | null;
  sort_order: number;
  description: string | null;
  short_description: string | null;
  emblem_url: string | null;
  color_token: string | null;
  is_active: boolean;
}

/** In-memory cache so the badge can look up emblems synchronously after first load. */
let cache: RankDefinitionRow[] | null = null;
const subscribers = new Set<(rows: RankDefinitionRow[]) => void>();
let inflight: Promise<RankDefinitionRow[]> | null = null;

async function loadOnce(): Promise<RankDefinitionRow[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase
      .from("rank_definitions" as any)
      .select("rank_key, rank_name, min_elo, max_elo, sort_order, description, short_description, emblem_url, color_token, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) {
      // Fallback: synthesize from local RANKS so UI never breaks.
      cache = RANKS.map((r) => ({
        rank_key: r.name.toLowerCase(),
        rank_name: r.name,
        min_elo: r.minElo,
        max_elo: r.name === "Apex" ? null : r.maxElo,
        sort_order: r.tier,
        description: null,
        short_description: null,
        emblem_url: null,
        color_token: r.hex,
        is_active: true,
      }));
    } else {
      cache = data as unknown as RankDefinitionRow[];
    }
    subscribers.forEach((cb) => cb(cache!));
    return cache!;
  })();
  return inflight;
}

export function getCachedRankDefinitions(): RankDefinitionRow[] | null {
  return cache;
}

export function getCachedEmblemUrl(rank: RankTier | string): string | null {
  if (!cache) {
    // Fire and forget — populates cache for next render.
    void loadOnce();
    return null;
  }
  const row = cache.find((r) => r.rank_name.toLowerCase() === String(rank).toLowerCase());
  return row?.emblem_url ?? null;
}

export function useRankDefinitions() {
  const [rows, setRows] = useState<RankDefinitionRow[]>(cache ?? []);
  useEffect(() => {
    let mounted = true;
    loadOnce().then((r) => {
      if (mounted) setRows(r);
    });
    const cb = (r: RankDefinitionRow[]) => mounted && setRows(r);
    subscribers.add(cb);
    return () => {
      mounted = false;
      subscribers.delete(cb);
    };
  }, []);
  return rows;
}