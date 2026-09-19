import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Allow": "POST, OPTIONS", "Content-Type": "application/json" } });
  }
  // Internal cron endpoint: a normal user or the public anon key must not
  // trigger privileged notification writes.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey || req.headers.get("Authorization") !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Window: tournaments starting in 24h ± 15min (matches cron cadence)
    const now = new Date();
    const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 15 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 1000);

    const { data: tournaments, error: tErr } = await supabase
      .from("tournaments")
      .select("id, name, start_date")
      .gte("start_date", windowStart.toISOString())
      .lte("start_date", windowEnd.toISOString())
      .eq("status", "upcoming");

    if (tErr) throw tErr;

    let notified = 0;
    const tournamentsProcessed: string[] = [];

    for (const t of tournaments ?? []) {
      // All teams registered to this tournament
      const { data: regs } = await supabase
        .from("tournament_registrations")
        .select("team_id")
        .eq("tournament_id", t.id);

      const teamIds = (regs ?? []).map((r) => r.team_id).filter(Boolean);
      if (teamIds.length === 0) continue;

      // Members of those teams
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .in("team_id", teamIds);

      const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id)));
      if (userIds.length === 0) continue;

      // Avoid duplicates: skip users who already received a 24h reminder for this tournament
      const reminderTitle = "Torneo in arrivo";
      const reminderTag = `[reminder24h:${t.id}]`;
      const reminderMessage = `${reminderTag} ${t.name} inizia tra 24 ore. Preparati!`;

      const { data: existing } = await supabase
        .from("notifications")
        .select("user_id")
        .in("user_id", userIds)
        .eq("title", reminderTitle)
        .like("message", `${reminderTag}%`);

      const alreadyNotified = new Set((existing ?? []).map((e) => e.user_id));
      const toNotify = userIds.filter((uid) => !alreadyNotified.has(uid));
      if (toNotify.length === 0) continue;

      const rows = toNotify.map((uid) => ({
        user_id: uid,
        title: reminderTitle,
        message: reminderMessage,
      }));

      const { error: insErr } = await supabase.from("notifications").insert(rows);
      if (!insErr) {
        notified += rows.length;
        tournamentsProcessed.push(t.id);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        tournaments_in_window: tournaments?.length ?? 0,
        tournaments_processed: tournamentsProcessed.length,
        notifications_sent: notified,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("tournament-reminder-24h error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});