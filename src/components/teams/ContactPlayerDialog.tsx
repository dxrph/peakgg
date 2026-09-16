import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  receiver: { id: string; name: string } | null;
}

export default function ContactPlayerDialog({ open, onOpenChange, receiver }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user || !receiver) { toast.error(t("teams_page.must_login", { defaultValue: "You must be logged in" })); return; }
    if (!message.trim()) { toast.error(t("teams_page.msg_required", { defaultValue: "Message required" })); return; }
    setLoading(true);
    const { error } = await supabase
      .from("recruitment_messages")
      .insert({ sender_id: user.id, receiver_id: receiver.id, message: message.trim() } as any);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("teams_page.message_sent", { defaultValue: "Message sent!" }));
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("teams_page.contact", { defaultValue: "Contact" })} {receiver?.name}</DialogTitle>
        </DialogHeader>
        <div>
          <Label>{t("teams_page.your_message", { defaultValue: "Your message" })}</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={5} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button variant="neon" onClick={submit} disabled={loading}>
            {loading ? "..." : t("teams_page.send", { defaultValue: "Send" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
