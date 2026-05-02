import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { UserPlus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES_BY_GAME: Record<string, string[]> = {
  valorant: ["Duelist", "Sentinel", "Controller", "Initiator", "Flex"],
  cs2: ["Entry Fragger", "AWPer", "Support", "Lurker", "IGL"],
  r6s: ["Hard Breach", "Soft Breach", "Anchor", "Roamer", "Support"],
};

const GAME_META: Record<string, { emoji: string; label: string; color: string; glow: string }> = {
  valorant: { emoji: "⚡", label: "Valorant", color: "#FF4655", glow: "rgba(255,70,85,0.45)" },
  cs2:      { emoji: "💥", label: "CS2",      color: "#F59E0B", glow: "rgba(245,158,11,0.45)" },
  r6s:      { emoji: "🛡️", label: "R6",       color: "#3B82F6", glow: "rgba(59,130,246,0.45)" },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  team: { id: string; name: string; game: string } | null;
}

export default function JoinTeamDialog({ open, onOpenChange, team }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const gameKey = team?.game ?? "valorant";
  const roles = ROLES_BY_GAME[gameKey] ?? ROLES_BY_GAME.valorant;
  const meta = GAME_META[gameKey] ?? GAME_META.valorant;

  const [role, setRole] = useState(roles[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset selection when team/game changes
  useEffect(() => {
    setRole(roles[0]);
  }, [gameKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!user || !team) {
      toast.error(t("teams_page.must_login", { defaultValue: "You must be logged in" }));
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("team_join_requests")
      .insert({
        team_id: team.id,
        user_id: user.id,
        role,
        message: message.trim() || null,
        status: "pending",
      } as any);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("teams_page.request_sent", { defaultValue: "Request sent!" }));
    setMessage("");
    setRole(roles[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setMessage(""); } onOpenChange(v); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-2 bg-card data-[state=open]:animate-fade-in duration-200">
        {/* Top accent bar — colored by game */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${meta.color}, hsl(var(--accent)), ${meta.color})` }} />

        <div className="px-6 pt-6 pb-2 animate-fade-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl uppercase tracking-wider">
              <UserPlus className="h-6 w-6 text-primary" />
              {t("teams_page.join", { defaultValue: "Join" })} {team?.name}
            </DialogTitle>
            <DialogDescription className="font-body flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border-2 font-display uppercase text-[11px] tracking-wider"
                style={{ borderColor: meta.color, color: meta.color, boxShadow: `0 0 10px ${meta.glow}` }}
              >
                <span>{meta.emoji}</span>{meta.label}
              </span>
              <span>{t("teams_page.pick_role_send", { defaultValue: "Pick your role and send a request to the captain." })}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-2 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* ROLE PICKER */}
          <div className="space-y-2">
            <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
              {t("teams_page.your_role", { defaultValue: "Your role" })}
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roles.map((r) => {
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "px-3 py-2.5 rounded-md border-2 transition-all bg-background/60 font-display uppercase text-xs tracking-wider text-center",
                      active ? "scale-[1.02]" : "border-border opacity-70 hover:opacity-100 hover:scale-[1.02]"
                    )}
                    style={
                      active
                        ? { borderColor: meta.color, color: meta.color, boxShadow: `0 0 14px ${meta.glow}, inset 0 0 10px ${meta.glow}` }
                        : undefined
                    }
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MESSAGE */}
          <div className="space-y-1.5">
            <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {t("teams_page.optional_message", { defaultValue: "Message (optional)" })}
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder={t("teams_page.message_placeholder", { defaultValue: "Tell the captain why you'd be a great fit..." })}
              className="font-body bg-background/60 border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:shadow-[0_0_18px_hsl(var(--primary)/0.45)] transition-all resize-none"
            />
            <div className="text-[10px] text-muted-foreground font-display text-right">{message.length}/500</div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-background/40 mt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground font-display uppercase tracking-wider"
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            onClick={submit}
            disabled={loading}
            className={cn(
              "font-display uppercase tracking-wider min-w-36 text-white border-0",
              "bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#A855F7]",
              "hover:from-[#8B5CF6] hover:via-[#A855F7] hover:to-[#C084FC]",
              "shadow-[0_0_18px_rgba(147,51,234,0.5)] hover:shadow-[0_0_24px_rgba(168,85,247,0.7)]",
              "disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
            )}
          >
            {loading ? "..." : t("teams_page.send_request", { defaultValue: "Send request" })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
