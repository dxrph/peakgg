import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationCard from "@/components/notifications/NotificationCard";

export default function NotificationsBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    resolveNotification,
    dismissNotification,
  } = useNotifications(10);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold font-display flex items-center justify-center border border-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] max-w-[95vw] p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
          <span className="font-display font-bold">Notifications</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" /> Mark all
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[28rem] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationCard
                key={n.id}
                n={n}
                compact
                onMarkRead={markAsRead}
                onResolve={resolveNotification}
                onDismiss={dismissNotification}
              />
            ))
          )}
        </div>
        <Link
          to="/notifications"
          className="block px-4 py-2.5 text-center text-sm font-display font-semibold border-t border-border hover:bg-secondary/40 transition-colors"
        >
          View all
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}