import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Zap } from "lucide-react";
import { toast } from "sonner";

interface Props {
  matchId: string;
  teamAId: string | null;
  teamBId: string | null;
  teamAName: string;
  teamBName: string;
  isCaptainA: boolean;
  isCaptainB: boolean;
  resultStatus: string;
  onChanged: () => void;
}

interface ReadyRow {
  team_id: string;
  ready: boolean;
  updated_at: string;
}

export default function ReadyCheck({
  matchId, teamAId, teamBId, teamAName, teamBName,
  isCaptainA, isCaptainB, resultStatus, onChanged,
}: Props) {
  const [rows, setRows] = useState<ReadyRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("match_ready_checks")
      .select("team_id, ready, updated_at")
      .eq("match_id", matchId);
    setRows((data as ReadyRow[]) ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`ready-${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_ready_checks", filter: `match_id=eq.${matchId}` },
        () => { load(); onChanged(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const aReady = rows.find((r) => r.team_id === teamAId)?.ready ?? false;
  const bReady = rows.find((r) => r.team_id === teamBId)?.ready ?? false;

  const setReady = async (ready: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc("set_match_ready", { _match_id: matchId, _ready: ready });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(ready ? "You are ready" : "You are not ready");
    load();
    onChanged();
  };

  if (!["scheduled", "live"].includes(resultStatus)) return null;

  return (
    <Card className={`p-4 ${resultStatus === "live" ? "border-primary/60 bg-primary/5" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground">Ready Check</h3>
        {resultStatus === "live" && (
          <span className="font-display uppercase text-sm text-primary flex items-center gap-1.5 animate-pulse">
            <Zap className="h-4 w-4" /> Match Live
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TeamReadyBlock
          name={teamAName}
          ready={aReady}
          isCaptain={isCaptainA}
          busy={busy}
          onReady={() => setReady(true)}
          onUnready={() => setReady(false)}
        />
        <TeamReadyBlock
          name={teamBName}
          ready={bReady}
          isCaptain={isCaptainB}
          busy={busy}
          onReady={() => setReady(true)}
          onUnready={() => setReady(false)}
        />
      </div>
    </Card>
  );
}

function TeamReadyBlock({
  name, ready, isCaptain, busy, onReady, onUnready,
}: { name: string; ready: boolean; isCaptain: boolean; busy: boolean; onReady: () => void; onUnready: () => void }) {
  return (
    <div className={`rounded-md border p-3 ${ready ? "border-success/50 bg-success/5" : "border-border"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-display uppercase truncate">{name}</span>
        {ready ? (
          <span className="text-success text-xs flex items-center gap-1"><Check className="h-3 w-3" /> Ready</span>
        ) : (
          <span className="text-muted-foreground text-xs flex items-center gap-1"><X className="h-3 w-3" /> Not ready</span>
        )}
      </div>
      {isCaptain && (
        ready ? (
          <Button size="sm" variant="outline" className="w-full" onClick={onUnready} disabled={busy}>Unready</Button>
        ) : (
          <Button size="sm" className="w-full" onClick={onReady} disabled={busy}>Ready Up</Button>
        )
      )}
    </div>
  );
}