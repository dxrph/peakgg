import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { useI18n } from "@/i18n";

interface Member {
  user_id: string;
  role: string;
  profiles: { username: string; display_name: string | null; avatar_url: string | null; rank: string | null; trophies: number };
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  teamId: string | null;
  teamName?: string;
}

export default function RosterDialog({ open, onOpenChange, teamId, teamName }: Props) {
  const { t } = useI18n();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !teamId) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("team_members")
        .select("user_id, role, profiles:profiles!inner(username, display_name, avatar_url, rank, trophies)")
        .eq("team_id", teamId);
      setMembers((data as any) ?? []);
      setLoading(false);
    })();
  }, [open, teamId]);

  const total = members.reduce((s, m) => s + (m.profiles?.trophies ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{teamName ?? t("teams_page.roster", { defaultValue: "Roster" })}</DialogTitle>
        </DialogHeader>
        <div className="rounded-md border border-border bg-muted/30 p-3 mb-3 flex items-center justify-between">
          <span className="font-display text-sm uppercase tracking-wider text-muted-foreground">
            {t("teams_page.team_trophies", { defaultValue: "Team trophies" })}
          </span>
          <span className="font-display text-2xl text-primary flex items-center gap-2">
            <Trophy className="h-5 w-5" /> {total}
          </span>
        </div>
        {loading ? <p className="text-muted-foreground text-sm">...</p> : (
          <ul className="space-y-2 max-h-72 overflow-auto">
            {members.length === 0 && <li className="text-sm text-muted-foreground">{t("teams_page.no_members", { defaultValue: "No members." })}</li>}
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between border border-border rounded-md p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display">
                    {(m.profiles?.display_name ?? m.profiles?.username ?? "?").slice(0,1).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-display text-sm">{m.profiles?.display_name ?? m.profiles?.username}</div>
                    <div className="text-xs text-muted-foreground">{m.role} · {m.profiles?.rank ?? "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-primary text-sm font-display">
                  <Trophy className="h-3 w-3" /> {m.profiles?.trophies ?? 0}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
