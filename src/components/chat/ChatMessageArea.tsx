import { useEffect, useRef, useState } from "react";
import { ChatMessage, ChatChannel } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getRankByElo } from "@/lib/ranks";
import { Trash2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface Props {
  channel: ChatChannel | null;
  messages: ChatMessage[];
  loading: boolean;
  onSend: (content: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export default function ChatMessageArea({ channel, messages, loading, onSend, onDelete, compact }: Props) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Seleziona un canale per iniziare</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("border-b border-border px-4 flex items-center gap-2 shrink-0", compact ? "py-2" : "py-3")}>
        <span className="text-lg">{channel.icon || "💬"}</span>
        <h3 className="font-display font-semibold text-foreground truncate">{channel.name}</h3>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-thin">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Caricamento...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nessun messaggio. Inizia la conversazione!</p>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.user_id === user?.id;
            const prevMsg = i > 0 ? messages[i - 1] : null;
            const isGrouped = prevMsg?.user_id === msg.user_id;
            const rank = msg.profile ? getRankByElo(msg.profile.elo) : null;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isOwn ? 20 : -20, y: 8 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn(
                  "group flex gap-2",
                  isOwn ? "flex-row-reverse" : "flex-row",
                  !isGrouped ? "mt-3" : "mt-0.5"
                )}
              >
                {/* Avatar */}
                {!isGrouped && !isOwn ? (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    {msg.profile?.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                ) : !isOwn ? (
                  <div className="w-8 shrink-0" />
                ) : null}

                <div className={cn("max-w-[75%]", compact && "max-w-[85%]")}>
                  {!isGrouped && !isOwn && (
                    <p className="text-xs font-semibold mb-0.5" style={rank ? { color: rank.color } : undefined}>
                      {msg.profile?.username || "Utente"}
                    </p>
                  )}
                  <div
                    className={cn(
                      "relative px-3 py-1.5 rounded-lg text-sm break-words",
                      isOwn
                        ? "bg-accent/20 text-foreground rounded-tr-sm"
                        : "bg-secondary text-foreground rounded-tl-sm"
                    )}
                  >
                    {msg.content}
                    {isOwn && (
                      <button
                        onClick={() => onDelete(msg.id)}
                        className="absolute -right-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {!isGrouped && (
                    <p className={cn("text-[10px] text-muted-foreground mt-0.5", isOwn && "text-right")}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: it })}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        {!user ? (
          <p className="text-sm text-muted-foreground text-center">Accedi per partecipare alla chat</p>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 500))}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Scrivi un messaggio..."
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              {input.length > 400 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  {input.length}/500
                </span>
              )}
            </div>
            <Button size="icon" variant="neon" onClick={handleSend} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
