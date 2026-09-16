import { useState } from "react";
import { Loader2, Flag, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sanitizeText, randomFileName } from "@/lib/security";

const TYPES = [
  { v: "cheat",         l: "Cheat / Hack" },
  { v: "bug",           l: "Bug di sistema" },
  { v: "abuse",         l: "Abuso / Tossicità" },
  { v: "impersonation", l: "Impersonificazione" },
  { v: "wrong_result",  l: "Risultato scorretto" },
  { v: "other",         l: "Altro" },
];

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  matchId?: string | null;
  reportedPlayerId?: string | null;
  trigger?: React.ReactNode;
}

export default function OpenTicketDialog({ matchId, reportedPlayerId, trigger }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("cheat");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setType("cheat"); setDescription(""); setFile(null); };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type)) { toast.error("Solo JPG, PNG o WebP"); return; }
    if (f.size > MAX_BYTES) { toast.error("Massimo 5 MB"); return; }
    setFile(f);
  };

  const submit = async () => {
    if (!user) { toast.error("Devi essere loggato"); return; }
    const desc = sanitizeText(description).slice(0, 1500);
    if (desc.length < 10) { toast.error("Descrivi il problema (minimo 10 caratteri)"); return; }
    setBusy(true);
    let screenshotPath: string | null = null;
    try {
      if (file) {
        const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
        const path = `${user.id}/${randomFileName(ext)}`;
        const { error: upErr } = await supabase.storage
          .from("ticket-screenshots")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        screenshotPath = path;
      }
      const { error } = await supabase.from("tickets").insert({
        type,
        description: desc,
        screenshot_url: screenshotPath,
        match_id: matchId ?? null,
        reported_player_id: reportedPlayerId ?? null,
        reporter_id: user.id,
      });
      if (error) throw error;
      toast.success("Ticket inviato. Lo staff lo esaminerà.");
      setOpen(false);
      reset();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Flag className="h-4 w-4 mr-2" /> Apri Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Apri un ticket</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div>
            <Label>Tipo problema</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrizione</Label>
            <Textarea
              rows={5}
              maxLength={1500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cosa è successo? Quando? Chi era coinvolto?"
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/1500</p>
          </div>
          <div>
            <Label>Screenshot (opzionale, max 5MB)</Label>
            <label className="flex items-center gap-2 mt-1 cursor-pointer rounded border border-dashed border-border px-3 py-2.5 hover:border-primary/50">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground truncate">
                {file ? file.name : "Carica immagine JPG / PNG / WebP"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Annulla</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Invia ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
