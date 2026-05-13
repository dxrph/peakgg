import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, X, UserPlus, Crown, ShieldCheck, Lock, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RosterMember, RosterSignup } from "./types";

interface Props {
  signup: RosterSignup;
  onChanged?: () => void;
}

const MIN_REQUIRED = 5;

export default function RosterManager({ signup, onChanged }: Props) {
  const { user } = useAuth();
  const isCaptain = !!user && user.id === signup.captain_user_id;
  const locked = !!signup.roster_locked_at;
  const approved = signup.status === "approved" || signup.status === "checked_in";
  const ready = !!signup.ready_at;

  const [members, setMembers] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tournament_roster_members")
      .select("id, tournament_id, signup_id, user_id, invited_by, role, status, created_at, accepted_at, declined_at")
      .eq("signup_id", signup.id)
      .neq("status", "removed");
    const list = (data as any[]) ?? [];
    const ids = Array.from(new Set(list.map(r => r.user_id)));
    let profMap: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles").select("id, username, display_name, avatar_url, rank").in("id", ids);
      profMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    }
    setMembers(list.map(r => ({ ...r, profile: profMap[r.user_id] ?? null })));
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
    const ch = supabase.channel(`rm-${signup.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_roster_members", filter: `signup_id=eq.${signup.id}` },
        () => fetchMembers())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signup.id]);

  const accepted = members.filter(m => m.status === "accepted" || m.status === "locked");
  const invited = members.filter(m => m.status === "invited");
  const declined = members.filter(m => m.status === "declined");
  const acceptedCore = accepted.filter(m => m.role !== "substitute").length;

  const blockReason = useMemo(() => {
    if (!approved) return "Waiting for admin approval";
    if (locked) return "Roster is locked";
    if (acceptedCore < MIN_REQUIRED) return `Need ${MIN_REQUIRED - acceptedCore} more accepted player(s)`;
    if (ready) return null;
    return null;
  }, [approved, locked, acceptedCore, ready]);

  const doSearch = async () => {
    const q = search.trim();
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const taken = new Set(members.map(m => m.user_id));
    if (signup.captain_user_id) taken.add(signup.captain_user_id);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, rank")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(10);
    setResults((data ?? []).filter((p: any) => !taken.has(p.id)));
    setSearching(false);
  };

  const invite = async (userId: string, role: "player" | "substitute" = "player") => {
    setBusy(true);
    const { error } = await supabase.rpc("cup_invite_player" as never, { _signup_id: signup.id, _user_id: userId, _role: role } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Invite sent");
    setSearch(""); setResults([]);
    fetchMembers();
  };

  const cancel = async (memberId: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("cup_cancel_invite" as never, { _member_id: memberId } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Invite cancelled");
    fetchMembers();
  };

  const remove = async (memberId: string) => {
    setBusy(true);
    const { error } = await supabase.rpc("cup_remove_member" as never, { _member_id: memberId } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Player removed");
    fetchMembers();
  };

  const markReady = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("cup_mark_team_ready" as never, { _signup_id: signup.id } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Team marked ready!");
    onChanged?.();
  };

  if (!isCaptain) {
    // Read-only view for non-captains
    return null;
  }

  return (
    <Card className="p-4 space-y-4 border-primary/30">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display uppercase tracking-wider">Roster Management</h3>
          <p className="text-xs text-muted-foreground">Captain controls · {acceptedCore}/{MIN_REQUIRED} accepted</p>
        </div>
        <div className="flex items-center gap-2">
          {locked && <Badge variant="outline" className="border-primary/40 text-primary"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
          {ready && <Badge variant="outline" className="border-success text-success"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>}
        </div>
      </div>

      {!approved && (
        <div className="rounded border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Your team is <strong>{signup.status}</strong>. Roster invites unlock once an admin approves your registration.
        </div>
      )}

      {approved && (
        <>
          {/* Search & invite */}
          {!locked && (
            <div className="space-y-2">
              <p className="text-xs font-display uppercase tracking-wider text-muted-foreground">Invite a PeakGG player</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search username or display name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    className="pl-8 h-9"
                  />
                </div>
                <Button onClick={doSearch} disabled={searching || search.trim().length < 2} size="sm">
                  {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
                </Button>
              </div>
              {results.length > 0 && (
                <ul className="rounded border border-border divide-y divide-border max-h-56 overflow-auto">
                  {results.map(p => (
                    <li key={p.id} className="flex items-center gap-2 p-2 hover:bg-muted/40">
                      <Avatar className="h-7 w-7">
                        {p.avatar_url && <AvatarImage src={p.avatar_url} />}
                        <AvatarFallback className="text-[10px]">{(p.display_name ?? p.username ?? "?").slice(0,1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display truncate">{p.display_name ?? p.username}</p>
                        <p className="text-[10px] text-muted-foreground truncate">@{p.username} · {p.rank ?? "Unranked"}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => invite(p.id, "player")} disabled={busy}>
                        <UserPlus className="h-3 w-3 mr-1" /> Invite
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => invite(p.id, "substitute")} disabled={busy}>
                        Sub
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Members list */}
          {loading ? (
            <div className="py-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>
          ) : (
            <ul className="space-y-1.5">
              {[...accepted, ...invited, ...declined].map(m => (
                <li key={m.id} className="flex items-center gap-2 rounded border border-border bg-background/40 p-2">
                  <Avatar className="h-7 w-7">
                    {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} />}
                    <AvatarFallback className="text-[10px]">{(m.profile?.display_name ?? m.profile?.username ?? "?").slice(0,1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${m.profile?.username ?? m.user_id}`} className="text-sm font-display truncate hover:text-primary">
                      {m.profile?.display_name ?? m.profile?.username ?? "Player"}
                    </Link>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {m.role === "captain" ? "Captain" : m.role === "substitute" ? "Substitute" : "Player"}
                    </p>
                  </div>
                  <StatusPill status={m.status} />
                  {m.role === "captain" ? (
                    <Crown className="h-4 w-4 text-primary" />
                  ) : !locked && m.status === "invited" ? (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => cancel(m.id)} disabled={busy} aria-label="Cancel">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : !locked && m.status === "accepted" ? (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(m.id)} disabled={busy} aria-label="Remove">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </li>
              ))}
              {accepted.length + invited.length + declined.length === 0 && (
                <li className="text-xs text-muted-foreground italic text-center py-3">No invites sent yet.</li>
              )}
            </ul>
          )}

          {/* Ready button */}
          {!locked && (
            <div className="pt-2 border-t border-border space-y-2">
              {blockReason ? (
                <div className="text-xs text-muted-foreground italic">{blockReason}</div>
              ) : ready ? (
                <div className="text-xs text-success flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Marked ready · waiting for admin to start tournament</div>
              ) : null}
              <Button
                variant="default"
                onClick={markReady}
                disabled={busy || !!blockReason || ready}
                className="w-full"
              >
                {busy && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                <Send className="h-3.5 w-3.5 mr-2" />
                {ready ? "Team is Ready" : "Mark Team Ready"}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    accepted: { label: "Accepted", cls: "border-success/50 text-success" },
    locked:   { label: "Locked",   cls: "border-primary/50 text-primary" },
    invited:  { label: "Pending",  cls: "border-muted-foreground/40 text-muted-foreground" },
    declined: { label: "Declined", cls: "border-destructive/50 text-destructive" },
  };
  const m = map[status] ?? { label: status, cls: "" };
  return <Badge variant="outline" className={cn("text-[10px] py-0 h-5", m.cls)}>{m.label}</Badge>;
}