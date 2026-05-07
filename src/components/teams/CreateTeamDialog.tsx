import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { Settings2, ChevronDown, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

const GAMES = [
  { value: "valorant", label: "Valorant", emoji: "⚡", color: "#FF4655", glow: "rgba(255,70,85,0.45)" },
  { value: "cs2",      label: "CS2",      emoji: "💥", color: "#F59E0B", glow: "rgba(245,158,11,0.45)" },
  { value: "r6s",      label: "R6",       emoji: "🛡️", color: "#3B82F6", glow: "rgba(59,130,246,0.45)" },
] as const;

const REGIONS = [
  { value: "EU",    label: "EU",    flag: "🇪🇺" },
  { value: "NA",    label: "NA",    flag: "🇺🇸" },
  { value: "APAC",  label: "APAC",  flag: "🌏" },
  { value: "LATAM", label: "LATAM", flag: "🌎" },
] as const;

export default function CreateTeamDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [game, setGame] = useState<typeof GAMES[number]["value"]>("valorant");
  const [region, setRegion] = useState<typeof REGIONS[number]["value"]>("EU");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [recruitment, setRecruitment] = useState<"open" | "invite" | "closed">("open");
  const [description, setDescription] = useState("");
  const [discord, setDiscord] = useState("");
  const [slots, setSlots] = useState(2);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName(""); setTag(""); setGame("valorant"); setRegion("EU");
    setAdvancedOpen(false); setRecruitment("open"); setDescription(""); setDiscord("");
    setSlots(2); setIsPublic(true);
  };

  const isValid =
    name.trim().length > 0 &&
    tag.trim().length > 0 &&
    !!game &&
    !!region;
  const selectedGame = GAMES.find((g) => g.value === game)!;

  const submit = async () => {
    if (!user) {
      toast.error(t("teams_page.must_login", { defaultValue: "You must be logged in" }));
      return;
    }
    if (!isValid) {
      toast.error(t("teams_page.fill_required", { defaultValue: "Please fill the required fields" }));
      return;
    }
    setLoading(true);
    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        tag: tag.trim().toUpperCase().slice(0, 4),
        game,
        region,
        owner_id: user.id,
        looking_for_players: recruitment === "open",
        slots,
        description: description.trim() || null,
        trophies: 0,
        color: selectedGame.color,
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
      .insert({ team_id: (team as any).id, user_id: user.id, role: "Captain" });

    setLoading(false);
    if (memErr) { toast.error(memErr.message); return; }

    toast.success(t("teams_page.team_created_captain", { defaultValue: "Team created. You are now the captain." }));
    reset();
    onOpenChange(false);
    onCreated?.();
    navigate(`/teams/${(team as any).id}/manage`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent
        className={cn(
          "max-w-lg p-0 overflow-hidden border-2",
          "bg-card",
          "data-[state=open]:animate-fade-in",
          "duration-200"
        )}
        style={{ borderColor: "hsl(var(--border))" }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

        <div className="px-6 pt-6 pb-2 animate-fade-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-2xl uppercase tracking-wider">
              <Shield className="h-6 w-6 text-primary" />
              {t("teams_page.create_team", { defaultValue: "Create Team" })}
            </DialogTitle>
            <DialogDescription className="font-body">
              {t("teams_page.create_team_sub", { defaultValue: "Build your roster and dominate the ladder." })}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-2 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* NAME + TAG */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
                {t("teams_page.team_name", { defaultValue: "Team name" })}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                placeholder="Phantom Squad"
                className="font-body bg-background/60 border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:shadow-[0_0_18px_hsl(var(--primary)/0.45)] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
                {t("teams_page.team_tag", { defaultValue: "Tag" })}
              </Label>
              <Input
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="PHX"
                className="font-display uppercase tracking-widest text-center bg-background/60 border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:shadow-[0_0_18px_hsl(var(--primary)/0.45)] transition-all"
              />
            </div>
          </div>

          {/* GAME PICKER */}
          <div className="space-y-2">
            <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
              {t("teams_page.game", { defaultValue: "Game" })}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {GAMES.map((g) => {
                const active = game === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGame(g.value)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-md border-2 transition-all",
                      "bg-background/60 hover:scale-[1.02]",
                      active ? "scale-[1.02]" : "border-border opacity-70 hover:opacity-100"
                    )}
                    style={
                      active
                        ? { borderColor: g.color, boxShadow: `0 0 16px ${g.glow}, inset 0 0 12px ${g.glow}` }
                        : undefined
                    }
                  >
                    <span className="text-2xl leading-none">{g.emoji}</span>
                    <span
                      className="font-display uppercase text-xs tracking-wider"
                      style={active ? { color: g.color } : undefined}
                    >
                      {g.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* REGION PICKER */}
          <div className="space-y-2">
            <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
              {t("teams_page.region", { defaultValue: "Region" })}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {REGIONS.map((r) => {
                const active = region === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRegion(r.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 rounded-md border-2 transition-all bg-background/60",
                      active
                        ? "border-primary text-primary shadow-[0_0_14px_hsl(var(--primary)/0.4)] scale-[1.03]"
                        : "border-border opacity-70 hover:opacity-100 hover:scale-[1.02]"
                    )}
                  >
                    <span className="text-xl leading-none">{r.flag}</span>
                    <span className="font-display uppercase text-[10px] tracking-wider">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ADVANCED COLLAPSIBLE */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-md border border-border bg-background/40 hover:border-primary/50 transition-colors group"
              >
                <span className="flex items-center gap-2 font-display uppercase text-xs tracking-wider text-muted-foreground group-hover:text-foreground">
                  <Settings2 className="h-4 w-4" />
                  {t("teams_page.advanced_settings", { defaultValue: "Advanced settings" })}
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", advancedOpen && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <div className="pt-3 space-y-4">
                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
                    {t("teams_page.description", { defaultValue: "Team description" })}
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="What is your team about?"
                    className="font-body bg-background/60 resize-none"
                  />
                </div>

                {/* Recruitment status */}
                <div className="space-y-2">
                  <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    {t("teams_page.recruitment_status", { defaultValue: "Recruitment status" })}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { v: "open",   label: t("teams_page.rec_open",   { defaultValue: "Open" }) },
                      { v: "invite", label: t("teams_page.rec_invite", { defaultValue: "Invite Only" }) },
                      { v: "closed", label: t("teams_page.rec_closed", { defaultValue: "Closed" }) },
                    ] as const).map((opt) => {
                      const active = recruitment === opt.v;
                      return (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setRecruitment(opt.v)}
                          className={cn(
                            "py-2 rounded-md border-2 font-display uppercase text-xs tracking-wider transition-all bg-background/60",
                            active
                              ? "border-primary text-primary shadow-[0_0_14px_hsl(var(--primary)/0.4)]"
                              : "border-border opacity-70 hover:opacity-100"
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {recruitment === "open" && (
                  <div className="p-3 rounded-md border border-border bg-background/40 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
                        {t("teams_page.open_slots", { defaultValue: "Open slots" })}
                      </Label>
                      <span className="font-display text-primary text-lg">{slots}</span>
                    </div>
                    <Slider
                      value={[slots]}
                      min={1}
                      max={5}
                      step={1}
                      onValueChange={(v) => setSlots(v[0] ?? 1)}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-display mt-1">
                      <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                    </div>
                  </div>
                )}

                {/* Discord contact */}
                <div className="space-y-1.5">
                  <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
                    {t("teams_page.discord_contact", { defaultValue: "Discord contact (optional)" })}
                  </Label>
                  <Input
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    maxLength={100}
                    placeholder="captain#0001 or invite link"
                    className="font-body bg-background/60"
                  />
                </div>

                {/* Public team */}
                <div className="flex items-start justify-between gap-3 p-3 rounded-md border border-border bg-background/40">
                  <div className="min-w-0">
                    <div className="font-display uppercase text-sm tracking-wide">
                      {t("teams_page.public_team", { defaultValue: "Public team" })}
                    </div>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {t("teams_page.public_team_hint", { defaultValue: "Anyone can find and view this team." })}
                    </p>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-2 px-6 py-4 border-t border-border bg-background/40 mt-2">
          {!isValid && (
            <p className="text-[11px] text-muted-foreground font-body text-right">
              {t("teams_page.create_helper", { defaultValue: "Add a team name, tag, game and region to create your team." })}
            </p>
          )}
          <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground font-display uppercase tracking-wider"
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            onClick={submit}
            disabled={loading || !isValid}
            className={cn(
              "font-display uppercase tracking-wider min-w-36 text-white border-0",
              "bg-gradient-to-r from-primary via-primary to-accent",
              "hover:brightness-110",
              "shadow-[0_0_18px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.7)]",
              "disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
            )}
          >
            {loading
              ? t("teams_page.creating", { defaultValue: "Creating…" })
              : t("teams_page.create", { defaultValue: "Create Team" })}
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
