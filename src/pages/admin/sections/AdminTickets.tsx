import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle, ImageOff, Eye } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { banProfile, formatRelative, logAdminAction, warnProfile } from "@/lib/admin";
import { sanitizeText } from "@/lib/security";

type Ticket = {
  id: string;
  match_id: string | null;
  reporter_id: string;
  reported_player_id: string | null;
  type: string;
  description: string;
  screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  resolved_by: string | null;
  created_at: string;
};

const TYPES = ["all", "cheat", "bug", "abuse", "impersonation", "wrong_result", "other"];
const STATUSES = ["all", "open", "reviewing", "resolved", "rejected"];

const STATUS_COLORS: Record<string, string> = {
  open:      "bg-warning/20 text-warning border-warning/30",
  reviewing: "bg-primary/20 text-primary border-primary/30",
  resolved:  "bg-success/20 text-success border-success/30",
  rejected:  "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
};

export default function AdminTickets() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeF, setTypeF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [profiles, setProfiles] = useState<Map<string, { username: string; avatar_url: string | null }>>(new Map());
  const [active, setActive] = useState<Ticket | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as Ticket[];
    setItems(list);
    const ids = Array.from(new Set([
      ...list.map((t) => t.reporter_id),
      ...list.map((t) => t.reported_player_id).filter(Boolean) as string[],
    ]));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id,username,avatar_url").in("id", ids);
      setProfiles(new Map((p ?? []).map((x) => [x.id, { username: x.username, avatar_url: x.avatar_url }])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => items.filter((t) => (typeF === "all" || t.type === typeF) && (statusF === "all" || t.status === statusF)),
    [items, typeF, statusF]
  );

  return (
    <AdminLayout title="Ticket" description="Gestisci segnalazioni di cheat, bug, abuso e impersonificazione.">
      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select value={typeF} onValueChange={setTypeF}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-display">Reporter</TableHead>
              <TableHead className="font-display">Segnalato</TableHead>
              <TableHead className="font-display">Tipo</TableHead>
              <TableHead className="font-display">Data</TableHead>
              <TableHead className="font-display">Status</TableHead>
              <TableHead className="font-display text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Caricamento…</TableCell></TableRow>}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nessun ticket</TableCell></TableRow>
            )}
            {filtered.map((t) => {
              const r = profiles.get(t.reporter_id);
              const v = t.reported_player_id ? profiles.get(t.reported_player_id) : null;
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-display text-sm">{r?.username ?? "—"}</TableCell>
                  <TableCell className="font-display text-sm">{v?.username ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs uppercase">{t.type}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatRelative(t.created_at)}</TableCell>
                  <TableCell><Badge className={`${STATUS_COLORS[t.status] ?? ""} text-xs uppercase`}>{t.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setActive(t)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <TicketDetailDialog
        ticket={active}
        onClose={() => setActive(null)}
        onChanged={load}
        profiles={profiles}
      />
    </AdminLayout>
  );
}

/* ─────────── Detail dialog ─────────── */

function TicketDetailDialog({
  ticket, onClose, onChanged, profiles,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  onChanged: () => void;
  profiles: Map<string, { username: string; avatar_url: string | null }>;
}) {
  const { user } = useAuth();
  const [shotUrl, setShotUrl] = useState<string | null>(null);
  const [shotLoading, setShotLoading] = useState(false);
  const [recent, setRecent] = useState<{ id: string; created_at: string; status: string; map: string | null }[]>([]);
  const [adminNotes, setAdminNotes] = useState("");
  const [banDays, setBanDays] = useState<string>("7");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ticket) { setShotUrl(null); setRecent([]); setAdminNotes(""); return; }
    setAdminNotes(ticket.admin_notes ?? "");
    if (ticket.reported_player_id) {
      (async () => {
        const { data } = await supabase
          .from("matches")
          .select("id, created_at, status, map")
          .or(`player_a_id.eq.${ticket.reported_player_id},player_b_id.eq.${ticket.reported_player_id}`)
          .order("created_at", { ascending: false })
          .limit(5);
        setRecent(data ?? []);
      })();
    } else { setRecent([]); }
  }, [ticket]);

  if (!ticket) return null;

  const reporter = profiles.get(ticket.reporter_id);
  const reported = ticket.reported_player_id ? profiles.get(ticket.reported_player_id) : null;

  const viewScreenshot = async () => {
    if (!ticket.screenshot_url || shotUrl || shotLoading) return;
    setShotLoading(true);
    const { data, error } = await supabase.storage
      .from("ticket-screenshots")
      .createSignedUrl(ticket.screenshot_url, 60 * 5);
    if (error) { toast.error(error.message); setShotLoading(false); return; }
    setShotUrl(data.signedUrl);
    setShotLoading(false);
  };

  const consumeScreenshot = async () => {
    if (!ticket.screenshot_url) return;
    const { error } = await supabase.storage
      .from("ticket-screenshots")
      .remove([ticket.screenshot_url]);
    if (error) { toast.error(error.message); return; }
    await supabase.from("tickets").update({ screenshot_url: null }).eq("id", ticket.id);
    await logAdminAction({ action: "screenshot_view_consumed", targetType: "ticket", targetId: ticket.id });
    setShotUrl(null);
    toast.success("Screenshot eliminato dallo storage");
    onChanged();
  };

  const updateStatus = async (status: "resolved" | "rejected" | "reviewing") => {
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
      .eq("id", ticket.id);
    if (error) { toast.error(error.message); setBusy(false); return; }
    await logAdminAction({
      action: status === "resolved" ? "ticket_resolve" : status === "rejected" ? "ticket_reject" : "ticket_review",
      targetType: "ticket",
      targetId: ticket.id,
    });
    toast.success(`Ticket ${status}`);
    setBusy(false);
    onClose();
    onChanged();
  };

  const warn = async () => {
    if (!ticket.reported_player_id) { toast.error("Nessun player segnalato"); return; }
    setBusy(true);
    const reason = sanitizeText(adminNotes).slice(0, 500) || `Ticket #${ticket.id.slice(0, 8)}: ${ticket.type}`;
    const res = await warnProfile({ userId: ticket.reported_player_id, reason });
    if (res.error) { toast.error(res.error); setBusy(false); return; }
    await logAdminAction({
      action: "warn_player",
      targetType: "user",
      targetId: ticket.reported_player_id,
      details: { ticket_id: ticket.id, reason, new_warn_count: res.newWarnCount, auto_banned: res.autoBanned },
    });
    toast.success(res.autoBanned
      ? `Warn applicato (#${res.newWarnCount}). Ban automatico 7g attivato.`
      : `Warn applicato (#${res.newWarnCount} di 3)`);
    setBusy(false);
  };

  const ban = async (permanent: boolean) => {
    if (!ticket.reported_player_id) { toast.error("Nessun player segnalato"); return; }
    setBusy(true);
    const reason = sanitizeText(adminNotes).slice(0, 500) || `Ticket #${ticket.id.slice(0, 8)}: ${ticket.type}`;
    const days = permanent ? null : parseInt(banDays, 10);
    const { error } = await banProfile({ userId: ticket.reported_player_id, reason, durationDays: days });
    if (error) { toast.error(error.message); setBusy(false); return; }
    await supabase.from("notifications").insert({
      user_id: ticket.reported_player_id,
      title: permanent ? "Account bannato in modo permanente" : `Account sospeso ${days} giorni`,
      message: reason,
    });
    await logAdminAction({
      action: "ban_player",
      targetType: "user",
      targetId: ticket.reported_player_id,
      details: { ticket_id: ticket.id, reason, duration_days: days, permanent },
    });
    toast.success(permanent ? "Ban permanente applicato" : `Ban di ${days} giorni applicato`);
    setBusy(false);
  };

  return (
    <Dialog open={!!ticket} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Ticket — {ticket.type}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Reporter">{reporter?.username ?? "—"}</Field>
            <Field label="Segnalato">{reported?.username ?? "—"}</Field>
            <Field label="Status"><Badge className={`${STATUS_COLORS[ticket.status] ?? ""} text-xs uppercase`}>{ticket.status}</Badge></Field>
            <Field label="Aperto">{formatRelative(ticket.created_at)}</Field>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase font-display mb-1">Descrizione</p>
            <p className="rounded border border-border bg-muted/30 p-3 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {ticket.screenshot_url && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-display mb-1">Screenshot allegato</p>
              {!shotUrl ? (
                <Button variant="outline" size="sm" onClick={viewScreenshot} disabled={shotLoading}>
                  {shotLoading && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                  Visualizza screenshot
                </Button>
              ) : (
                <div className="space-y-2">
                  <img src={shotUrl} alt="Screenshot ticket" className="rounded border border-border max-h-80" />
                  <Button variant="outline" size="sm" onClick={consumeScreenshot}>
                    <ImageOff className="h-3.5 w-3.5 mr-2" /> Confermato — elimina screenshot
                  </Button>
                </div>
              )}
            </div>
          )}

          {recent.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase font-display mb-1">Ultime partite del segnalato</p>
              <div className="rounded border border-border divide-y divide-border">
                {recent.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="font-mono">{m.id.slice(0, 8)}</span>
                    <span className="text-muted-foreground">{m.map ?? "—"}</span>
                    <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                    <span className="text-muted-foreground">{formatRelative(m.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Note admin</Label>
            <Textarea
              rows={3}
              maxLength={1000}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Motivo, decisione, riferimenti…"
            />
          </div>

          <div className="rounded border border-border p-3">
            <p className="text-xs text-muted-foreground uppercase font-display mb-2">Azioni sul player</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={warn} disabled={busy || !ticket.reported_player_id}>
                Warn (+1)
              </Button>
              <div className="flex items-center gap-1">
                <Select value={banDays} onValueChange={setBanDays}>
                  <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["1", "3", "7", "30"].map((d) => <SelectItem key={d} value={d}>{d} giorni</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => ban(false)} disabled={busy || !ticket.reported_player_id}>
                  Ban temporaneo
                </Button>
              </div>
              <Button size="sm" variant="destructive" onClick={() => ban(true)} disabled={busy || !ticket.reported_player_id}>
                Ban permanente
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Chiudi</Button>
          <Button variant="outline" onClick={() => updateStatus("reviewing")} disabled={busy}>In revisione</Button>
          <Button variant="outline" onClick={() => updateStatus("rejected")} disabled={busy}>Rigetta</Button>
          <Button onClick={() => updateStatus("resolved")} disabled={busy}>
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
