// PeakGG AI Bot — modular backend for the platform assistant.
// Phase 1 focus: assistant module (PeakBot chat). Other modules return a
// structured "coming soon" response so the frontend can light up safely.
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Module =
  | "assistant"
  | "announcements"
  | "followups"
  | "profile_optimizer"
  | "team_finder"
  | "match_summary"
  | "content_studio"
  | "safety_monitor"
  | "onboarding"
  | "chat_moderation"
  | "tournament_brief";

const MODULES: Module[] = [
  "assistant",
  "announcements",
  "followups",
  "profile_optimizer",
  "team_finder",
  "match_summary",
  "content_studio",
  "safety_monitor",
  "onboarding",
  "chat_moderation",
  "tournament_brief",
];

const ADMIN_ONLY: Module[] = [
  "announcements",
  "followups",
  "safety_monitor",
  "tournament_brief",
];

const TONES = ["default", "hype", "meme", "professional", "short", "toxic_fun"] as const;
const LANGS = ["en", "it", "fr"] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return json({ success: false, error: message, ...extra }, status);
}

// Naive per-user in-memory rate limiter (per cold start). Best-effort only.
const RATE: Map<string, number[]> = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
function rateLimited(key: string) {
  const now = Date.now();
  const arr = (RATE.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  RATE.set(key, arr);
  return arr.length > RATE_MAX;
}

function basePersona(tone: string, language: string) {
  const langName =
    language === "it" ? "Italian" : language === "fr" ? "French" : "English";
  const toneLine: Record<string, string> = {
    default:
      "Direct, confident, esports-native. Short and useful. Light toxic-fun is fine.",
    hype: "Hype esports caster energy. Short bursts. Caps sparingly.",
    meme: "Meme-aware, ranked-pain humor, but never abusive.",
    professional: "Professional esports tone. No memes. Clear and concise.",
    short: "Maximum 2 short sentences. No fluff.",
    toxic_fun:
      "Toxic-fun banter about gameplay only: skill issue, instalocks, whiffs, tilt, no comms, team diff. Never about people, identity, or protected attributes.",
  };

  return `You are PeakBot, the official AI assistant of PeakGG — a competitive esports platform for Valorant, CS2 and Rainbow Six Siege in Europe.

TONE: ${toneLine[tone] ?? toneLine.default}
LANGUAGE: Always reply in ${langName}.

HARD RULES:
- Keep replies short and useful (usually under 80 words).
- Never insult users, never target identity, religion, gender, race, nationality or any protected attribute.
- Jokes are only about gameplay culture (ranked pain, instalocks, whiffs, tilt, no comms, team diff, roster chaos).
- Never reveal private data of other users.
- Never invent match stats, ELO numbers, results or schedules. If a fact isn't in the provided context, say you don't have that data.
- Never claim to perform actions. Suggest what the user should click instead.
- Prefer one concrete next step with a CTA when possible.
- Use PeakGG vocabulary: Peak League, Open Cup, Challenger Series, Peak Championship, Free Agents, ELO, Rookie/Contender/Rival/Expert/Elite/Master/Apex.
- If asked something outside esports / PeakGG, briefly redirect back to what PeakBot can help with.`;
}

const CTA_MAP: { match: RegExp; label: string; url: string }[] = [
  { match: /peak\s*league|apply.*league|join.*league/i, label: "Apply With Team", url: "/leagues" },
  { match: /free\s*agent|lft|looking for team/i, label: "Complete Free Agent Profile", url: "/free-agents/complete-profile" },
  { match: /find.*team|join.*team|team finder/i, label: "Browse Teams", url: "/teams" },
  { match: /profile/i, label: "Edit Profile", url: "/profile" },
  { match: /tournament|cup|championship/i, label: "Browse Tournaments", url: "/tournaments" },
  { match: /scrim|warm[- ]?up|practice/i, label: "Find Scrims", url: "/scrims" },
  { match: /match|result|dispute/i, label: "Open Match", url: "/dashboard" },
  { match: /rank|elo/i, label: "How ELO Works", url: "/elo-explained" },
];

function pickCta(text: string): { label?: string; url?: string } {
  for (const c of CTA_MAP) if (c.match.test(text)) return { label: c.label, url: c.url };
  return {};
}

async function callLovableAI(messages: any[], opts: { temperature?: number } = {}) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      temperature: opts.temperature ?? 0.7,
    }),
  });
  if (res.status === 429) {
    const e: any = new Error("rate_limited");
    e.status = 429;
    throw e;
  }
  if (res.status === 402) {
    const e: any = new Error("payment_required");
    e.status = 402;
    throw e;
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? "").toString().trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return err("method_not_allowed", 405);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return err("invalid_body");

    const module = String(body.module ?? "").trim() as Module;
    const message = String(body.message ?? "").trim();
    const tone = String(body.tone ?? "default");
    const language = String(body.language ?? "en");
    const context = (body.context && typeof body.context === "object") ? body.context : {};

    if (!MODULES.includes(module)) return err("invalid_module");
    if (!TONES.includes(tone as any)) return err("invalid_tone");
    if (!LANGS.includes(language as any)) return err("invalid_language");
    if (message.length > 2000) return err("message_too_long");

    // Auth — required for personal modules and admin modules
    const authHeader = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    let isAdmin = false;
    if (authHeader.startsWith("Bearer ")) {
      const authed = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claims } = await authed.auth.getClaims(token);
      userId = (claims?.claims?.sub as string) ?? null;
      if (userId) {
        const admin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        const { data: roles } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
      }
    }

    if (ADMIN_ONLY.includes(module) && !isAdmin) {
      return err("admin_required", 403);
    }

    const rateKey = userId ?? req.headers.get("x-forwarded-for") ?? "anon";
    if (rateLimited(rateKey)) {
      return err("rate_limited", 429);
    }

    // Modules ------------------------------------------------------
    if (module === "assistant") {
      if (!message) return err("empty_message");

      const sys = basePersona(tone, language);
      const ctxLine = Object.keys(context).length
        ? `\nUSER CONTEXT (only what's safe to use):\n${JSON.stringify(context).slice(0, 800)}`
        : "";

      let content = "";
      try {
        content = await callLovableAI([
          { role: "system", content: sys + ctxLine },
          { role: "user", content: message },
        ]);
      } catch (e: any) {
        if (e?.status === 429) return err("rate_limited", 429);
        if (e?.status === 402) return err("payment_required", 402);
        throw e;
      }

      if (!content) content = "PeakBot is offline for a sec. Try again.";
      const cta = pickCta(message + " " + content);
      return json({
        success: true,
        module,
        message: content,
        cta_label: cta.label,
        cta_url: cta.url,
      });
    }

    if (module === "announcements") {
      // Admin-only (already gated above). Generates drafts, NEVER publishes.
      if (!message) return err("empty_message");

      const ctxBlock = Object.keys(context).length
        ? `\nADMIN CONTEXT (use only if relevant):\n${JSON.stringify(context).slice(0, 800)}`
        : "";

      const langName =
        language === "it" ? "Italian" : language === "fr" ? "French" : "English";

      const toneLine: Record<string, string> = {
        default: "Direct, confident, esports-native. Hype but credible.",
        hype: "Hype esports caster energy. Punchy. Caps sparingly.",
        meme: "Meme-aware, ranked-pain humor — never abusive.",
        professional: "Professional esports tone. No memes. Clear and concise.",
        short: "Maximum 2 short sentences in the body.",
        toxic_fun: "Toxic-fun banter about gameplay only (instalocks, whiffs, tilt). Never about people or identity.",
      };

      const sys = `You are PeakBot, drafting an OFFICIAL PeakGG announcement for the admin team to review.

LANGUAGE: ${langName}.
TONE: ${toneLine[tone] ?? toneLine.default}

HARD RULES:
- This is a DRAFT. You never publish. The admin will edit and approve.
- Output STRICT JSON only, no markdown, no prose outside JSON.
- Title: max 90 chars, no trailing period, no emoji spam (max 1 emoji).
- Body: max 600 chars, plain text, no markdown headings, line breaks allowed.
- Never invent dates, ELO values, prize money, sponsor names, or match results not present in the admin context.
- If context is missing, keep claims generic and let the admin fill specifics.
- Use PeakGG vocabulary: Peak League, Open Cup, Challenger Series, Peak Championship, Free Agents, ELO, Rookie/Contender/Rival/Expert/Elite/Master/Apex.
- Never insult users or target identity.

JSON SHAPE:
{
  "title": "string",
  "body": "string",
  "urgent_suggested": false,
  "variants": [
    { "label": "Short",    "title": "string", "body": "string" },
    { "label": "Hype",     "title": "string", "body": "string" },
    { "label": "Pro",      "title": "string", "body": "string" }
  ]
}`;

      let raw = "";
      try {
        raw = await callLovableAI(
          [
            { role: "system", content: sys + ctxBlock },
            {
              role: "user",
              content: `Draft an announcement about: ${message}\nReturn ONLY the JSON object.`,
            },
          ],
          { temperature: 0.8 },
        );
      } catch (e: any) {
        if (e?.status === 429) return err("rate_limited", 429);
        if (e?.status === 402) return err("payment_required", 402);
        throw e;
      }

      // Tolerate fenced code blocks
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let parsed: any = null;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Try to extract the first {...} block
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            parsed = JSON.parse(m[0]);
          } catch {
            // ignore
          }
        }
      }

      if (!parsed || typeof parsed.title !== "string" || typeof parsed.body !== "string") {
        return json({
          success: false,
          module,
          error: "bad_ai_output",
          message:
            "PeakBot returned an unreadable draft. Try again or simplify the topic.",
        });
      }

      const clip = (s: unknown, n: number) =>
        String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

      const draft = {
        title: clip(parsed.title, 120),
        body: clip(parsed.body, 4000),
        urgent_suggested: Boolean(parsed.urgent_suggested),
        variants: Array.isArray(parsed.variants)
          ? parsed.variants
              .slice(0, 4)
              .map((v: any) => ({
                label: clip(v?.label, 24) || "Variant",
                title: clip(v?.title, 120),
                body: clip(v?.body, 4000),
              }))
              .filter((v: any) => v.title && v.body)
          : [],
      };

      return json({
        success: true,
        module,
        title: draft.title,
        message: draft.body,
        metadata: {
          urgent_suggested: draft.urgent_suggested,
          variants: draft.variants,
        },
      });
    }

    // All other modules — Phase 2+. Acknowledge cleanly so the UI is honest.
    return json({
      success: false,
      module,
      error: "module_coming_soon",
      message: "This PeakBot module is being built. Available now: PeakBot chat (assistant).",
    });
  } catch (e: any) {
    console.error("peak-ai-bot error:", e);
    return err(e?.message ?? "internal_error", 500);
  }
});
