// Edge Function: update-match-result
// Updates per-game player_stats (ELO, wins/losses, streaks) when a match completes.
// POST body: { match_id: string }
// Auth required (caller must be authenticated). Match is read from DB; only completed matches are processed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type GameId = "valorant" | "cs2" | "r6s";
function isGameId(g: string | null | undefined): g is GameId {
  return g === "valorant" || g === "cs2" || g === "r6s";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const matchId = typeof body?.match_id === "string" ? body.match_id : null;
    if (!matchId) return json({ error: "match_id required" }, 400);

    // Use service role to read match + write player_stats (RLS write is blocked for clients)
    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: match, error: matchErr } = await admin
      .from("matches")
      .select("id, game, status, player_a_id, player_b_id, team_a_id, team_b_id, winner_id, kind, elo_processed_at")
      .eq("id", matchId)
      .maybeSingle();

    if (matchErr) return json({ error: matchErr.message }, 500);
    if (!match) return json({ error: "Match not found" }, 404);
    if (match.status !== "completed" || !match.winner_id) {
      return json({ error: "Match not completed" }, 400);
    }
    if (match.elo_processed_at) {
      return json({ ok: true, already_processed: true });
    }
    if (!isGameId(match.game)) {
      return json({ error: "Unsupported game" }, 400);
    }

    // Scrims are practice matches — they NEVER affect official PeakGG ELO.
    // Mark as processed so we don't keep retrying, then exit.
    if (match.kind === "scrim") {
      await admin.from("matches").update({ elo_processed_at: new Date().toISOString() }).eq("id", match.id);
      return json({ ok: true, skipped: "scrim_no_elo_impact" });
    }

    // K factor by match type — see EloExplained "Advanced formula".
    const K_BY_KIND: Record<string, number> = {
      open_cup: 24,
      ranked: 24,
      challenger_series: 28,
      peak_championship: 32,
    };
    const kFactor = K_BY_KIND[match.kind as string] ?? 24;

    // Atomic claim: set elo_processed_at NOW so concurrent invocations bail out.
    // If another invocation already claimed it, we exit early.
    const { data: claimed, error: claimErr } = await admin.rpc("claim_match_for_elo", { _match_id: match.id });
    if (claimErr) return json({ error: claimErr.message }, 500);
    if (!claimed) return json({ ok: true, already_processed: true });

    // Collect participating user IDs. Queue matches use match_rosters.side as
    // source of truth; team_a_id/team_b_id stay null for temporary sides.
    const participants: { userId: string; won: boolean }[] = [];
    const isQueueMatch = match.kind === "open_cup" || match.kind === "ranked";

    if (isQueueMatch) {
      const { data: rosters } = await admin
        .from("match_rosters")
        .select("team_id, user_id, side")
        .eq("match_id", match.id);

      if (rosters && rosters.length > 0) {
        const winnerRoster = rosters.find((r: { user_id: string; team_id: string | null; side: string | null }) => r.user_id === match.winner_id || r.team_id === match.winner_id);
        const winnerSide = winnerRoster?.side ?? null;
        rosters.forEach((r: { user_id: string; team_id: string | null; side: string | null }) => {
          const won = winnerSide ? r.side === winnerSide : r.team_id === match.winner_id || r.user_id === match.winner_id;
          participants.push({ userId: r.user_id, won });
        });
      }
    }

    if (participants.length === 0 && (match.player_a_id || match.player_b_id)) {
      // Legacy 1v1 match without rosters.
      if (match.player_a_id) participants.push({ userId: match.player_a_id, won: match.winner_id === match.player_a_id });
      if (match.player_b_id) participants.push({ userId: match.player_b_id, won: match.winner_id === match.player_b_id });
    } else if (participants.length === 0 && (match.team_a_id || match.team_b_id)) {
      // Permanent team match: derive members from real teams.
      const teamIds = [match.team_a_id, match.team_b_id].filter(Boolean) as string[];
      const { data: members } = await admin
        .from("team_members")
        .select("team_id, user_id")
        .in("team_id", teamIds);
      (members ?? []).forEach((m: { user_id: string; team_id: string }) => {
        participants.push({ userId: m.user_id, won: m.team_id === match.winner_id });
      });
    }

    if (participants.length === 0) {
      // Release the claim so it can be retried later
      await admin.from("matches").update({ elo_processed_at: null }).eq("id", match.id);
      return json({ error: "No participants resolved" }, 400);
    }

    const game = match.game as GameId;
    const updated: { user_id: string; won: boolean; elo: number }[] = [];

    // Default starting ELO for new players is 500 (Contender entry).
    const DEFAULT_ELO = 500;

    // Compute opponent average ELO per side for dynamic delta
    async function avgEloForUsers(userIds: string[]): Promise<number> {
      if (userIds.length === 0) return DEFAULT_ELO;
      const { data } = await admin
        .from("player_stats")
        .select("elo")
        .eq("game", game)
        .in("user_id", userIds);
      if (!data || data.length === 0) return DEFAULT_ELO;
      return Math.round(data.reduce((s: number, r: { elo: number | null }) => s + (r.elo ?? DEFAULT_ELO), 0) / data.length);
    }

    const winners = participants.filter(p => p.won).map(p => p.userId);
    const losers  = participants.filter(p => !p.won).map(p => p.userId);
    const winnersAvg = await avgEloForUsers(winners);
    const losersAvg  = await avgEloForUsers(losers);

    // Fast track flags
    const allIds = participants.map(p => p.userId);
    const { data: profs } = await admin
      .from("profiles")
      .select("id, fast_track")
      .in("id", allIds);
    const fastTrack = new Map<string, boolean>();
    (profs ?? []).forEach((p: { id: string; fast_track: boolean | null }) => fastTrack.set(p.id, !!p.fast_track));

    for (const p of participants) {
      // Read current per-game stat (auto-create if missing)
      const { data: existing } = await admin
        .from("player_stats")
        .select("id, elo, wins, losses, matches_played, win_streak, best_win_streak")
        .eq("user_id", p.userId)
        .eq("game", game)
        .maybeSingle();

      const baseElo = existing?.elo ?? DEFAULT_ELO;
      const baseWins = existing?.wins ?? 0;
      const baseLosses = existing?.losses ?? 0;
      const baseMatches = existing?.matches_played ?? 0;
      const baseStreak = existing?.win_streak ?? 0;
      const baseBest = existing?.best_win_streak ?? 0;

      const opponentElo = p.won ? losersAvg : winnersAvg;
      const { data: deltaRows } = await admin.rpc("calculate_dynamic_elo_delta", {
        _player_elo: baseElo,
        _opponent_elo: opponentElo,
        _won: p.won,
        _k: kFactor,
      });
      let delta = typeof deltaRows === "number"
        ? deltaRows
        : Math.max(-kFactor * 2, Math.min(kFactor * 2,
            Math.round(kFactor * ((p.won ? 1 : 0) - 1 / (1 + Math.pow(10, (opponentElo - baseElo) / 400))))
          ));
      // Fast Track: 1.8x ELO gain on wins until reaching Gold (1400)
      if (fastTrack.get(p.userId) && p.won && baseElo < 1400) {
        delta = Math.round(delta * 1.8);
      }
      const newElo = Math.max(0, baseElo + delta);
      const newWins = baseWins + (p.won ? 1 : 0);
      const newLosses = baseLosses + (p.won ? 0 : 1);
      const newStreak = p.won ? baseStreak + 1 : 0;
      const newBest = Math.max(baseBest, newStreak);

      if (existing?.id) {
        const { error } = await admin
          .from("player_stats")
          .update({
            elo: newElo,
            wins: newWins,
            losses: newLosses,
            matches_played: baseMatches + 1,
            win_streak: newStreak,
            best_win_streak: newBest,
          })
          .eq("id", existing.id);
        if (error) return json({ error: error.message }, 500);
      } else {
        const { error } = await admin.from("player_stats").insert({
          user_id: p.userId,
          game,
          elo: newElo,
          wins: newWins,
          losses: newLosses,
          matches_played: 1,
          win_streak: newStreak,
          best_win_streak: newBest,
        });
        if (error) return json({ error: error.message }, 500);
      }

      // Log the ELO change for transparency
      await admin.from("elo_history").insert({
        user_id: p.userId,
        game,
        match_id: match.id,
        elo_before: baseElo,
        elo_after: newElo,
        delta: newElo - baseElo,
        reason: p.won ? "match_win" : "match_loss",
        source_type: isQueueMatch ? match.kind : "match",
      });

      updated.push({ user_id: p.userId, won: p.won, elo: newElo });
    }

    // Recalculate smurf risk for all participants (best-effort, non-blocking)
    for (const p of participants) {
      try { await admin.rpc("recalculate_smurf_risk", { _user_id: p.userId }); } catch { /* ignore */ }
    }

    // elo_processed_at already set by claim_match_for_elo
    return json({ ok: true, game, updated });
  } catch (err) {
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}