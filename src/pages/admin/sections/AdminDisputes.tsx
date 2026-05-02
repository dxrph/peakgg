import { useEffect, useMemo, useState } from "react";
import { Gavel, Loader2, Eye, ImageOff, Save } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { formatRelative, logAdminAction, warnProfile } from "@/lib/admin";
import { sanitizeText } from "@/lib/security";

type DisputeTicket = {
  id: string;
  match_id: string | null;
  reporter_id: string;
  reported_player_id: string | null;
  type: string;
  description: string;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

type MatchInfo = {
  id: string;
  player_a_id: string | null;
  player_b_id: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  winner_id: string | null;
  status: string;
  map: string | null;
  game: string;
};

const STATUS_COLORS: Record<string, string> = {
  open:      "bg-warning/20 text-warning border-warning/30",
  reviewing: "bg-primary/20 text-primary border-primary/30",
  resolved:  "bg-success/20 text-success border-success/30",
  rejected:  "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
};

export default function AdminDisputes() {
  const [items, setItems] = useState<DisputeTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusF, setStatusF] = useState("open");
  const [profiles, setProfiles] = useState<Map<string, { username: string }>>(new Map());
  const [active, setActive] = useState<DisputeTicket | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("type", "wrong_result")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as DisputeTicket[];
    setItems(list);
    const ids = Array.from(new Set([
      ...list.map((t) => t.reporter_id),
      ...list.map((t) => t.reported_player_id).filter(Boolean) as string[],
    ]));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id,username").in("id", ids);
      setProfiles(new Map((p ?? []).map((x) => [x.id, { username: x.username }])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => items.filter((t) => statusF === "all" || t.status === statusF),
    [items, statusF]
  );

  return (
    <AdminLayout
      title="Dispute"
      description="Risultati partita contestati. Override score, applica sanzioni e chiudi la disputa."
    >
      <div className="flex gap-2 mb-4">
        {["open", "reviewing", "resolved", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusF(s)}
            className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider border transition-colors ${
              statusF === s ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-display">Match</TableHead>
              <TableHead className="font-display">Reporter</TableHead>
              <TableHead className="font-display">Contro</TableHead>
              <TableHead className="font-display">Aperto</TableHead>
              <TableHead className="font-display">Status</TableHead>
              <TableHead className="font-display text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Caricamento…</TableCell></TableRow>}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nessuna disputa</TableCell></TableRow>
            )}
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.match_id ? t.match_id.slice(0, 8) : "—"}</TableCell>
                <TableCell className="font-display text-sm">{profiles.get(t.reporter_id)?.username ?? "—"}</TableCell>
                <TableCell className="font-display text-sm">{t.reported_player_id ? profiles.get(t.reported_player_id)?.username ?? "—" : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatRelative(t.created_at)}</TableCell>
                <TableCell><Badge className={`${STATUS_COLORS[t.status] ?? ""} text-xs uppercase`}>{t.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setActive(t)} title="Apri disputa">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DisputeDetailDialog
        dispute={active}
        profiles={profiles}
        onClose={() => setActive(null)}
        onChanged={load}
      />
    </AdminLayout>
  );
}

/* ─────────── Detail Dialog ─────────── */

function DisputeDetailDialog({
  dispute, profiles, onClose, onChanged,
}: {
  dispute: DisputeTicket | null;
  profiles: Map<string, { username: string }>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [shotLoading, setShotLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [scoreA, setScoreA] = useState<string>("");
  const [scoreB, setScoreB] = useState<string>("");
  const [winnerSel, setWinnerSel] = useState<string>("none");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!dispute) {
      setMatch(null); setShotUrl(null); setAdminNotes(""); setScoreA(""); setScoreB(""); setWinnerSel("none"); return;
    }
    setAdminNotes(dispute.admin_notes ?? "");
    if (dispute.match_id) {
      (async () => {
        const { data } = await supabase
          .from("matches")
          .select("id,player_a_id,player_b_id,team_a_id,team_b_id,score_a,score_b,winner_id,status,map,game")
          .eq("id", dispute.match_id!)
          .maybeSingle();
        if (data) {
          setMatch(data as MatchInfo);
          setScoreA(String(data.score_a ?? 0));
          setScoreB(String(data.score_b ?? 0));
          setWinnerSel(data.winner_id ?? "none");
        }
      })();
    }
  }, [dispute]);

  if (!dispute) return null;

  const reporter = profiles.get(dispute.reporter_id);
  const reported = dispute.reported_player_id ? profiles.get(dispute.reported_player_id) : null;

  const viewScreenshot = async () => {
    if (!dispute.screenshot_url || shotUrl || shotLoading) return;
    setShotLoading(true);
    const { data, error } = await supabase.storage
      .from("ticket-screenshots")
      .createSignedUrl(dispute.screenshot_url, 60 * 5);
    if (error) { toast.error(error.message); setShotLoading(false); return; }
    setShotUrl(data.signedUrl);
    setShotLoading(false);
  };

  const consumeScreenshot = async () => {
    if (!dispute.screenshot_url) return;
    await supabase.storage.from("ticket-screenshots").remove([dispute.screenshot_url]);
    await supabase.from("tickets").update({ screenshot_url: null }).eq("id", dispute.id);
    await logAdminAction({ action: "screenshot_view_consumed", targetType: "ticket", targetId: dispute.id });
    setShotUrl(null);
    toast.success("Screenshot eliminato");
    onChanged();
  };

  const overrideScore = async () => {
    if (!match || !user) return;
    setBusy(true);
    const sA = parseInt(scoreA, 10);
    const sB = parseInt(scoreB, 10);
    if (Number.isNaN(sA) || Number.isNaN(sB) || sA < 0 || sB < 0) {
      toast.error("Score non validi"); setBusy(false); return;
    }
    const winner = winnerSel === "none" ? null : winnerSel;
    const { error } = await supabase
      .from("matches")
      .update({ score_a: sA, score_b: sB, winner_id: winner, status: "completed" })
      .eq("id", match.id);
    if (error) { toast.error(error.message); setBusy(false); return; }
    await logAdminAction({
      action: "dispute_override_score",
      targetType: "match",
      targetId: match.id,
      details: { ticket_id: dispute.id, score_a: sA, score_b: sB, winner_id: winner },
    });
    toast.success("Risultato match aggiornato");
    setBusy(false);
    onChanged();
  };

  const close = async (status: "resolved" | "rejected" | "reviewing") => {
    if (!user) return;
    setBusy(true);
    const notes = sanitizeText(adminNotes).slice(0, 1000);
    const { error } = await supabase
      .from("tickets")
      .update({
        status,
        admin_notes: notes || null,
        resolved_by: status === "reviewing" ? null : user.id,
      })
      .eq("id", dispute.id);
    if (error) { toast.error(error.message); setBusy(false); return; }
    await logAdminAction({
      action: status === "resolved" ? "dispute_resolve" : status === "rejected" ? "dispute_reject" : "ticket_review",
      targetType: "ticket",
      targetId: dispute.id,
      details: { match_id: dispute.match_id },
    });
    toast.success(`Disputa ${status}`);
    setBusy(false);
    onClose();
    onChanged();
  };

  const sanctionReporter = async () => {
    setBusy(true);
    const reason = `Disputa infondata #${dispute.id.slice(0, 8)}`;
    const r = await warnProfile({ userId: dispute.reporter_id, reason });
    if (r.error) { toast.error(r.error); setBusy(false); return; }
    toast.success(`Warn al reporter (#${r.newWarnCount})${r.autoBanned ? " — auto-ban 7g" : ""}`);
    setBusy(false);
  };

  const winnerOptions = match
    ? [
        { value: "none", label: "Pareggio / Nessuno" },
        ...(match.player_a_id ? [{ value: match.player_a_id, label: `Player A — ${profiles.get(match.player_a_id)?.username ?? match.player_a_id.slice(0,8)}` }] : []),
        ...(match.player_b_id ? [{ value: match.player_b_id, label: `Player B — ${profiles.get(match.player_b_id)?.username ?? match.player_b_id.slice(0,8)}` }] : []),
        ...(match.team_a_id ? [{ value: match.team_a_id, label: `Team A — ${match.team_a_id.slice(0,8)}` }] : []),
        ...(match.team_b_id ? [{ value: match.team_b_id, label: `Team B — ${match.team_b_id.slice(0,8)}` }] : []),
      ]
    : [];

  return (
    <Dialog open={!!dispute} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" /> Disputa risultato
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reporter">{reporter?.username ?? dispute.reporter_id.slice(0, 8)}</Field>
            <Field label="Contro">{reported?.username ?? "—"}</Field>
            <Field label="Match ID">{dispute.match_id ? <span className="font-mono text-xs">{dispute.match_id}</span> : "—"}</Field>
            <Field label="Aperta">{formatRelative(dispute.created_at)}</Field>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase font-display mb-1">Descrizione contestazione</p>
            <p className="rounded border border-border bg-muted/30 p-3 whitespace-pre-wrap">{dispute.description}</p>
          </div>

          {dispute.screenshot_url && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-display mb-1">Prova allegata</p>
              {!shotUrl ? (
                <Button variant="outline" size="sm" onClick={viewScreenshot} disabled={shotLoading}>
                  {shotLoading && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                  Visualizza screenshot
                </Button>
              ) : (
                <div className="space-y-2">
                  <img src={shotUrl} alt="Prova disputa" className="rounded border border-border max-h-80" />
                  <Button variant="outline" size="sm" onClick={consumeScreenshot}>
                    <ImageOff className="h-3.5 w-3.5 mr-2" /> Confermato — elimina prova
                  </Button>
                </div>
              )}
            </div>
          )}

          {match && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground uppercase font-display mb-3">Override risultato match</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label>Score A</Label>
                  <Input type="number" min={0} value={scoreA} onChange={(e) => setScoreA(e.target.value)} />
                </div>
                <div>
                  <Label>Score B</Label>
                  <Input type="number" min={0} value={scoreB} onChange={(e) => setScoreB(e.target.value)} />
                </div>
              </div>
              <div className="mb-3">
                <Label>Vincitore</Label>
                <Select value={winnerSel} onValueChange={setWinnerSel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {winnerOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={overrideScore} disabled={busy}>
                <Save className="h-3.5 w-3.5 mr-2" /> Applica override
              </Button>
            </div>
          )}

          <div>
            <Label>Note admin</Label>
            <Textarea
              rows={3} maxLength={1000}
              value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Decisione, evidenze, riferimenti…"
            />
          </div>

          <div className="rounded border border-border p-3">
            <p className="text-xs text-muted-foreground uppercase font-display mb-2">Azione disciplinare opzionale</p>
            <Button size="sm" variant="outline" onClick={sanctionReporter} disabled={busy}>
              Warn al reporter (disputa infondata)
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Chiudi</Button>
          <Button variant="outline" onClick={() => close("reviewing")} disabled={busy}>In revisione</Button>
          <Button variant="outline" onClick={() => close("rejected")} disabled={busy}>Rigetta</Button>
          <Button onClick={() => close("resolved")} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Risolvi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase font-display">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}