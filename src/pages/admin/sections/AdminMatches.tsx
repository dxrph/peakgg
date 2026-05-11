import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ExternalLink, RefreshCw, Swords } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

type MatchRow = {
  id: string;
  game: string;
  kind: string;
  status: string;
  result_status: string;
  player_a_id: string | null;
  player_b_id: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  created_at: string;
  played_at: string | null;
  elo_processed_at: string | null;
};

type Filter = "all" | "live" | "pending" | "disputed" | "elo_pending" | "completed";

const STATUS_COLORS: Record<string, string> = {
  scheduled:            "bg-muted text-muted-foreground border-border",
  live:                 "bg-primary/15 text-primary border-primary/30",
  pending_confirmation: "bg-warning/15 text-warning border-warning/30",
  disputed:             "bg-destructive/15 text-destructive border-destructive/30",
  confirmed:            "bg-success/15 text-success border-success/30",
  admin_resolved:       "bg-success/15 text-success border-success/30",
};

export default function AdminMatches() {
  const [filter, setFilter] = useState<Filter>("disputed");
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { username: string }>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from("matches")
        .select("id,game,kind,status,result_status,player_a_id,player_b_id,team_a_id,team_b_id,score_a,score_b,created_at,played_at,elo_processed_at")
        .in("kind", ["open_cup", "ranked"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter === "live") q = q.eq("result_status", "live");
      else if (filter === "pending") q = q.eq("result_status", "pending_confirmation");
      else if (filter === "disputed") q = q.eq("result_status", "disputed");
      else if (filter === "completed") q = q.eq("status", "completed");
      else if (filter === "elo_pending") q = q.eq("status", "completed").is("elo_processed_at", null);

      const { data, error } = await q;
      if (error) throw error;
      const list = (data ?? []) as MatchRow[];
      setMatches(list);

      const userIds = Array.from(new Set(list.flatMap(m => [m.player_a_id, m.player_b_id].filter(Boolean) as string[])));
      if (userIds.length) {
        const { data: ps } = await supabase.from("profiles").select("id,username").in("id", userIds);
        const pmap: Record<string, { username: string }> = {};
        (ps ?? []).forEach((p: any) => { pmap[p.id] = { username: p.username }; });
        setProfiles(pmap);
      }
    } catch {
      toast.error("Could not load matches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const counts = useMemo(() => ({ total: matches.length }), [matches]);

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "disputed", label: "Disputed" },
    { id: "pending", label: "Pending confirmation" },
    { id: "live", label: "Live" },
    { id: "elo_pending", label: "ELO pending" },
    { id: "completed", label: "Completed" },
    { id: "all", label: "All" },
  ];

  return (
    <AdminLayout
      title="Match monitor"
      description="Live state of competitive matches. Resolve from the match page."
      actions={
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
        </Button>
      }
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider border transition-colors ${
              filter === f.id ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{counts.total} result{counts.total === 1 ? "" : "s"}</span>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-display">Match</TableHead>
              <TableHead className="font-display">Game</TableHead>
              <TableHead className="font-display">Kind</TableHead>
              <TableHead className="font-display">Players</TableHead>
              <TableHead className="font-display">Score</TableHead>
              <TableHead className="font-display">Status</TableHead>
              <TableHead className="font-display">ELO</TableHead>
              <TableHead className="font-display">Created</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
              </TableCell></TableRow>
            )}
            {!loading && matches.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                <Swords className="h-5 w-5 inline mr-2 opacity-50" /> No matches in this filter
              </TableCell></TableRow>
            )}
            {matches.map(m => {
              const a = m.player_a_id ? profiles[m.player_a_id]?.username : null;
              const b = m.player_b_id ? profiles[m.player_b_id]?.username : null;
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-xs uppercase">{m.game}</TableCell>
                  <TableCell className="text-xs uppercase">{m.kind}</TableCell>
                  <TableCell className="text-xs">{a ?? "—"} vs {b ?? "—"}</TableCell>
                  <TableCell className="text-xs">{m.score_a ?? "—"} – {m.score_b ?? "—"}</TableCell>
                  <TableCell><Badge className={`${STATUS_COLORS[m.result_status] ?? ""} text-xs uppercase`}>{m.result_status}</Badge></TableCell>
                  <TableCell className="text-xs">
                    {m.elo_processed_at
                      ? <Badge className="bg-muted text-muted-foreground border-border text-[10px]">done</Badge>
                      : m.status === "completed"
                      ? <Badge className="bg-warning/15 text-warning border-warning/30 text-[10px]">pending</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/matches/${m.id}`}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
