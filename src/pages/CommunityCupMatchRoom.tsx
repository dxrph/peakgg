import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Loader2, Send, ShieldAlert, Swords, Trophy, MapPin,
  Lock, Unlock, AlertTriangle, CheckCircle2, RotateCcw, Play, Crown,
  Users, MessageSquare, Target, Info, Settings2, FileText, Hammer, Radio,
  Shuffle, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { VETO_MODE_LABEL, nextBo3Action } from "@/lib/match-veto";
import { getValorantMapImage } from "@/lib/valorant-maps";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type MatchRow = {
  id: string;
  tournament_id: string | null;
  round: number | null;
  bracket_position: number | null;
  status: string;
  result_status: string;
  signup_a_id: string | null;
  signup_b_id: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  score_a: number | null;
  score_b: number | null;
  winner_id: string | null;
  selected_map: string | null;
  map: string | null;
  veto_status: string | null;
  bo_format: string | null;
  map_selection_mode: string | null;
  chat_locked: boolean | null;
  admin_note: string | null;
  result_screenshot_url: string | null;
  result_notes: string | null;
  reported_by_user_id: string | null;
  dispute_status: string | null;
  dispute_reason: string | null;
  lobby_code: string | null;
  server_info: string | null;
  elo_processed_at: string | null;
};

type Veto = {
  id: string;
  mode: string;
  status: string;
  current_turn_signup_id: string | null;
  selected_map: string | null;
  banned_maps: string[];
  picked_maps: { map: string; by: string }[];
  veto_log: { action: string; map?: string; by?: string; at?: string }[];
};

type SignupLite = {
  id: string;
  team_name: string;
  team_tag: string | null;
  community_name: string | null;
  team_logo_url: string | null;
  status: string;
};

type MapPoolMap = { map_name: string; is_active: boolean; image_url: string | null; display_order: number };

type ChatMsg = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_system_message: boolean;
  sender_role: string | null;
  profile?: { username: string; avatar_url: string | null } | null;
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Scheduled", cls: "bg-muted text-muted-foreground" },
  scheduled: { label: "Scheduled", cls: "bg-muted text-muted-foreground" },
  in_progress: { label: "Live", cls: "bg-primary/15 text-primary border-primary/30" },
  live: { label: "Live", cls: "bg-primary/15 text-primary border-primary/30" },
  pending_confirmation: { label: "Pending Staff Confirmation", cls: "bg-warning/15 text-warning border-warning/30" },
  disputed: { label: "Under Staff Review", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  completed: { label: "Completed", cls: "bg-success/15 text-success border-success/30" },
  admin_resolved: { label: "Completed", cls: "bg-success/15 text-success border-success/30" },
};

export default function CommunityCupMatchRoom() {
  const { matchId, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useUserRoles();
  const isStaff = isAdmin || isModerator;

  const [match, setMatch] = useState<MatchRow | null>(null);
  const [veto, setVeto] = useState<Veto | null>(null);
  const [sa, setSa] = useState<SignupLite | null>(null);
  const [sb, setSb] = useState<SignupLite | null>(null);
  const [pool, setPool] = useState<MapPoolMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentName, setTournamentName] = useState<string>("");

  const load = async () => {
    if (!matchId) return;
    setLoading(true);
    const { data: mRaw, error } = await (supabase
      .from("matches")
      .select("*") as any)
      .eq("id", matchId)
      .maybeSingle();
    const m = mRaw as MatchRow | null;
    if (error || !m) {
      toast.error("Match not found.");
      setLoading(false);
      return;
    }
    setMatch(m as MatchRow);

    const ids = [m.signup_a_id, m.signup_b_id].filter(Boolean) as string[];
    if (ids.length) {
      const { data: sg } = await supabase
        .from("tournament_team_signups_public")
        .select("id, team_name, team_tag, community_name, team_logo_url, status")
        .in("id", ids);
      const map = new Map((sg ?? []).map((s: any) => [s.id, s as SignupLite]));
      setSa(m.signup_a_id ? map.get(m.signup_a_id) ?? null : null);
      setSb(m.signup_b_id ? map.get(m.signup_b_id) ?? null : null);
    }

    const [{ data: vetoRow }, { data: poolRows }, { data: tour }] = await Promise.all([
      supabase.from("match_map_veto").select("*").eq("match_id", matchId).maybeSingle(),
      m.tournament_id
        ? supabase
            .from("tournament_map_pool")
            .select("map_name, is_active, image_url, display_order")
            .eq("tournament_id", m.tournament_id)
            .order("display_order")
        : Promise.resolve({ data: [] as MapPoolMap[] } as any),
      m.tournament_id
        ? supabase.from("tournaments").select("name, slug").eq("id", m.tournament_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);

    if (vetoRow) {
      setVeto({
        ...(vetoRow as any),
        banned_maps: ((vetoRow as any).banned_maps ?? []) as string[],
        picked_maps: ((vetoRow as any).picked_maps ?? []) as any[],
        veto_log: ((vetoRow as any).veto_log ?? []) as any[],
      });
    } else {
      setVeto(null);
    }
    setPool(((poolRows as any[]) ?? []) as MapPoolMap[]);
    setTournamentName((tour as any)?.name ?? "Community Cup");
    setLoading(false);
  };

  useEffect(() => {
    load();
    // realtime: refresh match + veto on changes
    const ch = supabase
      .channel(`mr-${matchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_map_veto", filter: `match_id=eq.${matchId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [matchId]);

  // captain side determination
  const captainSide = useMemo<"A" | "B" | null>(() => {
    // We can't read captain_user_id from the public view; instead check signup directly
    return null; // resolved separately below via captainSideAsync
  }, []);
  const [resolvedSide, setResolvedSide] = useState<"A" | "B" | null>(null);
  useEffect(() => {
    if (!user || !match) { setResolvedSide(null); return; }
    (async () => {
      const ids = [match.signup_a_id, match.signup_b_id].filter(Boolean) as string[];
      if (!ids.length) return;
      const { data } = await supabase
        .from("tournament_team_signups")
        .select("id, captain_user_id")
        .in("id", ids);
      const a = (data ?? []).find((x: any) => x.id === match.signup_a_id);
      const b = (data ?? []).find((x: any) => x.id === match.signup_b_id);
      if (a?.captain_user_id === user.id) setResolvedSide("A");
      else if (b?.captain_user_id === user.id) setResolvedSide("B");
      else setResolvedSide(null);
    })();
  }, [user, match]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Match not found.</p>
      </div>
    );
  }

  const cupSlug = slug ?? "community-cup-1";
  const status = match.result_status === "disputed"
    ? "disputed"
    : match.status === "completed"
    ? "completed"
    : match.result_status === "pending_confirmation"
    ? "pending_confirmation"
    : match.status === "in_progress" || match.result_status === "live"
    ? "live"
    : "scheduled";
  const sb_meta = STATUS_BADGE[status];

  const canCaptainAct = !!resolvedSide;
  const isCaptainOrStaff = canCaptainAct || isStaff;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO title={`Match Room — ${tournamentName}`} description="PeakGG Community Cup match room" />
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate(`/tournaments/${cupSlug}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to tournament
        </Button>

        {/* HERO HEADER */}
        <Card className="relative overflow-hidden mb-4 border-border/60 bg-gradient-to-br from-card via-card to-background/40">
          <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_55%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="relative p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-display uppercase tracking-[0.18em]">
              <Swords className="h-3.5 w-3.5 text-primary" />
              <span>{tournamentName}</span>
              {match.round != null && <span className="text-muted-foreground/70">· Round {match.round}</span>}
              {match.bracket_position != null && <span className="text-muted-foreground/70">· Match #{match.bracket_position}</span>}
              {status === "live" && (
                <span className="ml-2 inline-flex items-center gap-1 text-primary">
                  <span className="relative flex h-2 w-2"><span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" /><span className="relative h-2 w-2 rounded-full bg-primary" /></span>
                  LIVE
                </span>
              )}
            </div>

            <div className="mt-4 grid lg:grid-cols-[1fr_auto] gap-5 items-center">
              {/* Team vs Team */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
                <HeroTeam side="A" signup={sa} winnerId={match.winner_id} teamId={match.team_a_id} score={match.score_a} status={status} />
                <div className="flex flex-col items-center gap-1">
                  <div className="font-display text-xs text-muted-foreground tracking-[0.2em]">VS</div>
                  <div className="h-10 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                  {(match.score_a != null || match.score_b != null) && (
                    <div className="font-display text-2xl sm:text-3xl tabular-nums">
                      <span className={cn(match.winner_id && match.team_a_id === match.winner_id && "text-primary")}>{match.score_a ?? "—"}</span>
                      <span className="text-muted-foreground mx-1">:</span>
                      <span className={cn(match.winner_id && match.team_b_id === match.winner_id && "text-primary")}>{match.score_b ?? "—"}</span>
                    </div>
                  )}
                </div>
                <HeroTeam side="B" signup={sb} winnerId={match.winner_id} teamId={match.team_b_id} score={match.score_b} status={status} alignRight />
              </div>

              {/* Status badges */}
              <div className="flex lg:flex-col flex-wrap gap-1.5 lg:items-end justify-start lg:justify-center">
                <Badge className={cn("border font-display tracking-wider", sb_meta?.cls)}>{sb_meta?.label}</Badge>
                <Badge variant="outline" className="font-display">{match.bo_format ?? "BO1"}</Badge>
                <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground font-display">
                  No ELO
                </Badge>
                <Badge variant="outline" className="font-display">
                  <Target className="h-3 w-3 mr-1" />
                  {VETO_MODE_LABEL[match.map_selection_mode ?? "admin_manual"] ?? match.map_selection_mode}
                </Badge>
                {match.selected_map && (
                  <Badge variant="outline" className="border-primary/50 text-primary bg-primary/5">
                    <MapPin className="h-3 w-3 mr-1" /> {match.selected_map}
                  </Badge>
                )}
                {match.chat_locked && (
                  <Badge variant="outline" className="border-destructive/40 text-destructive">
                    <Lock className="h-3 w-3 mr-1" />Chat locked
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* GRID */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <VetoPanel
              match={match}
              veto={veto}
              pool={pool}
              sa={sa}
              sb={sb}
              myCaptainSide={resolvedSide}
              isStaff={isStaff}
              onChanged={load}
            />

            {isCaptainOrStaff && (
              <ResultPanel match={match} myCaptainSide={resolvedSide} isStaff={isStaff} onChanged={load} />
            )}

            {isStaff && (
              <AdminPanel match={match} onChanged={load} />
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            <MatchSummary match={match} status={status} sb_meta={sb_meta} />
            <LobbyPanel match={match} canSeeCode={isCaptainOrStaff} canEdit={isStaff} onChanged={load} />
            <EloStatusPanel match={match} />
            <RulesPanel />
            <ChatPanel matchId={match.id} chatLocked={!!match.chat_locked} canChat={isCaptainOrStaff} isStaff={isStaff} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function HeroTeam({ side, signup, winnerId, teamId, score, status, alignRight }: {
  side: "A" | "B"; signup: SignupLite | null; winnerId: string | null; teamId: string | null;
  score: number | null; status: string; alignRight?: boolean;
}) {
  const isWinner = !!winnerId && teamId === winnerId;
  const isLoser = !!winnerId && teamId !== winnerId && !!signup;
  return (
    <div className={cn(
      "rounded-xl border p-3 sm:p-4 transition-all",
      isWinner ? "border-primary/60 bg-primary/5 shadow-[0_0_30px_-12px_hsl(var(--primary)/0.5)]"
        : isLoser ? "border-border/40 bg-card/40 opacity-70"
        : "border-border/60 bg-card/60 hover:border-border",
      alignRight && "text-right"
    )}>
      <div className={cn("flex items-center gap-3", alignRight && "flex-row-reverse")}>
        <div className={cn(
          "w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden border border-border/50 shrink-0",
          isWinner && "border-primary/60"
        )}>
          {signup?.team_logo_url
            ? <img src={signup.team_logo_url} alt="" className="w-full h-full object-cover" />
            : <Swords className="h-5 w-5 text-muted-foreground" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("flex items-center gap-1.5 text-[10px] font-display uppercase tracking-[0.18em] text-muted-foreground", alignRight && "justify-end")}>
            <span>Team {side}</span>
            {isWinner && <Crown className="h-3 w-3 text-primary" />}
          </div>
          <div className="font-display text-base sm:text-lg leading-tight truncate mt-0.5">
            {signup?.team_tag && <span className="text-primary/80 mr-1">[{signup.team_tag}]</span>}
            {signup?.team_name ?? "TBD"}
          </div>
          {signup?.community_name && (
            <div className={cn("text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5", alignRight && "justify-end")}>
              <Users className="h-3 w-3" />
              <span className="truncate">{signup.community_name}</span>
            </div>
          )}
        </div>
      </div>
      {isWinner && (
        <div className={cn("mt-2 text-[10px] font-display uppercase tracking-wider text-primary flex items-center gap-1", alignRight && "justify-end")}>
          <Trophy className="h-3 w-3" /> Winner
        </div>
      )}
    </div>
  );
}

function MatchSummary({ match, status, sb_meta }: { match: MatchRow; status: string; sb_meta: { label: string; cls: string } | undefined }) {
  const rows: Array<[string, React.ReactNode]> = [
    ["Status", <Badge key="s" className={cn("border", sb_meta?.cls)}>{sb_meta?.label}</Badge>],
    ["Format", <span key="f" className="font-display">{match.bo_format ?? "BO1"}</span>],
    ["Map mode", <span key="m">{VETO_MODE_LABEL[match.map_selection_mode ?? "admin_manual"] ?? match.map_selection_mode}</span>],
    ["Selected map", match.selected_map
      ? <span key="sm" className="text-primary font-display">{match.selected_map}</span>
      : <span key="sm" className="text-muted-foreground italic text-[11px]">Pending — staff to select or randomize</span>],
    ["Lobby code", match.lobby_code
      ? <span key="lc" className="font-mono text-primary">{match.lobby_code}</span>
      : <span key="lc" className="text-muted-foreground italic text-[11px]">Pending</span>],
    ["Server", match.server_info
      ? <span key="sv" className="font-display">{match.server_info}</span>
      : <span key="sv" className="text-muted-foreground italic text-[11px]">Not set</span>],
    ["Result", <span key="r" className="text-muted-foreground">{match.result_status ?? "—"}</span>],
    ["Score", <span key="sc" className="font-display tabular-nums">{match.score_a ?? "—"} : {match.score_b ?? "—"}</span>],
  ];
  return (
    <Card className="p-4 border-border/60">
      <h3 className="font-display uppercase tracking-[0.18em] text-xs text-muted-foreground flex items-center gap-2 mb-3">
        <Info className="h-3.5 w-3.5 text-primary" /> Match Summary
      </h3>
      <dl className="space-y-2 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
            <dt className="text-muted-foreground uppercase tracking-wider text-[10px]">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>
      {status === "live" && (
        <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-2 text-[11px] text-primary flex items-center gap-1.5">
          <Radio className="h-3 w-3" /> Match in progress.
        </div>
      )}
    </Card>
  );
}

function LobbyPanel({
  match, canSeeCode, canEdit, onChanged,
}: { match: MatchRow; canSeeCode: boolean; canEdit: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(match.lobby_code ?? "");
  const [server, setServer] = useState(match.server_info ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCode(match.lobby_code ?? "");
    setServer(match.server_info ?? "");
  }, [match.lobby_code, match.server_info]);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("matches")
      .update({ lobby_code: code.trim() || null, server_info: server.trim() || null } as any)
      .eq("id", match.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Lobby info updated");
    setEditing(false);
    onChanged();
  };

  const copy = async () => {
    if (!match.lobby_code) return;
    try {
      await navigator.clipboard.writeText(match.lobby_code);
      toast.success("Lobby code copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Card className="p-4 border-border/60">
      <h3 className="font-display uppercase tracking-[0.18em] text-xs text-muted-foreground flex items-center gap-2 mb-3">
        <Lock className="h-3.5 w-3.5 text-primary" /> Match Setup
      </h3>

      {!canSeeCode ? (
        <p className="text-xs text-muted-foreground">
          The lobby code is visible to participants and staff only.
        </p>
      ) : editing && canEdit ? (
        <div className="space-y-2">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Lobby code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. PEAK-1234" maxLength={32} />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Server / region</Label>
            <Input value={server} onChange={(e) => setServer(e.target.value)} placeholder="e.g. EU Frankfurt" maxLength={64} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="neon" disabled={busy} onClick={save}>
              {busy && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}Save
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Lobby code</span>
            {match.lobby_code ? (
              <button
                type="button"
                onClick={copy}
                className="font-mono text-sm text-primary hover:underline"
                title="Click to copy"
              >
                {match.lobby_code}
              </button>
            ) : (
              <span className="text-muted-foreground italic">Lobby code pending</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Server</span>
            <span className="font-display">{match.server_info || <span className="text-muted-foreground italic">Not set</span>}</span>
          </div>
          {canEdit && (
            <div className="pt-1">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="w-full">
                <Settings2 className="h-3 w-3 mr-1.5" />
                {match.lobby_code ? "Edit lobby info" : "Set lobby code"}
              </Button>
            </div>
          )}
          {!canEdit && !match.lobby_code && (
            <p className="text-[11px] text-muted-foreground italic pt-1">Waiting for staff to provide the lobby code.</p>
          )}
        </div>
      )}
    </Card>
  );
}

function RulesPanel() {
  return (
    <Card className="p-4 border-border/60">
      <h3 className="font-display uppercase tracking-[0.18em] text-xs text-muted-foreground flex items-center gap-2 mb-2">
        <FileText className="h-3.5 w-3.5 text-primary" /> Ruleset
        <Badge className="ml-auto bg-primary/10 text-primary border-primary/30 text-[10px]">VCT-inspired</Badge>
      </h3>
      <p className="text-[11px] text-muted-foreground mb-3">
        Competitive rules inspired by the VCT format. Not affiliated with Riot Games.
      </p>
      <Accordion type="multiple" className="text-xs">
        <AccordionItem value="lobby" className="border-border/40">
          <AccordionTrigger className="text-xs py-2">Lobby & gameplay</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Custom Game · Tournament Mode ON</li>
              <li>Cheats OFF · Overtime ON · Win by 2</li>
              <li>Server: EU preferred</li>
              <li>Map(s): selected via the veto / admin assignment</li>
              <li>Agents: current official competitive pool</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="result" className="border-border/40">
          <AccordionTrigger className="text-xs py-2">Reporting & disputes</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Screenshot of the final scoreboard recommended</li>
              <li>Both sides must confirm the result before it becomes official</li>
              <li>If the score is wrong, open a dispute with evidence</li>
              <li>Admins resolve disputes; their decision is final</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="conduct" className="border-border/40">
          <AccordionTrigger className="text-xs py-2">No-show, DC & conduct</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Players must be present within 15 minutes of the match start</li>
              <li>Disconnects: standard pause rules apply where supported</li>
              <li>Toxicity / cheating: report via dispute or ticket</li>
              <li>Repeated no-shows or violations may incur ELO penalties</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

function VetoPanel({
  match, veto, pool, sa, sb, myCaptainSide, isStaff, onChanged,
}: {
  match: MatchRow; veto: Veto | null; pool: MapPoolMap[]; sa: SignupLite | null; sb: SignupLite | null;
  myCaptainSide: "A" | "B" | null; isStaff: boolean; onChanged: () => void;
}) {
  const activeMaps = pool.filter((p) => p.is_active).map((p) => p.map_name);
  const banned = veto?.banned_maps ?? [];
  const picked = veto?.picked_maps?.map((p) => p.map) ?? [];
  const used = new Set([...banned, ...picked]);

  const myTurn = !!myCaptainSide && !!veto && veto.status === "in_progress" &&
    ((myCaptainSide === "A" && veto.current_turn_signup_id === match.signup_a_id) ||
     (myCaptainSide === "B" && veto.current_turn_signup_id === match.signup_b_id));

  const turnSide = veto?.current_turn_signup_id === match.signup_a_id ? "A"
    : veto?.current_turn_signup_id === match.signup_b_id ? "B" : null;

  const [busy, setBusy] = useState(false);

  const action = veto?.mode === "bo3_veto" ? nextBo3Action(banned, picked) : null;

  const ban = async (mapName: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("captain_ban_map", { _match_id: match.id, _map: mapName } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Banned ${mapName}`);
    onChanged();
  };
  const pick = async (mapName: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("captain_pick_map", { _match_id: match.id, _map: mapName } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Picked ${mapName}`);
    onChanged();
  };

  const startVeto = async (mode: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("start_match_veto", { _match_id: match.id, _mode: mode } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Veto started");
    onChanged();
  };
  const reset = async () => {
    if (!confirm("Reset map veto?")) return;
    setBusy(true);
    const { error } = await supabase.rpc("reset_match_veto", { _match_id: match.id } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Veto reset");
    onChanged();
  };
  const forceComplete = async () => {
    const m = prompt("Force selected map (leave blank to keep current):", match.selected_map ?? "");
    if (m === null) return;
    setBusy(true);
    const { error } = await supabase.rpc("complete_match_veto", { _match_id: match.id, _selected_map: m || null } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Veto completed");
    onChanged();
  };

  const canAct = (myTurn && veto?.status === "in_progress") || isStaff;

  return (
    <Card className="relative overflow-hidden border-border/60">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-display uppercase tracking-[0.18em] text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Map Veto
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {veto
              ? <>Manage bans and picks for this match. <span className="text-foreground/80">Mode: {VETO_MODE_LABEL[veto.mode] ?? veto.mode}</span></>
              : match.map_selection_mode === "admin_manual"
                ? "Map will be selected manually by tournament staff unless veto is started."
                : "Map veto has not started yet. Once staff or the system starts the veto, captains will be able to ban or pick maps here."}
          </p>
        </div>
        {isStaff && (
          <div className="flex flex-wrap gap-1.5">
            {!veto || veto.status === "completed" ? (
              <>
                <Select onValueChange={(v) => startVeto(v)}>
                  <SelectTrigger className="h-8 w-[180px]"><SelectValue placeholder="Start veto…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="bo1_veto">Captain Veto BO1</SelectItem>
                    <SelectItem value="bo3_veto">Captain Veto BO3</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : null}
            {veto && (
              <>
                <Button size="sm" variant="outline" onClick={forceComplete} disabled={busy}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Force complete</Button>
                <Button size="sm" variant="outline" onClick={reset} disabled={busy}><RotateCcw className="h-3.5 w-3.5 mr-1" />Reset</Button>
              </>
            )}
          </div>
        )}
      </div>

      {!veto && !isStaff && (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
          <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
          Waiting for tournament staff to start the veto.
        </div>
      )}

      {veto && veto.status === "in_progress" && (
        <div className="mb-4 p-3 rounded-lg border border-primary/40 bg-gradient-to-r from-primary/10 to-transparent flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-primary" />
          </div>
          <div className="text-sm flex-1">
            {turnSide ? (
              <>
                <span className="font-display uppercase text-primary tracking-wider">Team {turnSide}</span>
                <span className="text-muted-foreground"> turn</span>
                {action && <span className="text-foreground/80"> · {action.label}</span>}
                {myTurn && <span className="ml-2 inline-flex items-center gap-1 text-success font-display uppercase text-xs">— Your move</span>}
                {!myTurn && myCaptainSide && <span className="ml-2 text-muted-foreground text-xs">— waiting for the other captain</span>}
              </>
            ) : (
              <>Awaiting next action…</>
            )}
          </div>
          <Badge variant="outline" className="font-display text-[10px]">{VETO_MODE_LABEL[veto.mode] ?? veto.mode}</Badge>
        </div>
      )}

      {/* Map grid */}
      {activeMaps.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 inline mr-1 text-warning" />
          No active maps in pool. Admin must adjust the map pool.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {activeMaps.map((m) => {
            const isBanned = banned.includes(m);
            const isPicked = picked.includes(m);
            const isSelected = match.selected_map === m;
            const disabled = used.has(m) || busy || !canAct || (veto?.status !== "in_progress");
            return (
              <div key={m} className={cn(
                "group relative rounded-lg border overflow-hidden transition-all",
                isSelected ? "border-primary bg-gradient-to-b from-primary/20 to-primary/5 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.6)]" :
                isBanned ? "border-destructive/30 bg-destructive/5 opacity-60" :
                isPicked ? "border-success/40 bg-success/5" :
                "border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70"
              )}>
                <div className="aspect-[4/3] relative">
                  {/* Always-on backdrop so missing/broken map splashes still look intentional */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-muted/10" />
                  {(() => {
                    const imgUrl = getValorantMapImage(m, pool.find((p) => p.map_name === m)?.image_url ?? null);
                    return imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={m}
                        loading="lazy"
                        onError={(e) => {
                          // Hide broken image; the gradient overlay below remains as the fallback look.
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                        className={cn(
                          "absolute inset-0 w-full h-full object-cover",
                          isBanned && "grayscale",
                          !isSelected && !isPicked && "opacity-80 group-hover:opacity-100 transition",
                        )}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-muted/10 flex items-center justify-center">
                        <MapPin className="h-7 w-7 text-primary/50" />
                      </div>
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <div className={cn("font-display text-sm leading-tight", isBanned && "line-through")}>{m}</div>
                    {isBanned && <div className="text-[10px] uppercase tracking-wider text-destructive font-display">Banned</div>}
                    {isPicked && <div className="text-[10px] uppercase tracking-wider text-success font-display">Picked</div>}
                    {isSelected && <div className="text-[10px] uppercase tracking-wider text-primary font-display flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Selected</div>}
                  </div>
                </div>
                {!used.has(m) && veto?.status === "in_progress" && (
                  <div className="flex gap-1 p-1.5 border-t border-border/40 bg-card/60">
                    {(veto.mode === "bo1_veto" || veto.mode === "bo3_veto") && (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] flex-1" disabled={disabled} onClick={() => ban(m)}>Ban</Button>
                    )}
                    {veto.mode === "bo3_veto" && action?.type === "pick" && (
                      <Button size="sm" variant="neon" className="h-6 px-2 text-[10px] flex-1" disabled={disabled} onClick={() => pick(m)}>Pick</Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Veto log */}
      {veto && (veto.veto_log?.length ?? 0) > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Veto log</p>
          <ul className="space-y-1 text-xs">
            {veto.veto_log.map((l, i) => (
              <li key={i} className="text-muted-foreground">
                <span className="text-foreground">{l.action}</span> {l.map ? `· ${l.map}` : ""} {l.by ? `· ${l.by}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </Card>
  );
}

function ResultPanel({ match, myCaptainSide, isStaff, onChanged }: {
  match: MatchRow; myCaptainSide: "A" | "B" | null; isStaff: boolean; onChanged: () => void;
}) {
  const [a, setA] = useState<string>(match.score_a?.toString() ?? "");
  const [b, setB] = useState<string>(match.score_b?.toString() ?? "");
  const [screenshot, setScreenshot] = useState(match.result_screenshot_url ?? "");
  const [notes, setNotes] = useState(match.result_notes ?? "");
  const [confirm1, setConfirm1] = useState(false);
  const [busy, setBusy] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  useEffect(() => {
    setA(match.score_a?.toString() ?? "");
    setB(match.score_b?.toString() ?? "");
    setScreenshot(match.result_screenshot_url ?? "");
    setNotes(match.result_notes ?? "");
  }, [match.id, match.score_a, match.score_b, match.result_screenshot_url, match.result_notes]);

  const submit = async () => {
    if (!myCaptainSide) return toast.error("Only team captains can submit results.");
    const sa = Number(a), sb = Number(b);
    if (!Number.isFinite(sa) || !Number.isFinite(sb)) return toast.error("Enter both scores.");
    if (!confirm1) return toast.error("Please confirm the result is correct.");
    setBusy(true);
    const { error } = await supabase.rpc("submit_cup_match_result", {
      _match_id: match.id,
      _score_a: sa,
      _score_b: sb,
      _screenshot: screenshot || null,
      _notes: notes || null,
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Result submitted. Awaiting staff confirmation.");
    setConfirm1(false);
    onChanged();
  };

  const disabled = match.status === "completed" || match.result_status === "admin_resolved";

  return (
    <Card className="p-5 border-border/60">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="font-display uppercase tracking-[0.18em] text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Result Reporting
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Submit the final score for staff review. Staff confirmation required before the result becomes official.</p>
        </div>
      </div>
      {match.result_status === "pending_confirmation" && (
        <div className="mb-4 p-3 rounded-lg border border-warning/40 bg-warning/5 text-sm text-warning flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Result submitted. Waiting for staff confirmation.
        </div>
      )}
      {disabled && (
        <div className="mb-4 p-3 rounded-lg border border-success/40 bg-success/5 text-sm text-success flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Match completed. Final score {match.score_a}–{match.score_b}.
        </div>
      )}
      {!myCaptainSide && !isStaff && !disabled && (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-5 text-center text-sm text-muted-foreground">
          <Info className="h-5 w-5 mx-auto mb-2 text-muted-foreground/50" />
          Only the team captains involved in this match can submit a result.
        </div>
      )}
      {(myCaptainSide || isStaff) && (
      <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Score Team A</Label>
          <Input value={a} onChange={(e) => setA(e.target.value)} type="number" disabled={disabled || !myCaptainSide} />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Score Team B</Label>
          <Input value={b} onChange={(e) => setB(e.target.value)} type="number" disabled={disabled || !myCaptainSide} />
        </div>
      </div>
      <div className="mt-3">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Screenshot URL (optional)</Label>
        <Input value={screenshot} onChange={(e) => setScreenshot(e.target.value)} placeholder="https://…" disabled={disabled || !myCaptainSide} />
      </div>
      <div className="mt-3">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Notes (optional)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={disabled || !myCaptainSide} rows={3} />
      </div>
      {myCaptainSide && !disabled && (
        <label className="flex items-center gap-2 mt-4 text-xs cursor-pointer">
          <input type="checkbox" checked={confirm1} onChange={(e) => setConfirm1(e.target.checked)} className="accent-primary" />
          I confirm this result is correct.
        </label>
      )}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        {myCaptainSide && (
          <Button size="sm" variant="neon" disabled={busy || disabled || !confirm1} onClick={submit}>
            {busy && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Submit Result
          </Button>
        )}
        {myCaptainSide && (
          <Button size="sm" variant="outline" onClick={() => setDisputeOpen(true)} disabled={disabled}>
            <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Open Dispute
          </Button>
        )}
        {myCaptainSide && !disabled && (
          <p className="text-[11px] text-muted-foreground ml-auto">Submitting does not finalize the match. Staff will review and confirm.</p>
        )}
      </div>
      </>
      )}

      <DisputeDialog open={disputeOpen} onOpenChange={setDisputeOpen} matchId={match.id} onChanged={onChanged} />
    </Card>
  );
}

const DISPUTE_REASONS = [
  "Wrong score",
  "No-show",
  "Unauthorized substitute",
  "Player eligibility issue",
  "Toxic behavior",
  "Rule violation",
  "Technical issue",
  "Other",
];

function DisputeDialog({ open, onOpenChange, matchId, onChanged }: { open: boolean; onOpenChange: (v: boolean) => void; matchId: string; onChanged: () => void }) {
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("open_cup_match_dispute", {
      _match_id: matchId,
      _reason: reason,
      _description: description || null,
      _evidence: evidence || null,
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Dispute opened. Tournament staff will review.");
    onOpenChange(false);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open a dispute</DialogTitle>
          <DialogDescription>Tournament staff will review the match.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DISPUTE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </div>
          <div>
            <Label className="text-xs">Evidence URL (optional)</Label>
            <Input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant="neon" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Submit dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminPanel({ match, onChanged }: { match: MatchRow; onChanged: () => void }) {
  const [a, setA] = useState<string>(match.score_a?.toString() ?? "");
  const [b, setB] = useState<string>(match.score_b?.toString() ?? "");
  const [boFormat, setBoFormat] = useState(match.bo_format ?? "BO1");
  const [adminNote, setAdminNote] = useState(match.admin_note ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setA(match.score_a?.toString() ?? "");
    setB(match.score_b?.toString() ?? "");
    setBoFormat(match.bo_format ?? "BO1");
    setAdminNote(match.admin_note ?? "");
  }, [match.id, match.score_a, match.score_b, match.bo_format, match.admin_note]);

  const confirmResult = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("admin_confirm_cup_match_result", {
      _match_id: match.id,
      _score_a: a ? Number(a) : null,
      _score_b: b ? Number(b) : null,
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Result confirmed and bracket advanced.");
    // Community Cup does NOT affect ELO. We intentionally do not call
    // update-match-result here. ELO is reserved for Open Cup / ranked queue.
    onChanged();
  };

  const updateMatch = async (patch: Record<string, any>) => {
    setBusy(true);
    const { error } = await supabase.from("matches").update(patch as any).eq("id", match.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    onChanged();
  };

  const lockChat = async (locked: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc("set_cup_match_chat_locked", { _match_id: match.id, _locked: locked } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(locked ? "Chat locked" : "Chat unlocked");
    onChanged();
  };

  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-b from-primary/[0.03] to-transparent">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
          <div>
            <h2 className="font-display uppercase tracking-[0.18em] text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Admin Controls
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Staff-only controls for match management. Use these tools to override settings, confirm results and manage the match.</p>
          </div>
          <Badge variant="outline" className="border-primary/40 text-primary font-display text-[10px]">STAFF ONLY</Badge>
        </div>

        <Accordion type="multiple" defaultValue={["result"]} className="mt-4">
          <AccordionItem value="result" className="border-border/60">
            <AccordionTrigger className="text-sm font-display uppercase tracking-wider hover:no-underline">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Match Result</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Score A</Label>
                  <Input type="number" value={a} onChange={(e) => setA(e.target.value)} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Score B</Label>
                  <Input type="number" value={b} onChange={(e) => setB(e.target.value)} />
                </div>
              </div>
              <Button size="sm" variant="neon" onClick={confirmResult} disabled={busy}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm Result & Advance Bracket
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="format" className="border-border/60">
            <AccordionTrigger className="text-sm font-display uppercase tracking-wider hover:no-underline">
              <span className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" />Match Format</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">BO format (override)</Label>
                  <Select value={boFormat} onValueChange={(v) => { setBoFormat(v); updateMatch({ bo_format: v }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["BO1","BO2","BO3","BO5"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Selected map (manual override)</Label>
                  <Input
                    value={match.selected_map ?? ""}
                    onChange={(e) => updateMatch({ selected_map: e.target.value, map: e.target.value, veto_status: e.target.value ? "map_selected" : "not_started" })}
                    placeholder="Map name…"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    let pool: string[] = [];
                    if (match.tournament_id) {
                      const { data } = await supabase
                        .from("tournament_map_pool" as never)
                        .select("map_name, is_active")
                        .eq("tournament_id", match.tournament_id)
                        .eq("is_active", true);
                      pool = ((data as any[]) ?? []).map((r: any) => r.map_name);
                    }
                    if (pool.length === 0) {
                      const { DEFAULT_VALORANT_MAP_POOL } = await import("@/lib/valorant-maps");
                      pool = [...DEFAULT_VALORANT_MAP_POOL];
                    }
                    const pick = pool[Math.floor(Math.random() * pool.length)];
                    await updateMatch({ selected_map: pick, map: pick, veto_status: "map_selected" });
                  }}
                >
                  <Shuffle className="h-3.5 w-3.5 mr-1" /> Randomize Map from Pool
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notes" className="border-border/60">
            <AccordionTrigger className="text-sm font-display uppercase tracking-wider hover:no-underline">
              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Staff Notes</span>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin note (private)</Label>
              <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} onBlur={() => updateMatch({ admin_note: adminNote })} rows={3} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="actions" className="border-border/60 border-b-0">
            <AccordionTrigger className="text-sm font-display uppercase tracking-wider hover:no-underline">
              <span className="flex items-center gap-2"><Hammer className="h-4 w-4 text-primary" />Match Actions</span>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => updateMatch({ status: "in_progress", result_status: "live" })}>
                  <Play className="h-3.5 w-3.5 mr-1" /> Mark Live
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateMatch({ result_status: "disputed", dispute_status: "open" })}>
                  <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Mark Disputed
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateMatch({ dispute_status: "resolved", result_status: "scheduled" })}>
                  Resolve Dispute
                </Button>
                <Button size="sm" variant="outline" onClick={() => lockChat(!match.chat_locked)}>
                  {match.chat_locked ? <Unlock className="h-3.5 w-3.5 mr-1" /> : <Lock className="h-3.5 w-3.5 mr-1" />}
                  {match.chat_locked ? "Unlock chat" : "Lock chat"}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Card>
  );
}

function ChatPanel({ matchId, chatLocked, canChat, isStaff }: { matchId: string; chatLocked: boolean; canChat: boolean; isStaff: boolean }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const hydrate = async (rows: any[]): Promise<ChatMsg[]> => {
    if (!rows.length) return [];
    const ids = [...new Set(rows.filter((r) => !r.is_system_message).map((r) => r.user_id))].filter(Boolean);
    if (!ids.length) return rows as ChatMsg[];
    const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url").in("id", ids);
    const m = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return rows.map((r) => ({ ...r, profile: m.get(r.user_id) ?? null }));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("match_chat_messages")
        .select("id, user_id, content, created_at, is_system_message, sender_role")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      setMsgs(await hydrate((data as any[]) ?? []));
    })();
    const ch = supabase
      .channel(`mc-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "match_chat_messages", filter: `match_id=eq.${matchId}` }, async (payload) => {
        const [hyd] = await hydrate([payload.new]);
        setMsgs((prev) => prev.some((m) => m.id === (payload.new as any).id) ? prev : [...prev, hyd]);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [matchId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs.length]);

  const send = async () => {
    if (!user || !text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("match_chat_messages").insert({
      match_id: matchId,
      user_id: user.id,
      content: text.trim().slice(0, 500),
      is_system_message: false,
      sender_role: isStaff ? "admin" : "captain",
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    setText("");
  };

  return (
    <Card className="relative p-0 overflow-hidden flex flex-col h-[640px] border-border/60">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="px-4 py-3 border-b border-border/60 bg-card/60 backdrop-blur flex items-center justify-between">
        <div>
          <h3 className="font-display uppercase tracking-[0.18em] text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Match Chat
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Coordination between captains and staff.</p>
        </div>
        {chatLocked && <Badge variant="outline" className="border-destructive/40 text-destructive text-[10px]"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {msgs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-8">
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-display uppercase tracking-wider text-foreground/80">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
              Captains and staff can use this chat for coordination during the match.
            </p>
          </div>
        ) : msgs.map((m) => (
          <div key={m.id} className={cn("text-sm", m.is_system_message && "flex justify-center")}>
            {m.is_system_message ? (
              <div className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary/90">
                <Radio className="h-3 w-3" />{m.content}
              </div>
            ) : (
              <div className={cn(
                "flex items-start gap-2 rounded-lg p-2",
                m.sender_role === "admin" ? "bg-primary/[0.04] border border-primary/15" : "hover:bg-muted/20"
              )}>
                {m.profile?.avatar_url
                  ? <img src={m.profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover mt-0.5 border border-border/40" />
                  : <div className="w-7 h-7 rounded-full bg-muted mt-0.5 flex items-center justify-center text-[10px] font-display text-muted-foreground">{(m.profile?.username ?? "P")[0].toUpperCase()}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={cn("font-display uppercase text-xs tracking-wider", m.sender_role === "admin" ? "text-primary" : "text-foreground")}>
                      {m.profile?.username ?? "Player"}
                    </span>
                    {m.sender_role === "admin" && (
                      <Badge variant="outline" className="border-primary/40 text-primary text-[9px] py-0 h-4 px-1">STAFF</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="break-words text-sm mt-0.5 text-foreground/90">{m.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {canChat && !chatLocked && user && (
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-border/60 p-2 flex gap-2 bg-card/40">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" maxLength={500} disabled={busy} className="bg-background/60" />
          <Button type="submit" size="sm" variant="neon" disabled={busy || !text.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      )}
      {chatLocked && !isStaff && (
        <div className="border-t border-border/60 p-3 text-center text-xs text-muted-foreground bg-destructive/5 flex items-center justify-center gap-2">
          <Lock className="h-3.5 w-3.5" /> Match chat is locked by tournament staff.
        </div>
      )}
      {!canChat && !chatLocked && (
        <div className="border-t border-border/60 p-3 text-center text-xs text-muted-foreground">
          Only captains involved in this match and staff can write here.
        </div>
      )}
    </Card>
  );
}

type EloRow = { user_id: string; delta: number; elo_before: number; elo_after: number; reason: string };

function EloStatusPanel({ match }: { match: MatchRow }) {
  const [rows, setRows] = useState<EloRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, { username: string; avatar_url: string | null }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hasRosters, setHasRosters] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: hist }, { data: rosters }] = await Promise.all([
        supabase.from("elo_history").select("user_id, delta, elo_before, elo_after, reason").eq("match_id", match.id),
        supabase.from("match_rosters").select("user_id").eq("match_id", match.id).limit(1),
      ]);
      if (cancelled) return;
      const eloRows = ((hist as any[]) ?? []) as EloRow[];
      setRows(eloRows);
      setHasRosters(((rosters as any[]) ?? []).length > 0);
      const ids = [...new Set(eloRows.map((r) => r.user_id))];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username, avatar_url").in("id", ids);
        if (!cancelled) {
          setProfiles(new Map((profs ?? []).map((p: any) => [p.id, { username: p.username, avatar_url: p.avatar_url }])));
        }
      }
      setLoading(false);
    })();
  }, [match.id, match.elo_processed_at, match.status]);

  const isDisputed = match.result_status === "disputed" || match.dispute_status === "open";
  const isCompleted = match.status === "completed";
  const processed = !!(match as any).elo_processed_at || rows.length > 0;

  let banner: { tone: "muted" | "warning" | "success" | "info"; label: string; hint?: string };
  if (isDisputed) banner = { tone: "warning", label: "ELO Frozen", hint: "Match is disputed — ELO will process after staff resolves it." };
  else if (processed) banner = { tone: "success", label: "ELO Updated", hint: "Per-game ELO and history have been written." };
  else if (isCompleted) banner = { tone: "info", label: "Processing…", hint: "ELO update is in progress for participants." };
  else if (hasRosters === false) banner = { tone: "muted", label: "ELO Not Applicable", hint: "ELO will apply once registered players are attached to this match roster." };
  else banner = { tone: "info", label: "ELO Pending", hint: "ELO updates after the result is officially confirmed by staff." };

  const toneCls = {
    muted: "border-border/60 bg-muted/10 text-muted-foreground",
    warning: "border-warning/40 bg-warning/5 text-warning",
    success: "border-success/40 bg-success/5 text-success",
    info: "border-primary/30 bg-primary/5 text-primary",
  }[banner.tone];

  return (
    <Card className="p-4 border-border/60">
      <h3 className="font-display uppercase tracking-[0.18em] text-xs text-muted-foreground flex items-center gap-2 mb-3">
        <TrendingUp className="h-3.5 w-3.5 text-primary" /> ELO Status
        <Badge className="ml-auto bg-primary/10 text-primary border-primary/30 text-[10px]">Community Cup</Badge>
      </h3>
      <div className={cn("rounded-md border p-2.5 text-xs", toneCls)}>
        <div className="font-display uppercase tracking-wider">{banner.label}</div>
        {banner.hint && <div className="text-[11px] opacity-80 mt-0.5">{banner.hint}</div>}
      </div>
      {loading ? (
        <div className="mt-3 text-[11px] text-muted-foreground">Loading…</div>
      ) : rows.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-xs">
          {rows.map((r) => {
            const p = profiles.get(r.user_id);
            const positive = r.delta >= 0;
            return (
              <li key={r.user_id} className="flex items-center gap-2 border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                {p?.avatar_url
                  ? <img src={p.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                  : <div className="w-5 h-5 rounded-full bg-muted" />}
                <span className="truncate flex-1">{p?.username ?? r.user_id.slice(0, 6)}</span>
                <span className="text-muted-foreground tabular-nums">{r.elo_before} → {r.elo_after}</span>
                <span className={cn("font-display tabular-nums", positive ? "text-success" : "text-destructive")}>
                  {positive ? "+" : ""}{r.delta}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Card>
  );
}
