import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldAlert, FileText, Ban, Search, RefreshCcw, ShieldOff, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { sanitizeText } from "@/lib/security";

type AuditEntry = {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  target_id: string | null;
  target_resource: string | null;
  reason: string | null;
  metadata: any;
  created_at: string;
};

type BanEntry = {
  id: string;
  user_id: string;
  banned_by: string;
  reason: string;
  expires_at: string | null;
  created_at: string;
  lifted_at: string | null;
  lifted_by: string | null;
};

type ProfileLite = { id: string; username: string; avatar_url: string | null };

const tabs = [
  { id: "audit", label: "Audit Log", icon: FileText },
  { id: "bans", label: "Banned Users", icon: Ban },
  { id: "suspicious", label: "Suspicious", icon: ShieldAlert },
] as const;

type TabId = typeof tabs[number]["id"];

function fmt(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

export default function AdminSecurityPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("audit");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [suspicious, setSuspicious] = useState<
    { user_id: string; username: string | null; reports: number }[]
  >([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTargetUsername, setBanTargetUsername] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("");

  const loadProfiles = async (ids: string[]) => {
    const missing = [...new Set(ids.filter((i) => i && !profiles[i]))];
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", missing);
    if (data) {
      setProfiles((p) => {
        const next = { ...p };
        for (const row of data) next[row.id] = row as ProfileLite;
        return next;
      });
    }
  };

  const loadAudit = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      toast.error("Could not load audit log");
      return;
    }
    setAudit((data ?? []) as AuditEntry[]);
    const ids: string[] = [];
    for (const r of data ?? []) {
      if (r.admin_id) ids.push(r.admin_id);
      if (r.target_user_id) ids.push(r.target_user_id);
    }
    await loadProfiles(ids);
  };

  const loadBans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("banned_users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      toast.error("Could not load bans");
      return;
    }
    setBans((data ?? []) as BanEntry[]);
    const ids: string[] = [];
    for (const r of data ?? []) {
      ids.push(r.user_id);
      ids.push(r.banned_by);
      if (r.lifted_by) ids.push(r.lifted_by);
    }
    await loadProfiles(ids);
  };

  const loadSuspicious = async () => {
    setLoading(true);
    // Aggregate reported messages from global_messages and team_messages
    const [{ data: g }, { data: t }] = await Promise.all([
      supabase
        .from("global_messages")
        .select("user_id, report_count")
        .gt("report_count", 0)
        .order("report_count", { ascending: false })
        .limit(200),
      supabase
        .from("team_messages")
        .select("user_id, report_count")
        .gt("report_count", 0)
        .order("report_count", { ascending: false })
        .limit(200),
    ]);
    setLoading(false);
    const totals = new Map<string, number>();
    for (const r of [...(g ?? []), ...(t ?? [])]) {
      totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (r.report_count ?? 0));
    }
    const ids = [...totals.keys()];
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id, username, avatar_url").in("id", ids)
      : { data: [] as any[] };
    const profMap: Record<string, ProfileLite> = {};
    for (const p of profs ?? []) profMap[p.id] = p as ProfileLite;
    setProfiles((p) => ({ ...p, ...profMap }));
    const list = ids
      .map((id) => ({
        user_id: id,
        username: profMap[id]?.username ?? null,
        reports: totals.get(id) ?? 0,
      }))
      .sort((a, b) => b.reports - a.reports);
    setSuspicious(list);
  };

  useEffect(() => {
    if (tab === "audit") loadAudit();
    if (tab === "bans") loadBans();
    if (tab === "suspicious") loadSuspicious();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const writeAudit = async (
    action: string,
    targetUserId: string | null,
    reason: string,
    metadata: Record<string, unknown> = {},
  ) => {
    if (!user) return;
    await supabase.from("admin_actions").insert([
      {
        admin_id: user.id,
        action,
        target_user_id: targetUserId,
        target_resource: targetUserId ? "user" : null,
        reason: sanitizeText(reason).slice(0, 500),
        metadata: metadata as any,
      },
    ]);
  };

  const handleBan = async () => {
    if (!user) return;
    const username = banTargetUsername.trim();
    const reason = sanitizeText(banReason).trim();
    if (!username || reason.length < 3) {
      toast.error("Username and a reason (3+ chars) are required");
      return;
    }
    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();
    if (pErr || !prof) {
      toast.error("User not found");
      return;
    }
    const expires =
      banDays && Number(banDays) > 0
        ? new Date(Date.now() + Number(banDays) * 86400000).toISOString()
        : null;
    const { error } = await supabase.from("banned_users").upsert(
      {
        user_id: prof.id,
        banned_by: user.id,
        reason: reason.slice(0, 500),
        expires_at: expires,
        lifted_at: null,
        lifted_by: null,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    await writeAudit("ban_user", prof.id, reason, { expires_at: expires });
    toast.success(`Banned ${prof.username}`);
    setBanDialogOpen(false);
    setBanTargetUsername("");
    setBanReason("");
    setBanDays("");
    loadBans();
  };

  const handleLift = async (b: BanEntry) => {
    if (!user) return;
    const { error } = await supabase
      .from("banned_users")
      .update({ lifted_at: new Date().toISOString(), lifted_by: user.id })
      .eq("id", b.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await writeAudit("lift_ban", b.user_id, "Ban lifted", { ban_id: b.id });
    toast.success("Ban lifted");
    loadBans();
  };

  const quickBan = async (uid: string, username: string | null) => {
    setBanTargetUsername(username ?? "");
    setBanDialogOpen(true);
  };

  const filteredAudit = audit.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const adminName = profiles[a.admin_id]?.username ?? "";
    const targetName = a.target_user_id ? profiles[a.target_user_id]?.username ?? "" : "";
    return (
      a.action.toLowerCase().includes(s) ||
      (a.reason ?? "").toLowerCase().includes(s) ||
      adminName.toLowerCase().includes(s) ||
      targetName.toLowerCase().includes(s)
    );
  });

  const filteredBans = bans.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = profiles[b.user_id]?.username ?? "";
    return name.toLowerCase().includes(s) || b.reason.toLowerCase().includes(s);
  });

  const isActive = (b: BanEntry) =>
    !b.lifted_at && (!b.expires_at || new Date(b.expires_at) > new Date());

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-display font-bold">Security</h1>
            <p className="text-muted-foreground font-body text-sm">
              Audit log, banned users, and suspicious account monitoring.
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 overflow-x-auto border-b border-border pb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-display font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (tab === "audit") loadAudit();
              if (tab === "bans") loadBans();
              if (tab === "suspicious") loadSuspicious();
            }}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {tab === "bans" && (
            <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="neon" size="sm">
                  <Ban className="h-4 w-4 mr-2" />
                  Ban user
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ban a user</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Username</Label>
                    <Input
                      value={banTargetUsername}
                      onChange={(e) => setBanTargetUsername(e.target.value)}
                      maxLength={32}
                    />
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                  <div>
                    <Label>Duration in days (empty = permanent)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={banDays}
                      onChange={(e) => setBanDays(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setBanDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="neon" onClick={handleBan}>
                    Confirm ban
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {tab === "audit" && (
          <div className="rounded-lg border border-border bg-card neon-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-display">When</TableHead>
                  <TableHead className="font-display">Admin</TableHead>
                  <TableHead className="font-display">Action</TableHead>
                  <TableHead className="font-display">Target</TableHead>
                  <TableHead className="font-display">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudit.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {fmt(a.created_at)}
                    </TableCell>
                    <TableCell className="font-display text-sm">
                      {profiles[a.admin_id]?.username ?? a.admin_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-display text-xs">
                        {a.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-display text-sm">
                      {a.target_user_id
                        ? profiles[a.target_user_id]?.username ?? a.target_user_id.slice(0, 8)
                        : a.target_resource ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[320px] truncate">
                      {a.reason ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAudit.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No audit entries
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === "bans" && (
          <div className="rounded-lg border border-border bg-card neon-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-display">User</TableHead>
                  <TableHead className="font-display">Reason</TableHead>
                  <TableHead className="font-display">Banned</TableHead>
                  <TableHead className="font-display">Expires</TableHead>
                  <TableHead className="font-display">Status</TableHead>
                  <TableHead className="font-display">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBans.map((b) => {
                  const active = isActive(b);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-display font-semibold text-sm">
                        {profiles[b.user_id]?.username ?? b.user_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[320px] truncate">
                        {b.reason}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {fmt(b.created_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {b.expires_at ? fmt(b.expires_at) : "Permanent"}
                      </TableCell>
                      <TableCell>
                        {active ? (
                          <Badge className="bg-destructive/20 text-destructive border-destructive/30 font-display text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-success/20 text-success border-success/30 font-display text-xs">
                            Lifted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-display"
                            onClick={() => handleLift(b)}
                          >
                            <ShieldOff className="h-3.5 w-3.5 mr-1" />
                            Lift
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredBans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No bans recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === "suspicious" && (
          <div className="rounded-lg border border-border bg-card neon-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-display">User</TableHead>
                  <TableHead className="font-display">Total chat reports</TableHead>
                  <TableHead className="font-display">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspicious.map((s) => (
                  <TableRow key={s.user_id}>
                    <TableCell className="font-display font-semibold text-sm">
                      {s.username ?? s.user_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-warning/20 text-warning border-warning/30 font-mono text-xs">
                        {s.reports}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-display text-destructive"
                        onClick={() => quickBan(s.user_id, s.username)}
                      >
                        <UserX className="h-3.5 w-3.5 mr-1" />
                        Ban
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {suspicious.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No suspicious accounts
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
