import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, Plus, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { logAdminAction, formatRelative } from "@/lib/admin";
import { sanitizeText } from "@/lib/security";

type Tx = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
};

type ProfileLite = { id: string; username: string; peak_coins: number };

export default function AdminEconomy() {
  const [tx, setTx] = useState<Tx[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [topHolders, setTopHolders] = useState<ProfileLite[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: "", amount: "", reason: "" });

  const load = async () => {
    setLoading(true);
    const [{ data: txs }, { data: top }] = await Promise.all([
      supabase.from("peak_coins_transactions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("id, username, peak_coins").order("peak_coins", { ascending: false }).limit(20),
    ]);
    setTx((txs ?? []) as Tx[]);
    setTopHolders((top ?? []) as ProfileLite[]);
    const ids = [...new Set((txs ?? []).map((t) => t.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, peak_coins").in("id", ids);
      const map: Record<string, ProfileLite> = {};
      for (const p of profs ?? []) map[p.id] = p as ProfileLite;
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    const username = form.username.trim();
    const amount = parseInt(form.amount, 10);
    const reason = sanitizeText(form.reason).trim().slice(0, 200);
    if (!username || !Number.isFinite(amount) || amount === 0 || reason.length < 3) {
      toast.error("Username, importo (≠ 0) e motivo (3+ caratteri) richiesti");
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("id, username").eq("username", username).maybeSingle();
    if (!prof) { toast.error("Utente non trovato"); return; }
    const { error } = await supabase.from("peak_coins_transactions").insert({
      user_id: prof.id, amount, reason,
    });
    if (error) { toast.error(error.message); return; }
    await logAdminAction({
      action: "elo_adjust",
      targetType: "user",
      targetId: prof.id,
      details: { peak_coins_delta: amount, reason },
    });
    toast.success(`${amount > 0 ? "+" : ""}${amount} coin a ${prof.username}`);
    setOpen(false);
    setForm({ username: "", amount: "", reason: "" });
    load();
  };

  const filtered = tx.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (profiles[t.user_id]?.username ?? "").toLowerCase().includes(s) || t.reason.toLowerCase().includes(s);
  });

  return (
    <AdminLayout title="Economia" description="Peak Coins: transazioni e top holders">
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-sm uppercase tracking-wider text-muted-foreground">Transazioni recenti</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8 h-9 w-48" placeholder="Cerca..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Aggiungi</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nuova transazione Peak Coins</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} maxLength={32} /></div>
                    <div><Label>Importo (negativo per addebito)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                    <div><Label>Motivo</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} maxLength={200} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
                    <Button onClick={submit}>Conferma</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Utente</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatRelative(t.created_at)}</TableCell>
                  <TableCell className="font-display text-sm">{profiles[t.user_id]?.username ?? t.user_id.slice(0, 8)}</TableCell>
                  <TableCell className="text-right font-display">
                    <Badge variant={t.amount >= 0 ? "default" : "destructive"} className="font-display">
                      {t.amount > 0 ? "+" : ""}{t.amount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[320px] truncate">{t.reason}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nessuna transazione</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" /> Top holders
          </p>
          <ul className="space-y-1.5">
            {topHolders.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-display"><span className="text-muted-foreground mr-2">#{i + 1}</span>{p.username}</span>
                <span className="font-display text-primary">{p.peak_coins}</span>
              </li>
            ))}
            {topHolders.length === 0 && <li className="text-sm text-muted-foreground">Nessun dato</li>}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
