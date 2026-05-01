// Async chat moderation backup. Uses Lovable AI (Gemini Flash Lite) to flag
// nuanced offensive content the client filter may have missed. Updates the
// row in-place by exact content match for the user.
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { table, text, user_id } = await req.json();
    if (!table || !text || !user_id) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (table !== "global_messages" && table !== "team_messages") {
      return new Response(JSON.stringify({ error: "bad table" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const trimmed = String(text).slice(0, 200);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a strict chat moderator for a competitive gaming platform. Reply with a single JSON object: {\"flag\": boolean, \"reason\": string}. Flag insults, slurs, hate speech, threats, harassment, or sexual content directed at people. Do NOT flag normal trash-talk, game terms, or mild frustration. Languages: EN, IT, FR." },
          { role: "user", content: `Message: """${trimmed}"""` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      return new Response(JSON.stringify({ error: "ai failed", status: aiRes.status }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { flag?: boolean; reason?: string } = {};
    try { parsed = JSON.parse(raw); } catch { /* ignore */ }

    if (parsed.flag) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      // Flag the most recent matching message from this user
      const { data: rows } = await supabase
        .from(table)
        .select("id")
        .eq("user_id", user_id)
        .eq("content", trimmed)
        .order("created_at", { ascending: false })
        .limit(1);
      if (rows && rows.length > 0) {
        await supabase
          .from(table)
          .update({ flagged: true, flag_reason: parsed.reason || "ai_moderation", content: "⚠️ Message removed" })
          .eq("id", rows[0].id);
      }
    }

    return new Response(JSON.stringify({ flagged: !!parsed.flag }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
