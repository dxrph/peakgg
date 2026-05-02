import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

const ROLES_BY_GAME: Record<string, string[]> = {
  valorant: ["Duelist", "Sentinel", "Controller", "Initiator", "Flex"],
  cs2: ["Entry Fragger", "AWPer", "Support", "Lurker", "IGL"],
  r6s: ["Hard Breach", "Soft Breach", "Anchor", "Roamer", "Support"],
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  team: { id: string; name: string; game: string } | null;
}

export default function JoinTeamDialog({ open, onOpenChange, team }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const roles = ROLES_BY_GAME[team?.game ?? "valorant"] ?? ROLES_BY_GAME.valorant;
  const [role, setRole] = useState(roles[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user || !team) { toast.error(t("teams_page.must_login", { defaultValue: "You must be logged in" })); return; }
    setLoading(true);
    const { error } = await supabase
      .from("team_join_requests")
      .insert({ team_id: team.id, user_id: user.id, role, message: message.trim() || null, status: "pending" } as any);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("teams_page.request_sent", { defaultValue: "Request sent!" }));
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("teams_page.join", { defaultValue: "Join" })} {team?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("teams_page.your_role", { defaultValue: "Your role" })}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("teams_page.optional_message", { defaultValue: "Message (optional)" })}</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button variant="neon" onClick={submit} disabled={loading}>
            {loading ? "..." : t("teams_page.send_request", { defaultValue: "Send request" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
