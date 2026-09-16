import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Trash2, VolumeX, Volume2, Flag, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { formatRelative, logAdminAction } from "@/lib/admin";
import { sanitizeText } from "@/lib/security";

type GlobalMsg = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  flagged: boolean;
  flag_reason: string | null;
  report_count: number;
};
type TeamMsg = GlobalMsg & { team_id: string };
type ChatMute = {
  id: string;
  user_id: string;
  scope: string;
  team_id: string | null;
  expires_at: string | null;
  reason: string | null;
  created_at: string;
};

export default function AdminChat() {
  return (
    <AdminLayout
      title="Moderazione Chat"
      description="Messaggi flaggati, gestione mute e azioni rapide su contenuti pubblici e team."
    >
      <Tabs defaultValue="global">
        <TabsList>
          <TabsTrigger value="global">Globale</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="mutes">Mute attivi</TabsTrigger>
        </TabsList>
        <TabsContent value="global" className="mt-4"><GlobalTab /></TabsContent>
        <TabsContent value="team" className="mt-4"><TeamTab /></TabsContent>
        <TabsContent value="mutes" className="mt-4"><MutesTab /></TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

/* ─────────── Global tab ─────────── */
function GlobalTab() {
  const [items, setItems] = useState<GlobalMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"flagged" | "reported" | "all">("flagged");
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [muteFor, setMuteFor] = useState<{ userId: string; scope: "global" | "team"; teamId?: string | null } | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("global_messages").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter === "flagged") q = q.eq("flagged", true);
    if (filter === "reported") q = q.gt("report_count", 0);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as GlobalMsg[];
    setItems(list);
    const ids = Array.from(new Set(list.map((m) => m.user_id)));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id,username").in("id", ids);
      setProfiles(new Map((p ?? []).map((x) => [x.id, x.username])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const del = async (m: GlobalMsg) => {
    if (!confirm("Eliminare il messaggio?")) return;
    const { error } = await supabase.from("global_messages").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAdminAction({ action: "chat_message_delete", targetType: "global_message", targetId: m.id, details: { user_id: m.user_id } });
    toast.success("Messaggio eliminato");
    load();
  };

  const unflag = async (m: GlobalMsg) => {
    const { error } = await supabase
      .from("global_messages")
      .update({ flagged: false, flag_reason: null, report_count: 0 })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAdminAction({ action: "chat_message_unflag", targetType: "global_message", targetId: m.id });
    toast.success("Flag rimosso");
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["flagged", "reported", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider border transition-colors ${
              filter === f ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <MessagesTable
        loading={loading}
        rows={items.map((m) => ({
          id: m.id, user_id: m.user_id, content: m.content, created_at: m.created_at,
          flagged: m.flagged, flag_reason: m.flag_reason, report_count: m.report_count,
          extra: null,
        }))}
        profiles={profiles}
        onDelete={(id) => del(items.find((x) => x.id === id)!)}
        onUnflag={(id) => unflag(items.find((x) => x.id === id)!)}
        onMute={(uid) => setMuteFor({ userId: uid, scope: "global" })}
      />
      <MuteDialog state={muteFor} onClose={() => setMuteFor(null)} />
    </div>
  );
}

/* ─────────── Team tab ─────────── */
function TeamTab() {
  const [items, setItems] = useState<TeamMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"flagged" | "reported">("flagged");
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [teams, setTeams] = useState<Map<string, string>>(new Map());
  const [muteFor, setMuteFor] = useState<{ userId: string; scope: "global" | "team"; teamId?: string | null } | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("team_messages").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter === "flagged") q = q.eq("flagged", true);
    if (filter === "reported") q = q.gt("report_count", 0);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as TeamMsg[];
    setItems(list);
    const uids = Array.from(new Set(list.map((m) => m.user_id)));
    const tids = Array.from(new Set(list.map((m) => m.team_id)));
    if (uids.length) {
      const { data: p } = await supabase.from("profiles").select("id,username").in("id", uids);
      setProfiles(new Map((p ?? []).map((x) => [x.id, x.username])));
    }
    if (tids.length) {
      const { data: t } = await supabase.from("teams").select("id,name").in("id", tids);
      setTeams(new Map((t ?? []).map((x) => [x.id, x.name])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const del = async (m: TeamMsg) => {
    if (!confirm("Eliminare il messaggio?")) return;
    const { error } = await supabase.from("team_messages").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAdminAction({ action: "chat_message_delete", targetType: "team_message", targetId: m.id, details: { user_id: m.user_id, team_id: m.team_id } });
    toast.success("Messaggio eliminato");
    load();
  };

  const unflag = async (m: TeamMsg) => {
    const { error } = await supabase
      .from("team_messages")
      .update({ flagged: false, flag_reason: null, report_count: 0 })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAdminAction({ action: "chat_message_unflag", targetType: "team_message", targetId: m.id });
    toast.success("Flag rimosso");
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["flagged", "reported"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider border transition-colors ${
              filter === f ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <MessagesTable
        loading={loading}
        rows={items.map((m) => ({
          id: m.id, user_id: m.user_id, content: m.content, created_at: m.created_at,
          flagged: m.flagged, flag_reason: m.flag_reason, report_count: m.report_count,
          extra: teams.get(m.team_id) ?? m.team_id.slice(0, 8),
        }))}
        profiles={profiles}
        extraLabel="Team"
        onDelete={(id) => del(items.find((x) => x.id === id)!)}
        onUnflag={(id) => unflag(items.find((x) => x.id === id)!)}
        onMute={(uid) => {
          const m = items.find((x) => x.user_id === uid);
          setMuteFor({ userId: uid, scope: "team", teamId: m?.team_id ?? null });
        }}
      />
      <MuteDialog state={muteFor} onClose={() => setMuteFor(null)} />
    </div>
  );
}

/* ─────────── Mutes tab ─────────── */
function MutesTab() {
  const [items, setItems] = useState<ChatMute[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_mutes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as ChatMute[];
    setItems(list);
    const ids = Array.from(new Set(list.map((m) => m.user_id)));
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("id,username").in("id", ids);
      setProfiles(new Map((p ?? []).map((x) => [x.id, x.username])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const unmute = async (m: ChatMute) => {
    if (!confirm("Rimuovere il mute?")) return;
    const { error } = await supabase.from("chat_mutes").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    await logAdminAction({ action: "chat_user_unmute", targetType: "user", targetId: m.user_id, details: { mute_id: m.id, scope: m.scope } });
    toast.success("Mute rimosso");
    load();
  };

  const isExpired = (e: string | null) => e !== null && new Date(e) < new Date();

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-display">Utente</TableHead>
            <TableHead className="font-display">Scope</TableHead>
            <TableHead className="font-display">Scade</TableHead>
            <TableHead className="font-display">Motivo</TableHead>
            <TableHead className="font-display">Creato</TableHead>
            <TableHead className="font-display text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Caricamento…</TableCell></TableRow>}
          {!loading && items.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nessun mute attivo</TableCell></TableRow>
          )}
          {items.map((m) => (
            <TableRow key={m.id} className={isExpired(m.expires_at) ? "opacity-50" : ""}>
              <TableCell className="font-display text-sm">{profiles.get(m.user_id) ?? m.user_id.slice(0, 8)}</TableCell>
              <TableCell><Badge variant="outline" className="text-xs uppercase">{m.scope}</Badge></TableCell>
              <TableCell className="text-xs">{m.expires_at ? new Date(m.expires_at).toLocaleString() : <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">Permanente</Badge>}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{m.reason ?? "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatRelative(m.created_at)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => unmute(m)}>
                  <Volume2 className="h-3.5 w-3.5 mr-1" /> Unmute
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─────────── Shared messages table ─────────── */
function MessagesTable({
  loading, rows, profiles, extraLabel, onDelete, onUnflag, onMute,
}: {
  loading: boolean;
  rows: { id: string; user_id: string; content: string; created_at: string; flagged: boolean; flag_reason: string | null; report_count: number; extra: string | null }[];
  profiles: Map<string, string>;
  extraLabel?: string;
  onDelete: (id: string) => void;
  onUnflag: (id: string) => void;
  onMute: (uid: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-display">Autore</TableHead>
            {extraLabel && <TableHead className="font-display">{extraLabel}</TableHead>}
            <TableHead className="font-display">Contenuto</TableHead>
            <TableHead className="font-display">Flag</TableHead>
            <TableHead className="font-display">Report</TableHead>
            <TableHead className="font-display">Quando</TableHead>
            <TableHead className="font-display text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={extraLabel ? 7 : 6} className="text-center py-8 text-muted-foreground">Caricamento…</TableCell></TableRow>}
          {!loading && rows.length === 0 && (
            <TableRow><TableCell colSpan={extraLabel ? 7 : 6} className="text-center py-8 text-muted-foreground">Nessun messaggio</TableCell></TableRow>
          )}
          {rows.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-display text-sm">{profiles.get(m.user_id) ?? m.user_id.slice(0, 8)}</TableCell>
              {extraLabel && <TableCell className="text-xs text-muted-foreground">{m.extra}</TableCell>}
              <TableCell className="max-w-md text-sm">
                <p className="line-clamp-2">{m.content}</p>
                {m.flag_reason && (
                  <p className="text-xs text-warning mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {m.flag_reason}
                  </p>
                )}
              </TableCell>
              <TableCell>{m.flagged ? <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs"><Flag className="h-3 w-3 mr-1" />flagged</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
              <TableCell className="text-xs font-mono">{m.report_count}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatRelative(m.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {m.flagged && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onUnflag(m.id)} title="Rimuovi flag">
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMute(m.user_id)} title="Mute utente">
                    <VolumeX className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(m.id)} title="Elimina">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─────────── Mute dialog ─────────── */
function MuteDialog({
  state, onClose,
}: {
  state: { userId: string; scope: "global" | "team"; teamId?: string | null } | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [duration, setDuration] = useState("60");
  const [scope, setScope] = useState<"global" | "team" | "all">("global");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state) { setScope(state.scope); setReason(""); setDuration("60"); }
  }, [state]);

  if (!state) return null;

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const mins = duration === "perm" ? null : parseInt(duration, 10);
    const expires = mins === null ? null : new Date(Date.now() + mins * 60 * 1000).toISOString();
    const { error } = await supabase.from("chat_mutes").insert({
      user_id: state.userId,
      muted_by: user.id,
      scope,
      team_id: scope === "team" ? state.teamId ?? null : null,
      expires_at: expires,
      reason: sanitizeText(reason).slice(0, 300) || null,
    });
    if (error) { toast.error(error.message); setBusy(false); return; }
    await logAdminAction({
      action: "chat_user_mute",
      targetType: "user",
      targetId: state.userId,
      details: { scope, expires, reason },
    });
    toast.success("Mute applicato");
    setBusy(false);
    onClose();
  };

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <VolumeX className="h-5 w-5 text-warning" /> Mute utente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Scope</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as "global" | "team" | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Solo globale</SelectItem>
                <SelectItem value="team" disabled={!state.teamId}>Solo team</SelectItem>
                <SelectItem value="all">Tutte le chat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Durata</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 ora</SelectItem>
                <SelectItem value="1440">24 ore</SelectItem>
                <SelectItem value="10080">7 giorni</SelectItem>
                <SelectItem value="perm">Permanente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Motivo</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Motivo del mute…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Annulla</Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Applica mute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}