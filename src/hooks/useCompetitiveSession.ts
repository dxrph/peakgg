import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CompetitiveStatus =
  | "idle"
  | "queued"
  | "match_found"
  | "in_match"
  | "pending_confirmation"
  | "disputed"
  | "completed";

export interface CompetitiveSession {
  status: CompetitiveStatus;
  mode: "open_cup" | "ranked" | null;
  game: string | null;
  teamSize: number | null;
  joinedAt: string | null;
  activeMatchId: string | null;
  refresh: () => void;
  cancelQueue: () => Promise<void>;
  loading: boolean;
}

/**
 * Single source of truth for the current user's competitive session.
 * Polls every 5s; consumers can also call refresh() after a mutation.
 */
export function useCompetitiveSession(): CompetitiveSession {
  const { user } = useAuth();
  const [status, setStatus] = useState<CompetitiveStatus>("idle");
  const [mode, setMode] = useState<CompetitiveSession["mode"]>(null);
  const [game, setGame] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<number | null>(null);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!user) {
      setStatus("idle"); setMode(null); setGame(null); setTeamSize(null);
      setJoinedAt(null); setActiveMatchId(null); setLoading(false);
      return;
    }
    let alive = true;
    const load = async () => {
      // 1) Active match via match_rosters (queue matches)
      const { data: rs } = await supabase
        .from("match_rosters")
        .select("match_id")
        .eq("user_id", user.id);
      const ids = (rs ?? []).map((r: any) => r.match_id);
      let activeMatch: any = null;
      if (ids.length) {
        const { data: m } = await supabase
          .from("matches")
          .select("id, status, kind, game, result_status, created_at")
          .in("id", ids)
          .in("kind", ["open_cup", "ranked"])
          .not("status", "in", "(completed,cancelled)")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        activeMatch = m;
      }
      // 2) Queue entry
      const { data: q } = await supabase
        .from("open_cup_queue")
        .select("game, team_size, joined_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alive) return;

      if (activeMatch) {
        setMode((activeMatch.kind as any) ?? "open_cup");
        setGame(activeMatch.game ?? null);
        setActiveMatchId(activeMatch.id);
        setJoinedAt(null);
        setTeamSize(prev => prev ?? 1);
        const rs2 = activeMatch.result_status;
        if (rs2 === "disputed") setStatus("disputed");
        else if (rs2 === "pending_confirmation") setStatus("pending_confirmation");
        else if (activeMatch.status === "live" || activeMatch.status === "in_progress") setStatus("in_match");
        else setStatus("match_found");
      } else if (q) {
        setMode("open_cup");
        setGame(q.game);
        setTeamSize(q.team_size);
        setJoinedAt(q.joined_at);
        setActiveMatchId(null);
        setStatus("queued");
      } else {
        setStatus("idle"); setMode(null); setGame(null); setTeamSize(null);
        setJoinedAt(null); setActiveMatchId(null);
      }
      setLoading(false);
    };
    load();
    const id = setInterval(load, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [user?.id, tick]);

  const cancelQueue = useCallback(async () => {
    await supabase.rpc("cancel_open_cup_queue");
    refresh();
  }, [refresh]);

  return { status, mode, game, teamSize, joinedAt, activeMatchId, refresh, cancelQueue, loading };
}