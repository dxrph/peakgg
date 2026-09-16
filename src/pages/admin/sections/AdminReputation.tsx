import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Trash2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { logAdminAction, formatRelative } from "@/lib/admin";

type Vote = {
  id: string;
  player_id: string;
  voter_id: string;
  match_id: string;
  communication: number;
  fairplay: number;
  punctuality: number;
  created_at: string;
};

type ProfileLite = { id: string; username: string; reputation_score: number };

export default function AdminReputation() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [low, setLow] = useState<ProfileLite[]>([]);
  const [top, setTop] = useState<ProfileLite[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: vs }, { data: lo }, { data: tp }] = await Promise.all([
      supabase.from("reputation_votes").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id, username, reputation_score").order("reputation_score", { ascending: true }).limit(20),
      supabase.from("profiles").select("id, username, reputation_score").order("reputation_score", { ascending: false }).limit(20),
    ]);
    setVotes((vs ?? []) as Vote[]);
    setLow((lo ?? []) as ProfileLite[]);
    setTop((tp ?? []) as ProfileLite[]);
    const ids = [...new Set([...(vs ?? []).map((v) => v.player_id), ...(vs ?? []).map((v) => v.voter_id)])];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, reputation_score").in("id", ids);
      const map: Record<string, ProfileLite> = {};
      for (const p of profs ?? []) map[p.id] = p as ProfileLite;
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (v: Vote) => {
    if (!confirm("Eliminare questo voto?")) return;
    const { error } = await supabase.from("reputation_votes").delete().eq("id", v.id);
    if (error) { toast.error(error.message); return; }
    await logAdminAction({
      action: "ticket_review",
      targetType: "reputation_vote",
      targetId: v.id,
      details: { player_id: v.player_id, voter_id: v.voter_id },
    });
    toast.success("Voto eliminato");
    load();
  };

  const avg = (v: Vote) => ((v.communication + v.fairplay + v.punctuality) / 3).toFixed(1);

  return (
    <AdminLayout title="Reputazione" description="Voti tra giocatori e classifica reputazione">
      <Tabs defaultValue="votes">
        <TabsList>
          <TabsTrigger value="votes">Voti recenti</TabsTrigger>
          <TabsTrigger value="low">Reputazione più bassa</TabsTrigger>
          <TabsTrigger value="top">Top reputazione</TabsTrigger>
        </TabsList>

        <TabsContent value="votes">
          <div className="flex justify-end mb-2">
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Aggiorna
            </Button>
          </div>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Giocatore</TableHead>
                  <TableHead>Da</TableHead>
                  <TableHead>Comm.</TableHead>
                  <TableHead>Fairplay</TableHead>
                  <TableHead>Punt.</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {votes.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatRelative(v.created_at)}</TableCell>
                    <TableCell className="font-display">{profiles[v.player_id]?.username ?? v.player_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{profiles[v.voter_id]?.username ?? v.voter_id.slice(0, 8)}</TableCell>
                    <TableCell>{v.communication}</TableCell>
                    <TableCell>{v.fairplay}</TableCell>
                    <TableCell>{v.punctuality}</TableCell>
                    <TableCell><Badge variant="outline" className="font-display">{avg(v)}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => remove(v)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {votes.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nessun voto</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="low">
          <RepList list={low} accent="destructive" />
        </TabsContent>
        <TabsContent value="top">
          <RepList list={top} accent="primary" />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

function RepList({ list, accent }: { list: ProfileLite[]; accent: "destructive" | "primary" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <ul className="space-y-1.5">
        {list.map((p, i) => (
          <li key={p.id} className="flex items-center justify-between text-sm">
            <span className="font-display"><span className="text-muted-foreground mr-2">#{i + 1}</span>{p.username}</span>
            <span className={`font-display flex items-center gap-1 text-${accent}`}>
              <Star className="h-3.5 w-3.5" /> {Number(p.reputation_score).toFixed(2)}
            </span>
          </li>
        ))}
        {list.length === 0 && <li className="text-sm text-muted-foreground">Nessun dato</li>}
      </ul>
    </div>
  );
}
