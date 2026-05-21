import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PeakBotModule =
  | "assistant"
  | "announcements"
  | "followups"
  | "profile_optimizer"
  | "team_finder"
  | "match_summary"
  | "content_studio"
  | "safety_monitor"
  | "onboarding"
  | "chat_moderation";

export type PeakBotTone =
  | "default"
  | "hype"
  | "meme"
  | "professional"
  | "short"
  | "toxic_fun";

export interface PeakBotResponse {
  success: boolean;
  module: PeakBotModule;
  title?: string;
  message: string;
  short_message?: string;
  cta_label?: string;
  cta_url?: string;
  suggestions?: string[];
  risk_level?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface CallBotOptions {
  tone?: PeakBotTone;
  language?: "en" | "it" | "fr";
}

interface CallArgs {
  module: PeakBotModule;
  message: string;
  context?: Record<string, unknown>;
  options?: CallBotOptions;
}

export function usePeakAIBot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PeakBotResponse | null>(null);
  const last = useRef<CallArgs | null>(null);

  const callBot = useCallback(
    async (
      module: PeakBotModule,
      message: string,
      context: Record<string, unknown> = {},
      options: CallBotOptions = {},
    ): Promise<PeakBotResponse | null> => {
      const payload = {
        module,
        message,
        context,
        tone: options.tone ?? "default",
        language: options.language ?? "en",
      };
      last.current = { module, message, context, options };
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke("peak-ai-bot", {
          body: payload,
        });
        if (error) {
          const msg =
            (error as any)?.context?.error ??
            error.message ??
            "PeakBot is offline. Try again.";
          setError(msg);
          setResponse(null);
          return null;
        }
        const res = data as PeakBotResponse;
        if (!res?.success) {
          const friendly =
            res?.error === "rate_limited"
              ? "Too many requests. Slow down before PeakBot rate-limits you harder than your duo."
              : res?.error === "payment_required"
              ? "PeakBot is out of credits. Ping an admin."
              : res?.error === "module_coming_soon"
              ? res.message
              : res?.message || res?.error || "PeakBot couldn't answer that one.";
          setError(friendly);
          setResponse(res ?? null);
          return res ?? null;
        }
        setResponse(res);
        return res;
      } catch (e: any) {
        setError(e?.message ?? "Network error");
        setResponse(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const regenerate = useCallback(async () => {
    if (!last.current) return null;
    const { module, message, context, options } = last.current;
    return callBot(module, message, context, options);
  }, [callBot]);

  const copyResponse = useCallback(async () => {
    if (!response?.message) return false;
    try {
      await navigator.clipboard.writeText(response.message);
      return true;
    } catch {
      return false;
    }
  }, [response]);

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    last.current = null;
  }, []);

  return { loading, error, response, callBot, regenerate, copyResponse, reset };
}
