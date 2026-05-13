import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, ShieldCheck, Trophy, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import CommunityCupSignupDialog from "./CommunityCupSignupDialog";
import { DISCORD_INVITE } from "@/lib/links";
import RosterManager from "@/components/community-cup/RosterManager";
import MyInvites from "@/components/community-cup/MyInvites";
import SignupRosterCard from "@/components/community-cup/SignupRosterCard";

type PublicSignup = {
  id: string; team_name: string; team_tag: string | null; team_logo_url: string | null;
  community_name: string; country_language: string; average_rank: string | null; status: string;
};
type MySignup = PublicSignup & { captain_name: string; captain_discord: string; admin_note: string | null; checked_in_at: string | null; created_at: string; captain_user_id: string | null; ready_at: string | null; roster_locked_at: string | null };

interface Props { tournamentId: string; tournamentStatus: string }

const STATUS_META: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon?: React.ReactNode; cls?: string }> = {
  pending:     { label: "Pending review", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  approved:    { label: "Approved",       variant: "outline",   icon: <CheckCircle2 className="h-3 w-3" />, cls: "border-success text-success" },
  checked_in:  { label: "Checked in",     variant: "outline",   icon: <ShieldCheck className="h-3 w-3" />,  cls: "border-primary text-primary" },
  waitlisted:  { label: "Waitlisted",     variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  rejected:    { label: "Rejected",       variant: "outline",   icon: <XCircle className="h-3 w-3" />,      cls: "border-destructive text-destructive" },
  eliminated:  { label: "Eliminated",     variant: "secondary" },
  champion:    { label: "Champion",       variant: "outline",   icon: <Trophy className="h-3 w-3" />,       cls: "border-accent text-accent" },
};

export default function CommunityCupPanel({ tournamentId, tournamentStatus }: Props) {
  const { user } = useAuth();
  const [publicTeams, setPublicTeams] = useState<PublicSignup[]>([]);
  const [mine, setMine] = useState<MySignup | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: pub }, mineRes] = await Promise.all([
      supabase.from("tournament_team_signups_public" as never)
        .select("id, team_name, team_tag, team_logo_url, community_name, country_language, average_rank, status")
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: true }),
      user
        ? supabase.from("tournament_team_signups" as never)
            .select("id, team_name, team_tag, team_logo_url, community_name, country_language, average_rank, status, captain_name, captain_discord, admin_note, checked_in_at, created_at, captain_user_id, ready_at, roster_locked_at, tournament_id")
            .eq("tournament_id", tournamentId)
            .eq("captain_user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setPublicTeams((pub ?? []) as PublicSignup[]);
    setMine(((mineRes as { data: MySignup | null }).data) ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tournamentId, user?.id]);

  const checkinOpen = tournamentStatus === "checkin" || tournamentStatus === "checkin_open";
  const registrationOpen = tournamentStatus === "registration_open";

  const checkIn = async () => {
    if (!mine) return;
    setBusy(true);
    const { error } = await supabase.rpc("community_cup_checkin" as never, { _signup_id: mine.id } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("You are checked in. Good luck!");
    load();
  };

  const champion = useMemo(() => publicTeams.find((t) => t.status === "champion"), [publicTeams]);

  if (loading) {
    return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending invites for the current user */}
      <MyInvites tournamentId={tournamentId} onChanged={load} />

      {/* MY TEAM */}
      {user && mine && (
        <>
        <div className="rounded-lg border border-primary/40 bg-card p-6 neon-border">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-1">My Team</p>
              <h3 className="text-xl font-display font-bold">
                {mine.team_tag ? <span className="text-muted-foreground mr-2">[{mine.team_tag}]</span> : null}
                {mine.team_name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{mine.community_name} · {mine.country_language}</p>
              {mine.admin_note && (
                <p className="text-sm mt-3 rounded bg-muted/40 px-3 py-2 border border-border">
                  <span className="text-muted-foreground">Staff note: </span>{mine.admin_note}
                </p>
              )}
            </div>
            <StatusBadge status={mine.status} />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {checkinOpen && mine.status === "approved" && (
              <Button variant="neon" onClick={checkIn} disabled={busy} className="uppercase tracking-wider">
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Check In
              </Button>
            )}
            {mine.status === "checked_in" && (
              <Badge variant="outline" className="border-primary text-primary">Checked in {mine.checked_in_at ? new Date(mine.checked_in_at).toLocaleString() : ""}</Badge>
            )}
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
              <Button variant="neonOutline" size="sm">Open Discord</Button>
            </a>
          </div>
        </div>

        {/* Captain roster management */}
        <RosterManager
          signup={{
            id: mine.id,
            tournament_id: tournamentId,
            captain_user_id: mine.captain_user_id,
            team_name: mine.team_name,
            team_tag: mine.team_tag,
            team_logo_url: mine.team_logo_url,
            status: mine.status,
            ready_at: mine.ready_at,
            roster_locked_at: mine.roster_locked_at,
          }}
          onChanged={load}
        />
        </>
      )}

      {/* REGISTER CTA when no signup */}
      {user && !mine && registrationOpen && (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <h3 className="text-lg font-display font-bold mb-2">Bring your 5-stack</h3>
          <p className="text-sm text-muted-foreground mb-4">Free entry. Staff reviews every signup before approval.</p>
          <Button variant="neon" size="lg" className="uppercase tracking-wider" onClick={() => setOpenDialog(true)}>
            Register Your Team
          </Button>
        </div>
      )}

      {!user && registrationOpen && (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Sign in to register your team for PeakGG Community Cup #1.</p>
        </div>
      )}

      {/* APPROVED TEAMS */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />Approved Teams
          </h3>
          <Badge variant="secondary" className="font-display">{publicTeams.length}</Badge>
        </div>
        {publicTeams.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No teams approved yet. Be the first.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {publicTeams.map((t) => (
              <div key={t.id} className="rounded-lg border border-border bg-background/40 p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {t.team_tag && <span className="font-mono text-xs text-muted-foreground">[{t.team_tag}]</span>}
                      <p className="font-display truncate">{t.team_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.community_name} · {t.country_language}{t.average_rank ? ` · ${t.average_rank}` : ""}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <SignupRosterCard signupId={t.id} compact />
              </div>
            ))}
          </div>
        )}
        {champion && (
          <div className="mt-4 rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            <span><span className="font-display">Champion:</span> {champion.team_name} ({champion.community_name})</span>
          </div>
        )}
      </div>

      <CommunityCupSignupDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        tournamentId={tournamentId}
        onSuccess={load}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, variant: "secondary" as const };
  return (
    <Badge variant={m.variant} className={`font-display gap-1 ${m.cls ?? ""}`}>
      {m.icon}{m.label}
    </Badge>
  );
}