import Navbar from "@/components/landing/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RankBadge from "@/components/RankBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Shield, Users, Trophy, Swords, AlertTriangle, Ban, Search, Plus, Eye,
  CheckCircle2, XCircle, FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const tabs = [
  { id: "users", label: "Users", icon: Users },
  { id: "tournaments", label: "Tournaments", icon: Trophy },
  { id: "matches", label: "Matches", icon: Swords },
  { id: "reports", label: "Reports", icon: AlertTriangle },
  { id: "audit", label: "Audit Log", icon: FileText },
];

const mockUsers = [
  { id: 1, username: "PhantomX", elo: 3120, risk: 5, status: "Active", verified: 3 },
  { id: 2, username: "NexusGhost", elo: 2680, risk: 12, status: "Active", verified: 2 },
  { id: 3, username: "SmurfSuspect42", elo: 1850, risk: 78, status: "Flagged", verified: 0 },
  { id: 4, username: "ToxicPlayer99", elo: 420, risk: 45, status: "Banned", verified: 1 },
  { id: 5, username: "AceViper", elo: 2590, risk: 8, status: "Active", verified: 3 },
];

const mockReports = [
  { id: 1, reporter: "NexusGhost", reported: "SmurfSuspect42", type: "Smurf", match: "#4821", status: "Pending", date: "Mar 4" },
  { id: 2, reporter: "AceViper", reported: "ToxicPlayer99", type: "Toxic", match: "#4819", status: "Resolved", date: "Mar 3" },
  { id: 3, reporter: "CyberWolf", reported: "NewAccount1", type: "Smurf", match: "#4815", status: "Pending", date: "Mar 2" },
];

const mockAudit = [
  { id: 1, actor: "Admin", action: "Banned user", target: "ToxicPlayer99", time: "2h ago" },
  { id: 2, actor: "System", action: "Risk score updated", target: "SmurfSuspect42 → 78", time: "3h ago" },
  { id: 3, actor: "Admin", action: "Created tournament", target: "Weekly #13", time: "5h ago" },
  { id: 4, actor: "Admin", action: "Validated match", target: "Match #4821", time: "6h ago" },
  { id: 5, actor: "System", action: "ELO decay applied", target: "12 players", time: "1d ago" },
];

const mockTournaments = [
  { id: 1, name: "Weekly #12", format: "5v5 SE", status: "Open", teams: "12/16", date: "Mar 8" },
  { id: 2, name: "EU Masters Qualifier", format: "5v5 DE", status: "Draft", teams: "0/32", date: "Mar 15" },
  { id: 3, name: "Community Cup", format: "5v5 SE", status: "Live", teams: "8/8", date: "Mar 5" },
];

const mockMatches = [
  { id: 4821, teams: "Peak Kings vs Void Reapers", score: "13-9", status: "Verified", map: "Ascent" },
  { id: 4820, teams: "Storm Elite vs Shadow Corp", score: "11-13", status: "Disputed", map: "Haven" },
  { id: 4819, teams: "Phoenix Rise vs Ice Protocol", score: "13-7", status: "Verified", map: "Bind" },
];

function RiskBadge({ score }: { score: number }) {
  if (score >= 60) return <Badge className="bg-destructive/20 text-destructive border-destructive/30 font-mono text-xs">{score}</Badge>;
  if (score >= 30) return <Badge className="bg-warning/20 text-warning border-warning/30 font-mono text-xs">{score}</Badge>;
  return <Badge className="bg-success/20 text-success border-success/30 font-mono text-xs">{score}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-success/20 text-success border-success/30",
    Flagged: "bg-warning/20 text-warning border-warning/30",
    Banned: "bg-destructive/20 text-destructive border-destructive/30",
    Pending: "bg-warning/20 text-warning border-warning/30",
    Resolved: "bg-success/20 text-success border-success/30",
    Open: "bg-primary/20 text-primary border-primary/30",
    Live: "bg-accent/20 text-accent border-accent/30",
    Draft: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30",
    Verified: "bg-success/20 text-success border-success/30",
    Disputed: "bg-destructive/20 text-destructive border-destructive/30",
  };
  return <Badge className={`${styles[status] || ""} font-display text-xs`}>{status}</Badge>;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user) return;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        navigate("/", { replace: true });
      } else {
        setIsAdmin(true);
      }
      setChecking(false);
    }
    check();
    return () => { cancelled = true; };
  }, [user, navigate]);

  if (checking || !isAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Panel</h1>
            <p className="text-muted-foreground font-body text-sm">PeakGG administration — manage users, tournaments, matches, and reports.</p>
          </div>
        </div>

        <div className="flex gap-1 mb-8 overflow-x-auto border-b border-border pb-px">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-display font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-10 bg-card border-border" />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card neon-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-display">Username</TableHead>
                    <TableHead className="font-display">PeakGG Rank</TableHead>
                    <TableHead className="font-display">ELO</TableHead>
                    <TableHead className="font-display">Risk Score</TableHead>
                    <TableHead className="font-display">Verified</TableHead>
                    <TableHead className="font-display">Status</TableHead>
                    <TableHead className="font-display">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-display font-semibold">{u.username}</TableCell>
                      <TableCell><RankBadge elo={u.elo} size="sm" /></TableCell>
                      <TableCell className="font-mono">{u.elo}</TableCell>
                      <TableCell><RiskBadge score={u.risk} /></TableCell>
                      <TableCell><span className="font-mono text-sm">Lv.{u.verified}</span></TableCell>
                      <TableCell><StatusBadge status={u.status} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Ban className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "tournaments" && (
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search tournaments..." className="pl-10 bg-card border-border" />
              </div>
              <Button variant="neon" size="sm"><Plus className="mr-2 h-4 w-4" />Create Tournament</Button>
            </div>
            <div className="rounded-lg border border-border bg-card neon-border overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="font-display">Name</TableHead>
                  <TableHead className="font-display">Format</TableHead>
                  <TableHead className="font-display">Date</TableHead>
                  <TableHead className="font-display">Teams</TableHead>
                  <TableHead className="font-display">Status</TableHead>
                  <TableHead className="font-display">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {mockTournaments.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-display font-semibold">{t.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.format}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.date}</TableCell>
                      <TableCell className="font-mono text-sm">{t.teams}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs font-display">Edit</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "matches" && (
          <div className="rounded-lg border border-border bg-card neon-border overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="font-display">ID</TableHead>
                <TableHead className="font-display">Teams</TableHead>
                <TableHead className="font-display">Map</TableHead>
                <TableHead className="font-display">Score</TableHead>
                <TableHead className="font-display">Status</TableHead>
                <TableHead className="font-display">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockMatches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">#{m.id}</TableCell>
                    <TableCell className="font-display font-semibold text-sm">{m.teams}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.map}</TableCell>
                    <TableCell className="font-mono font-bold">{m.score}</TableCell>
                    <TableCell><StatusBadge status={m.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {m.status === "Disputed" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success"><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><XCircle className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="rounded-lg border border-border bg-card neon-border overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="font-display">Reporter</TableHead>
                <TableHead className="font-display">Reported</TableHead>
                <TableHead className="font-display">Type</TableHead>
                <TableHead className="font-display">Match</TableHead>
                <TableHead className="font-display">Date</TableHead>
                <TableHead className="font-display">Status</TableHead>
                <TableHead className="font-display">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockReports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-display text-sm">{r.reporter}</TableCell>
                    <TableCell className="font-display font-semibold text-sm">{r.reported}</TableCell>
                    <TableCell><Badge variant="outline" className="font-display text-xs">{r.type}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{r.match}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.date}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                        {r.status === "Pending" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success"><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><XCircle className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="rounded-lg border border-border bg-card neon-border overflow-hidden">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="font-display">Actor</TableHead>
                <TableHead className="font-display">Action</TableHead>
                <TableHead className="font-display">Target</TableHead>
                <TableHead className="font-display">Time</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockAudit.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell><Badge variant={a.actor === "System" ? "secondary" : "outline"} className="font-display text-xs">{a.actor}</Badge></TableCell>
                    <TableCell className="font-body text-sm">{a.action}</TableCell>
                    <TableCell className="font-display font-semibold text-sm">{a.target}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
