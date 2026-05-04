import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Bell, Plus, RefreshCcw, Search, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { logAdminAction, formatRelative } from "@/lib/admin";
import { sanitizeText } from "@/lib/security";

type Announcement = {
  id: string;
  title: string;
  body: string;
  active: boolean;
  urgent: boolean;
  created_by: string;
  created_at: string;
};

type Filter = "all" | "active" | "inactive" | "urgent";

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", body: "", active: true, urgent: false });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setItems((data ?? []) as Announcement[]);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", body: "", active: true, urgent: false });
    setOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, body: a.body, active: a.active, urgent: a.urgent });
    setOpen(true);
  };

  const submit = async () => {
    if (!user) return;
    const title = sanitizeText(form.title).trim().slice(0, 120);
    const body = sanitizeText(form.body).trim().slice(0, 4000);
    if (title.length < 3 || body.length < 5) {
      toast.error("Titolo (3+) e testo (5+) richiesti");
      return;
    }
    if (editing) {
      const { error } = await supabase
        .from("announcements")
        .update({ title, body, active: form.active, urgent: form.urgent })
        .eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      await logAdminAction({
        action: "announcement_toggle",
        targetType: "announcement",
        targetId: editing.id,
        details: { title, urgent: form.urgent, active: form.active, edited: true },
      });
      toast.success("Annuncio aggiornato");
    } else {
      const { data, error } = await supabase
        .from("announcements")
        .insert({ title, body, active: form.active, urgent: form.urgent, created_by: user.id })
        .select("id")
        .maybeSingle();
      if (error) { toast.error(error.message); return; }
      await logAdminAction({
        action: "announcement_create",
        targetType: "announcement",
        targetId: data?.id,
        details: { title, urgent: form.urgent, active: form.active },
      });
      toast.success("Annuncio pubblicato");
    }
    setOpen(false);
    load();
  };

  const toggleActive = async (a: Announcement) => {
    const { error } = await supabase
      .from("announcements")
      .update({ active: !a.active })
      .eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    await logAdminAction({
      action: "announcement_toggle",
      targetType: "announcement",
      targetId: a.id,
      details: { active: !a.active },
    });
    load();
  };

  const remove = async (a: Announcement) => {
    if (!confirm(`Eliminare l'annuncio "${a.title}"?`)) return;
    const { error } = await supabase.from("announcements").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    await logAdminAction({
      action: "announcement_toggle",
      targetType: "announcement",
      targetId: a.id,
      details: { deleted: true, title: a.title },
    });
    toast.success("Annuncio eliminato");
    load();
  };

  const filtered = items.filter((a) => {
    if (filter === "active" && !a.active) return false;
    if (filter === "inactive" && a.active) return false;
    if (filter === "urgent" && !a.urgent) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!a.title.toLowerCase().includes(s) && !a.body.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <AdminLayout title="Annunci" description="Comunicazioni globali alla community">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Cerca…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "inactive", "urgent"] as Filter[]).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "ghost"} onClick={() => setFilter(f)} className="font-display uppercase tracking-wider">
              {f === "all" ? "Tutti" : f === "active" ? "Attivi" : f === "inactive" ? "Inattivi" : "Urgenti"}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Nuovo
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titolo</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Creato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="flex items-start gap-2">
                    {a.urgent && <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-sm truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-md">{a.body}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={a.active} onCheckedChange={() => toggleActive(a)} />
                    <Badge variant={a.active ? "default" : "outline"} className="font-display">
                      {a.active ? "ON" : "OFF"}
                    </Badge>
                    {a.urgent && <Badge variant="destructive" className="font-display">URGENTE</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatRelative(a.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(a)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nessun annuncio
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifica annuncio" : "Nuovo annuncio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Titolo</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} />
              <p className="text-xs text-muted-foreground mt-1">{form.title.length}/120</p>
            </div>
            <div>
              <Label>Testo</Label>
              <Textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={4000} />
              <p className="text-xs text-muted-foreground mt-1">{form.body.length}/4000</p>
            </div>
            <div className="flex items-center justify-between">
              <Label>Attivo</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Urgente</Label>
              <Switch checked={form.urgent} onCheckedChange={(v) => setForm({ ...form, urgent: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
            <Button onClick={submit}>{editing ? "Salva" : "Pubblica"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}