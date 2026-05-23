import { useEffect, useMemo, useState } from "react";
import { Plus, Trophy, Download, X, Pencil, ArrowRightLeft, Loader2, GitBranch, Sparkles, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { downloadCSV, formatRelative, logAdminAction, toCSV } from "@/lib/admin";
import { sanitizeText } from "@/lib/security";
import TournamentWizardDialog from "@/components/admin/tournament-wizard/TournamentWizardDialog";
import type { WizardForm } from "@/components/admin/tournament-wizard/types";
import { usePeakAIBot } from "@/hooks/usePeakAIBot";

const VALORANT_MAPS = ["Ascent", "Breeze", "Fracture", "Haven", "Lotus", "Pearl", "Split"] as const;

const FORMAT_OPTIONS = [
  { value: "single_elim",  label: "Eliminazione Diretta" },
  { value: "double_elim",  label: "Doppia Eliminazione" },
  { value: "groups",       label: "Gironi" },
  { value: "groups_elim",  label: "Gironi + Eliminazione" },
  { value: "swiss",        label: "Swiss" },
  { value: "round_robin",  label: "Round Robin" },
];
const BO_OPTIONS = ["BO1", "BO3", "BO5"];
const MAP_MODES = [
  { value: "random",  label: "Random dal pool" },
  { value: "ban",     label: "Ban system (a turno)" },
  { value: "all",     label: "Tutte disponibili" },
  { value: "fixed",   label: "Mappa fissa" },
];
const ENTRY_OPTIONS = [
  { value: "open",    label: "Aperta" },
  { value: "invite",  label: "Su invito" },
  { value: "paid",    label: "A pagamento (PeakCoins)" },
];
const REWARD_BADGES = [
  { value: "",                  label: "Nessuno" },
  { value: "cup_winner",        label: "Cup Winner" },
  { value: "challenger_elite",  label: "Challenger Elite" },
  { value: "peak_champion",     label: "Peak Champion" },
];
const REWARD_BANNERS = [
  { value: "",          label: "Nessuno" },
  { value: "red",       label: "Rosso" },
  { value: "purple",    label: "Viola" },
  { value: "gold_anim", label: "Oro animato" },
];
const STATUS_OPTIONS = ["upcoming", "live", "completed"];

type Tournament = {
  id: string;
  name: string;
  game: string;
  format: string;
  bo: string;
  bracket_type: string;
  map_mode: string;
  map_pool: string[] | null;
  fixed_map: string | null;
  max_teams: number;
  entry_type: string;
  entry_cost_coins: number;
  reward_trophies: number;
  reward_badge: string | null;
  reward_banner: string | null;
  seeding_enabled: boolean;
  min_elo: number | null;
  rank_max: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  description: string | null;
};

type FormState = Omit<Tournament, "id" | "game" | "bracket_type"> & {
  id?: string;
  bracket_type: string;
};

const emptyForm: FormState = {
  name: "",
  format: "single_elim",
  bracket_type: "single_elim",
  bo: "BO1",
  map_mode: "random",
  map_pool: [...VALORANT_MAPS],
  fixed_map: null,
  max_teams: 16,
  entry_type: "open",
  entry_cost_coins: 0,
  reward_trophies: 0,
  reward_badge: null,
  reward_banner: null,
  seeding_enabled: false,
  min_elo: 0,
  rank_max: 9999,
  start_date: null,
  end_date: null,
  status: "upcoming",
  description: "",
};

function statusBadge(s: string) {
  const map: Record<string, string> = {
    upcoming:  "bg-primary/20 text-primary border-primary/30",
    live:      "bg-accent/20 text-accent border-accent/30",
    completed: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
  };
  return <Badge className={`${map[s] ?? ""} font-display text-xs uppercase`}>{s}</Badge>;
}

export default function AdminTournaments() {
  const { user } = useAuth();
  const [items, setItems] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [replaceFor, setReplaceFor] = useState<Tournament | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitial, setWizardInitial] = useState<(Partial<WizardForm> & { id?: string }) | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Errore caricamento tornei");
    setItems((data ?? []) as Tournament[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => filter === "all" ? items : items.filter((t) => t.status === filter),
    [items, filter]
  );

  const openCreate = () => { setForm(emptyForm); setOpen(true); };
  const openEdit = (t: Tournament) => {
    setForm({
      ...emptyForm,
      ...t,
      map_pool: t.map_pool ?? [],
      description: t.description ?? "",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("Nome obbligatorio"); return; }
    if (form.map_mode === "fixed" && !form.fixed_map) { toast.error("Scegli la mappa fissa"); return; }
    setSubmitting(true);
    const payload = {
      name: sanitizeText(form.name).slice(0, 80),
      game: "valorant",
      format: form.format,
      bracket_type: form.format,
      bo: form.bo,
      map_mode: form.map_mode,
      map_pool: form.map_pool,
      fixed_map: form.map_mode === "fixed" ? form.fixed_map : null,
      max_teams: form.max_teams,
      entry_type: form.entry_type,
      entry_cost_coins: form.entry_type === "paid" ? form.entry_cost_coins : 0,
      reward_trophies: form.reward_trophies,
      reward_badge: form.reward_badge || null,
      reward_banner: form.reward_banner || null,
      seeding_enabled: form.seeding_enabled,
      min_elo: form.min_elo ?? 0,
      rank_max: form.rank_max ?? 9999,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      description: sanitizeText(form.description ?? "").slice(0, 1000) || null,
      created_by: user.id,
    };

    if (form.id) {
      const { error } = await supabase.from("tournaments").update(payload).eq("id", form.id);
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      await logAdminAction({ action: "tournament_update", targetType: "tournament", targetId: form.id });
      toast.success("Torneo aggiornato");
    } else {
      const { data, error } = await supabase.from("tournaments").insert(payload).select("id").maybeSingle();
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      await logAdminAction({ action: "tournament_create", targetType: "tournament", targetId: data?.id });
      toast.success("Torneo creato");
    }
    setOpen(false);
    setSubmitting(false);
    load();
  };

  const closeTournament = async (t: Tournament) => {
    const { error } = await supabase.from("tournaments").update({ status: "completed" }).eq("id", t.id);
    if (error) return toast.error(error.message);
    await logAdminAction({ action: "tournament_close", targetType: "tournament", targetId: t.id });
    toast.success("Torneo chiuso");
    load();
  };

  const exportCSV = async (t: Tournament) => {
    const { data, error } = await supabase
      .from("tournament_entries")
      .select("placement,points_earned,registered_at,status,team_id,user_id")
      .eq("tournament_id", t.id)
      .order("placement", { ascending: true, nullsFirst: false });
    if (error) return toast.error(error.message);
    const csv = toCSV(data ?? []);
    downloadCSV(`tournament-${t.name.replace(/\s+/g, "_")}.csv`, csv);
    await logAdminAction({ action: "tournament_export_csv", targetType: "tournament", targetId: t.id });
  };

  return (
    <AdminLayout
      title="Tornei"
      description="Crea, modifica e gestisci i tornei della piattaforma."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Quick create
          </Button>
          <Button variant="default" size="sm" onClick={() => { setWizardInitial(null); setWizardOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Advanced wizard
          </Button>
        </div>
      }
    >
      <div className="flex gap-2 mb-4">
        {[{ v: "all", l: "Tutti" }, ...STATUS_OPTIONS.map((s) => ({ v: s, l: s }))].map((o) => (
          <button
            key={o.v}
            onClick={() => setFilter(o.v)}
            className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider border transition-colors ${
              filter === o.v ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-display">Nome</TableHead>
              <TableHead className="font-display">Formato</TableHead>
              <TableHead className="font-display">BO</TableHead>
              <TableHead className="font-display">Team</TableHead>
              <TableHead className="font-display">Status</TableHead>
              <TableHead className="font-display">Creato</TableHead>
              <TableHead className="font-display text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Caricamento…</TableCell></TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nessun torneo</TableCell></TableRow>
            )}
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-display font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" /> {t.name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {FORMAT_OPTIONS.find((f) => f.value === t.format)?.label ?? t.format}
                </TableCell>
                <TableCell className="font-mono text-xs">{t.bo}</TableCell>
                <TableCell className="font-mono text-sm">{t.max_teams}</TableCell>
                <TableCell>{statusBadge(t.status)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatRelative((t as { created_at?: string }).created_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReplaceFor(t)} title="Sostituisci team">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => exportCSV(t)} title="Esporta CSV">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => {
                      if (!confirm(`Generare bracket per "${t.name}"? I match pending verranno sostituiti.`)) return;
                      const { error } = await supabase.rpc("generate_bracket", { _tournament_id: t.id });
                      if (error) { toast.error(error.message); return; }
                      await logAdminAction({ action: "bracket_generate", targetType: "tournament", targetId: t.id });
                      toast.success("Bracket generato");
                    }} title="Genera bracket">
                      <GitBranch className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)} title="Modifica">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setWizardInitial({ id: t.id, name: t.name, game: (t.game as any) ?? "valorant", description: t.description ?? "", max_teams: t.max_teams, status: t.status }); setWizardOpen(true); }} title="Edit advanced">
                      <Pencil className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    {t.status !== "completed" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => closeTournament(t)} title="Chiudi torneo">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TournamentFormDialog
        open={open}
        onOpenChange={setOpen}
        form={form}
        setForm={setForm}
        onSubmit={submit}
        submitting={submitting}
      />

      <ReplaceTeamDialog
        tournament={replaceFor}
        onClose={() => setReplaceFor(null)}
        onDone={load}
      />

      <TournamentWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        initial={wizardInitial ?? undefined}
        onSaved={load}
      />
    </AdminLayout>
  );
}

/* ─────────── Form dialog ─────────── */

function TournamentFormDialog({
  open, onOpenChange, form, setForm, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: FormState;
  setForm: (f: FormState) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const update = (patch: Partial<FormState>) => setForm({ ...form, ...patch });
  const togglePoolMap = (m: string) => {
    const cur = new Set(form.map_pool ?? []);
    cur.has(m) ? cur.delete(m) : cur.add(m);
    update({ map_pool: Array.from(cur) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{form.id ? "Modifica torneo" : "Nuovo torneo"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Nome torneo</Label>
            <Input value={form.name} onChange={(e) => update({ name: e.target.value })} maxLength={80} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Formato</Label>
              <Select value={form.format} onValueChange={(v) => update({ format: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Best Of</Label>
              <Select value={form.bo} onValueChange={(v) => update({ bo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BO_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Modalità mappe</Label>
            <Select value={form.map_mode} onValueChange={(v) => update({ map_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MAP_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {form.map_mode === "fixed" ? (
            <div>
              <Label>Mappa fissa</Label>
              <Select value={form.fixed_map ?? ""} onValueChange={(v) => update({ fixed_map: v })}>
                <SelectTrigger><SelectValue placeholder="Scegli mappa" /></SelectTrigger>
                <SelectContent>{VALORANT_MAPS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label className="mb-2 block">Pool mappe</Label>
              <div className="flex flex-wrap gap-2">
                {VALORANT_MAPS.map((m) => {
                  const sel = (form.map_pool ?? []).includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => togglePoolMap(m)}
                      className={`px-2.5 py-1 rounded text-xs font-display uppercase tracking-wider border ${
                        sel ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Max team</Label>
              <Select value={String(form.max_teams)} onValueChange={(v) => update({ max_teams: parseInt(v, 10) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[8, 16, 32, 64].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Min ELO</Label>
              <Input type="number" min={0} value={form.min_elo ?? 0} onChange={(e) => update({ min_elo: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <div>
              <Label>Max ELO</Label>
              <Input type="number" min={0} value={form.rank_max ?? 9999} onChange={(e) => update({ rank_max: parseInt(e.target.value, 10) || 9999 })} />
            </div>
          </div>

          <div>
            <Label>Iscrizione</Label>
            <Select value={form.entry_type} onValueChange={(v) => update({ entry_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ENTRY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.entry_type === "paid" && (
            <div>
              <Label>Costo iscrizione (PeakCoins)</Label>
              <Input type="number" min={0} value={form.entry_cost_coins} onChange={(e) => update({ entry_cost_coins: parseInt(e.target.value, 10) || 0 })} />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Trofei</Label>
              <Input type="number" min={0} value={form.reward_trophies} onChange={(e) => update({ reward_trophies: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <div>
              <Label>Badge</Label>
              <Select value={form.reward_badge ?? "__none"} onValueChange={(v) => update({ reward_badge: v === "__none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REWARD_BADGES.map((o) => <SelectItem key={o.value || "none"} value={o.value === "" ? "__none" : o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Banner</Label>
              <Select value={form.reward_banner ?? "__none"} onValueChange={(v) => update({ reward_banner: v === "__none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REWARD_BANNERS.map((o) => <SelectItem key={o.value || "none"} value={o.value === "" ? "__none" : o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded border border-border p-3">
            <div>
              <p className="text-sm font-display">Seeding manuale bracket</p>
              <p className="text-xs text-muted-foreground">Permette di trascinare i team prima dell'inizio</p>
            </div>
            <Switch checked={form.seeding_enabled} onCheckedChange={(v) => update({ seeding_enabled: v })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data inizio</Label>
              <Input type="datetime-local" value={form.start_date ? form.start_date.slice(0, 16) : ""} onChange={(e) => update({ start_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
            <div>
              <Label>Data fine</Label>
              <Input type="datetime-local" value={form.end_date ? form.end_date.slice(0, 16) : ""} onChange={(e) => update({ end_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update({ status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrizione</Label>
            <Textarea rows={3} value={form.description ?? ""} onChange={(e) => update({ description: e.target.value })} maxLength={1000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Annulla</Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {form.id ? "Salva" : "Crea torneo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── Replace team from waitlist ─────────── */

function ReplaceTeamDialog({
  tournament, onClose, onDone,
}: {
  tournament: Tournament | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [registered, setRegistered] = useState<{ team_id: string; team_name: string }[]>([]);
  const [waitlist, setWaitlist] = useState<{ team_id: string; team_name: string; position: number }[]>([]);
  const [removeId, setRemoveId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tournament) return;
    (async () => {
      const [{ data: regs }, { data: wl }] = await Promise.all([
        supabase
          .from("tournament_registrations")
          .select("team_id")
          .eq("tournament_id", tournament.id),
        supabase
          .from("tournament_waitlist")
          .select("team_id, position")
          .eq("tournament_id", tournament.id)
          .order("position", { ascending: true }),
      ]);
      const allIds = Array.from(new Set([
        ...((regs ?? []).map((r) => r.team_id)),
        ...((wl ?? []).map((r) => r.team_id)),
      ]));
      const { data: teams } = allIds.length
        ? await supabase.from("teams").select("id, name").in("id", allIds)
        : { data: [] as { id: string; name: string }[] };
      const nameOf = new Map((teams ?? []).map((t) => [t.id, t.name]));
      setRegistered((regs ?? []).map((r) => ({ team_id: r.team_id, team_name: nameOf.get(r.team_id) ?? r.team_id })));
      setWaitlist((wl ?? []).map((r) => ({ team_id: r.team_id, position: r.position, team_name: nameOf.get(r.team_id) ?? r.team_id })));
      setRemoveId("");
    })();
  }, [tournament]);

  const replace = async () => {
    if (!tournament || !removeId) return;
    if (waitlist.length === 0) { toast.error("Lista d'attesa vuota"); return; }
    setBusy(true);
    const next = waitlist[0];
    // Remove disqualified
    const { error: e1 } = await supabase
      .from("tournament_registrations")
      .delete()
      .eq("tournament_id", tournament.id)
      .eq("team_id", removeId);
    if (e1) { toast.error(e1.message); setBusy(false); return; }
    // Add waitlist[0]
    const { error: e2 } = await supabase
      .from("tournament_registrations")
      .insert({ tournament_id: tournament.id, team_id: next.team_id });
    if (e2) { toast.error(e2.message); setBusy(false); return; }
    // Remove from waitlist
    await supabase
      .from("tournament_waitlist")
      .delete()
      .eq("tournament_id", tournament.id)
      .eq("team_id", next.team_id);
    await logAdminAction({
      action: "tournament_replace_team",
      targetType: "tournament",
      targetId: tournament.id,
      details: { removed_team_id: removeId, added_team_id: next.team_id },
    });
    toast.success(`${next.team_name} promosso da lista d'attesa`);
    setBusy(false);
    onClose();
    onDone();
  };

  return (
    <Dialog open={!!tournament} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Sostituisci team squalificato</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm">
          <div>
            <Label>Team da rimuovere</Label>
            <Select value={removeId} onValueChange={setRemoveId}>
              <SelectTrigger><SelectValue placeholder="Scegli team iscritto" /></SelectTrigger>
              <SelectContent>
                {registered.map((r) => <SelectItem key={r.team_id} value={r.team_id}>{r.team_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded border border-border p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Prossimo in lista d'attesa</p>
            {waitlist[0]
              ? <p className="font-display">{waitlist[0].team_name}</p>
              : <p className="text-muted-foreground text-xs">Nessun team in attesa</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Annulla</Button>
          <Button onClick={replace} disabled={busy || !removeId || waitlist.length === 0}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sostituisci
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
