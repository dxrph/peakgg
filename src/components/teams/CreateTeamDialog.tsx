import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

const GAMES = [
  { value: "valorant", label: "Valorant" },
  { value: "cs2", label: "CS2" },
  { value: "r6s", label: "Rainbow Six Siege" },
];
const RANKS = ["Rookie", "Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Apex"];
const REGIONS = ["EU", "NA", "APAC", "LATAM"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export default function CreateTeamDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [game, setGame] = useState("valorant");
  const [rank, setRank] = useState("Rookie");
  const [region, setRegion] = useState("EU");
  const [loading, setLoading] = useState(false);

  const reset = () => { setName(""); setTag(""); setGame("valorant"); setRank("Rookie"); setRegion("EU"); };

  const submit = async () => {
    if (!user) { toast.error(t("teams_page.must_login", { defaultValue: "You must be logged in" })); return; }
    if (!name.trim() || !tag.trim()) { toast.error(t("teams_page.fill_required", { defaultValue: "Fill required fields" })); return; }
    setLoading(true);
    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        tag: tag.trim().toUpperCase().slice(0, 4),
        game,
        rank,
        region,
        owner_id: user.id,
        looking_for_players: true,
        slots: 2,
        trophies: 0,
        color: "#7C3AED",
      } as any)
      .select()
      .single();
    if (error || !team) {
      setLoading(false);
      toast.error(error?.message ?? "Error creating team");
      return;
    }
    const { error: memErr } = await supabase
      .from("team_members")
      .insert({ team_id: team.id, user_id: user.id, role: "Captain" });
    setLoading(false);
    if (memErr) { toast.error(memErr.message); return; }
    toast.success(t("teams_page.team_created", { defaultValue: "Team created!" }));
    reset();
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("teams_page.create_team", { defaultValue: "Create Team" })}</DialogTitle>
          <DialogDescription>{t("teams_page.create_team_sub", { defaultValue: "Build your roster and dominate the ladder." })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("teams_page.team_name", { defaultValue: "Team name" })}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
          </div>
          <div>
            <Label>{t("teams_page.team_tag", { defaultValue: "Tag (max 4)" })}</Label>
            <Input value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} maxLength={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("teams_page.game", { defaultValue: "Game" })}</Label>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GAMES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("teams_page.rank", { defaultValue: "Rank" })}</Label>
              <Select value={rank} onValueChange={setRank}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{t("teams_page.region", { defaultValue: "Region" })}</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
          <Button variant="neon" onClick={submit} disabled={loading}>
            {loading ? "..." : t("teams_page.create", { defaultValue: "Create" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
