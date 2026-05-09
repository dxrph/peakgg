import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Channel = "general" | "match_prep" | "announcements";

interface Msg {
  id: string;
  user_id: string;
  content: string;
  pinned: boolean;
  channel: string;
  created_at: string;
  profile?: { username: string; avatar_url: string | null } | null;
}

export default function TeamChatPanel({ teamId, isCaptain }: { teamId: string; isCaptain: boolean }) {
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel>("general");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const hydrate = async (rows: any[]): Promise<Msg[]> => {
    if (!rows.length) return [];
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url").in("id", ids);
    const m = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return rows.map((r) => ({ ...r, profile: m.get(r.user_id) ?? null }));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("team_chat_messages")
        .select("id, user_id, content, pinned, channel, created_at")
        .eq("team_id", teamId)
        .eq("channel", channel)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      setMsgs(await hydrate((data as any[]) ?? []));
    })();
    const ch = supabase
      .channel(`team-chat-${teamId}-${channel}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_chat_messages", filter: `team_id=eq.${teamId}` },
        async (payload) => {
          const row = payload.new as any;
          if (row.channel !== channel) return;
          const [hyd] = await hydrate([row]);
          setMsgs((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, hyd]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "team_chat_messages", filter: `team_id=eq.${teamId}` },
        (payload) => {
          const row = payload.new as any;
          setMsgs((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "team_chat_messages", filter: `team_id=eq.${teamId}` },
        (payload) => {
          const row = payload.old as any;
          setMsgs((prev) => prev.filter((m) => m.id !== row.id));
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [teamId, channel]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length]);

  const send = async () => {
    if (!user || !text.trim()) return;
    if (channel === "announcements" && !isCaptain) {
      return toast.error("Only the captain can post announcements");
    }
    setBusy(true);
    const { error } = await supabase.from("team_chat_messages").insert({
      team_id: teamId,
      user_id: user.id,
      channel,
      content: text.trim().slice(0, 500),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setText("");
  };

  const togglePin = async (m: Msg) => {
    const { error } = await supabase.from("team_chat_messages").update({ pinned: !m.pinned }).eq("id", m.id);
    if (error) toast.error(error.message);
  };
  const remove = async (m: Msg) => {
    const { error } = await supabase.from("team_chat_messages").delete().eq("id", m.id);
    if (error) toast.error(error.message);
  };

  const pinned = msgs.filter((m) => m.pinned);

  return (
    <Card className="p-0 overflow-hidden flex flex-col h-[500px]">
      <div className="px-3 py-2 border-b border-border bg-card/60">
        <Tabs value={channel} onValueChange={(v) => setChannel(v as Channel)}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="match_prep">Match Prep</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {pinned.length > 0 && (
        <div className="border-b border-border bg-primary/5 px-3 py-2 space-y-1 max-h-32 overflow-y-auto">
          {pinned.map((m) => (
            <div key={`pin-${m.id}`} className="text-xs flex items-start gap-2">
              <Pin className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <span className="text-primary font-display uppercase">{m.profile?.username}:</span>
              <span className="break-words">{m.content}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {msgs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No messages yet.</p>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-sm group">
              {m.profile?.avatar_url ? (
                <img src={m.profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover mt-0.5" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-display uppercase text-xs text-primary">{m.profile?.username ?? "Player"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {m.pinned && <Pin className="h-3 w-3 text-primary" />}
                </div>
                <p className="break-words">{m.content}</p>
              </div>
              {(isCaptain || m.user_id === user?.id) && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {isCaptain && (
                    <button onClick={() => togglePin(m)} className="text-muted-foreground hover:text-primary p-1">
                      {m.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </button>
                  )}
                  <button onClick={() => remove(m)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      {user && (channel !== "announcements" || isCaptain) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-border p-2 flex gap-2"
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message your team…" maxLength={500} disabled={busy} />
          <Button type="submit" size="sm" disabled={busy || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
      {channel === "announcements" && !isCaptain && (
        <div className="border-t border-border p-2 text-xs text-muted-foreground text-center">Only the captain can post in Announcements.</div>
      )}
    </Card>
  );
}