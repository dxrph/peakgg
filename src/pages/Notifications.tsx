import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Bell, Check, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Notification } from "@/hooks/useNotifications";
import { useI18n } from "@/i18n";
import NotificationCard from "@/components/notifications/NotificationCard";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const {
    unreadCount,
    markAllAsRead,
    markAsRead,
    resolveNotification,
    dismissNotification,
  } = useNotifications(10);
  const [all, setAll] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!cancelled) {
        setAll((data ?? []) as Notification[]);
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel(`notifications-page:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-3xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold">
              <Bell className="inline h-8 w-8 text-accent mr-2" />
              {t("notifications_page.title")}
            </h1>
            <p className="text-muted-foreground font-body mt-1">
              {unreadCount > 0
                ? t("notifications_page.unread_count", { count: unreadCount })
                : t("notifications_page.all_caught_up")}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              {t("notifications_page.mark_all_read")}
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              {t("notifications_page.loading")}
            </div>
          ) : all.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-body">
              {t("notifications_page.empty")}
            </div>
          ) : (
            all.map((n) => (
              <NotificationCard
                key={n.id}
                n={n}
                onMarkRead={markAsRead}
                onResolve={resolveNotification}
                onDismiss={dismissNotification}
              />
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}