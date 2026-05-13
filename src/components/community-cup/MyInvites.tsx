import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Invite {
  id: string;
  signup_id: string;
  tournament_id: string;
  role: string;
  team_name: string;
  team_tag: string | null;
}

export default function MyInvites({ tournamentId, onChanged }: { tournamentId?: string; onChanged?: () => void }) {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user) { setInvites([]); setLoading(false); return; }
    setLoading(true);
    let q = supabase
      .from("tournament_roster_members")
      .select("id, signup_id, tournament_id, role")
      .eq("user_id", user.id)
      .eq("status", "invited");
    if (tournamentId) q = q.eq("tournament_id", tournamentId);
    const { data: rows } = await q;
    const list = (rows as any[]) ?? [];
    if (!list.length) { setInvites([]); setLoading(false); return; }
    const sids = Array.from(new Set(list.map(r => r.signup_id)));
    const { data: signups } = await supabase
      .from("tournament_team_signups")
      .select("id, team_name, team_tag")
      .in("id", sids);
    const sm = Object.fromEntries((signups ?? []).map((s: any) => [s.id, s]));
    setInvites(list.map(r => ({
      ...r,
      team_name: sm[r.signup_id]?.team_name ?? "Team",
      team_tag: sm[r.signup_id]?.team_tag ?? null,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id, tournamentId]);

  const respond = async (id: string, accept: boolean) => {
    setBusy(id);
    const { error } = await supabase.rpc("cup_respond_invite" as never, { _member_id: id, _accept: accept } as never);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(accept ? "Invite accepted!" : "Invite declined");
    load();
    onChanged?.();
  };

  if (!user || loading) return null;
  if (invites.length === 0) return null;

  return (
    <Card className="p-4 space-y-3 border-primary/40 bg-primary/5">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="font-display uppercase tracking-wider text-sm">Roster invites for you</h3>
        <Badge variant="outline" className="border-primary/40 text-primary">{invites.length}</Badge>
      </div>
      <ul className="space-y-2">
        {invites.map(inv => (
          <li key={inv.id} className="flex items-center gap-2 rounded border border-border bg-background/40 p-2.5">
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm">
                {inv.team_tag && <span className="text-muted-foreground mr-1">[{inv.team_tag}]</span>}
                {inv.team_name}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">Invited as {inv.role}</p>
            </div>
            <Button size="sm" variant="default" onClick={() => respond(inv.id, true)} disabled={busy === inv.id}>
              {busy === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Accept</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => respond(inv.id, false)} disabled={busy === inv.id}>
              <X className="h-3 w-3" />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}