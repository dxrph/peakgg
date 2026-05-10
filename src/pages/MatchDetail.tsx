import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import StatusPill from "@/components/leagues/StatusPill";
import ReadyCheck from "@/components/matches/ReadyCheck";
import MatchChat from "@/components/matches/MatchChat";
import TeamLogo from "@/components/teams/TeamLogo";
import RankBadge from "@/components/RankBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ShieldAlert, Check, Send, Gavel, MessageCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { DISCORD_INVITE } from "@/lib/links";
import { toast } from "sonner";

interface MatchRow {
  id: string; game: string; map: string | null;
  team_a_id: string | null; team_b_id: string | null;
  player_a_id: string | null; player_b_id: string | null;
  score_a: number | null; score_b: number | null;
  result_status: string; status: string;
  matchday: number | null; scheduled_at: string | null;
  season_id: string | null; division_id: string | null;
  submitted_by: string | null; confirmed_by: string | null;
  lobby_code: string | null; server_info: string | null;
  kind?: string | null;
  winner_id?: string | null;
  elo_processed_at?: string | null;
}
interface TeamRow { id: string; name: string; tag: string | null; avatar_url: string | null; owner_id: string; }
interface PlayerInfo {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  elo: number | null;
}
interface EloDelta { user_id: string; delta: number; elo_after: number; }
interface RosterRow { user_id: string; team_id: string | null; side: "A" | "B" | null; }

export default function MatchDetailPage() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useUserRoles();
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [teamA, setTeamA] = useState<TeamRow | null>(null);
  const [teamB, setTeamB] = useState<TeamRow | null>(null);
  const [playerA, setPlayerA] = useState<PlayerInfo | null>(null);
  const [playerB, setPlayerB] = useState<PlayerInfo | null>(null);
  const [rosterA, setRosterA] = useState<PlayerInfo[]>([]);
  const [rosterB, setRosterB] = useState<PlayerInfo[]>([]);
  const [rosterRows, setRosterRows] = useState<RosterRow[]>([]);
  const [eloDeltas, setEloDeltas] = useState<EloDelta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [winnerSide, setWinnerSide] = useState<"a" | "b">("a");
  const [map, setMap] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const isOpenCup = match?.kind === "open_cup";
  const isQueueMatch = match?.kind === "open_cup" || match?.kind === "ranked";
  // Derive team size from rosters (rosters are now the source of truth for Open Cup).
  // Falls back to player_a/b for legacy 1v1 matches that pre-date the rosters refactor.
  const teamSize = useMemo(() => {
    if (rosterRows.length > 0) {
      const sideACount = rosterRows.filter(r => r.side === "A" || (!r.side && r.team_id === match?.team_a_id)).length;
      const sideBCount = rosterRows.filter(r => r.side === "B" || (!r.side && r.team_id === match?.team_b_id)).length;
      return Math.max(sideACount, sideBCount, 1);
    }
    if (match?.player_a_id || match?.player_b_id) return 1;
    return 0;
  }, [rosterRows, match?.team_a_id, match?.team_b_id, match?.player_a_id, match?.player_b_id]);
  const isSoloTest = isQueueMatch && teamSize === 1;
  const isRosterMatch = isQueueMatch && teamSize > 1;
  // Backwards-compat alias used through render code: solo (1-per-side) layout.
  const is1v1 = teamSize === 1 && (isQueueMatch || !!match?.player_a_id || !!match?.player_b_id);

  const loadPlayer = async (uid: string, game: string): Promise<PlayerInfo> => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("profiles").select("id, username, display_name, avatar_url").eq("id", uid).maybeSingle(),
      supabase.from("player_stats").select("elo").eq("user_id", uid).eq("game", game).maybeSingle(),
    ]);
    return {
      user_id: uid,
      username: p?.username ?? null,
      display_name: p?.display_name ?? null,
      avatar_url: p?.avatar_url ?? null,
      elo: s?.elo ?? null,
    };
  };

  const load = async () => {
    if (!matchId) return;
    const { data: m } = await supabase
      .from("matches")
      .select("id, game, map, team_a_id, team_b_id, player_a_id, player_b_id, score_a, score_b, result_status, status, matchday, scheduled_at, season_id, division_id, submitted_by, confirmed_by, lobby_code, server_info, kind, winner_id, elo_processed_at")
      .eq("id", matchId)
      .maybeSingle();
    if (!m) { setLoading(false); return; }
    setMatch(m as MatchRow);
    setScoreA(m.score_a ?? 0); setScoreB(m.score_b ?? 0); setMap(m.map ?? "");

    // Always try to load match_rosters first (Open Cup writes them for any team size).
    const { data: rosters } = await supabase
      .from("match_rosters")
      .select("user_id, team_id, side")
      .eq("match_id", m.id);
    const rRows = (rosters ?? []) as RosterRow[];
    setRosterRows(rRows);

    if (rRows.length > 0) {
      const aRows = rRows.filter(r => r.side === "A" || (!r.side && r.team_id === m.team_a_id));
      const bRows = rRows.filter(r => r.side === "B" || (!r.side && r.team_id === m.team_b_id));
      const [aPlayers, bPlayers] = await Promise.all([
        Promise.all(aRows.map(r => loadPlayer(r.user_id, m.game))),
        Promise.all(bRows.map(r => loadPlayer(r.user_id, m.game))),
      ]);
      setRosterA(aPlayers); setRosterB(bPlayers);
      setPlayerA(aPlayers[0] ?? null);
      setPlayerB(bPlayers[0] ?? null);
      setTeamA(null); setTeamB(null);
    } else if (m.player_a_id || m.player_b_id) {
      // Legacy 1v1 (no rosters written)
      const [pa, pb] = await Promise.all([
        m.player_a_id ? loadPlayer(m.player_a_id, m.game) : Promise.resolve(null),
        m.player_b_id ? loadPlayer(m.player_b_id, m.game) : Promise.resolve(null),
      ]);
      setPlayerA(pa); setPlayerB(pb);
      setRosterA(pa ? [pa] : []); setRosterB(pb ? [pb] : []);
      setTeamA(null); setTeamB(null);
    } else {
      const ids = [m.team_a_id, m.team_b_id].filter(Boolean) as string[];
      if (ids.length) {
        const { data: ts } = await supabase.from("teams").select("id, name, tag, avatar_url, owner_id").in("id", ids);
        const tA = (ts ?? []).find(t => t.id === m.team_a_id) ?? null;
        const tB = (ts ?? []).find(t => t.id === m.team_b_id) ?? null;
        setTeamA(tA as TeamRow); setTeamB(tB as TeamRow);
      }
    }

    // ELO deltas after completion
    if (m.elo_processed_at) {
      const { data: hist } = await supabase
        .from("elo_history")
        .select("user_id, delta, elo_after")
        .eq("match_id", m.id);
      setEloDeltas((hist ?? []) as EloDelta[]);
    } else {
      setEloDeltas([]);
    }

    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [matchId]);

  // Realtime: re-load when this match row changes (status/score/elo_processed_at)
  useEffect(() => {
    if (!matchId) return;
    const ch = supabase
      .channel(`match-${matchId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [matchId]);

  const isParticipant = useMemo(() => {
    if (!user || !match) return false;
    if (rosterRows.some(r => r.user_id === user.id)) return true;
    if (is1v1) return user.id === match.player_a_id || user.id === match.player_b_id;
    return false; // team participation handled below
  }, [user, match, is1v1, rosterRows]);

  const [isTeamParticipant, setIsTeamParticipant] = useState(false);
  useEffect(() => {
    if (!user || !match || isQueueMatch || is1v1) { setIsTeamParticipant(false); return; }
    (async () => {
      const ids = [match.team_a_id, match.team_b_id].filter(Boolean) as string[];
      if (!ids.length) { setIsTeamParticipant(false); return; }
      const { data } = await supabase
        .from("team_members").select("team_id").eq("user_id", user.id).in("team_id", ids).limit(1);
      setIsTeamParticipant((data ?? []).length > 0);
    })();
  }, [user?.id, match?.team_a_id, match?.team_b_id, is1v1]);

  const isCaptainA = !!user && teamA?.owner_id === user.id;
  const isCaptainB = !!user && teamB?.owner_id === user.id;
  const isAnyCaptain = isCaptainA || isCaptainB;
  const isStaff = isAdmin || isModerator;
  const canAccessChat = isAnyCaptain || isTeamParticipant || isParticipant || isStaff;
  const canSeeLobby = canAccessChat;

  const canSubmit = match
    && ["scheduled", "live", "awaiting_result"].includes(match.result_status)
    && (isAnyCaptain || (isQueueMatch && (isParticipant || isTeamParticipant)));
  const submittedByMe = match?.submitted_by === user?.id;
  const canConfirm = match?.result_status === "pending_confirmation" && !submittedByMe
    && (isAnyCaptain || (isQueueMatch && (isParticipant || isTeamParticipant)));
  // Open Cup: any participant can dispute. League/team matches: captain only.
  const canDispute = match?.result_status === "pending_confirmation" && !submittedByMe && (
    (isQueueMatch && (isParticipant || isTeamParticipant))
    || (!isOpenCup && isAnyCaptain)
  );
  const canAdminResolve = isStaff && match
    && ["disputed", "pending_confirmation", "scheduled", "awaiting_result", "live"].includes(match.result_status);

  const triggerEloUpdate = async (id: string) => {
    try { await supabase.functions.invoke("update-match-result", { body: { match_id: id } }); } catch {}
  };

  const openSubmit = () => {
    // Pre-select winner for 1v1
    if (is1v1 && user) {
      setWinnerSide(user.id === match?.player_a_id ? "a" : "b");
    }
    setSubmitOpen(true);
  };

  const submit = async () => {
    if (!match) return;
    setBusy(true);
    let sa = scoreA, sb = scoreB;
    if (is1v1) {
      sa = winnerSide === "a" ? 1 : 0;
      sb = winnerSide === "b" ? 1 : 0;
    }
    const { error } = isQueueMatch
      ? await supabase.rpc("submit_open_cup_result", { _match_id: match.id, _score_a: sa, _score_b: sb })
      : await supabase.rpc("submit_match_result", {
          _match_id: match.id, _score_a: sa, _score_b: sb,
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
    const { error } = isQueueMatch
      ? await supabase.rpc("confirm_open_cup_result", { _match_id: match.id })
      : await supabase.rpc("confirm_match_result", { _match_id: match.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Result confirmed");
    if (isQueueMatch) await triggerEloUpdate(match.id);
    load();
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
    const { error } = isQueueMatch
      ? await supabase.rpc("admin_resolve_open_cup_match", { _match_id: match.id, _score_a: scoreA, _score_b: scoreB })
      : await supabase.rpc("admin_resolve_match", { _match_id: match.id, _score_a: scoreA, _score_b: scoreB });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Match resolved");
    if (isQueueMatch) await triggerEloUpdate(match.id);
    setAdminOpen(false); load();
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
  const statusLabel = (() => {
    switch (match.result_status) {
      case "scheduled": return "Match Ready";
      case "live": return "Live";
      case "awaiting_result": return "Awaiting Result";
      case "pending_confirmation": return "Pending Confirmation";
      case "confirmed": return "Completed";
      case "admin_resolved": return "Admin Resolved";
      case "disputed": return "Disputed";
      default: return match.result_status;
    }
  })();

  const instruction = (() => {
    if (!isParticipant && !isTeamParticipant) return null;
    if (["scheduled","live","awaiting_result"].includes(match.result_status))
      return "Play the match, then submit the result.";
    if (match.result_status === "pending_confirmation")
      return submittedByMe
        ? "Waiting for your opponent to confirm."
        : "Confirm or dispute the submitted result.";
    if (match.result_status === "confirmed") return "Match completed. ELO has been updated.";
    if (match.result_status === "admin_resolved") return "An admin resolved this match.";
    return null;
  })();

  const renderPlayerCard = (p: PlayerInfo | null, side: "a" | "b", align: "left" | "right") => {
    const initials = (p?.display_name ?? p?.username ?? "?").slice(0, 2).toUpperCase();
    const delta = p ? eloDeltas.find(d => d.user_id === p.user_id) : null;
    return (
      <div className={`flex items-center gap-3 min-w-0 ${align === "right" ? "justify-end text-right flex-row-reverse" : ""}`}>
        <Avatar className="h-14 w-14 border border-border">
          {p?.avatar_url && <AvatarImage src={p.avatar_url} alt={p.display_name ?? p.username ?? ""} />}
          <AvatarFallback className="font-display">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Player {side.toUpperCase()}</div>
          {p ? (
            <Link to={`/u/${p.username ?? p.user_id}`} className="font-display font-bold text-lg uppercase hover:text-primary truncate block">
              {p.display_name ?? p.username ?? "Player"}
            </Link>
          ) : (
            <div className="font-display font-bold text-lg uppercase text-muted-foreground">TBD</div>
          )}
          {p?.elo != null && (
            <div className={`flex items-center gap-2 mt-1 ${align === "right" ? "justify-end" : ""}`}>
              <RankBadge elo={p.elo} size="sm" />
              <span className="text-xs text-muted-foreground tabular-nums">
                {p.elo} ELO
                {delta && (
                  <span className={`ml-1 font-semibold ${delta.delta >= 0 ? "text-success" : "text-destructive"}`}>
                    {delta.delta >= 0 ? "+" : ""}{delta.delta}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={
          is1v1
            ? `${playerA?.display_name ?? playerA?.username ?? "Player A"} vs ${playerB?.display_name ?? playerB?.username ?? "Player B"} — Match | PeakGG`
            : `${teamA?.name ?? "Team A"} vs ${teamB?.name ?? "Team B"} — Match | PeakGG`
        }
        description="PeakGG match"
      />
      <Navbar />
      <main className="flex-1 container py-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link to={isOpenCup ? "/tournaments" : (match.season_id ? "/leagues" : "/teams")}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>

        <Card className="p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap text-xs font-display uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-2 flex-wrap">
              {isOpenCup && <Badge variant="outline" className="border-success/40 text-success">Open Cup Beta</Badge>}
              {isSoloTest && <Badge variant="outline" className="border-primary/40 text-primary">1v1 Test Queue</Badge>}
              {isRosterMatch && <Badge variant="outline" className="border-primary/40 text-primary">{teamSize}v{teamSize} Solo Queue</Badge>}
              <span>{match.game.toUpperCase()}</span>
              {match.matchday && <span>· Matchday {match.matchday}</span>}
            </div>
            <StatusPill status={match.result_status} />
          </div>

          {isRosterMatch ? (
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 sm:gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Side A · {rosterA.length} players · avg {rosterA.length ? Math.round(rosterA.reduce((s,p)=>s+(p.elo??0),0)/rosterA.length) : 0} ELO</div>
                {rosterA.map(p => renderPlayerCard(p, "a", "left"))}
              </div>
              <div className="text-center pt-6">
                {showScore ? (
                  <div className="font-display font-bold text-3xl sm:text-5xl">
                    <span className={(match.score_a ?? 0) > (match.score_b ?? 0) ? "text-primary" : ""}>{match.score_a ?? 0}</span>
                    <span className="text-muted-foreground mx-2">:</span>
                    <span className={(match.score_b ?? 0) > (match.score_a ?? 0) ? "text-primary" : ""}>{match.score_b ?? 0}</span>
                  </div>
                ) : (
                  <div className="font-display text-2xl text-muted-foreground">VS</div>
                )}
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{statusLabel}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground text-right">Side B · {rosterB.length} players · avg {rosterB.length ? Math.round(rosterB.reduce((s,p)=>s+(p.elo??0),0)/rosterB.length) : 0} ELO</div>
                {rosterB.map(p => renderPlayerCard(p, "b", "right"))}
              </div>
            </div>
          ) : is1v1 ? (
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
              {renderPlayerCard(playerA, "a", "left")}
              <div className="text-center">
                {showScore ? (
                  <div className="font-display font-bold text-3xl sm:text-5xl">
                    <span className={(match.score_a ?? 0) > (match.score_b ?? 0) ? "text-primary" : ""}>{match.score_a ?? 0}</span>
                    <span className="text-muted-foreground mx-2">:</span>
                    <span className={(match.score_b ?? 0) > (match.score_a ?? 0) ? "text-primary" : ""}>{match.score_b ?? 0}</span>
                  </div>
                ) : (
                  <div className="font-display text-2xl text-muted-foreground">VS</div>
                )}
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{statusLabel}</div>
              </div>
              {renderPlayerCard(playerB, "b", "right")}
            </div>
          ) : (
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <TeamLogo name={teamA?.name} tag={teamA?.tag} avatarUrl={teamA?.avatar_url} size={56} rounded="lg" />
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
                <TeamLogo name={teamB?.name} tag={teamB?.tag} avatarUrl={teamB?.avatar_url} size={56} rounded="lg" />
              </div>
            </div>
          )}

          {instruction && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
              <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>{instruction}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-5 justify-center">
            {canSubmit && <Button onClick={openSubmit} className="w-full sm:w-auto"><Send className="h-4 w-4 mr-1.5" /> Submit Result</Button>}
            {canConfirm && <Button onClick={confirm} disabled={busy} className="w-full sm:w-auto"><Check className="h-4 w-4 mr-1.5" /> Confirm Result</Button>}
            {canDispute && <Button variant="outline" onClick={() => setDisputeOpen(true)} className="w-full sm:w-auto"><ShieldAlert className="h-4 w-4 mr-1.5" /> Dispute</Button>}
            {is1v1 && canConfirm && (
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 mr-1.5" /> Report on Discord</a>
              </Button>
            )}
            {canAdminResolve && <Button variant="secondary" onClick={() => setAdminOpen(true)} className="w-full sm:w-auto"><Gavel className="h-4 w-4 mr-1.5" /> Admin Resolve</Button>}
          </div>

          {match.elo_processed_at && eloDeltas.length === 0 && (
            <div className="mt-4 text-center text-xs text-muted-foreground">ELO update processed.</div>
          )}
          {match.status === "completed" && !match.elo_processed_at && (
            <div className="mt-4 text-center text-xs text-muted-foreground">ELO update pending…</div>
          )}
        </Card>

        {match.result_status === "pending_confirmation" && (
          <Card className="p-4 mb-6 border-amber-500/40 bg-amber-500/5">
            <p className="text-sm">A score was submitted by {submittedByMe ? "you" : "the opposing side"} — waiting for confirmation.</p>
          </Card>
        )}
        {match.result_status === "disputed" && (
          <Card className="p-4 mb-6 border-destructive/40 bg-destructive/5">
            <p className="text-sm">This match is disputed. Standings are frozen until admin resolution.</p>
          </Card>
        )}

        {is1v1 && (
          <Card className="p-4 mb-6 text-sm">
            <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-2">Match Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Coordinate with your opponent (Discord recommended).</li>
              <li>Play your 1v1 match in {match.game.toUpperCase()}.</li>
              <li>Winner submits the result. Loser confirms.</li>
              <li>ELO updates once after confirmation. No double-counting.</li>
            </ol>
            <p className="mt-3 text-[11px] text-muted-foreground/80 italic">
              Beta test match — please report any issues in Discord.
            </p>
          </Card>
        )}

        {match.season_id && (
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <ReadyCheck
                matchId={match.id}
                teamAId={match.team_a_id}
                teamBId={match.team_b_id}
                teamAName={teamA?.name ?? "Team A"}
                teamBName={teamB?.name ?? "Team B"}
                isCaptainA={isCaptainA}
                isCaptainB={isCaptainB}
                resultStatus={match.result_status}
                onChanged={load}
              />
              {canSeeLobby && (match.lobby_code || match.server_info) && (
                <Card className="p-4">
                  <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-2">Lobby Info</h3>
                  {match.lobby_code && <div className="text-sm"><span className="text-muted-foreground">Code:</span> <span className="font-mono">{match.lobby_code}</span></div>}
                  {match.server_info && <div className="text-sm"><span className="text-muted-foreground">Server:</span> {match.server_info}</div>}
                </Card>
              )}
            </div>
            {!user ? (
              <Card className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center">Sign in to access match chat.</Card>
            ) : canAccessChat ? (
              <MatchChat matchId={match.id} />
            ) : (
              <Card className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center">
                Only match participants can access this room.
              </Card>
            )}
          </div>
        )}
      </main>
      <Footer />

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Result</DialogTitle></DialogHeader>
          {is1v1 ? (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Who won?</Label>
                <RadioGroup value={winnerSide} onValueChange={(v) => setWinnerSide(v as "a" | "b")} className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40">
                    <RadioGroupItem value="a" id="w-a" />
                    <span className="font-display uppercase text-sm">{playerA?.display_name ?? playerA?.username ?? "Player A"}{user?.id === match.player_a_id ? " (Me)" : ""}</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40">
                    <RadioGroupItem value="b" id="w-b" />
                    <span className="font-display uppercase text-sm">{playerB?.display_name ?? playerB?.username ?? "Player B"}{user?.id === match.player_b_id ? " (Me)" : ""}</span>
                  </label>
                </RadioGroup>
              </div>
              <p className="text-xs text-muted-foreground">Recorded as 1–0 for the winner. Final scores can be adjusted later by an admin if needed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{teamA?.name ?? "Team A"} score</Label><Input type="number" min={0} value={scoreA} onChange={e => setScoreA(parseInt(e.target.value || "0"))} /></div>
                <div><Label>{teamB?.name ?? "Team B"} score</Label><Input type="number" min={0} value={scoreB} onChange={e => setScoreB(parseInt(e.target.value || "0"))} /></div>
              </div>
              <div><Label>Map</Label><Input value={map} onChange={e => setMap(e.target.value)} placeholder="Ascent, Mirage..." /></div>
              <div><Label>Notes (optional)</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
            </div>
          )}
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
              <div><Label>{is1v1 ? (playerA?.display_name ?? playerA?.username ?? "Player A") : (teamA?.name ?? "Team A")}</Label><Input type="number" min={0} value={scoreA} onChange={e => setScoreA(parseInt(e.target.value || "0"))} /></div>
              <div><Label>{is1v1 ? (playerB?.display_name ?? playerB?.username ?? "Player B") : (teamB?.name ?? "Team B")}</Label><Input type="number" min={0} value={scoreB} onChange={e => setScoreB(parseInt(e.target.value || "0"))} /></div>
            </div>
            <p className="text-xs text-muted-foreground">This overrides the result and recomputes ELO/standings.</p>
          </div>
          <DialogFooter><Button onClick={adminResolve} disabled={busy}>Resolve</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
