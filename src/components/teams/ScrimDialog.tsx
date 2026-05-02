import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

const FORMATS = ["5v5 BO1", "5v5 BO3", "5v5 BO5", "2v2", "1v1"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** if set, scrim is targeted at this team */
  targetTeam?: { id: string; name: string; game: string } | null;
  /** challenger team is required (the user's team) */
  challengerTeamId: string | null;
  challengerGame?: string;
  onCreated?: () => void;
}

export default function ScrimDialog({ open, onOpenChange, targetTeam, challengerTeamId, challengerGame, onCreated }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [format, setFormat] = useState("5v5 BO1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) { toast.error(t("teams_page.must_login", { defaultValue: "You must be logged in" })); return; }
    if (!challengerTeamId) { toast.error(t("teams_page.need_team", { defaultValue: "You must own/be in a team to post a scrim" })); return; }
    if (!date || !time) { toast.error(t("teams_page.fill_required", { defaultValue: "Fill required fields" })); return; }
    setLoading(true);
    const game = targetTeam?.game ?? challengerGame ?? "valorant";
    const { error } = await supabase.from("scrims").insert({
      team_id: challengerTeamId,
      challenger_team_id: challengerTeamId,
      target_team_id: targetTeam?.id ?? null,
      game,
      scheduled_date: date,
      scheduled_time: time,
      format,
      notes: notes.trim() || null,
      status: "open",
      posted_by: user.id,
    } as any);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("teams_page.scrim_posted", { defaultValue: "Scrim posted!" }));
    setDate(""); setTime(""); setNotes("");
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {targetTeam
              ? `${t("teams_page.challenge", { defaultValue: "Challenge" })} ${targetTeam.name}`
              : t("teams_page.post_open_scrim", { defaultValue: "Post open scrim" })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("teams_page.date", { defaultValue: "Date" })}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>{t("teams_page.time", { defaultValue: "Time" })}</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("teams_page.format", { defaultValue: "Format" })}</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("teams_page.notes", { defaultValue: "Notes (optional)" })}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button variant="neon" onClick={submit} disabled={loading}>
            {loading ? "..." : t("teams_page.post_scrim", { defaultValue: "Post scrim" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
