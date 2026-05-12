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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ShieldAlert, Check, Send, Gavel, MessageCircle, Info, AlertTriangle, Trophy, Clock, FileWarning, Shield } from "lucide-react";
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
interface DisputeRow {
  id: string;
  match_id: string;
  opened_by: string | null;
  reason: string | null;
  evidence_url: string | null;
  status: string;
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
  opener?: { username: string | null; display_name: string | null } | null;
}

export default function MatchDetailPage() {
  const { matchId: rawMatchId } = useParams();
  // Treat literal "undefined"/"null" strings (from broken upstream links) as missing.
  const matchId =
    rawMatchId && rawMatchId !== "undefined" && rawMatchId !== "null"
      ? rawMatchId
      : undefined;
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
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [submitterProfile, setSubmitterProfile] = useState<{ username: string | null; display_name: string | null } | null>(null);
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
  const [reasonType, setReasonType] = useState<string>("wrong_result");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  // Admin resolve modal state
  const [adminWinner, setAdminWinner] = useState<"a" | "b">("a");
  const [adminScoreA, setAdminScoreA] = useState(0);
  const [adminScoreB, setAdminScoreB] = useState(0);
  const [adminReason, setAdminReason] = useState<string>("dispute_resolved");
  const [adminNotes, setAdminNotes] = useState("");
  const [adminConfirmStep, setAdminConfirmStep] = useState(false);

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

  const loadDisputes = async (mId: string) => {
    const { data } = await supabase
      .from("match_disputes")
      .select("id, match_id, opened_by, reason, evidence_url, status, resolved_by, resolution_note, created_at, resolved_at")
      .eq("match_id", mId)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as DisputeRow[];
    const ids = [...new Set(rows.map(r => r.opened_by).filter(Boolean) as string[])];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, display_name").in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      rows.forEach(r => { if (r.opened_by) r.opener = map.get(r.opened_by) ?? null; });
    }
    setDisputes(rows);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [matchId]);

  // Load disputes & submitter profile whenever match changes
  useEffect(() => {
    if (!match) return;
    loadDisputes(match.id);
    if (match.submitted_by) {
      supabase.from("profiles").select("username, display_name").eq("id", match.submitted_by).maybeSingle()
        .then(({ data }) => setSubmitterProfile(data ?? null));
    } else {
      setSubmitterProfile(null);
    }
    // eslint-disable-next-line
  }, [match?.id, match?.submitted_by, match?.result_status]);

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
    if (!match || !reasonType) return toast.error("Reason required");
    const reasonText = `[${reasonType}] ${reason || ""}`.trim();
    setBusy(true);
    let uploadedUrl = evidenceUrl || null;
    try {
      if (evidenceFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const ext = evidenceFile.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${user.id}/${match.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("dispute-evidence")
          .upload(path, evidenceFile, { upsert: false, contentType: evidenceFile.type || undefined });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("dispute-evidence").getPublicUrl(path);
        uploadedUrl = pub.publicUrl;
      }
    } catch (e: any) {
      setBusy(false);
      return toast.error(e.message || "Evidence upload failed");
    }
    const { error } = await supabase.rpc("dispute_match_result", {
      _match_id: match.id, _reason: reasonText, _evidence: uploadedUrl,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Dispute opened. An admin will review this match.");
    setDisputeOpen(false); setReason(""); setEvidenceUrl(""); setEvidenceFile(null); load();
  };
  const openAdminResolve = () => {
    setAdminScoreA(match?.score_a ?? 0);
    setAdminScoreB(match?.score_b ?? 0);
    setAdminWinner(((match?.score_b ?? 0) > (match?.score_a ?? 0)) ? "b" : "a");
    setAdminReason(match?.result_status === "disputed" ? "dispute_resolved" : "admin_correction");
    setAdminNotes("");
    setAdminConfirmStep(false);
    setAdminOpen(true);
  };

  const adminResolve = async () => {
    if (!match) return;
    if (adminScoreA < 0 || adminScoreB < 0) return toast.error("Scores must be ≥ 0");
    if (!adminReason) return toast.error("Reason required");
    if (adminScoreA === adminScoreB) return toast.error("Scores cannot be tied — pick a winner score");
    const winnerByScore = adminScoreA > adminScoreB ? "a" : "b";
    if (winnerByScore !== adminWinner) {
      return toast.error("Selected winner doesn't match the score. Adjust score or winner.");
    }
    setBusy(true);
    let winnerUserId: string | null = null;
    if (isQueueMatch && is1v1) {
      winnerUserId = adminWinner === "a" ? (playerA?.user_id ?? null) : (playerB?.user_id ?? null);
    }
    const { error } = isQueueMatch
      ? await supabase.rpc("admin_resolve_open_cup_match", {
          _match_id: match.id,
          _score_a: adminScoreA,
          _score_b: adminScoreB,
          _winner_user_id: winnerUserId,
          _reason: adminReason,
          _notes: adminNotes || null,
        })
      : await supabase.rpc("admin_resolve_match", { _match_id: match.id, _score_a: adminScoreA, _score_b: adminScoreB });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Match resolved");
    if (isQueueMatch && !match.elo_processed_at) await triggerEloUpdate(match.id);
    setAdminOpen(false); setAdminConfirmStep(false); load();
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
            {canAdminResolve && <Button variant="secondary" onClick={openAdminResolve} className="w-full sm:w-auto"><Gavel className="h-4 w-4 mr-1.5" /> Admin Resolve</Button>}
          </div>

          {match.elo_processed_at && eloDeltas.length === 0 && (
            <div className="mt-4 text-center text-xs text-muted-foreground">ELO update processed.</div>
          )}
          {match.status === "completed" && !match.elo_processed_at && (
            <div className="mt-4 text-center text-xs text-muted-foreground">ELO update pending…</div>
          )}
        </Card>

        {/* === RESULT STATUS PANEL === */}
        <Card className="p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <h3 className="font-display uppercase tracking-wider text-sm">Result Status</h3>
            <Badge variant="outline" className="ml-auto text-[10px]">{statusLabel}</Badge>
          </div>
          {(() => {
            const submitterName = submitterProfile?.display_name ?? submitterProfile?.username ?? "—";
            const submittedWinnerSide: "a" | "b" | null =
              (match.score_a ?? 0) > (match.score_b ?? 0) ? "a"
              : (match.score_b ?? 0) > (match.score_a ?? 0) ? "b" : null;
            const submittedWinnerName = submittedWinnerSide
              ? (submittedWinnerSide === "a"
                  ? (playerA?.display_name ?? playerA?.username ?? teamA?.name ?? "Side A")
                  : (playerB?.display_name ?? playerB?.username ?? teamB?.name ?? "Side B"))
              : "Tie";
            if (["scheduled","live","awaiting_result"].includes(match.result_status)) {
              return <p className="text-sm text-muted-foreground">No result submitted yet. Play your match, then submit the result below.</p>;
            }
            if (match.result_status === "pending_confirmation") {
              return (
                <div className="space-y-2 text-sm">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Submitted winner: </span><span className="font-semibold text-foreground">{submittedWinnerName}</span></div>
                    <div><span className="text-muted-foreground">Score: </span><span className="font-mono">{match.score_a ?? 0} – {match.score_b ?? 0}</span></div>
                    <div><span className="text-muted-foreground">Submitted by: </span>{submitterName}</div>
                    <div><span className="text-muted-foreground">When: </span>{match.scheduled_at ? new Date(match.scheduled_at).toLocaleString() : "—"}</div>
                  </div>
                  <p className="text-amber-400 text-xs mt-2">
                    {submittedByMe ? "Waiting for the opposing side to confirm." : "Confirm this result, or open a dispute if it's wrong."}
                  </p>
                </div>
              );
            }
            if (match.result_status === "disputed") {
              return (
                <div className="space-y-2 text-sm">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Submitted winner: </span><span className="font-semibold">{submittedWinnerName}</span></div>
                    <div><span className="text-muted-foreground">Submitted score: </span><span className="font-mono">{match.score_a ?? 0} – {match.score_b ?? 0}</span></div>
                    <div><span className="text-muted-foreground">Submitted by: </span>{submitterName}</div>
                    <div><span className="text-destructive font-semibold">Awaiting admin resolution</span></div>
                  </div>
                </div>
              );
            }
            if (match.result_status === "confirmed" || match.result_status === "admin_resolved") {
              const winnerName = match.score_a === match.score_b
                ? "Tie"
                : ((match.score_a ?? 0) > (match.score_b ?? 0)
                  ? (playerA?.display_name ?? playerA?.username ?? teamA?.name ?? "Side A")
                  : (playerB?.display_name ?? playerB?.username ?? teamB?.name ?? "Side B"));
              return (
                <div className="space-y-2 text-sm">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Final winner: </span><span className="font-semibold text-success">{winnerName}</span></div>
                    <div><span className="text-muted-foreground">Final score: </span><span className="font-mono">{match.score_a ?? 0} – {match.score_b ?? 0}</span></div>
                    <div><span className="text-muted-foreground">{match.result_status === "admin_resolved" ? "Resolved by admin" : "Confirmed"}</span></div>
                    <div><span className="text-muted-foreground">ELO: </span>{match.elo_processed_at ? <span className="text-success">Updated</span> : <span className="text-amber-400">Pending</span>}</div>
                  </div>
                </div>
              );
            }
            return <p className="text-sm text-muted-foreground">Not provided.</p>;
          })()}
        </Card>

        {/* === DISPUTE DETAILS === */}
        {(match.result_status === "disputed" || disputes.length > 0) && (
          <Card className={`p-4 sm:p-5 mb-6 ${match.result_status === "disputed" ? "border-destructive/40 bg-destructive/5" : ""}`}>
            <div className="flex items-center gap-2 mb-3">
              <FileWarning className={`h-4 w-4 ${match.result_status === "disputed" ? "text-destructive" : "text-muted-foreground"}`} />
              <h3 className="font-display uppercase tracking-wider text-sm">Dispute Details</h3>
              {disputes.length > 1 && <Badge variant="outline" className="ml-auto text-[10px]">{disputes.length} disputes</Badge>}
            </div>
            {disputes.length === 0 ? (
              <div className="flex items-start gap-2 text-sm text-amber-400">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Match is marked disputed but no dispute record was found. Admin can still resolve manually.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.slice(0, 3).map(d => (
                  <div key={d.id} className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs text-muted-foreground">
                        Opened by <span className="font-semibold text-foreground">{d.opener?.display_name ?? d.opener?.username ?? "—"}</span>
                        {" · "}{new Date(d.created_at).toLocaleString()}
                      </span>
                      <Badge variant={d.status === "open" ? "destructive" : "outline"} className="text-[10px]">{d.status}</Badge>
                    </div>
                    {d.reason && <div className="text-foreground/90 break-words">{d.reason}</div>}
                    {d.evidence_url && (
                      <a href={d.evidence_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-primary hover:underline mt-1.5">
                        View evidence ↗
                      </a>
                    )}
                    {d.resolution_note && (
                      <div className="mt-2 pt-2 border-t border-border/60 text-xs">
                        <span className="text-muted-foreground">Resolution: </span>{d.resolution_note}
                      </div>
                    )}
                  </div>
                ))}
                {!isStaff && match.result_status === "disputed" && (
                  <p className="text-xs text-muted-foreground">An admin will review this match. ELO is frozen until resolved.</p>
                )}
              </div>
            )}
          </Card>
        )}

        {/* === ELO STATUS === */}
        {isQueueMatch && (
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display uppercase tracking-wider text-sm">ELO Status</h3>
            </div>
            {(() => {
              if (match.result_status === "disputed") return <p className="text-sm text-amber-400">ELO frozen until admin resolution.</p>;
              if (["scheduled","live","awaiting_result"].includes(match.result_status)) return <p className="text-sm text-muted-foreground">ELO updates after result confirmation.</p>;
              if (match.result_status === "pending_confirmation") return <p className="text-sm text-muted-foreground">No ELO has been awarded yet.</p>;
              if ((match.result_status === "confirmed" || match.result_status === "admin_resolved") && !match.elo_processed_at) return <p className="text-sm text-muted-foreground">Processing ELO update…</p>;
              if (match.elo_processed_at) {
                if (eloDeltas.length === 0) return <p className="text-sm text-success">ELO updated.</p>;
                return (
                  <div className="space-y-1.5 text-sm">
                    {eloDeltas.map(d => {
                      const p = [...rosterA, ...rosterB, playerA, playerB].filter(Boolean).find((x: any) => x?.user_id === d.user_id) as PlayerInfo | undefined;
                      const name = p?.display_name ?? p?.username ?? d.user_id.slice(0,6);
                      const before = d.elo_after - d.delta;
                      return (
                        <div key={d.user_id} className="flex items-center justify-between gap-3">
                          <span className="truncate">{name}</span>
                          <span className="font-mono tabular-nums">
                            {before} → {d.elo_after}{" "}
                            <span className={d.delta >= 0 ? "text-success" : "text-destructive"}>({d.delta >= 0 ? "+" : ""}{d.delta})</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              return null;
            })()}
          </Card>
        )}

        {/* === ADMIN CONTROL PANEL === */}
        {isStaff && (
          <Card className="p-4 sm:p-5 mb-6 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="font-display uppercase tracking-wider text-sm">Admin Control Panel</h3>
              <Badge variant="outline" className="ml-auto text-[10px] border-primary/40 text-primary">Staff only</Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
              <div>Status: <span className="text-foreground font-semibold">{statusLabel}</span></div>
              <div>Open disputes: <span className="text-foreground font-semibold">{disputes.filter(d => d.status === "open").length}</span></div>
              <div>Score: <span className="font-mono text-foreground">{match.score_a ?? 0} – {match.score_b ?? 0}</span></div>
              <div>ELO processed: <span className="text-foreground">{match.elo_processed_at ? new Date(match.elo_processed_at).toLocaleString() : "No"}</span></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canAdminResolve && (
                <Button size="sm" variant="secondary" onClick={openAdminResolve}>
                  <Gavel className="h-4 w-4 mr-1.5" /> {match.result_status === "disputed" ? "Resolve Dispute" : "Resolve Match"}
                </Button>
              )}
            </div>
            {match.elo_processed_at && (
              <p className="text-[11px] text-amber-400 mt-3">⚠ ELO has already been processed for this match. Resolving again will not re-process ELO.</p>
            )}
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

        {isQueueMatch && (
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-4 text-sm">
              <h3 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-2">Coordinate with your opponent</h3>
              <p className="text-muted-foreground">
                Use the match chat to agree on lobby setup. Need help? Hop into Discord.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Discord
                  </a>
                </Button>
              </div>
            </Card>
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
            <div>
              <Label className="mb-1.5 block">Reason</Label>
              <Select value={reasonType} onValueChange={setReasonType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wrong_result">Wrong result</SelectItem>
                  <SelectItem value="opponent_no_response">Opponent not responding</SelectItem>
                  <SelectItem value="no_show">No-show</SelectItem>
                  <SelectItem value="toxic">Toxic behavior</SelectItem>
                  <SelectItem value="cheating">Cheating suspicion</SelectItem>
                  <SelectItem value="technical">Technical issue</SelectItem>
                  <SelectItem value="elo_not_updated">ELO not updated</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Message (optional)</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Add context for the admin" />
            </div>
            <div>
              <Label className="mb-1.5 block">Evidence (optional)</Label>
              <Input
                type="file"
                accept="image/*,video/*,.pdf"
                onChange={e => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > 20 * 1024 * 1024) {
                    toast.error("Max 20MB");
                    e.target.value = "";
                    return;
                  }
                  setEvidenceFile(f);
                }}
              />
              {evidenceFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  {evidenceFile.name} · {(evidenceFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Screenshot, clip, or PDF (max 20MB).</p>
            </div>
            <p className="text-xs text-muted-foreground">An admin will review this match. ELO is frozen until resolved.</p>
          </div>
          <DialogFooter><Button variant="destructive" onClick={dispute} disabled={busy}>Open Dispute</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adminOpen} onOpenChange={(o) => { setAdminOpen(o); if (!o) setAdminConfirmStep(false); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-primary" /> Admin Resolve Match
            </DialogTitle>
          </DialogHeader>
          {!adminConfirmStep ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs rounded-lg border border-border bg-secondary/20 p-3">
                <div>
                  <div className="text-muted-foreground">Side A</div>
                  <div className="font-display uppercase truncate">{is1v1 ? (playerA?.display_name ?? playerA?.username ?? "Player A") : (teamA?.name ?? "Team A")}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Side B</div>
                  <div className="font-display uppercase truncate">{is1v1 ? (playerB?.display_name ?? playerB?.username ?? "Player B") : (teamB?.name ?? "Team B")}</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">Submitted: </span>
                  <span className="font-mono">{match.score_a ?? 0} – {match.score_b ?? 0}</span>
                  {disputes[0]?.reason && <span className="text-muted-foreground"> · Dispute: <span className="text-foreground">{disputes[0].reason}</span></span>}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">ELO processed: </span>
                  <span className={match.elo_processed_at ? "text-amber-400" : "text-foreground"}>{match.elo_processed_at ? "Yes" : "No"}</span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Winner</Label>
                <RadioGroup value={adminWinner} onValueChange={(v) => {
                  const w = v as "a" | "b";
                  setAdminWinner(w);
                  if (is1v1) { setAdminScoreA(w === "a" ? 1 : 0); setAdminScoreB(w === "b" ? 1 : 0); }
                }} className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40">
                    <RadioGroupItem value="a" id="aw-a" />
                    <span className="font-display uppercase text-sm truncate">{is1v1 ? (playerA?.display_name ?? playerA?.username ?? "Player A") : (teamA?.name ?? "Team A")}</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-secondary/40">
                    <RadioGroupItem value="b" id="aw-b" />
                    <span className="font-display uppercase text-sm truncate">{is1v1 ? (playerB?.display_name ?? playerB?.username ?? "Player B") : (teamB?.name ?? "Team B")}</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Score A</Label>
                  <Input type="number" min={0} value={adminScoreA} onChange={e => setAdminScoreA(Math.max(0, parseInt(e.target.value || "0")))} />
                </div>
                <div>
                  <Label>Score B</Label>
                  <Input type="number" min={0} value={adminScoreB} onChange={e => setAdminScoreB(Math.max(0, parseInt(e.target.value || "0")))} />
                </div>
              </div>
              {(adminScoreA !== adminScoreB) && ((adminScoreA > adminScoreB ? "a" : "b") !== adminWinner) && (
                <p className="text-xs text-amber-400">⚠ Score and selected winner do not match.</p>
              )}

              <div>
                <Label className="mb-1.5 block">Reason</Label>
                <Select value={adminReason} onValueChange={setAdminReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dispute_resolved">Dispute resolved</SelectItem>
                    <SelectItem value="no_show">No-show</SelectItem>
                    <SelectItem value="wrong_result">Wrong result submitted</SelectItem>
                    <SelectItem value="screenshot_evidence">Screenshot evidence</SelectItem>
                    <SelectItem value="admin_correction">Admin correction</SelectItem>
                    <SelectItem value="technical_issue">Technical issue</SelectItem>
                    <SelectItem value="elo_not_updated">ELO not updated</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block">Resolution notes (optional)</Label>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Visible to both players in their notification" />
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setAdminOpen(false)}>Cancel</Button>
                <Button onClick={() => setAdminConfirmStep(true)} disabled={!adminReason || adminScoreA === adminScoreB}>
                  Continue
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm">
                You are about to resolve this match as <span className="font-semibold">
                  {adminWinner === "a"
                    ? (is1v1 ? (playerA?.display_name ?? playerA?.username ?? "Player A") : (teamA?.name ?? "Team A"))
                    : (is1v1 ? (playerB?.display_name ?? playerB?.username ?? "Player B") : (teamB?.name ?? "Team B"))}
                </span> win, <span className="font-mono">{adminScoreA} – {adminScoreB}</span>.
                <div className="mt-1 text-xs text-muted-foreground">
                  {match.elo_processed_at ? "ELO will NOT be re-processed (already processed)." : "ELO will be processed once."} Both players will be notified.
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setAdminConfirmStep(false)} disabled={busy}>Back</Button>
                <Button onClick={adminResolve} disabled={busy}>
                  <Check className="h-4 w-4 mr-1.5" /> Confirm Resolve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
