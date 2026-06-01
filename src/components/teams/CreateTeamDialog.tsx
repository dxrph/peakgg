import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
import { Settings2, ChevronDown, Shield, Users, Sparkles, Trophy, Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import trophyAsset from "@/assets/championship-trophy.png.asset.json";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

const VALORANT = {
  value: "valorant" as const,
  label: "Valorant",
  short: "VAL",
  color: "#FF4655",
  glow: "rgba(255,70,85,0.45)",
};

const EUROPE = { value: "EU" as const, label: "Europe", flag: "🇪🇺" };

function computeInitials(name: string, tag: string): string {
  const source = (name || tag || "").trim();
  if (!source) return "";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  const single = words[0] ?? "";
  return single.slice(0, 2).toUpperCase();
}

export default function CreateTeamDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const game = VALORANT.value;
  const region = EUROPE.value;
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [recruitment, setRecruitment] = useState<"open" | "invite" | "closed">("open");
  const [description, setDescription] = useState("");
  const [discord, setDiscord] = useState("");
  const [slots, setSlots] = useState(2);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setName(""); setTag("");
    setAdvancedOpen(false); setRecruitment("open"); setDescription(""); setDiscord("");
    setSlots(2); setIsPublic(true);
    setSuccess(false);
  };

  const isValid = name.trim().length > 0 && tag.trim().length > 0;
  const selectedGame = VALORANT;
  const initials = computeInitials(name, tag);

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
    setSuccess(true);
    const teamId = (team as any).id;
    setTimeout(() => {
      reset();
      onOpenChange(false);
      onCreated?.();
      navigate(`/teams/${teamId}/manage`);
    }, 1400);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent
        className={cn(
          "max-w-5xl p-0 overflow-hidden border-2 w-[calc(100vw-1.5rem)]",
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
              {t("teams_page.create_team_title", { defaultValue: "Create Your Team" })}
            </DialogTitle>
            <DialogDescription className="font-body max-w-2xl">
              {t("teams_page.create_team_sub", { defaultValue: "Create your team, recruit players and compete in PeakGG tournaments." })}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0 max-h-[75vh] overflow-y-auto">
        <div className="px-6 pb-2 space-y-5 lg:border-r lg:border-border">
          {/* SECTION: IDENTITY */}
          <SectionLabel icon={Shield} text={t("teams_page.section_identity", { defaultValue: "Team identity" })} />
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

          {/* SECTION: COMPETITIVE SETUP */}
          <SectionLabel icon={Trophy} text={t("teams_page.section_competitive", { defaultValue: "Competitive setup" })} />
          {/* LOCKED GAME + REGION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
                {t("teams_page.main_game", { defaultValue: "Game" })}
              </Label>
              <div
                className="flex items-center justify-between gap-2 py-3 px-3 rounded-md border-2 bg-background/60"
                style={{ borderColor: VALORANT.color, boxShadow: `0 0 12px ${VALORANT.glow}` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-display text-base tracking-wider" style={{ color: VALORANT.color }}>
                    {VALORANT.short}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display uppercase text-sm tracking-wider truncate">
                      {VALORANT.label}
                    </div>
                    <div className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">
                      {t("teams_page.closed_beta", { defaultValue: "Closed Beta" })}
                    </div>
                  </div>
                </div>
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground">
                {t("teams_page.region", { defaultValue: "Region" })}
              </Label>
              <div className="flex items-center justify-between gap-2 py-3 px-3 rounded-md border-2 border-border bg-background/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl leading-none">{EUROPE.flag}</span>
                  <div className="min-w-0">
                    <div className="font-display uppercase text-sm tracking-wider truncate">
                      {EUROPE.label}
                    </div>
                    <div className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">
                      {t("teams_page.beta_region", { defaultValue: "Beta region" })}
                    </div>
                  </div>
                </div>
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>
          </div>

          {/* RECRUITMENT STATUS (simple) */}
          <div className="space-y-2">
            <Label className="font-display uppercase text-xs tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              {t("teams_page.recruitment_status", { defaultValue: "Recruitment status" })}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { v: "open" as const,   label: t("teams_page.rec_recruiting", { defaultValue: "Recruiting Players" }) },
                { v: "closed" as const, label: t("teams_page.rec_full",       { defaultValue: "Full Roster" }) },
              ]).map((opt) => {
                const active = recruitment === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setRecruitment(opt.v)}
                    className={cn(
                      "py-2.5 rounded-md border-2 font-display uppercase text-xs tracking-wider transition-all bg-background/60",
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

          {/* SECTION: OPTIONAL */}
          <SectionLabel icon={Settings2} text={t("teams_page.section_optional", { defaultValue: "Optional details" })} />
          {/* ADVANCED COLLAPSIBLE */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-md border border-border bg-background/40 hover:border-primary/50 transition-colors group"
              >
                <span className="flex items-center gap-2 font-display uppercase text-xs tracking-wider text-muted-foreground group-hover:text-foreground">
                  <Settings2 className="h-4 w-4" />
                  {t("teams_page.advanced_settings", { defaultValue: "Description & contact" })}
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

        {/* LIVE PREVIEW PANEL */}
        <aside className="px-6 py-5 bg-background/40 lg:bg-background/60 border-t lg:border-t-0 border-border space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-display uppercase tracking-widest text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            {t("teams_page.live_preview", { defaultValue: "Live preview" })}
          </div>

          {/* Team card preview */}
          <div
            className="rounded-lg border-2 bg-card overflow-hidden transition-all"
            style={{ borderColor: selectedGame.color, boxShadow: `0 0 24px ${selectedGame.glow}` }}
          >
            <div
              className="h-14 relative"
              style={{
                background: `linear-gradient(135deg, ${selectedGame.color}33 0%, hsl(var(--background)) 100%)`,
              }}
            >
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    "linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />
            </div>
            <div className="px-4 pb-4 -mt-7">
              <div
                className="w-14 h-14 rounded-md border-2 flex items-center justify-center font-display text-xl tracking-wider bg-gradient-to-br from-background to-card relative overflow-hidden"
                style={{
                  borderColor: selectedGame.color,
                  color: selectedGame.color,
                  boxShadow: `0 0 16px ${selectedGame.glow}, inset 0 0 10px ${selectedGame.glow}`,
                }}
              >
                {initials ? (
                  <span className="relative z-10">{initials}</span>
                ) : (
                  <span className="relative z-10 opacity-40">PG</span>
                )}
              </div>
              <div className="mt-3 min-w-0">
                <div className="font-display font-bold text-lg truncate">
                  {name.trim() || t("teams_page.preview_name_ph", { defaultValue: "Your team name" })}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  [{tag.toUpperCase().slice(0, 4) || "TAG"}] · {selectedGame.label} · 🇪🇺 {EUROPE.label}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {recruitment === "open" ? (
                  <span className="text-[10px] uppercase tracking-wider font-display border border-success/40 text-success rounded-sm px-1.5 py-0.5">
                    {t("teams_page.rec_recruiting", { defaultValue: "Recruiting Players" })}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider font-display border border-border text-muted-foreground rounded-sm px-1.5 py-0.5">
                    {t("teams_page.rec_full", { defaultValue: "Full Roster" })}
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wider font-display border border-primary/40 text-primary rounded-sm px-1.5 py-0.5">
                  <Sparkles className="h-2.5 w-2.5 inline mr-0.5" />
                  {t("teams_page.founding_team", { defaultValue: "Founding Team" })}
                </span>
              </div>
              {description.trim() && (
                <p className="text-xs text-muted-foreground font-body mt-3 line-clamp-3">
                  {description.trim()}
                </p>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-md border border-border bg-card/40 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-display uppercase tracking-widest text-primary">
              <Trophy className="h-3.5 w-3.5" />
              {t("teams_page.tips_title", { defaultValue: "Founding a roster" })}
            </div>
            <ul className="text-[11px] text-muted-foreground font-body space-y-1.5 leading-relaxed">
              <li>• {t("teams_page.tip_1", { defaultValue: "Pick a strong tag — it appears next to your matches." })}</li>
              <li>• {t("teams_page.tip_2", { defaultValue: "One owned team per game. Choose wisely." })}</li>
              <li>• {t("teams_page.tip_3", { defaultValue: "Founding teams get an early badge on their public page." })}</li>
            </ul>
          </div>
        </aside>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-2 px-6 py-4 border-t border-border bg-background/40 mt-2">
          {!isValid && (
            <p className="text-[11px] text-muted-foreground font-body text-right">
              {t("teams_page.create_helper", { defaultValue: "Add a team name and tag to create your team." })}
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
              : t("teams_page.create_my_team", { defaultValue: "Create My Team" })}
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="font-display uppercase text-[11px] tracking-widest text-muted-foreground">{text}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
