import { supabase } from "@/integrations/supabase/client";

export type AdminAction =
  | "warn_player"
  | "ban_player"
  | "unban_player"
  | "elo_adjust"
  | "ticket_resolve"
  | "ticket_reject"
  | "ticket_review"
  | "tournament_create"
  | "tournament_update"
  | "tournament_close"
  | "tournament_export_csv"
  | "tournament_replace_team"
  | "announcement_create"
  | "announcement_toggle"
  | "private_message_send"
  | "role_grant"
  | "role_revoke"
  | "screenshot_view_consumed";

export async function logAdminAction(params: {
  action: AdminAction;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const adminId = auth.user?.id;
  if (!adminId) return;
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action: params.action,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    details: (params.details ?? null) as never,
  });
}

/**
 * Apply a ban to a profile. If warn_count reaches the auto-ban threshold,
 * caller is responsible for handling escalation.
 */
export async function banProfile(opts: {
  userId: string;
  reason: string;
  durationDays: number | null; // null = permanent
}) {
  const expires = opts.durationDays === null
    ? null
    : new Date(Date.now() + opts.durationDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: true,
      ban_reason: opts.reason,
      ban_expires_at: expires,
    })
    .eq("id", opts.userId);
  return { error };
}

export async function unbanProfile(userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: false,
      ban_reason: null,
      ban_expires_at: null,
    })
    .eq("id", userId);
  return { error };
}

/**
 * Increments warn_count and triggers an automatic 7-day ban on the 3rd warn.
 * Returns whether the auto-ban was triggered.
 */
export async function warnProfile(opts: {
  userId: string;
  reason: string;
}): Promise<{ autoBanned: boolean; newWarnCount: number; error?: string }> {
  const { data: profile, error: e1 } = await supabase
    .from("profiles")
    .select("warn_count")
    .eq("id", opts.userId)
    .maybeSingle();
  if (e1 || !profile) return { autoBanned: false, newWarnCount: 0, error: e1?.message ?? "Profile not found" };

  const next = (profile.warn_count ?? 0) + 1;
  const { error: e2 } = await supabase
    .from("profiles")
    .update({ warn_count: next })
    .eq("id", opts.userId);
  if (e2) return { autoBanned: false, newWarnCount: next, error: e2.message };

  // notify the player
  await supabase.from("notifications").insert({
    user_id: opts.userId,
    title: "Hai ricevuto un richiamo",
    message: opts.reason,
  });

  if (next >= 3) {
    const { error: bErr } = await banProfile({
      userId: opts.userId,
      reason: `Auto-ban: 3 richiami raggiunti. Ultimo: ${opts.reason}`,
      durationDays: 7,
    });
    if (!bErr) {
      await supabase.from("notifications").insert({
        user_id: opts.userId,
        title: "Account sospeso 7 giorni",
        message: "Hai raggiunto 3 richiami. Sospensione automatica di 7 giorni.",
      });
      return { autoBanned: true, newWarnCount: next };
    }
  }
  return { autoBanned: false, newWarnCount: next };
}

/** Adjust a player's ELO for one game and write an elo_history entry. */
export async function adjustElo(opts: {
  userId: string;
  game: string;
  delta: number;
  reason: string;
}) {
  const { data: stats, error: e1 } = await supabase
    .from("player_stats")
    .select("elo")
    .eq("user_id", opts.userId)
    .eq("game", opts.game)
    .maybeSingle();
  if (e1 || !stats) return { error: e1?.message ?? "Stats not found" };

  const eloBefore = stats.elo ?? 1000;
  const eloAfter = Math.max(0, eloBefore + opts.delta);

  const { error: e2 } = await supabase
    .from("player_stats")
    .update({ elo: eloAfter })
    .eq("user_id", opts.userId)
    .eq("game", opts.game);
  if (e2) return { error: e2.message };

  await supabase.from("elo_history").insert({
    user_id: opts.userId,
    game: opts.game,
    delta: opts.delta,
    elo_before: eloBefore,
    elo_after: eloAfter,
    reason: opts.reason,
  });

  return { error: null, eloBefore, eloAfter };
}

/** Convert array of objects to a CSV string. */
export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce<Set<string>>((acc, r) => {
      Object.keys(r).forEach((k) => acc.add(k));
      return acc;
    }, new Set())
  );
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => escape((r as Record<string, unknown>)[h])).join(","));
  }
  return lines.join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s fa`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h fa`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}g fa`;
  return new Date(iso).toLocaleDateString();
}
