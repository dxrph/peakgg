import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { containsProfanity } from "@/lib/profanity";

export type ChannelKind = "global" | "team";

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  flagged: boolean;
  flag_reason: string | null;
  report_count: number;
  team_id?: string | null;
  profile?: { username: string; avatar_url: string | null };
  elo?: number;
  role?: "admin" | "moderator" | null;
}

export interface MuteInfo {
  expires_at: string | null;
  reason: string | null;
}

const PAGE_SIZE = 50;
const COOLDOWN_MS = 5000;

export function useChat(kind: ChannelKind, teamId?: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [mute, setMute] = useState<MuteInfo | null>(null);
  const [activeView, setActiveView] = useState(false);
  const lastSentAt = useRef(0);
  const channelRef = useRef<any>(null);
  const activeViewRef = useRef(false);
  activeViewRef.current = activeView;

  const enabled = kind === "global" ? !!user : !!user && !!teamId;
  const tableName = kind === "global" ? "global_messages" : "team_messages";

  // Hydrate profiles + roles for a list of user IDs
  const hydrate = useCallback(async (rows: any[]): Promise<ChatMessage[]> => {
    if (rows.length === 0) return [];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const [{ data: profiles }, { data: stats }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, username, avatar_url").in("id", ids),
      supabase.from("player_stats").select("user_id, elo").in("user_id", ids),
      supabase.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);
    const pMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const eMap = new Map<string, number>();
    (stats || []).forEach((s: any) => {
      eMap.set(s.user_id, Math.max(eMap.get(s.user_id) ?? 0, s.elo ?? 0));
    });
    const rMap = new Map<string, "admin" | "moderator" | null>();
    (roles || []).forEach((r: any) => {
      const cur = rMap.get(r.user_id);
      if (r.role === "admin" || (r.role === "moderator" && cur !== "admin")) rMap.set(r.user_id, r.role);
    });
    return rows.map((m) => ({
      ...m,
      profile: pMap.get(m.user_id),
      elo: eMap.get(m.user_id) ?? 0,
      role: rMap.get(m.user_id) ?? null,
    }));
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!enabled) {
      setMessages([]);
      return;
    }
    setLoading(true);
    (async () => {
      let q = supabase
        .from(tableName as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (kind === "team" && teamId) q = q.eq("team_id", teamId);
      const { data } = await q;
      const rows = ((data as any[]) || []).reverse();
      const hydrated = await hydrate(rows);
      setMessages(hydrated);
      setLoading(false);
    })();
  }, [enabled, tableName, teamId, kind, hydrate]);

  // Mute info
  useEffect(() => {
    if (!user) { setMute(null); return; }
    (async () => {
      const { data } = await supabase
        .from("chat_mutes")
        .select("expires_at, reason, scope, team_id")
        .eq("user_id", user.id);
      const active = (data || []).find((m: any) => {
        if (m.expires_at && new Date(m.expires_at) <= new Date()) return false;
        if (m.scope === "all") return true;
        if (kind === "global" && m.scope === "global") return true;
        if (kind === "team" && m.scope === "team" && (!m.team_id || m.team_id === teamId)) return true;
        return false;
      });
      setMute(active ? { expires_at: active.expires_at, reason: active.reason } : null);
    })();
  }, [user, kind, teamId]);

  // Realtime
  useEffect(() => {
    if (!enabled) return;
    const filter = kind === "team" && teamId ? `team_id=eq.${teamId}` : undefined;
    const ch = supabase
      .channel(`chat-${kind}-${teamId ?? "global"}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: tableName, ...(filter ? { filter } : {}) },
        async (payload) => {
          const row = payload.new as any;
          const [hydrated] = await hydrate([row]);
          setMessages((prev) => prev.some((m) => m.id === row.id) ? prev : [...prev, hydrated]);
          if (!activeViewRef.current && row.user_id !== user?.id) {
            setUnread((u) => u + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: tableName, ...(filter ? { filter } : {}) },
        (payload) => {
          const old = payload.old as any;
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: tableName, ...(filter ? { filter } : {}) },
        (payload) => {
          const row = payload.new as any;
          setMessages((prev) => prev.map((m) => m.id === row.id ? { ...m, ...row } : m));
        }
      )
      .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [enabled, kind, teamId, tableName, hydrate, user?.id]);

  const markRead = useCallback(() => {
    setUnread(0);
    setActiveView(true);
  }, []);
  const markInactive = useCallback(() => setActiveView(false), []);

  const sendMessage = useCallback(
    async (raw: string): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: "Not signed in" };
      if (mute) {
        const until = mute.expires_at ? new Date(mute.expires_at).toLocaleString() : "permanent";
        return { ok: false, error: `You are muted until ${until}. ${mute.reason ?? ""}`.trim() };
      }
      const trimmed = raw.trim().slice(0, 200);
      if (!trimmed) return { ok: false };
      const now = Date.now();
      if (now - lastSentAt.current < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - (now - lastSentAt.current)) / 1000);
        return { ok: false, error: `Wait ${wait}s before sending another message.` };
      }
      const profane = containsProfanity(trimmed);
      const payload: any = {
        user_id: user.id,
        content: profane ? "⚠️ Message removed" : trimmed,
        flagged: profane,
        flag_reason: profane ? "profanity" : null,
      };
      if (kind === "team") payload.team_id = teamId;

      const { error } = await supabase.from(tableName as any).insert(payload);
      if (error) return { ok: false, error: error.message };
      lastSentAt.current = now;

      // Async server-side recheck (Lovable AI) for nuanced content
      if (!profane) {
        supabase.functions.invoke("moderate-chat", {
          body: { table: tableName, text: trimmed, content_lookup: trimmed, user_id: user.id },
        }).catch(() => {});
      }
      if (profane) {
        return { ok: false, error: "Your message was blocked by the auto-moderator." };
      }
      return { ok: true };
    },
    [user, mute, tableName, kind, teamId]
  );

  const deleteMessage = useCallback(async (id: string) => {
    await supabase.from(tableName as any).delete().eq("id", id);
  }, [tableName]);

  const reportMessage = useCallback(async (id: string) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    const next = (msg.report_count || 0) + 1;
    const updates: any = { report_count: next };
    if (next >= 3) { updates.flagged = true; updates.flag_reason = "community_reports"; }
    await supabase.from(tableName as any).update(updates).eq("id", id);
  }, [messages, tableName]);

  return {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    reportMessage,
    unread,
    markRead,
    markInactive,
    mute,
    enabled,
  };
}
