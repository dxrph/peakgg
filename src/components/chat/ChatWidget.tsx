import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Globe2, Users, Send, Flag, Trash2, Crown, Shield, BadgeCheck, Pin, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChat, type ChatMessage } from "@/hooks/useChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/RankBadge";
import { getRankByElo } from "@/lib/ranks";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Tab = "global" | "team";

function MessageRow({
  msg,
  isOwn,
  onDelete,
  onReport,
  canModerate,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  canModerate: boolean;
}) {
  const time = new Date(msg.created_at);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fullStr = time.toLocaleString();
  const rank = getRankByElo(msg.elo ?? 0);

  if (msg.flagged) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 text-xs italic text-muted-foreground">
        <span>⚠️ Message removed</span>
        <span className="text-[10px] opacity-60">· {timeStr}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "group flex gap-2 px-2 py-1.5 rounded-md",
        isOwn ? "bg-primary/[0.06]" : "hover:bg-secondary/40"
      )}
    >
      <Avatar className="h-7 w-7 shrink-0 mt-0.5 border border-border/50">
        <AvatarImage src={msg.profile?.avatar_url ?? undefined} alt={msg.profile?.username ?? "user"} />
        <AvatarFallback className="text-[10px]">
          {(msg.profile?.username ?? "U").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "text-xs font-display font-semibold truncate",
              isOwn ? "text-primary" : "text-foreground"
            )}
          >
            {msg.profile?.username ?? "Player"}
          </span>
          {msg.role === "admin" && (
            <Badge className="h-4 px-1 text-[9px] gap-0.5 bg-primary/20 text-primary border border-primary/40">
              <Crown className="h-2.5 w-2.5" /> ADMIN
            </Badge>
          )}
          {msg.role === "moderator" && (
            <Badge className="h-4 px-1 text-[9px] gap-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/40">
              <Shield className="h-2.5 w-2.5" /> MOD
            </Badge>
          )}
          <BadgeCheck className="h-3 w-3 text-blue-400/80" />
          <RankBadge rank={rank.name} size="sm" />
          <span
            className="text-[10px] text-muted-foreground ml-auto cursor-default"
            title={fullStr}
          >
            {timeStr}
          </span>
        </div>
        <p className="text-[13px] text-foreground/90 leading-snug break-words mt-0.5">
          {msg.content}
        </p>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1 pt-1">
        <button
          onClick={() => onReport(msg.id)}
          title="Report"
          className="text-muted-foreground hover:text-destructive p-0.5"
        >
          <Flag className="h-3 w-3" />
        </button>
        {(isOwn || canModerate) && (
          <button
            onClick={() => onDelete(msg.id)}
            title="Delete"
            className="text-muted-foreground hover:text-destructive p-0.5"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ChannelView({ kind, teamId, teamName }: { kind: Tab; teamId: string | null; teamName: string | null }) {
  const { user } = useAuth();
  const chat = useChat(kind, teamId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [canModerate, setCanModerate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chat.markRead();
    return () => chat.markInactive();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).then(({ data }) => {
      const roles = (data || []).map((r: any) => r.role);
      setCanModerate(roles.includes("admin") || roles.includes("moderator"));
    });
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const res = await chat.sendMessage(input);
    setSending(false);
    if (res.ok) {
      setInput("");
    } else if (res.error) {
      toast({ title: "Cannot send", description: res.error, variant: "destructive" });
      if (res.error.startsWith("Your message was blocked")) setInput("");
    }
  };

  if (kind === "team" && !teamId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
        <Users className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-display uppercase tracking-wider">Team Chat locked</p>
        <p className="text-xs text-muted-foreground -mt-2">Join or create a team to unlock Team Chat.</p>
        <div className="flex gap-2">
          <Link to="/teams"><Button size="sm" variant="neon"><Plus className="h-3.5 w-3.5 mr-1" />Create Team</Button></Link>
          <Link to="/teams"><Button size="sm" variant="outline">Find Teams</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {kind === "team" && teamName && (
        <div className="px-3 py-2 border-b border-border/60 text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground bg-[#0a0a0a] flex items-center gap-1.5">
          <Users className="h-3 w-3" /> {teamName} · Private
        </div>
      )}
      {kind === "global" && (
        <div className="px-3 py-2 border-b border-border/60 bg-primary/5 flex items-start gap-2">
          <Pin className="h-3 w-3 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-snug">
            Welcome to <span className="text-primary font-semibold">PeakGG Season 0 Beta</span>. Find teams, ask questions and join the Discord.
          </p>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1.5 py-2 space-y-0.5">
        {chat.loading ? (
          <p className="text-xs text-muted-foreground text-center py-8">Loading…</p>
        ) : chat.messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Start the conversation.</p>
        ) : (
          chat.messages.map((m) => (
            <MessageRow
              key={m.id}
              msg={m}
              isOwn={m.user_id === user?.id}
              onDelete={chat.deleteMessage}
              onReport={chat.reportMessage}
              canModerate={canModerate}
            />
          ))
        )}
      </div>

      <div className="border-t border-border/60 p-2 bg-[#0a0a0a]">
        {chat.mute ? (
          <p className="text-xs text-destructive text-center py-1.5">
            You are muted{chat.mute.expires_at ? ` until ${new Date(chat.mute.expires_at).toLocaleString()}` : " permanently"}.
            {chat.mute.reason && ` Reason: ${chat.mute.reason}`}
          </p>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 200))}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Message PeakGG…"
              maxLength={200}
              className="flex-1 bg-secondary/60 border border-border/60 rounded-md px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{input.length}/200</span>
            <Button size="icon" variant="neon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={!input.trim() || sending}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("global");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [globalUnread, setGlobalUnread] = useState(0);
  const [teamUnread, setTeamUnread] = useState(0);

  // Find first team
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: own } = await supabase.from("teams").select("id, name").eq("owner_id", user.id).limit(1);
      if (own && own.length > 0) {
        setTeamId(own[0].id); setTeamName(own[0].name); return;
      }
      const { data: mem } = await supabase
        .from("team_members")
        .select("team_id, teams!inner(id, name)")
        .eq("user_id", user.id)
        .limit(1);
      if (mem && mem.length > 0) {
        const t: any = (mem[0] as any).teams;
        setTeamId(t.id); setTeamName(t.name);
      }
    })();
  }, [user]);

  // Background unread tracking when widget closed
  useEffect(() => {
    if (!user || open) return;
    const ch = supabase
      .channel(`chat-bg-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "global_messages" }, (p) => {
        const row: any = p.new;
        if (row.user_id !== user.id) setGlobalUnread((u) => u + 1);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_messages" }, (p) => {
        const row: any = p.new;
        if (teamId && row.team_id === teamId && row.user_id !== user.id) setTeamUnread((u) => u + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, open, teamId]);

  useEffect(() => {
    if (open) {
      if (tab === "global") setGlobalUnread(0);
      if (tab === "team") setTeamUnread(0);
    }
  }, [open, tab]);

  const totalUnread = globalUnread + teamUnread;

  // Hide on admin chat page; placed after hooks to keep hook order stable
  if (!user) return null;
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
          "bg-[#111] border border-border/60 hover:border-primary/60 hover:shadow-[0_0_24px_hsl(var(--primary)/0.3)]",
          open && "scale-95"
        )}
      >
        {open ? <X className="h-5 w-5 text-foreground" /> : <MessageSquare className="h-5 w-5 text-foreground" />}
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_hsl(var(--primary)/0.6)]">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "fixed z-50 bottom-24 right-6 w-[380px] h-[520px] bg-[#0a0a0a] border border-border/60 rounded-xl shadow-2xl overflow-hidden flex flex-col",
              "max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:bottom-0 max-sm:right-0"
            )}
          >
            {/* Header tabs */}
            <div className="flex border-b border-border/60 bg-[#0a0a0a] shrink-0">
              {(["global", "team"] as Tab[]).map((t) => {
                const unread = t === "global" ? globalUnread : teamUnread;
                const Icon = t === "global" ? Globe2 : Users;
                const label = t === "global" ? "Global" : "Team";
                const active = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "relative flex-1 py-3 text-xs font-display font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    {unread > 0 && !active && (
                      <span className="ml-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] text-primary-foreground font-bold flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                    {active && (
                      <span className="absolute left-4 right-4 bottom-0 h-[2px] bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => setOpen(false)}
                className="px-3 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body — re-mount per tab so the hook resubscribes */}
            {tab === "global" ? (
              <ChannelView key="global" kind="global" teamId={null} teamName={null} />
            ) : (
              <ChannelView key={`team-${teamId ?? "none"}`} kind="team" teamId={teamId} teamName={teamName} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
