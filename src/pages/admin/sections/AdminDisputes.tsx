import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Gavel, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

type DisputeRow = {
  id: string;
  match_id: string;
  opened_by: string;
  reason: string;
  evidence_url: string | null;
  status: string;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
};

type MatchRow = {
  id: string;
  game: string;
  kind: string;
  status: string;
  result_status: string;
  player_a_id: string | null;
  player_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  elo_processed_at: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  open:     "bg-destructive/15 text-destructive border-destructive/30",
  resolved: "bg-success/15 text-success border-success/30",
  rejected: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30",
};

export default function AdminDisputes() {
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchRow>>({});
  const [profiles, setProfiles] = useState<Record<string, { username: string }>>({});
  const [stuck, setStuck] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      let q = supabase.from("match_disputes").select("*").order("created_at", { ascending: false }).limit(200);
      if (filter === "open") q = q.eq("status", "open");
      const { data: d, error } = await q;
      if (error) throw error;
      const list = (d ?? []) as DisputeRow[];
      setDisputes(list);

      const matchIds = Array.from(new Set(list.map(x => x.match_id)));
      const matchMap: Record<string, MatchRow> = {};
      if (matchIds.length) {
        const { data: ms } = await supabase
          .from("matches")
          .select("id,game,kind,status,result_status,player_a_id,player_b_id,score_a,score_b,elo_processed_at")
          .in("id", matchIds);
        (ms ?? []).forEach((m: any) => { matchMap[m.id] = m; });
      }
      setMatches(matchMap);

      // Stuck matches: result_status = disputed but no dispute row at all
      const { data: dispMatches } = await supabase
        .from("matches")
        .select("id,game,kind,status,result_status,player_a_id,player_b_id,score_a,score_b,elo_processed_at")
        .eq("result_status", "disputed");
      const { data: allDisp } = await supabase.from("match_disputes").select("match_id");
      const everDisputed = new Set((allDisp ?? []).map((x: any) => x.match_id));
      setStuck(((dispMatches ?? []) as MatchRow[]).filter(m => !everDisputed.has(m.id)));

      const userIds = Array.from(new Set([
        ...list.map(x => x.opened_by),
        ...Object.values(matchMap).flatMap(m => [m.player_a_id, m.player_b_id].filter(Boolean) as string[]),
      ]));
      if (userIds.length) {
        const { data: ps } = await supabase.from("profiles").select("id,username").in("id", userIds);
        const pmap: Record<string, { username: string }> = {};
        (ps ?? []).forEach((p: any) => { pmap[p.id] = { username: p.username }; });
        setProfiles(pmap);
      }
    } catch (e: any) {
      toast.error("Could not load disputes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const counts = useMemo(() => ({
    open: disputes.filter(d => d.status === "open").length,
    total: disputes.length,
    stuck: stuck.length,
  }), [disputes, stuck]);

  return (
    <AdminLayout
      title="Match disputes"
      description="Unified inbox — every player dispute lives here. Resolve from the match page."
      actions={
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
        </Button>
      }
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(["open", "all"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider border transition-colors ${
              filter === s ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s} {s === "open" ? `(${counts.open})` : `(${counts.total})`}
          </button>
        ))}
        {counts.stuck > 0 && (
          <Badge className="bg-warning/15 text-warning border-warning/30 ml-2">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {counts.stuck} stuck disputed match{counts.stuck === 1 ? "" : "es"} (no dispute row)
          </Badge>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-display">Match</TableHead>
              <TableHead className="font-display">Game</TableHead>
              <TableHead className="font-display">Players</TableHead>
              <TableHead className="font-display">Score</TableHead>
              <TableHead className="font-display">Opened by</TableHead>
              <TableHead className="font-display">Reason</TableHead>
              <TableHead className="font-display">ELO</TableHead>
              <TableHead className="font-display">Status</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…
              </TableCell></TableRow>
            )}
            {!loading && disputes.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No disputes
              </TableCell></TableRow>
            )}
            {disputes.map(d => {
              const m = matches[d.match_id];
              const a = m?.player_a_id ? profiles[m.player_a_id]?.username : null;
              const b = m?.player_b_id ? profiles[m.player_b_id]?.username : null;
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.match_id.slice(0, 8)}</TableCell>
                  <TableCell className="text-xs uppercase">{m?.game ?? "—"}</TableCell>
                  <TableCell className="text-xs">{a ?? "—"} vs {b ?? "—"}</TableCell>
                  <TableCell className="text-xs">{m ? `${m.score_a ?? "—"} – ${m.score_b ?? "—"}` : "—"}</TableCell>
                  <TableCell className="font-display text-sm">{profiles[d.opened_by]?.username ?? d.opened_by.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate" title={d.reason}>
                    {d.reason}
                    {d.evidence_url && (
                      <a href={d.evidence_url} target="_blank" rel="noreferrer" className="ml-2 text-primary underline text-xs">evidence</a>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {m?.elo_processed_at
                      ? <Badge className="bg-muted text-muted-foreground border-border text-[10px]">processed</Badge>
                      : <Badge className="bg-warning/15 text-warning border-warning/30 text-[10px]">pending</Badge>}
                  </TableCell>
                  <TableCell><Badge className={`${STATUS_COLORS[d.status] ?? ""} text-xs uppercase`}>{d.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/matches/${d.match_id}`}>
                        <Gavel className="h-3.5 w-3.5 mr-1.5" /> Open
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {stuck.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-warning/30 text-sm font-display flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Stuck disputed matches — no dispute record. Resolve manually from match page.
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead>Game</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stuck.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-xs uppercase">{m.game}</TableCell>
                  <TableCell className="text-xs">{m.score_a ?? "—"} – {m.score_b ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/matches/${m.id}`}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Resolve
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}
