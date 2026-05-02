import { useEffect, useMemo, useState } from "react";
import { Target, Trash2, Pencil, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatRelative, logAdminAction } from "@/lib/admin";
import { sanitizeText } from "@/lib/security";

type Scrim = {
  id: string;
  team_id: string;
  posted_by: string;
  game: string;
  format: string;
  scheduled_date: string;
  scheduled_time: string;
  rank_min: number | null;
  rank_max: number | null;
  notes: string | null;
  status: string;
  contact_info: string | null;
  created_at: string;
};

const GAMES = ["all", "valorant", "cs2", "r6s"];
const STATUSES = ["all", "open", "accepted", "completed", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  open:      "bg-warning/20 text-warning border-warning/30",
  accepted:  "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
};

export default function AdminScrims() {
  const [items, setItems] = useState<Scrim[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameF, setGameF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [teams, setTeams] = useState<Map<string, string>>(new Map());
  const [posters, setPosters] = useState<Map<string, string>>(new Map());
  const [editing, setEditing] = useState<Scrim | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scrims")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as Scrim[];
    setItems(list);
    const teamIds = Array.from(new Set(list.map((s) => s.team_id).filter(Boolean)));
    const userIds = Array.from(new Set(list.map((s) => s.posted_by).filter(Boolean)));
    if (teamIds.length) {
      const { data: t } = await supabase.from("teams").select("id,name").in("id", teamIds);
      setTeams(new Map((t ?? []).map((x) => [x.id, x.name])));
    }
    if (userIds.length) {
      const { data: p } = await supabase.from("profiles").select("id,username").in("id", userIds);
      setPosters(new Map((p ?? []).map((x) => [x.id, x.username])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => items.filter((s) => (gameF === "all" || s.game === gameF) && (statusF === "all" || s.status === statusF)),
    [items, gameF, statusF]
  );

  const remove = async (s: Scrim) => {
    if (!confirm(`Eliminare scrim del team ${teams.get(s.team_id) ?? ""}?`)) return;
    const { error } = await supabase.from("scrims").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    await logAdminAction({ action: "scrim_delete", targetType: "scrim", targetId: s.id, details: { team_id: s.team_id } });
    toast.success("Scrim eliminato");
    load();
  };

  return (
    <AdminLayout
      title="Scrims"
      description="Modera le richieste di scrim: filtra, modifica o elimina annunci."
    >
      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <Label className="text-xs text-muted-foreground">Gioco</Label>
          <Select value={gameF} onValueChange={setGameF}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{GAMES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-display">Team</TableHead>
              <TableHead className="font-display">Poster</TableHead>
              <TableHead className="font-display">Gioco</TableHead>
              <TableHead className="font-display">Formato</TableHead>
              <TableHead className="font-display">Quando</TableHead>
              <TableHead className="font-display">Status</TableHead>
              <TableHead className="font-display">Creato</TableHead>
              <TableHead className="font-display text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Caricamento…</TableCell></TableRow>}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nessuno scrim</TableCell></TableRow>
            )}
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-display text-sm flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-primary" /> {teams.get(s.team_id) ?? s.team_id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{posters.get(s.posted_by) ?? s.posted_by.slice(0, 8)}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs uppercase">{s.game}</Badge></TableCell>
                <TableCell className="text-xs">{s.format}</TableCell>
                <TableCell className="text-xs font-mono">{s.scheduled_date} {s.scheduled_time?.slice(0, 5)}</TableCell>
                <TableCell><Badge className={`${STATUS_COLORS[s.status] ?? ""} text-xs uppercase`}>{s.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatRelative(s.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(s)} title="Modifica">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(s)} title="Elimina">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ScrimEditDialog
        scrim={editing}
        onClose={() => setEditing(null)}
        onSaved={load}
      />
    </AdminLayout>
  );
}

function ScrimEditDialog({
  scrim, onClose, onSaved,
}: {
  scrim: Scrim | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState("open");
  const [notes, setNotes] = useState("");
  const [rankMin, setRankMin] = useState("0");
  const [rankMax, setRankMax] = useState("9999");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!scrim) return;
    setStatus(scrim.status);
    setNotes(scrim.notes ?? "");
    setRankMin(String(scrim.rank_min ?? 0));
    setRankMax(String(scrim.rank_max ?? 9999));
  }, [scrim]);

  if (!scrim) return null;

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("scrims")
      .update({
        status,
        notes: sanitizeText(notes).slice(0, 500) || null,
        rank_min: parseInt(rankMin, 10) || 0,
        rank_max: parseInt(rankMax, 10) || 9999,
      })
      .eq("id", scrim.id);
    if (error) { toast.error(error.message); setBusy(false); return; }
    await logAdminAction({ action: "scrim_update", targetType: "scrim", targetId: scrim.id, details: { status } });
    toast.success("Scrim aggiornato");
    setBusy(false);
    onClose();
    onSaved();
  };

  return (
    <Dialog open={!!scrim} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Modifica scrim</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["open", "accepted", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Rank min</Label>
              <Input type="number" min={0} value={rankMin} onChange={(e) => setRankMin(e.target.value)} />
            </div>
            <div>
              <Label>Rank max</Label>
              <Input type="number" min={0} value={rankMax} onChange={(e) => setRankMax(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Note</Label>
            <Textarea rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Annulla</Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}