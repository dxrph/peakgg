import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import ChatSidebar from "./ChatSidebar";
import ChatMessageArea from "./ChatMessageArea";
import { cn } from "@/lib/utils";
import { MessageCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ChatWidget() {
  const { user } = useAuth();
  const chat = useChat();
  const [open, setOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  if (!user) return null;

  const activeChannel = chat.channels.find((c) => c.id === chat.activeChannelId) || null;

  // Auto-select first channel if none selected
  if (!chat.activeChannelId && chat.channels.length > 0) {
    chat.setActiveChannelId(chat.channels[0].id);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
          "gradient-primary hover:opacity-90",
          open && "rotate-90"
        )}
      >
        {open ? (
          <X className="h-6 w-6 text-primary-foreground" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6 text-primary-foreground" />
            {chat.totalUnread > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 text-[10px] h-5 min-w-[20px] px-1 justify-center">
                {chat.totalUnread > 99 ? "99+" : chat.totalUnread}
              </Badge>
            )}
          </>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            "fixed z-50 bg-card border border-border rounded-lg shadow-2xl overflow-hidden",
            "animate-in slide-in-from-bottom-4 fade-in-0 duration-300",
            "bottom-24 right-6 w-[350px] h-[500px]",
            "max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:rounded-none max-sm:bottom-0 max-sm:right-0"
          )}
        >
          <div className="flex h-full">
            {/* Mini sidebar toggle for widget */}
            <div className={cn(
              "border-r border-border overflow-y-auto transition-all duration-200",
              showSidebar ? "w-[180px]" : "w-[48px]"
            )}>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="w-full text-center py-2 text-xs text-muted-foreground hover:text-foreground border-b border-border"
              >
                {showSidebar ? "◁" : "▷"}
              </button>
              <ChatSidebar
                channels={chat.channels}
                activeChannelId={chat.activeChannelId}
                onSelect={(id) => { chat.setActiveChannelId(id); setShowSidebar(false); }}
                unreadCounts={chat.unreadCounts}
                compact={!showSidebar}
              />
            </div>
            <div className="flex-1 min-w-0">
              <ChatMessageArea
                channel={activeChannel}
                messages={chat.messages}
                loading={chat.loading}
                onSend={chat.sendMessage}
                onDelete={chat.deleteMessage}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
