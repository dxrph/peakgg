import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Gamepad2,
  Target,
  MapPin,
  Languages as LanguagesIcon,
  Clock,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GAMES, type GameId } from "@/lib/ranks";
import GameIcon from "@/components/GameIcon";

const REGIONS = ["EU", "EU-West", "EU-East", "EU-North", "EU-South"];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
];
const ROLES_BY_GAME: Record<string, string[]> = {
  valorant: ["Duelist", "Controller", "Sentinel", "Initiator", "Flex", "IGL"],
  cs2: ["Entry", "AWPer", "Lurker", "Support", "Rifler", "IGL"],
  r6: ["Entry", "Anchor", "Support", "Flex", "IGL"],
};
const AVAILABILITY = [
  { value: "weekday_evenings", label: "Weekday evenings" },
  { value: "weekends", label: "Weekends" },
  { value: "flexible", label: "Flexible / most days" },
  { value: "daily", label: "Daily" },
];
const TEAM_TYPES = [
  { value: "casual", label: "Casual" },
  { value: "competitive", label: "Competitive" },
  { value: "tournament_ready", label: "Tournament-ready" },
];

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  preferred_game: string | null;
  role: string | null;
  region: string | null;
  language: string | null;
  availability: string | null;
  preferred_team_type: string | null;
  discord_username: string | null;
  looking_for_team: boolean;
};

export default function FreeAgentsCompletePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [game, setGame] = useState<GameId | "">("");
  const [role, setRole] = useState("");
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("");
  const [availability, setAvailability] = useState("");
  const [teamType, setTeamType] = useState("");
  const [discord, setDiscord] = useState("");
  const [listed, setListed] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name, bio, preferred_game, role, region, language, availability, preferred_team_type, discord_username, looking_for_team"
        )
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();
      if (!active) return;
      if (data) {
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setGame((data.preferred_game as GameId) ?? "");
        setRole(data.role ?? "");
        setRegion(data.region ?? "");
        setLanguage(data.language ?? "");
        setAvailability(data.availability ?? "");
        setTeamType(data.preferred_team_type ?? "");
        setDiscord(data.discord_username ?? "");
        setListed(data.looking_for_team ?? true);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const roleOptions = useMemo(() => (game ? ROLES_BY_GAME[game] ?? [] : []), [game]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!game) e.game = "Pick your main game.";
    if (!role) e.role = "Pick your role.";
    if (!region) e.region = "Pick your region.";
    if (!language) e.language = "Pick at least one language.";
    if (!availability) e.availability = "Pick when you're available.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (asListed: boolean) => {
    if (!user) return;
    if (!validate()) {
      toast.error("Please complete the required fields.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        preferred_game: game || null,
        role: role || null,
        region: region || null,
        language: language || "en",
        availability: availability || null,
        preferred_team_type: teamType || null,
        discord_username: discord.trim() || null,
        looking_for_team: asListed,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message || "Could not save your profile.");
      return;
    }
    if (asListed) {
      toast.success("Profile completed. You are now listed as a Free Agent.");
    } else {
      toast.success("Profile saved as hidden. You won't appear on the board.");
    }
    setListed(asListed);
    navigate("/free-agents");
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <Helmet>
        <title>Complete Free Agent Profile · PeakGG</title>
        <meta
          name="description"
          content="List yourself on the PeakGG Free Agents board. Show your game, role, rank, region, languages and availability so teams can scout you."
        />
      </Helmet>
      <Navbar />

      <div className="container max-w-3xl pt-24">
        <button
          onClick={() => navigate("/free-agents")}
          className="inline-flex items-center gap-1.5 text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Free Agents
        </button>

        <h1 className="font-display font-bold uppercase tracking-tight text-3xl md:text-4xl">
          Complete Free Agent Profile
        </h1>
        <p className="text-sm text-muted-foreground font-body mt-2 max-w-xl">
          List yourself so teams can scout your game, role, rank, region and availability.
        </p>
      </div>

      {loading ? (
        <div className="container max-w-3xl mt-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="container max-w-3xl mt-8 space-y-6">
          {/* Game & Role */}
          <Section
            icon={Gamepad2}
            title="Game & Role"
            desc="The first thing captains filter by."
          >
            <Field label="Main game *" error={errors.game}>
              <Select
                value={game}
                onValueChange={(v) => {
                  setGame(v as GameId);
                  setRole("");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select your main game" /></SelectTrigger>
                <SelectContent>
                  {GAMES.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="inline-flex items-center gap-2">
                        <GameIcon game={g.id} size={14} /> {g.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Role *" error={errors.role}>
              <Select value={role} onValueChange={setRole} disabled={!game}>
                <SelectTrigger>
                  <SelectValue placeholder={game ? "Pick your role" : "Pick a game first"} />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <p className="text-[11px] text-muted-foreground font-body">
              Your PeakGG ELO and rank are derived automatically from your matches —
              no need to type them here.
            </p>
          </Section>

          {/* Region & Languages */}
          <Section
            icon={MapPin}
            title="Region & Languages"
            desc="Helps captains match you with EU rosters that fit your timezone."
          >
            <Field label="Region *" error={errors.region}>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue placeholder="Pick your region" /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Primary language *" error={errors.language} icon={LanguagesIcon}>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue placeholder="Pick a language" /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          {/* Availability */}
          <Section
            icon={Clock}
            title="Availability"
            desc="When you can play and what kind of team you're looking for."
          >
            <Field label="Availability *" error={errors.availability}>
              <Select value={availability} onValueChange={setAvailability}>
                <SelectTrigger><SelectValue placeholder="Pick when you're available" /></SelectTrigger>
                <SelectContent>
                  {AVAILABILITY.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Preferred team type" icon={Target}>
              <Select value={teamType} onValueChange={setTeamType}>
                <SelectTrigger><SelectValue placeholder="Casual, competitive, tournament-ready…" /></SelectTrigger>
                <SelectContent>
                  {TEAM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>

          {/* About You */}
          <Section
            icon={UserIcon}
            title="About You"
            desc="A short pitch helps captains pick you over a similar player."
          >
            <Field label="Display name">
              <Input
                value={displayName}
                maxLength={40}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How your name appears on cards"
              />
            </Field>

            <Field label="Short bio">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={280}
                placeholder="Playstyle, experience, what you bring to a team…"
              />
              <div className="text-[10px] text-muted-foreground mt-1 text-right">
                {bio.length}/280
              </div>
            </Field>

            <Field label="Discord username (optional)">
              <Input
                value={discord}
                maxLength={40}
                onChange={(e) => setDiscord(e.target.value)}
                placeholder="yourtag"
              />
            </Field>
          </Section>

          {/* Visibility */}
          <Section
            icon={listed ? Eye : EyeOff}
            title="Visibility"
            desc="Choose if your profile is visible on the public board."
          >
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-background/40 p-4">
              <div className="min-w-0">
                <div className="font-display font-semibold text-sm">
                  Listed on Free Agents board
                </div>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  When enabled, captains can find you using the public filters.
                  Turn this off to keep your profile private.
                </p>
              </div>
              <Switch checked={listed} onCheckedChange={setListed} />
            </div>
          </Section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="neon"
              size="lg"
              onClick={() => save(true)}
              disabled={saving}
              className="sm:flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Save and List Profile
            </Button>
            <Button
              variant="neonOutline"
              size="lg"
              onClick={() => save(false)}
              disabled={saving}
            >
              <EyeOff className="h-4 w-4 mr-2" /> Save as Hidden
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground font-body text-center pt-2">
            You can update or hide your profile at any time from this page.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: any;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-card/50 backdrop-blur p-5 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold uppercase tracking-wider text-sm leading-none">
            {title}
          </h2>
          {desc && (
            <p className="text-[11px] text-muted-foreground font-body mt-1">{desc}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  icon: Icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: any;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider font-display text-muted-foreground inline-flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p className="mt-1 text-[11px] text-destructive font-body">{error}</p>
      )}
    </div>
  );
}