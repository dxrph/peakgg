import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Trophy, Plus, Lock } from "lucide-react";
import { toast } from "sonner";
import { logAdminAction, formatRelative } from "@/lib/admin";

type Season = {
  id: string; name: string; slug: string;
  starts_at: string; ends_at: string;
  active: boolean; soft_reset_factor: number;
  closed_at: string | null;
};
type Result = {
  id: string; season_id: string; user_id: string; game: string;
  final_elo: number; placement: number;
  trophies_awarded: number; peak_coins_awarded: number;
};

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selected, setSelected] = useState<Season | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", starts_at: "", ends_at: "", soft_reset_factor: "0.5" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("seasons").select("*").order("starts_at", { ascending: false });
    setSeasons((data ?? []) as Season[]);
  };

  useEffect(() => { load(); }, []);

  const loadResults = async (s: Season) => {
    setSelected(s);
    const { data } = await supabase
      .from("season_results").select("*")
      .eq("season_id", s.id).order("placement", { ascending: true }).limit(100);
    const rows = (data ?? []) as Result[];
    setResults(rows);
    const ids = [...new Set(rows.map(r => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", ids);
      const map: Record<string, string> = {};
      for (const p of profs ?? []) map[p.id] = p.username;
      setUsernames(map);
    }
  };

  const create = async () => {
    if (!form.name || !form.slug || !form.starts_at || !form.ends_at) {
      toast.error("Compila tutti i campi"); return;
    }
    setLoading(true);
    const { error } = await supabase.from("seasons").insert({
      name: form.name, slug: form.slug,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      active: true,
      soft_reset_factor: parseFloat(form.soft_reset_factor) || 0.5,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await logAdminAction({ action: "season_create", targetType: "seasons", details: { name: form.name } });
    toast.success("Stagione creata");
    setOpen(false);
    setForm({ name: "", slug: "", starts_at: "", ends_at: "", soft_reset_factor: "0.5" });
    load();
  };

  const closeSeason = async (s: Season) => {
    if (!confirm(`Chiudere "${s.name}"? Verranno distribuiti premi e applicato il soft reset.`)) return;
    const { error } = await supabase.rpc("close_season", { _season_id: s.id });
    if (error) { toast.error(error.message); return; }
    await logAdminAction({ action: "season_close", targetType: "seasons", targetId: s.id, details: { name: s.name } });
    toast.success("Stagione chiusa, premi distribuiti");
    load();
  };

  return (
    <AdminLayout
      title="Stagioni Ranked"
      description="Cicli competitivi: snapshot, premi e soft reset ELO"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuova stagione</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuova stagione</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Season 1" /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="s1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Inizio</Label><Input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></div>
                <div><Label>Fine</Label><Input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></div>
              </div>
              <div><Label>Soft reset factor (0–1)</Label><Input value={form.soft_reset_factor} onChange={e => setForm({ ...form, soft_reset_factor: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={create} disabled={loading}>Crea</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-display uppercase text-sm tracking-widest text-muted-foreground mb-3">Stagioni</h2>
          {seasons.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna stagione</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Stato</TableHead><TableHead>Fine</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {seasons.map(s => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => loadResults(s)}>
                    <TableCell className="font-display">{s.name}</TableCell>
                    <TableCell>
                      {s.active ? <Badge>Attiva</Badge> : s.closed_at ? <Badge variant="secondary">Chiusa</Badge> : <Badge variant="outline">—</Badge>}
                    </TableCell>
                    <TableCell className="text-xs">{formatRelative(s.ends_at)}</TableCell>
                    <TableCell>
                      {s.active && (
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); closeSeason(s); }}>
                          <Lock className="h-3 w-3 mr-1" /> Chiudi
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-display uppercase text-sm tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Risultati {selected?.name ?? ""}
          </h2>
          {!selected ? (
            <p className="text-sm text-muted-foreground">Seleziona una stagione</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun risultato (la stagione non è ancora stata chiusa)</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Player</TableHead><TableHead>Game</TableHead><TableHead>ELO</TableHead><TableHead>Coins</TableHead></TableRow></TableHeader>
              <TableBody>
                {results.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>#{r.placement}</TableCell>
                    <TableCell>{usernames[r.user_id] ?? r.user_id.slice(0, 8)}</TableCell>
                    <TableCell className="uppercase text-xs">{r.game}</TableCell>
                    <TableCell>{r.final_elo}</TableCell>
                    <TableCell>+{r.peak_coins_awarded}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}