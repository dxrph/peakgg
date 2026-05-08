import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import StatusPill from "@/components/leagues/StatusPill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ShieldAlert, Check, Send, Gavel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";

interface MatchRow {
  id: string; game: string; map: string | null;
  team_a_id: string | null; team_b_id: string | null;
  score_a: number | null; score_b: number | null;
  result_status: string; status: string;
  matchday: number | null; scheduled_at: string | null;
  season_id: string | null; division_id: string | null;
  submitted_by: string | null; confirmed_by: string | null;
}
interface TeamRow { id: string; name: string; tag: string | null; avatar_url: string | null; owner_id: string; }

export default function MatchDetailPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useUserRoles();
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [teamA, setTeamA] = useState<TeamRow | null>(null);
  const [teamB, setTeamB] = useState<TeamRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [map, setMap] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!matchId) return;
    const { data: m } = await supabase
      .from("matches")
      .select("id, game, map, team_a_id, team_b_id, score_a, score_b, result_status, status, matchday, scheduled_at, season_id, division_id, submitted_by, confirmed_by")
      .eq("id", matchId)
      .maybeSingle();
    if (!m) { setLoading(false); return; }
    setMatch(m as MatchRow);
    setScoreA(m.score_a ?? 0); setScoreB(m.score_b ?? 0); setMap(m.map ?? "");
    const ids = [m.team_a_id, m.team_b_id].filter(Boolean) as string[];
    if (ids.length) {
      const { data: ts } = await supabase.from("teams").select("id, name, tag, avatar_url, owner_id").in("id", ids);
      const tA = (ts ?? []).find(t => t.id === m.team_a_id) ?? null;
      const tB = (ts ?? []).find(t => t.id === m.team_b_id) ?? null;
      setTeamA(tA as TeamRow); setTeamB(tB as TeamRow);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [matchId]);

  const isCaptainA = !!user && teamA?.owner_id === user.id;
  const isCaptainB = !!user && teamB?.owner_id === user.id;
  const isAnyCaptain = isCaptainA || isCaptainB;
  const isStaff = isAdmin || isModerator;
  const canSubmit = isAnyCaptain && match && ["scheduled", "live", "awaiting_result"].includes(match.result_status);
  const submittedByMe = match?.submitted_by === user?.id;
  const canConfirm = isAnyCaptain && match?.result_status === "pending_confirmation" && !submittedByMe;
  const canDispute = isAnyCaptain && match?.result_status === "pending_confirmation" && !submittedByMe;
  const canAdminResolve = isStaff && match && ["disputed", "pending_confirmation", "scheduled", "awaiting_result", "live"].includes(match.result_status);

  const submit = async () => {
    if (!match) return;
    setBusy(true);
    const { error } = await supabase.rpc("submit_match_result", {
      _match_id: match.id, _score_a: scoreA, _score_b: scoreB,
      _map: map || null, _notes: notes || null, _screenshot: null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Result submitted — waiting for opponent confirmation");
    setSubmitOpen(false); load();
  };
  const confirm = async () => {
    if (!match) return;
    setBusy(true);
    const { error } = await supabase.rpc("confirm_match_result", { _match_id: match.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Result confirmed"); load();
  };
  const dispute = async () => {
    if (!match || !reason) return toast.error("Reason required");
    setBusy(true);
    const { error } = await supabase.rpc("dispute_match_result", { _match_id: match.id, _reason: reason, _evidence: null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Dispute opened — admin will review");
    setDisputeOpen(false); setReason(""); load();
  };
  const adminResolve = async () => {
    if (!match) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_resolve_match", { _match_id: match.id, _score_a: scoreA, _score_b: scoreB });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Match resolved"); setAdminOpen(false); load();
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="container py-10"><Skeleton className="h-64" /></div></div>;
  if (!match) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl uppercase">Match not found</h1>
        <Button asChild variant="outline" className="mt-4"><Link to="/leagues">Back</Link></Button>
      </div>
    </div>
  );

  const showScore = ["confirmed", "admin_resolved", "pending_confirmation", "live"].includes(match.result_status);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={`${teamA?.name ?? "Team A"} vs ${teamB?.name ?? "Team B"} — Match | PeakGG`} description="Peak League match" />
      <Navbar />
      <main className="flex-1 container py-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link to={match.season_id ? `/leagues` : "/teams"}><ChevronLeft className="h-4 w-4" /> Back</Link>
        </Button>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4 text-xs font-display uppercase tracking-widest text-muted-foreground">
            <span>{match.matchday ? `Matchday ${match.matchday}` : "Match"} · {match.game}</span>
            <StatusPill status={match.result_status} />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {teamA?.avatar_url ? <img src={teamA.avatar_url} className="w-14 h-14 rounded object-cover" alt="" /> : <div className="w-14 h-14 rounded bg-muted border border-border" />}
              <div className="min-w-0">
                <Link to={teamA ? `/teams/${teamA.id}` : "#"} className="font-display font-bold text-lg uppercase hover:text-primary truncate block">{teamA?.name ?? "TBD"}</Link>
                {teamA?.tag && <div className="text-xs text-muted-foreground">[{teamA.tag}]</div>}
              </div>
            </div>
            <div className="text-center">
              {showScore ? (
                <div className="font-display font-bold text-4xl md:text-5xl">
                  <span className={(match.score_a ?? 0) > (match.score_b ?? 0) ? "text-primary" : ""}>{match.score_a ?? 0}</span>
                  <span className="text-muted-foreground mx-2">:</span>
                  <span className={(match.score_b ?? 0) > (match.score_a ?? 0) ? "text-primary" : ""}>{match.score_b ?? 0}</span>
                </div>
              ) : (
                <div className="font-display text-2xl text-muted-foreground">VS</div>
              )}
              {match.scheduled_at && <div className="text-xs text-muted-foreground mt-2">{new Date(match.scheduled_at).toLocaleString()}</div>}
              {match.map && <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{match.map}</div>}
            </div>
            <div className="flex items-center gap-3 min-w-0 justify-end text-right">
              <div className="min-w-0">
                <Link to={teamB ? `/teams/${teamB.id}` : "#"} className="font-display font-bold text-lg uppercase hover:text-primary truncate block">{teamB?.name ?? "TBD"}</Link>
                {teamB?.tag && <div className="text-xs text-muted-foreground">[{teamB.tag}]</div>}
              </div>
              {teamB?.avatar_url ? <img src={teamB.avatar_url} className="w-14 h-14 rounded object-cover" alt="" /> : <div className="w-14 h-14 rounded bg-muted border border-border" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            {canSubmit && <Button onClick={() => setSubmitOpen(true)}><Send className="h-4 w-4 mr-1.5" /> Submit Result</Button>}
            {canConfirm && <Button onClick={confirm} disabled={busy}><Check className="h-4 w-4 mr-1.5" /> Confirm Result</Button>}
            {canDispute && <Button variant="outline" onClick={() => setDisputeOpen(true)}><ShieldAlert className="h-4 w-4 mr-1.5" /> Dispute</Button>}
            {canAdminResolve && <Button variant="secondary" onClick={() => setAdminOpen(true)}><Gavel className="h-4 w-4 mr-1.5" /> Admin Resolve</Button>}
          </div>
        </Card>

        {match.result_status === "pending_confirmation" && (
          <Card className="p-4 mb-6 border-amber-500/40 bg-amber-500/5">
            <p className="text-sm">A score was submitted by {submittedByMe ? "you" : "the opposing captain"} — waiting for confirmation.</p>
          </Card>
        )}
        {match.result_status === "disputed" && (
          <Card className="p-4 mb-6 border-destructive/40 bg-destructive/5">
            <p className="text-sm">This match is disputed. Standings are frozen until admin resolution.</p>
          </Card>
        )}
      </main>
      <Footer />

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Result</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{teamA?.name} score</Label><Input type="number" min={0} value={scoreA} onChange={e => setScoreA(parseInt(e.target.value || "0"))} /></div>
              <div><Label>{teamB?.name} score</Label><Input type="number" min={0} value={scoreB} onChange={e => setScoreB(parseInt(e.target.value || "0"))} /></div>
            </div>
            <div><Label>Map</Label><Input value={map} onChange={e => setMap(e.target.value)} placeholder="Ascent, Mirage..." /></div>
            <div><Label>Notes (optional)</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={submit} disabled={busy}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open Dispute</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} placeholder="Explain what went wrong" />
          </div>
          <DialogFooter><Button variant="destructive" onClick={dispute} disabled={busy || !reason}>Open Dispute</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Admin Resolve</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{teamA?.name}</Label><Input type="number" min={0} value={scoreA} onChange={e => setScoreA(parseInt(e.target.value || "0"))} /></div>
              <div><Label>{teamB?.name}</Label><Input type="number" min={0} value={scoreB} onChange={e => setScoreB(parseInt(e.target.value || "0"))} /></div>
            </div>
            <p className="text-xs text-muted-foreground">This overrides the result and recomputes standings.</p>
          </div>
          <DialogFooter><Button onClick={adminResolve} disabled={busy}>Resolve</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
