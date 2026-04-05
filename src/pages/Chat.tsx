import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Mountain } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessageArea from "@/components/chat/ChatMessageArea";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const { user } = useAuth();
  const chat = useChat();

  // Auto-select first channel
  useEffect(() => {
    if (!chat.activeChannelId && chat.channels.length > 0) {
      chat.setActiveChannelId(chat.channels[0].id);
    }
  }, [chat.channels, chat.activeChannelId]);

  const activeChannel = chat.channels.find((c) => c.id === chat.activeChannelId) || null;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Devi essere autenticato per accedere alla chat.</p>
          <Link to="/login"><Button variant="neon">Accedi</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border bg-background/90 backdrop-blur-xl shrink-0">
        <div className="container flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded gradient-primary flex items-center justify-center">
              <Mountain className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">PEAKGG</span>
          </Link>
          <h1 className="font-display font-semibold text-foreground">💬 Chat</h1>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground font-display uppercase tracking-wider">
            Dashboard →
          </Link>
        </div>
      </nav>

      {/* Chat layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r border-border overflow-y-auto hidden md:block shrink-0 bg-card/50">
          <ChatSidebar
            channels={chat.channels}
            activeChannelId={chat.activeChannelId}
            onSelect={chat.setActiveChannelId}
            unreadCounts={chat.unreadCounts}
          />
        </aside>

        {/* Mobile channel select */}
        <div className="md:hidden border-b border-border p-2 shrink-0 overflow-x-auto flex gap-1">
          {chat.channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => chat.setActiveChannelId(ch.id)}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors ${
                chat.activeChannelId === ch.id
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "text-muted-foreground border-border"
              }`}
            >
              {ch.icon} {ch.name}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 min-w-0">
          <ChatMessageArea
            channel={activeChannel}
            messages={chat.messages}
            loading={chat.loading}
            onSend={chat.sendMessage}
            onDelete={chat.deleteMessage}
          />
        </div>
      </div>
    </div>
  );
}
