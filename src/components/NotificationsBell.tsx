import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

export default function NotificationsBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications(10);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifiche">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold font-display flex items-center justify-center border border-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-display font-bold">Notifiche</span>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} non lette</span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nessuna notifica
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors ${
                  !n.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-sm">{n.title}</div>
                    {n.message && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: it })}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <Link
          to="/notifications"
          className="block px-4 py-2.5 text-center text-sm font-display font-semibold border-t border-border hover:bg-secondary/40 transition-colors"
        >
          Vedi tutte
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}