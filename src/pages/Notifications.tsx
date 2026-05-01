import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Bell, Check, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow, format } from "date-fns";
import { it, enUS, fr } from "date-fns/locale";
import { useI18n } from "@/i18n";

const dateLocaleMap: Record<string, Locale> = { it, en: enUS, fr };
import type { Locale } from "date-fns";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const dateLocale = dateLocaleMap[locale] ?? enUS;
  const { unreadCount, markAllAsRead, markAsRead } = useNotifications(10);
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

  const handleClick = (n: Notification) => {
    if (!n.is_read) {
      markAsRead(n.id);
      setAll((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
  };

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
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-5 py-4 border-b border-border last:border-0 hover:bg-secondary/40 transition-colors ${
                  !n.is_read ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  {!n.is_read && (
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-display font-bold">{n.title}</div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(n.created_at), "d MMM yyyy HH:mm", { locale: dateLocale })}
                      </div>
                    </div>
                    {n.message && (
                      <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: dateLocale })}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}