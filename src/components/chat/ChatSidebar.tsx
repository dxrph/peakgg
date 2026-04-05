import { ChatChannel } from "@/hooks/useChat";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Props {
  channels: ChatChannel[];
  activeChannelId: string | null;
  onSelect: (id: string) => void;
  unreadCounts: Record<string, number>;
  compact?: boolean;
}

export default function ChatSidebar({ channels, activeChannelId, onSelect, unreadCounts, compact }: Props) {
  const global = channels.filter((c) => c.type === "global");
  const game = channels.filter((c) => c.type === "game");
  const team = channels.filter((c) => c.type === "team");

  const renderChannel = (ch: ChatChannel) => {
    const unread = unreadCounts[ch.id] || 0;
    return (
      <button
        key={ch.id}
        onClick={() => onSelect(ch.id)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
          activeChannelId === ch.id
            ? "bg-primary/15 text-primary border border-primary/30"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <span className="text-base">{ch.icon || "💬"}</span>
        {!compact && <span className="truncate flex-1">{ch.name}</span>}
        {unread > 0 && (
          <Badge variant="destructive" className="text-[10px] h-5 min-w-[20px] px-1 justify-center">
            {unread > 99 ? "99+" : unread}
          </Badge>
        )}
      </button>
    );
  };

  const Section = ({ title, items }: { title: string; items: ChatChannel[] }) =>
    items.length > 0 ? (
      <div className="space-y-1">
        {!compact && <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">{title}</p>}
        {items.map(renderChannel)}
      </div>
    ) : null;

  return (
    <div className="space-y-4 py-2">
      <Section title="Generale" items={global} />
      <Section title="Per Gioco" items={game} />
      {team.length > 0 ? (
        <Section title="I Miei Team" items={team} />
      ) : (
        !compact && (
          <div className="px-3 space-y-1">
            <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-1">I Miei Team</p>
            <p className="text-xs text-muted-foreground">Non fai parte di nessun team.</p>
            <Link to="/teams" className="text-xs text-primary hover:underline">Trova un team →</Link>
          </div>
        )
      )}
    </div>
  );
}
