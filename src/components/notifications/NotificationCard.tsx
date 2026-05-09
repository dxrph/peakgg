import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { it, enUS, fr } from "date-fns/locale";
import type { Locale } from "date-fns";
import {
  Bell,
  UserPlus,
  Trophy,
  Swords,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Users,
  ExternalLink,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import type { Notification } from "@/hooks/useNotifications";

const dateLocaleMap: Record<string, Locale> = { it, en: enUS, fr };

interface Props {
  n: Notification;
  onResolve: (id: string) => Promise<void> | void;
  onMarkRead: (id: string) => Promise<void> | void;
  onDismiss?: (id: string) => Promise<void> | void;
  compact?: boolean;
}

const TYPE_META: Record<
  string,
  { label: string; tone: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  team_application: { label: "Team Application", tone: "bg-accent/15 text-accent border-accent/30", Icon: UserPlus },
  team_application_accepted: { label: "Application Accepted", tone: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", Icon: CheckCircle2 },
  team_application_rejected: { label: "Application Rejected", tone: "bg-muted text-muted-foreground border-border", Icon: XCircle },
  match_result_pending: { label: "Result Pending", tone: "bg-primary/15 text-primary border-primary/30", Icon: Swords },
  match_disputed: { label: "Dispute", tone: "bg-amber-500/15 text-amber-400 border-amber-500/30", Icon: AlertTriangle },
  match_scheduled: { label: "Match", tone: "bg-primary/15 text-primary border-primary/30", Icon: Swords },
  league_registration_approved: { label: "League", tone: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", Icon: Trophy },
  league_registration_rejected: { label: "League", tone: "bg-muted text-muted-foreground border-border", Icon: XCircle },
  team_chat_message: { label: "Team Chat", tone: "bg-secondary text-foreground border-border", Icon: MessageSquare },
  match_chat_message: { label: "Match Chat", tone: "bg-secondary text-foreground border-border", Icon: MessageSquare },
  team_member_added: { label: "Team", tone: "bg-secondary text-foreground border-border", Icon: Users },
  generic: { label: "Notification", tone: "bg-secondary text-foreground border-border", Icon: Bell },
};

function getTypeMeta(type?: string | null) {
  return TYPE_META[type ?? "generic"] ?? TYPE_META.generic;
}

export default function NotificationCard({ n, onResolve, onMarkRead, onDismiss, compact }: Props) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const dateLocale = dateLocaleMap[locale] ?? enUS;
  const [busy, setBusy] = useState<string | null>(null);

  const meta = (n.meta ?? {}) as Record<string, any>;
  const type = n.type ?? "generic";
  const typeMeta = getTypeMeta(type);
  const Icon = typeMeta.Icon;
  const isResolved = n.status === "resolved";

  const go = (url?: string | null) => {
    if (!url) return;
    if (!n.is_read) onMarkRead(n.id);
    navigate(url);
  };

  const handleApproveApp = async () => {
    if (!meta.request_id) return;
    setBusy("approve");
    const { error } = await supabase
      .from("team_join_requests")
      .update({ status: "accepted" })
      .eq("id", meta.request_id);
    setBusy(null);
    if (error) {
      toast.error("Could not approve application");
      return;
    }
    toast.success("Application approved");
    await onResolve(n.id);
  };

  const handleRejectApp = async () => {
    if (!meta.request_id) return;
    setBusy("reject");
    const { error } = await supabase
      .from("team_join_requests")
      .update({ status: "rejected" })
      .eq("id", meta.request_id);
    setBusy(null);
    if (error) {
      toast.error("Could not reject application");
      return;
    }
    toast.success("Application rejected");
    await onResolve(n.id);
  };

  const handleConfirmResult = async () => {
    if (!meta.match_id) return;
    setBusy("confirm");
    const { error } = await supabase.rpc("confirm_match_result", { _match_id: meta.match_id });
    setBusy(null);
    if (error) {
      toast.error(error.message?.includes("captain") ? "Only opposing captain can confirm" : "Could not confirm result");
      return;
    }
    toast.success("Result confirmed");
    await onResolve(n.id);
  };

  const renderActions = () => {
    if (isResolved) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Resolved</span>
        </div>
      );
    }

    switch (type) {
      case "team_application":
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleApproveApp} disabled={!!busy}>
              {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleRejectApp} disabled={!!busy}>
              {busy === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reject"}
            </Button>
            {meta.applicant_id && (
              <Button size="sm" variant="ghost" onClick={() => go(`/players/${meta.applicant_id}`)}>
                View Profile
              </Button>
            )}
            {meta.team_id && (
              <Button size="sm" variant="ghost" onClick={() => go(`/teams/${meta.team_id}/dashboard`)}>
                Dashboard
              </Button>
            )}
          </div>
        );
      case "team_application_accepted":
      case "team_application_rejected":
      case "team_member_added":
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => go(n.action_url)}>
              View Team
            </Button>
          </div>
        );
      case "match_result_pending":
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleConfirmResult} disabled={!!busy}>
              {busy === "confirm" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => go(`/matches/${meta.match_id}?action=dispute`)}
            >
              Dispute
            </Button>
            <Button size="sm" variant="ghost" onClick={() => go(`/matches/${meta.match_id}`)}>
              Open Match
            </Button>
          </div>
        );
      case "match_disputed":
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => go(`/matches/${meta.match_id}`)}>
              Open Match
            </Button>
          </div>
        );
      case "match_scheduled":
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => go(`/matches/${meta.match_id}`)}>
              Open Match Room
            </Button>
          </div>
        );
      case "league_registration_approved":
        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => go(n.action_url)}>
              View League
            </Button>
            {meta.team_id && (
              <Button size="sm" variant="outline" onClick={() => go(`/teams/${meta.team_id}/dashboard`)}>
                Team Dashboard
              </Button>
            )}
          </div>
        );
      case "league_registration_rejected":
        return (
          <Button size="sm" variant="outline" onClick={() => go(n.action_url)}>
            View League
          </Button>
        );
      case "team_chat_message":
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => go(n.action_url || (meta.team_id ? `/teams/${meta.team_id}/dashboard?tab=chat` : null))}>
              Open Chat
            </Button>
            {!n.is_read && (
              <Button size="sm" variant="ghost" onClick={() => onMarkRead(n.id)}>
                Mark Read
              </Button>
            )}
          </div>
        );
      case "match_chat_message":
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => go(n.action_url || (meta.match_id ? `/matches/${meta.match_id}` : null))}>
              Open Chat
            </Button>
            {!n.is_read && (
              <Button size="sm" variant="ghost" onClick={() => onMarkRead(n.id)}>
                Mark Read
              </Button>
            )}
          </div>
        );
      default:
        if (n.action_url) {
          return (
            <Button size="sm" variant="outline" onClick={() => go(n.action_url)}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
            </Button>
          );
        }
        if (!n.is_read) {
          return (
            <Button size="sm" variant="ghost" onClick={() => onMarkRead(n.id)}>
              Mark Read
            </Button>
          );
        }
        return null;
    }
  };

  return (
    <div
      className={`relative px-4 py-3 border-b border-border last:border-0 transition-colors ${
        !n.is_read ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
      } ${isResolved ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 h-8 w-8 rounded-md border flex items-center justify-center ${typeMeta.tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${typeMeta.tone}`}>
              {typeMeta.label}
            </Badge>
            {!n.is_read && !isResolved && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="unread" />
            )}
          </div>
          <div className="font-display font-semibold text-sm leading-snug">{n.title}</div>
          {n.message && (
            <div className={`text-xs text-muted-foreground mt-0.5 ${compact ? "line-clamp-2" : ""}`}>
              {n.message}
            </div>
          )}
          <div className="text-[10px] text-muted-foreground mt-1.5">
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: dateLocale })}
          </div>
          <div className="mt-2.5">{renderActions()}</div>
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(n.id)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}