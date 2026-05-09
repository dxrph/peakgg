import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface Msg {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { username: string; avatar_url: string | null } | null;
}

export default function MatchChat({ matchId }: { matchId: string }) {
  const { user } = useAuth();
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
        .from("match_chat_messages")
        .select("id, user_id, content, created_at")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      setMsgs(await hydrate((data as any[]) ?? []));
    })();
    const ch = supabase
      .channel(`match-chat-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_chat_messages", filter: `match_id=eq.${matchId}` },
        async (payload) => {
          const row = payload.new as any;
          const [hyd] = await hydrate([row]);
          setMsgs((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, hyd]));
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [matchId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length]);

  const send = async () => {
    if (!user || !text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("match_chat_messages").insert({
      match_id: matchId,
      user_id: user.id,
      content: text.trim().slice(0, 500),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setText("");
  };

  return (
    <Card className="p-0 overflow-hidden flex flex-col h-[400px]">
      <div className="px-4 py-2 border-b border-border bg-card/60">
        <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground">Match Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {msgs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No messages yet — say hi to your opponents.</p>
        ) : (
          msgs.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-sm">
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
                </div>
                <p className="break-words">{m.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      {user && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-border p-2 flex gap-2"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            maxLength={500}
            disabled={busy}
          />
          <Button type="submit" size="sm" disabled={busy || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </Card>
  );
}