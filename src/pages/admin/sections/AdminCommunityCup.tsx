import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import RoleGuard from "@/components/RoleGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Download, Trophy } from "lucide-react";
import { toast } from "sonner";

type Signup = {
  id: string; tournament_id: string; created_at: string; status: string;
  team_name: string; team_tag: string | null; team_logo_url: string | null;
  community_name: string; community_discord_url: string | null;
  country_language: string; average_rank: string | null;
  captain_name: string; captain_discord: string; captain_email: string; captain_riot_id: string;
  player_1_riot_id: string; player_2_riot_id: string; player_3_riot_id: string; player_4_riot_id: string; player_5_riot_id: string;
  substitute_1_riot_id: string | null; substitute_2_riot_id: string | null;
  notes: string | null; admin_note: string | null; checked_in_at: string | null;
  agreement_available: boolean; agreement_discord: boolean; agreement_rules: boolean; agreement_forfeit: boolean;
};

type Tournament = { id: string; name: string; status: string; max_teams: number; slug: string | null };

const STATUSES = ["pending","approved","rejected","waitlisted","checked_in","eliminated","champion"] as const;
const TOURNAMENT_STATUSES = ["collecting_interest","registration_open","registration_closed","checkin","live","completed"] as const;

export default function AdminCommunityCup() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [detail, setDetail] = useState<Signup | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: t } = await supabase
      .from("tournaments")
      .select("id, name, status, max_teams, slug")
      .eq("slug", "community-cup-1")
      .maybeSingle();
    if (t) {
      setTournament(t as Tournament);
      const { data: s } = await supabase
        .from("tournament_team_signups" as never)
        .select("*")
        .eq("tournament_id", t.id)
        .order("created_at", { ascending: false });
      setSignups((s ?? []) as never as Signup[]);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: signups.length };
    for (const s of STATUSES) c[s] = signups.filter((x) => x.status === s).length;
    return c;
  }, [signups]);

  const filtered = filter === "all" ? signups : signups.filter((s) => s.status === filter);

  const setSignupStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tournament_team_signups" as never)
      .update({ status, ...(status === "checked_in" ? { checked_in_at: new Date().toISOString() } : {}) } as never)
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Status set to ${status}`);
    load();
  };

  const setAdminNote = async (id: string, admin_note: string) => {
    const { error } = await supabase.from("tournament_team_signups" as never)
      .update({ admin_note } as never).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Note saved");
    load();
  };

  const removeSignup = async (id: string) => {
    if (!confirm("Delete this registration permanently?")) return;
    const { error } = await supabase.from("tournament_team_signups" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setDetail(null);
    load();
  };

  const updateTournamentStatus = async (status: string) => {
    if (!tournament) return;
    setSavingStatus(true);
    const { error } = await supabase.from("tournaments").update({ status }).eq("id", tournament.id);
    setSavingStatus(false);
    if (error) return toast.error(error.message);
    toast.success(`Tournament status: ${status}`);
    load();
  };

  const exportCsv = () => {
    const header = ["status","team_name","team_tag","community_name","country_language","average_rank","captain_name","captain_discord","captain_email","captain_riot_id","p1","p2","p3","p4","p5","sub1","sub2","created_at"];
    const lines = [header.join(",")];
    for (const s of filtered) {
      const row = [
        s.status, s.team_name, s.team_tag ?? "", s.community_name, s.country_language, s.average_rank ?? "",
        s.captain_name, s.captain_discord, s.captain_email, s.captain_riot_id,
        s.player_1_riot_id, s.player_2_riot_id, s.player_3_riot_id, s.player_4_riot_id, s.player_5_riot_id,
        s.substitute_1_riot_id ?? "", s.substitute_2_riot_id ?? "", s.created_at,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
      lines.push(row);
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "community-cup-1-signups.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RoleGuard allow={["admin","moderator"]}>
      <AdminLayout>
        <div className="space-y-6">
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-display font-bold">Community Cup #1 — Signups</h1>
              <p className="text-sm text-muted-foreground">Review, approve and manage team registrations.</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </header>

          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !tournament ? (
            <p className="text-sm text-muted-foreground">Tournament not found.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <Stat label="Total"        value={counts.all} />
                <Stat label="Pending"      value={counts.pending} />
                <Stat label="Approved"     value={counts.approved} />
                <Stat label="Waitlisted"   value={counts.waitlisted} />
                <Stat label="Checked-in"   value={counts.checked_in} />
                <Stat label="Rejected"     value={counts.rejected} />
                <Stat label={`Slots`}      value={`${counts.approved + counts.checked_in}/${tournament.max_teams}`} />
              </div>

              <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-display uppercase text-muted-foreground">Tournament status</span>
                  <Badge variant="outline" className="border-primary text-primary font-display">{tournament.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={tournament.status} onValueChange={updateTournamentStatus} disabled={savingStatus}>
                    <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                  {STATUSES.map((s) => (
                    <TabsTrigger key={s} value={s}>{s} ({counts[s] ?? 0})</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="rounded-lg border border-border bg-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase font-display text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Team</th>
                      <th className="text-left p-3">Community</th>
                      <th className="text-left p-3">Captain</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No signups in this view.</td></tr>
                    ) : filtered.map((s) => (
                      <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                        <td className="p-3">
                          <div className="font-display">{s.team_tag ? <span className="text-muted-foreground mr-1">[{s.team_tag}]</span> : null}{s.team_name}</div>
                          {s.average_rank && <div className="text-xs text-muted-foreground">{s.average_rank}</div>}
                        </td>
                        <td className="p-3">
                          <div>{s.community_name}</div>
                          <div className="text-xs text-muted-foreground">{s.country_language}</div>
                        </td>
                        <td className="p-3">
                          <div>{s.captain_name}</div>
                          <div className="text-xs text-muted-foreground">{s.captain_discord}</div>
                        </td>
                        <td className="p-3"><Badge variant="secondary" className="font-display">{s.status}</Badge></td>
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <Button size="sm" variant="ghost" onClick={() => setDetail(s)}>View</Button>
                          {s.status !== "approved" && <Button size="sm" variant="outline" onClick={() => setSignupStatus(s.id, "approved")}>Approve</Button>}
                          {s.status !== "rejected" && <Button size="sm" variant="ghost" onClick={() => setSignupStatus(s.id, "rejected")}>Reject</Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <SignupDetailDialog
          signup={detail}
          onClose={() => setDetail(null)}
          onStatus={(s, status) => setSignupStatus(s.id, status)}
          onNote={(s, note) => setAdminNote(s.id, note)}
          onDelete={(s) => removeSignup(s.id)}
        />
      </AdminLayout>
    </RoleGuard>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs uppercase font-display text-muted-foreground">{label}</p>
      <p className="text-2xl font-display font-bold mt-1">{value}</p>
    </div>
  );
}

function SignupDetailDialog({
  signup, onClose, onStatus, onNote, onDelete,
}: {
  signup: Signup | null;
  onClose: () => void;
  onStatus: (s: Signup, status: string) => void;
  onNote: (s: Signup, note: string) => void;
  onDelete: (s: Signup) => void;
}) {
  const [note, setNote] = useState("");
  useEffect(() => { setNote(signup?.admin_note ?? ""); }, [signup]);

  if (!signup) return null;
  return (
    <Dialog open={!!signup} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {signup.team_tag ? <span className="text-muted-foreground mr-1">[{signup.team_tag}]</span> : null}
            {signup.team_name}
          </DialogTitle>
          <DialogDescription>{signup.community_name} · {signup.country_language}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <Block title="Captain">
            <Row k="Name" v={signup.captain_name} />
            <Row k="Discord" v={signup.captain_discord} />
            <Row k="Email" v={signup.captain_email} />
            <Row k="Riot ID" v={signup.captain_riot_id} />
          </Block>
          <Block title="Players">
            {[1,2,3,4,5].map((i) => <Row key={i} k={`Player ${i}`} v={(signup as never as Record<string,string>)[`player_${i}_riot_id`]} />)}
            {signup.substitute_1_riot_id && <Row k="Sub 1" v={signup.substitute_1_riot_id} />}
            {signup.substitute_2_riot_id && <Row k="Sub 2" v={signup.substitute_2_riot_id} />}
          </Block>
          <Block title="Confirmations">
            <Row k="Available" v={signup.agreement_available ? "✓" : "✗"} />
            <Row k="Discord" v={signup.agreement_discord ? "✓" : "✗"} />
            <Row k="Rules" v={signup.agreement_rules ? "✓" : "✗"} />
            <Row k="Forfeit" v={signup.agreement_forfeit ? "✓" : "✗"} />
          </Block>
          {signup.notes && <Block title="Captain notes"><p className="text-muted-foreground">{signup.notes}</p></Block>}

          <div className="space-y-2">
            <p className="text-xs font-display uppercase text-muted-foreground">Admin note (visible to captain)</p>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} />
            <Button size="sm" variant="outline" onClick={() => onNote(signup, note)}>Save note</Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-display uppercase text-muted-foreground">Set status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Button key={s} size="sm" variant={signup.status === s ? "neon" : "outline"} onClick={() => onStatus(signup, s)}>
                  {s === "champion" && <Trophy className="h-3 w-3 mr-1" />}{s}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="justify-between">
          <Button variant="ghost" className="text-destructive" onClick={() => onDelete(signup)}>Delete</Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-display uppercase text-muted-foreground mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono text-xs text-right break-all">{v}</span>
    </div>
  );
}