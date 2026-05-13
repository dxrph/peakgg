import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Users, Loader2, ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RosterMember } from "./types";

interface Props {
  signupId: string | null;
  teamName?: string | null;
  compact?: boolean;
  className?: string;
}

export default function SignupRosterCard({ signupId, teamName, compact, className }: Props) {
  const [members, setMembers] = useState<RosterMember[] | null>(null);

  useEffect(() => {
    if (!signupId) { setMembers([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("tournament_roster_members")
        .select("id, tournament_id, signup_id, user_id, invited_by, role, status, created_at, accepted_at, declined_at, profile:profiles!tournament_roster_members_user_id_fkey(id, username, display_name, avatar_url, rank)")
        .eq("signup_id", signupId)
        .in("status", ["accepted", "locked"])
        .order("role", { ascending: true });
      if (!cancelled) setMembers((data as any) ?? []);
    })();
    const ch = supabase.channel(`roster-${signupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_roster_members", filter: `signup_id=eq.${signupId}` },
        async () => {
          const { data } = await supabase
            .from("tournament_roster_members")
            .select("id, tournament_id, signup_id, user_id, invited_by, role, status, created_at, accepted_at, declined_at, profile:profiles!tournament_roster_members_user_id_fkey(id, username, display_name, avatar_url, rank)")
            .eq("signup_id", signupId)
            .in("status", ["accepted", "locked"]);
          if (!cancelled) setMembers((data as any) ?? []);
        })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [signupId]);

  if (!signupId) {
    return (
      <Card className={cn("p-3 border-dashed", className)}>
        <p className="text-xs text-muted-foreground italic">TBD — team not yet assigned</p>
      </Card>
    );
  }

  if (members === null) {
    return (
      <Card className={cn("p-3 flex items-center gap-2", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs text-muted-foreground">Loading roster…</span>
      </Card>
    );
  }

  return (
    <Card className={cn("p-3 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <p className="font-display uppercase text-[10px] tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3 w-3" /> Roster · {members.length}
        </p>
        {members.some(m => m.status === "locked") && (
          <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/40 text-primary"><Lock className="h-2.5 w-2.5 mr-0.5" />Locked</Badge>
        )}
      </div>
      {members.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No accepted players yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {members.map(m => (
            <li key={m.id} className="flex items-center gap-2">
              <Link to={`/profile/${m.profile?.username ?? m.user_id}`} className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80">
                <Avatar className="h-6 w-6">
                  {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} />}
                  <AvatarFallback className="text-[10px]">{(m.profile?.display_name ?? m.profile?.username ?? "?").slice(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs truncate font-display">
                  {m.profile?.display_name ?? m.profile?.username ?? "Player"}
                </span>
              </Link>
              {m.role === "captain" && <Crown className="h-3 w-3 text-primary shrink-0" aria-label="Captain" />}
              {m.role === "substitute" && <Badge variant="outline" className="text-[9px] py-0 h-4">SUB</Badge>}
              {m.status === "accepted" && <ShieldCheck className="h-3 w-3 text-success shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}