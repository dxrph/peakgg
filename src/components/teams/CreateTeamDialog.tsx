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
import { Shield, Sparkles, Globe, Trophy, Tag, Hash } from "lucide-react";

const GAMES = [
  { value: "valorant", label: "Valorant" },
  { value: "cs2", label: "CS2" },
  { value: "r6s", label: "Rainbow Six Siege" },
];
const RANKS = ["Rookie", "Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Apex"];
const REGIONS = ["EU", "NA", "APAC", "LATAM"];
const COLORS = [
  "#FF4B2B", "#FF8C00", "#7C3AED", "#2563EB",
  "#10B981", "#EAB308", "#EC4899", "#06B6D4",
];

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
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName(""); setTag(""); setGame("valorant"); setRank("Rookie"); setRegion("EU"); setColor(COLORS[0]);
  };

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
        color,
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

  const tagPreview = (tag.trim().toUpperCase().slice(0, 4)) || "TAG";
  const namePreview = name.trim() || t("teams_page.team_name", { defaultValue: "Team name" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-primary/30 bg-card p-0 overflow-hidden">
        {/* Neon top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 font-display text-2xl uppercase tracking-wider">
            <Shield className="h-6 w-6 text-primary" />
            {t("teams_page.create_team", { defaultValue: "Create Team" })}
          </DialogTitle>
          <DialogDescription className="font-body">
            {t("teams_page.create_team_sub", { defaultValue: "Build your roster and dominate the ladder." })}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-5">
          {/* Live preview card */}
          <div className="relative rounded-lg border border-border bg-background/50 p-4 overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ background: `radial-gradient(circle at 20% 20%, ${color}, transparent 60%)` }}
            />
            <div className="relative flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center font-display font-bold text-primary-foreground text-base shadow-lg"
                style={{ background: color, boxShadow: `0 0 20px ${color}66` }}
              >
                {tagPreview}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-lg uppercase tracking-wide truncate">{namePreview}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-body mt-0.5">
                  <Globe className="h-3 w-3" /> {region}
                  <span>·</span>
                  <span className="uppercase">{game}</span>
                  <span>·</span>
                  <Trophy className="h-3 w-3 text-primary" /> {rank}
                </div>
              </div>
            </div>
          </div>

          {/* Name + tag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> {t("teams_page.team_name", { defaultValue: "Team name" })}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                placeholder="Phantom Squad"
                className="font-body"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" /> {t("teams_page.team_tag", { defaultValue: "Tag" })}
              </Label>
              <Input
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="PHX"
                className="font-display uppercase tracking-widest text-center"
              />
            </div>
          </div>

          {/* Game + Rank */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
                {t("teams_page.game", { defaultValue: "Game" })}
              </Label>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GAMES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
                {t("teams_page.rank", { defaultValue: "Rank" })}
              </Label>
              <Select value={rank} onValueChange={setRank}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
              {t("teams_page.region", { defaultValue: "Region" })}
            </Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {t("teams_page.team_color", { defaultValue: "Team color" })}
            </Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={`relative w-9 h-9 rounded-md transition-all ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110"
                      : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                  style={{ background: c, boxShadow: color === c ? `0 0 14px ${c}99` : undefined }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-background/40 mt-4 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button variant="neon" onClick={submit} disabled={loading} className="min-w-32">
            {loading
              ? "..."
              : <><Shield className="h-4 w-4 mr-1" /> {t("teams_page.create", { defaultValue: "Create" })}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
