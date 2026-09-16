import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingDown, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin";

type Suspect = {
  id: string; username: string; smurf_risk_score: number;
  created_at: string; reputation_score: number;
};

export default function AdminElo() {
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [decaying, setDecaying] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, smurf_risk_score, created_at, reputation_score")
      .gte("smurf_risk_score", 40)
      .order("smurf_risk_score", { ascending: false })
      .limit(50);
    setSuspects((data ?? []) as Suspect[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runDecay = async () => {
    if (!confirm("Applicare il decay ELO a tutti gli inattivi >14 giorni?")) return;
    setDecaying(true);
    const { data, error } = await supabase.rpc("apply_elo_decay");
    setDecaying(false);
    if (error) { toast.error(error.message); return; }
    const row = Array.isArray(data) && data[0] ? data[0] : null;
    await logAdminAction({ action: "elo_decay", targetType: "player_stats", details: row });
    toast.success(`Decay applicato: ${row?.affected_users ?? 0} player, -${row?.total_decay ?? 0} ELO`);
  };

  const recalcRisk = async (userId: string) => {
    const { error } = await supabase.rpc("recalculate_smurf_risk", { _user_id: userId });
    if (error) { toast.error(error.message); return; }
    toast.success("Risk score ricalcolato");
    load();
  };

  const riskColor = (s: number) =>
    s >= 70 ? "destructive" : s >= 50 ? "default" : "secondary";

  return (
    <AdminLayout
      title="ELO Tools"
      description="Decay inattività e detection smurf"
      actions={
        <Button onClick={runDecay} disabled={decaying} size="sm">
          <TrendingDown className="h-4 w-4 mr-1" />
          {decaying ? "Applicando..." : "Applica decay"}
        </Button>
      }
    >
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display uppercase text-sm tracking-widest text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" /> Sospetti smurf (risk ≥ 40)
          </h2>
          <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        ) : suspects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun sospetto al momento 👌</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Reputazione</TableHead>
                <TableHead>Creato</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suspects.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-display">{s.username}</TableCell>
                  <TableCell>
                    <Badge variant={riskColor(s.smurf_risk_score) as any}>{s.smurf_risk_score}/100</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{Number(s.reputation_score).toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => recalcRisk(s.id)}>Ricalcola</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-4 mt-4">
        <h2 className="font-display uppercase text-sm tracking-widest text-muted-foreground mb-2">
          Come funziona
        </h2>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li><strong>Decay:</strong> -10 ELO per ogni settimana di inattività oltre 14 giorni, mai sotto 1000.</li>
          <li><strong>ELO dinamico:</strong> formula Elo standard <code>K × (actual − expected)</code>. K=24 Open Cup/Ranked, 28 Challenger, 32 Peak Championship. Gli scrim non influenzano l'ELO ufficiale.</li>
          <li><strong>Smurf risk:</strong> calcolato da winrate, ELO climb 7gg, account age, streak, verifica.</li>
          <li><strong>Trigger:</strong> il risk si ricalcola automaticamente a ogni match completato.</li>
        </ul>
      </Card>
    </AdminLayout>
  );
}