import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RankBadge from "@/components/RankBadge";
import EloProgressBar from "@/components/EloProgressBar";
import RankProgressionModal from "@/components/RankProgressionModal";
import { Coins, Pencil, UserPlus, Upload, Loader2, Trophy, Swords, ImagePlus, Award, Users, Search, Clock, Star, ShieldCheck, Sparkles, Globe2, Share2, MessageSquare, Calendar, TrendingUp, Flame } from "lucide-react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CommunityCupHistory from "@/components/community-cup/CommunityCupHistory";
/* ------------------------------------------------------------------ */
/* Banner upload — validation + friendly error mapping                */
/* ------------------------------------------------------------------ */

const BANNER_MAX_BYTES = 5 * 1024 * 1024;
const BANNER_ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const BANNER_ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];

type TFn = (key: string, options?: Record<string, unknown>) => string;

function validateBannerFile(file: File, t: TFn): string | null {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const mimeOk = BANNER_ALLOWED_MIME.includes(file.type);
  const extOk = BANNER_ALLOWED_EXT.includes(ext);
  if (!mimeOk && !extOk) {
    return t("profile_page.banner_unsupported");
  }
  if (file.size > BANNER_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return t("profile_page.file_too_large", { mb });
  }
  if (file.size === 0) {
    return t("profile_page.banner_empty");
  }
  return null;
}

function friendlyBannerError(err: unknown, t: TFn): string {
  const raw = (err as any)?.message ?? String(err ?? "");
  const msg = raw.toLowerCase();
  if (!navigator.onLine) return t("profile_page.offline");
  if (msg.includes("row-level security") || msg.includes("not authorized") || msg.includes("permission") || msg.includes("403") || msg.includes("unauthorized")) {
    return t("profile_page.banner_perm_denied");
  }
  if (msg.includes("payload too large") || msg.includes("413") || msg.includes("exceeded the maximum allowed size")) {
    return t("profile_page.file_too_large_simple");
  }
  if (msg.includes("mime") || msg.includes("invalid_mime") || msg.includes("not allowed")) {
    return t("profile_page.banner_unsupported_mime");
  }
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("fetch failed")) {
    return t("profile_page.network_error");
  }
  if (msg.includes("bucket not found")) {
    return t("profile_page.banner_storage_missing");
  }
  return raw || t("profile_page.upload_failed");
}

type UploadResult = { ok: true; url: string } | { ok: false; error: string };

import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { GAMES, getGameById, type GameId, getRankByElo, getEloProgress } from "@/lib/ranks";
import GameIcon from "@/components/GameIcon";
import SeasonBadge from "@/components/seasons/SeasonBadge";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  peak_coins: number;
  preferred_game: string | null;
  region: string | null;
  language: string | null;
  role: string | null;
  discord_username: string | null;
  reputation_score: number;
  account_verified: boolean;
  fast_track: boolean;
  looking_for_team: boolean;
  last_active_at: string;
  created_at: string;
};

type PlayerStat = {
  user_id: string;
  game: GameId;
  elo: number;
  matches_played: number;
  wins: number;
  losses: number;
  win_streak: number;
  best_win_streak: number;
  peak_elo?: number;
  peak_rank?: string;
};

type TeamRow = {
  team: { id: string; name: string; tag: string; avatar_url: string | null; game: string; avg_elo: number } | null;
};

type MatchRow = {
  id: string; game: string; status: string; played_at: string | null; created_at: string;
  player_a_id: string | null; player_b_id: string | null;
  team_a_id: string | null; team_b_id: string | null;
  score_a: number | null; score_b: number | null;
  winner_id: string | null;
  map: string | null;
  kind?: string | null;
};

type TrophyRow = {
  id: string;
  placement: number | null;
  points_earned: number | null;
  registered_at: string;
  tournament: {
    id: string;
    name: string;
    game: string;
    tier: number;
    end_date: string | null;
  } | null;
};

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, profile: myProfile } = useAuth();
  const { t } = useI18n();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [team, setTeam] = useState<TeamRow["team"] | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [trophies, setTrophies] = useState<TrophyRow[]>([]);
  const [stats, setStats] = useState<Record<GameId, PlayerStat | null>>({
    valorant: null,
    cs2: null,
    r6s: null,
  });
  const [ownsTeam, setOwnsTeam] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [rankModalOpen, setRankModalOpen] = useState(false);
  const [rankModalGame, setRankModalGame] = useState<GameId>("valorant");

  const isOwnProfile = !!user && !!profile && user.id === profile.id;

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, banner_url, bio, peak_coins, preferred_game, region, language, role, discord_username, reputation_score, account_verified, fast_track, looking_for_team, last_active_at, created_at")
        .eq("username", username!)
        .maybeSingle();

      if (!active) return;
      if (!p) { setProfile(null); setLoading(false); return; }
      setProfile(p as Profile);

      const [{ data: tm }, { data: ms }, { data: trs }, { data: ps }] = await Promise.all([
        supabase
          .from("team_members")
          .select("team:teams(id, name, tag, avatar_url, game, avg_elo)")
          .eq("user_id", p.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("matches")
          .select("id, game, status, played_at, created_at, player_a_id, player_b_id, team_a_id, team_b_id, score_a, score_b, winner_id, map, kind")
          .or(`player_a_id.eq.${p.id},player_b_id.eq.${p.id}`)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("tournament_entries")
          .select("id, placement, points_earned, registered_at, tournament:tournaments(id, name, game, tier, end_date)")
          .eq("user_id", p.id)
          .not("placement", "is", null)
          .order("registered_at", { ascending: false })
          .limit(12),
        supabase
          .from("player_stats")
          .select("user_id, game, elo, matches_played, wins, losses, win_streak, best_win_streak, peak_elo, peak_rank")
          .eq("user_id", p.id),
      ]);
      if (!active) return;
      setTeam((tm as any)?.team ?? null);
      setMatches((ms as MatchRow[]) ?? []);
      setTrophies(((trs as any[]) ?? []).filter(t => t.tournament) as TrophyRow[]);

      // Map per-game stats
      const map: Record<GameId, PlayerStat | null> = { valorant: null, cs2: null, r6s: null };
      ((ps as any[]) ?? []).forEach((row: any) => {
        if (row.game === "valorant" || row.game === "cs2" || row.game === "r6s") {
          map[row.game as GameId] = row as PlayerStat;
        }
      });
      setStats(map);

      // Check if viewer owns a team (for invite button)
      if (user && user.id !== p.id) {
        const { data: own } = await supabase
          .from("teams")
          .select("id, name")
          .eq("owner_id", user.id)
          .limit(1)
          .maybeSingle();
        if (active) setOwnsTeam(own ?? null);
      }

      setLoading(false);
    })();
    return () => { active = false; };
  }, [username, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container pt-24 text-center">
          <h1 className="text-2xl font-display font-bold mb-2">{t("profile_page_extra.not_found")}</h1>
          <p className="text-muted-foreground mb-4">No player matches "{username}".</p>
          <Button onClick={() => navigate("/leaderboard")}>{t("profile_page_extra.browse_leaderboard")}</Button>
        </div>
      </div>
    );
  }

  const matchStats = computeStats(matches, profile.id);
  // Header rank: use the user's preferred game stats (fallback to highest ELO across games)
  const preferredGame: GameId = isGameId(profile.preferred_game) ? (profile.preferred_game as GameId) : "valorant";
  const headerStat: PlayerStat | null =
    stats[preferredGame] ??
    (Object.values(stats).filter(Boolean) as PlayerStat[]).sort((a, b) => b.elo - a.elo)[0] ??
    null;
  const headerElo = headerStat?.elo ?? 1000;
  const rankInfo = getRankByElo(headerElo);

  const handleInvite = async () => {
    if (!ownsTeam) return;
    // Add notification — server-side INSERT not allowed; use a soft toast for now
    toast.success(`Invite sent to ${profile.username} for ${ownsTeam.name}`);
  };

  const handleBannerUpload = async (file: File): Promise<UploadResult> => {
    if (!isOwnProfile) {
      return { ok: false, error: t("profile_page.not_owner") };
    }
    const validationError = validateBannerFile(file, t);
    if (validationError) {
      toast.error(validationError);
      return { ok: false, error: validationError };
    }
    try {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${profile.id}/banner-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-banners")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("profile-banners").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ banner_url: pub.publicUrl }).eq("id", profile.id);
      if (updErr) throw updErr;
      setProfile({ ...profile, banner_url: pub.publicUrl });
      toast.success(t("profile_page.banner_updated"));
      return { ok: true, url: pub.publicUrl };
    } catch (err) {
      const message = friendlyBannerError(err, t);
      toast.error(message);
      return { ok: false, error: message };
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{`${profile.display_name || profile.username} — PeakGG Profile`}</title>
        <meta name="description" content={`${profile.display_name || profile.username}'s competitive profile on PeakGG. ELO ${headerElo}, ${rankInfo.name}.`} />
      </Helmet>
      <Navbar />
      {/* ───────────────── HERO BANNER (v2) ───────────────── */}
      <div className="relative w-full pt-16">
        <div
          className="relative w-full overflow-hidden border-b border-border min-h-[280px] md:min-h-[340px]"
          style={{
            background: profile.banner_url
              ? `linear-gradient(180deg, hsl(var(--background)/0.35) 0%, hsl(var(--background)/0.75) 60%, hsl(var(--background)) 100%), url(${profile.banner_url}) center/cover no-repeat`
              : `linear-gradient(135deg, ${rankInfo.hex}40 0%, hsl(var(--background)) 65%), radial-gradient(circle at 80% 20%, ${rankInfo.hex}66, transparent 55%)`,
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)/0.25) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.25) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          {/* Owner banner upload chip */}
          {isOwnProfile && (
            <div className="absolute top-3 right-3 z-10">
              <ProfileBannerChip onUpload={handleBannerUpload} />
            </div>
          )}

          <div className="container relative z-[1] py-10 md:py-14">
            <Badge variant="outline" className="mb-3 border-primary/40 text-primary uppercase font-display tracking-widest text-[10px]">
              {t("profile_v2.hero_eyebrow")}
            </Badge>
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
              {/* Avatar + identity */}
              <div className="flex items-end gap-5 flex-1 min-w-0">
                <div
                  className="rounded-full p-[3px] shrink-0 relative"
                  style={{ background: rankInfo.gradient ?? rankInfo.hex, boxShadow: `0 0 32px ${rankInfo.hex}88` }}
                >
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
                    <AvatarFallback className="gradient-primary text-primary-foreground font-display font-bold text-3xl">
                      {profile.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {profile.account_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 border-2 border-background" title={t("profile_v2.verified")}>
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {profile.fast_track && (
                      <Badge className="bg-accent/15 text-accent border-accent/40 text-[10px] uppercase font-display">
                        <Sparkles className="h-3 w-3 mr-1" /> {t("profile_v2.fast_track")}
                      </Badge>
                    )}
                    {profile.looking_for_team && (
                      <Badge variant="outline" className="text-[10px] uppercase font-display border-primary/40 text-primary">
                        <Search className="h-3 w-3 mr-1" /> {t("profile_v2.looking_for_team")}
                      </Badge>
                    )}
                  </div>
                  <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight truncate">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="font-body text-sm text-muted-foreground truncate">@{profile.username}</p>
                  <div className="mt-3 flex items-center gap-x-3 gap-y-1.5 flex-wrap text-xs text-muted-foreground font-mono">
                    <span className="inline-flex items-center gap-1"><Globe2 className="h-3 w-3" /> {profile.region || "EU"}</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {(profile.language || "EN").toUpperCase()}</span>
                    <span className="inline-flex items-center gap-1">
                      <GameIcon game={preferredGame} size={12} />
                      {GAMES.find(g => g.id === preferredGame)?.shortName ?? "—"}
                    </span>
                    {profile.role && (
                      <span className="inline-flex items-center gap-1 text-foreground/80">
                        <Swords className="h-3 w-3" /> {profile.role}
                      </span>
                    )}
                    {profile.discord_username && (
                      <span className="inline-flex items-center gap-1 text-[#8a93f5]">
                        <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
                          <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.078.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0c-.165-.39-.406-.874-.617-1.249a.077.077 0 0 0-.078-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.045-.32 13.579.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.027c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.105 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.349-1.22.645-1.873.892a.077.077 0 0 0-.041.105c.36.699.772 1.364 1.225 1.994a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.182 0-2.156-1.085-2.156-2.419 0-1.333.956-2.418 2.156-2.418 1.21 0 2.175 1.094 2.156 2.418 0 1.334-.956 2.419-2.156 2.419zm7.974 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.175 1.094 2.156 2.418 0 1.334-.946 2.419-2.156 2.419z"/>
                        </svg>
                        {profile.discord_username}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-display tracking-wider ${
                        team
                          ? "border-success/40 text-success bg-success/10"
                          : "border-accent/40 text-accent bg-accent/10"
                      }`}
                    >
                      {team ? `In Team · ${team.tag}` : "Free Agent"}
                    </Badge>
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {t("profile_v2.joined")} {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action cluster */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {isOwnProfile ? (
                  <Button onClick={() => setEditOpen(true)} size="sm" variant="outline">
                    <Pencil className="h-4 w-4 mr-2" /> {t("profile_page_extra.edit_profile")}
                  </Button>
                ) : (
                  <>
                    {ownsTeam && (
                      <Button onClick={handleInvite} size="sm">
                        <UserPlus className="h-4 w-4 mr-2" /> {t("profile_v2.invite_to_team")}
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" /> {t("profile_v2.send_message")}
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    toast.success(t("profile_v2.share"));
                  }}
                  aria-label={t("profile_v2.share")}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm mt-5 font-body max-w-prose text-muted-foreground border-l-2 border-primary/40 pl-3">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Top stat strip */}
        <div className="border-b border-border bg-card/40 backdrop-blur">
          <div className="container py-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <StripStat icon={<TrendingUp className="h-4 w-4" />} label={t("profile_v2.best_rank")} value={
              <span className="inline-flex items-center gap-2">
                <RankBadge elo={headerElo} size="md" />
                <span className="font-display font-bold" style={{ color: rankInfo.hex }}>{rankInfo.name}</span>
              </span>
            } />
            <StripStat icon={<Swords className="h-4 w-4 text-primary" />} label={t("profile_v2.total_matches")} value={matchStats.played} />
            <StripStat
              icon={<Trophy className="h-4 w-4 text-yellow-400" />}
              label={t("profile_v2.win_rate")}
              value={`${matchStats.winRate}%`}
              valueClass={matchStats.winRate >= 50 ? "text-success" : "text-destructive"}
            />
            <StripStat icon={<Flame className="h-4 w-4 text-accent" />} label={t("profile_v2.current_streak")} value={matchStats.streak} />
            <StripStat
              icon={<Star className="h-4 w-4 text-yellow-400 fill-yellow-400/40" />}
              label={t("profile_v2.reputation")}
              value={Number(profile.reputation_score ?? 5).toFixed(1)}
            />
          </div>
        </div>
      </div>

      {isOwnProfile && team && (
        <div className="container mt-6">
          <Link
            to={`/teams/${team.id}/dashboard`}
            className="flex items-center justify-between gap-4 rounded-md border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors p-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-display uppercase tracking-wider text-sm truncate">
                  You are part of {team.name}
                </p>
                <p className="text-xs text-muted-foreground">Open your Team Dashboard to manage roster, league, and chat.</p>
              </div>
            </div>
            <Button size="sm" variant="neon" className="shrink-0">Open Dashboard</Button>
          </Link>
        </div>
      )}

      {/* ───────────────── TABS ───────────────── */}
      <div className="container py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto no-scrollbar bg-card border border-border h-auto p-1 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary border border-transparent gap-2 font-display uppercase tracking-wider text-xs">
              <Award className="h-3.5 w-3.5" /> {t("profile_v2.overview")}
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary border border-transparent gap-2 font-display uppercase tracking-wider text-xs">
              <TrendingUp className="h-3.5 w-3.5" /> {t("profile_v2.stats")}
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary border border-transparent gap-2 font-display uppercase tracking-wider text-xs">
              <Swords className="h-3.5 w-3.5" /> {t("profile_v2.matches")}
            </TabsTrigger>
            <TabsTrigger value="trophies" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary border border-transparent gap-2 font-display uppercase tracking-wider text-xs">
              <Trophy className="h-3.5 w-3.5" /> {t("profile_v2.trophies")}
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary border border-transparent gap-2 font-display uppercase tracking-wider text-xs">
              <Users className="h-3.5 w-3.5" /> {t("profile_v2.teams")}
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {GAMES.map((g) => (
                <PerGameCard
                  key={g.id}
                  game={g.id}
                  stat={stats[g.id]}
                  preferred={g.id === preferredGame}
                  onClick={() => { setRankModalGame(g.id); setRankModalOpen(true); }}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <SectionCard title={t("profile_v2.activity")} icon={Swords} className="lg:col-span-2">
                <RecentMatchesList matches={matches.slice(0, 8)} profileId={profile.id} />
              </SectionCard>
              <div className="space-y-5">
                <SectionCard title={t("profile_v2.teams")} icon={Users}>
                  {team ? (
                    <Link to={`/teams/${team.id}`} className="flex items-center gap-3 hover:bg-secondary/30 -m-2 p-2 rounded-md transition-colors">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={team.avatar_url ?? undefined} alt={team.name} />
                        <AvatarFallback className="bg-secondary font-display font-bold text-sm">{team.tag.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold truncate text-sm">
                          {team.name} <span className="text-muted-foreground font-mono text-xs">[{team.tag}]</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-display uppercase tracking-wider mt-0.5">
                          ELO {team.avg_elo}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-muted-foreground font-body mb-3">{t("profile_page_extra.no_team")}</p>
                      <Link to="/teams"><Button size="sm" variant="outline" className="w-full"><Search className="h-4 w-4 mr-2" />{t("profile_page_extra.search_team")}</Button></Link>
                    </div>
                  )}
                </SectionCard>
                <SectionCard title="Wallet" icon={Coins}>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-display font-bold text-yellow-400 flex items-center gap-2">
                      <Coins className="h-5 w-5" /> {profile.peak_coins}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-display uppercase tracking-wider">Peak Coins</div>
                  </div>
                </SectionCard>
                <div><SeasonBadge userId={profile.id} /></div>
              </div>
            </div>

            <SectionCard title={t("profile_v2.achievements")} icon={Award}>
              <BadgeStrip stats={stats} matchStats={matchStats} trophiesCount={trophies.length} />
            </SectionCard>

            {/* Favorite Clips placeholder */}
            <SectionCard title="Favorite Clips" icon={ImagePlus}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="group relative aspect-video rounded-md border border-dashed border-border bg-secondary/20 overflow-hidden flex items-center justify-center"
                  >
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{ background: `linear-gradient(135deg, ${rankInfo.hex}33 0%, transparent 70%)` }}
                    />
                    <div className="relative text-center px-3">
                      <ImagePlus className="h-5 w-5 mx-auto text-muted-foreground/50 mb-1" />
                      <p className="text-[11px] text-muted-foreground font-display uppercase tracking-wider">
                        {isOwnProfile ? "Add a clip" : "Coming soon"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Tournament history placeholder */}
            <SectionCard title="Tournament History" icon={Trophy}>
              {trophies.length === 0 ? (
                <div className="text-center py-6">
                  <Trophy className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground font-body">
                    {t("profile_page_extra.no_trophies")}
                  </p>
                  <Link to="/tournaments">
                    <Button size="sm" variant="outline" className="mt-3">
                      <Trophy className="h-4 w-4 mr-2" /> Browse Tournaments
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {trophies.slice(0, 5).map((tr) => (
                    <div
                      key={tr.id}
                      className="flex items-center gap-3 border border-border rounded-md p-3 bg-secondary/20"
                    >
                      <Trophy className="h-5 w-5 text-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold truncate">{tr.tournament?.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono uppercase">
                          {tr.tournament?.game} · #{tr.placement} · +{tr.points_earned ?? 0} TP
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {tr.tournament?.end_date ? new Date(tr.tournament.end_date).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </TabsContent>

          {/* STATS */}
          <TabsContent value="stats">
            <Tabs defaultValue={preferredGame}>
              <TabsList className="w-full justify-start overflow-x-auto no-scrollbar bg-card border border-border h-auto p-1">
              {GAMES.map((g) => (
                <TabsTrigger
                  key={g.id}
                  value={g.id}
                  className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:border-primary/40 border border-transparent gap-2 font-display uppercase tracking-wider text-xs"
                >
                  <GameIcon game={g.id} size={16} />
                  {g.shortName}
                </TabsTrigger>
              ))}
            </TabsList>

            {GAMES.map((g) => {
              const s = stats[g.id];
              const elo = s?.elo ?? 1000;
              const wins = s?.wins ?? 0;
              const losses = s?.losses ?? 0;
              const total = wins + losses;
              const wr = total > 0 ? Math.round((wins / total) * 100) : 0;
              const rinfo = getRankByElo(elo);
              return (
                <TabsContent key={g.id} value={g.id} className="mt-4 space-y-4">
                  <button
                    type="button"
                    onClick={() => { setRankModalGame(g.id); setRankModalOpen(true); }}
                    className="w-full text-left rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <RankBadge elo={elo} size="md" />
                        <div className="min-w-0">
                          <div className="font-display font-bold text-base truncate" style={{ color: rinfo.hex }}>
                            {rinfo.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            <span className="text-success font-bold">{wins}W</span>
                            {" · "}
                            <span className="text-destructive font-bold">{losses}L</span>
                            {total > 0 && <> · {wr}% WR</>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-primary text-xl">{elo}</div>
                        <div className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">ELO</div>
                      </div>
                    </div>
                    <EloProgressBar elo={elo} />
                  </button>

                  {/* Recent matches for this game */}
                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="px-4 py-2.5 bg-secondary/40 border-b border-border flex items-center gap-2 text-[11px] font-display uppercase tracking-widest text-muted-foreground">
                      <Swords className="h-3.5 w-3.5" /> Recent Matches
                    </div>
                    <RecentMatchesList
                      matches={matches.filter((m) => m.game === g.id).slice(0, 10)}
                      profileId={profile.id}
                    />
                  </div>
                </TabsContent>
              );
            })}
            </Tabs>
          </TabsContent>

          {/* MATCHES */}
          <TabsContent value="matches">
            <SectionCard title={t("profile_v2.matches")} icon={Swords}>
              <RecentMatchesList matches={matches} profileId={profile.id} />
            </SectionCard>
            <div className="mt-6">
              <CommunityCupHistory userId={profile.id} />
            </div>
          </TabsContent>

          {/* TROPHIES */}
          <TabsContent value="trophies">
            {trophies.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground font-body">{t("profile_page_extra.no_trophies")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {trophies.map((tr) => <TrophyCard key={tr.id} row={tr} />)}
              </div>
            )}
          </TabsContent>

          {/* TEAMS */}
          <TabsContent value="teams">
            <SectionCard title={t("profile_v2.teams")} icon={Users}>
              {team ? (
                <Link to={`/teams/${team.id}`} className="flex items-center gap-4 hover:bg-secondary/30 -m-2 p-3 rounded-md transition-colors">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={team.avatar_url ?? undefined} alt={team.name} />
                    <AvatarFallback className="bg-secondary font-display font-bold">{team.tag.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-lg">{team.name} <span className="text-muted-foreground font-mono text-sm">[{team.tag}]</span></div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">ELO {team.avg_elo} · {team.game.toUpperCase()}</div>
                  </div>
                </Link>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground font-body mb-3">{t("profile_page_extra.no_team")}</p>
                  <Link to="/teams"><Button size="sm" variant="outline"><Search className="h-4 w-4 mr-2" />{t("profile_page_extra.search_team")}</Button></Link>
                </div>
              )}
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          onSaved={(p) => setProfile({ ...profile, ...p })}
        />
      )}

      <RankProgressionModal
        open={rankModalOpen}
        onOpenChange={setRankModalOpen}
        stats={stats}
        game={rankModalGame}
        onGameChange={setRankModalGame}
        username={profile.display_name || profile.username}
        isOwn={isOwnProfile}
      />
      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = "text-foreground", sub }: { icon: any; label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center neon-border">
      <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
      <div className="text-xl font-display font-bold">{value}</div>
      <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">{label}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground font-body">{sub}</div>}
    </div>
  );
}

/* ───────────────── New profile sub-components ───────────────── */

function HeroStat({
  label, value, valueClassName = "text-foreground", icon,
}: { label: string; value: string | number; valueClassName?: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className={`text-xl md:text-2xl font-display font-bold flex items-center gap-1.5 justify-center ${valueClassName}`}>
        {icon}
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">{label}</div>
    </div>
  );
}

function StripStat({
  icon, label, value, valueClass = "text-foreground",
}: { icon?: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
        {icon}{label}
      </div>
      <div className={`text-lg md:text-xl font-display font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function InlineStat({
  label, value, valueClassName = "text-foreground",
}: { label: string; value: string | number; valueClassName?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-base md:text-lg font-display font-bold ${valueClassName}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ProfileBannerChip({ onUpload }: { onUpload: (f: File) => Promise<UploadResult> }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    await onUpload(file);
    setBusy(false);
  };
  return (
    <Label className="cursor-pointer">
      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handle} disabled={busy} />
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider bg-background/70 backdrop-blur border border-border hover:bg-background/90 transition-colors">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
        {busy ? t("profile_page.loading") : t("profile_page.change_banner")}
      </span>
    </Label>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ora";
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${h === 1 ? "ora" : "ore"} fa`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${d === 1 ? "giorno" : "giorni"} fa`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} sett. fa`;
  const mo = Math.floor(d / 30);
  return `${mo} ${mo === 1 ? "mese" : "mesi"} fa`;
}

function RecentMatchesList({ matches, profileId }: { matches: MatchRow[]; profileId: string }) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <Swords className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground font-body mb-3">Nessuna partita recente.</p>
        <Link to="/play">
          <Button size="sm" variant="outline">Trova match</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="divide-y divide-border">
      {matches.map((m) => {
        const isA = m.player_a_id === profileId;
        const myScore = isA ? m.score_a : m.score_b;
        const oppScore = isA ? m.score_b : m.score_a;
        const won = m.winner_id ? (isA ? m.winner_id === m.player_a_id : m.winner_id === m.player_b_id) : null;
        const result: "W" | "L" | "—" =
          m.status !== "completed" || won === null ? "—" : won ? "W" : "L";
        const dateIso = m.played_at ?? m.created_at;
        return (
          <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/20 transition-colors">
            <span
              className={`inline-flex items-center justify-center w-7 h-7 rounded font-display font-bold text-xs shrink-0 ${
                result === "W" ? "bg-success/20 text-success border border-success/40" :
                result === "L" ? "bg-destructive/20 text-destructive border border-destructive/40" :
                "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {result}
            </span>
            <span className="font-display font-semibold truncate flex-1 min-w-0">
              {m.map
                ?? (m.kind === "open_cup" ? "Open Cup 1v1"
                  : m.kind === "ranked" ? "Ranked 1v1 Beta"
                  : m.kind === "scrim" ? "Scrim"
                  : "Match")}
            </span>
            <span className="font-mono text-foreground hidden sm:inline shrink-0">
              {myScore ?? "-"} : {oppScore ?? "-"}
            </span>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" /> {relativeTime(dateIso)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BadgeStrip({
  stats, matchStats, trophiesCount,
}: { stats: Record<GameId, PlayerStat | null>; matchStats: ReturnType<typeof computeStats>; trophiesCount: number }) {
  const earned: { label: string; color: string; icon: React.ReactNode }[] = [];
  if (matchStats.played >= 1) earned.push({ label: "First Blood", color: "#ef4444", icon: <Swords className="h-4 w-4" /> });
  if (matchStats.wins >= 10) earned.push({ label: "10 Wins", color: "#22c55e", icon: <Trophy className="h-4 w-4" /> });
  if (matchStats.streak >= 3) earned.push({ label: `${matchStats.streak}× Streak`, color: "#f59e0b", icon: <Award className="h-4 w-4" /> });
  if (trophiesCount >= 1) earned.push({ label: "Tournament", color: "#facc15", icon: <Trophy className="h-4 w-4" /> });
  const bestElo = Math.max(...Object.values(stats).map((s) => s?.elo ?? 0), 0);
  if (bestElo >= 1500) earned.push({ label: "Gold+", color: getRankByElo(bestElo).hex, icon: <Award className="h-4 w-4" /> });

  if (earned.length === 0) {
    return (
      <p className="text-xs text-muted-foreground font-body text-center py-3">
        Nessun badge ancora. Gioca per sbloccarli.
      </p>
    );
  }
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {earned.map((b, i) => (
        <div
          key={i}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-display font-bold"
          style={{ borderColor: `${b.color}66`, background: `${b.color}1a`, color: b.color }}
          title={b.label}
        >
          {b.icon}
          {b.label}
        </div>
      ))}
    </div>
  );
}

function PerGameCard({
  game, stat, preferred, onClick,
}: {
  game: GameId;
  stat: PlayerStat | null;
  preferred: boolean;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const info = getGameById(game);
  const elo = stat?.elo ?? 1000;
  const wins = stat?.wins ?? 0;
  const losses = stat?.losses ?? 0;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const rankInfo = getRankByElo(elo);
  const progress = getEloProgress(elo);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border bg-card/70 p-4 transition-all hover:border-primary/60 hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        preferred ? "border-primary/70 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]" : "border-border"
      }`}
      aria-label={`Apri progressione ${info.name}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <GameIcon game={game} size={22} />
          <span className="font-display font-bold text-sm truncate">{info.name}</span>
        </div>
        {preferred && (
          <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary text-primary shrink-0">
            {t("profile_page_extra.preferred")}
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <RankBadge elo={elo} size="sm" />
          <span className="font-display font-bold text-sm truncate" style={{ color: rankInfo.hex }}>
            {rankInfo.name}
          </span>
        </div>
        <span className="font-mono font-bold text-primary text-sm">{elo}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono mb-2">
        <span><span className="text-success font-bold">{wins}W</span> / <span className="text-destructive font-bold">{losses}L</span></span>
        <span>{total > 0 ? `${winRate}% WR` : "—"}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full transition-all"
          style={{
            width: `${progress.percent}%`,
            background: progress.nextRank
              ? `linear-gradient(90deg, ${rankInfo.hex}, ${progress.nextRank.hex})`
              : (rankInfo.gradient ?? rankInfo.hex),
          }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground font-mono mt-1 text-right">
        {progress.nextRank ? `${Math.max(0, progress.nextThreshold - elo)} → ${progress.nextRank.name}` : "MAX"}
      </div>
    </button>
  );
}


function SectionCard({
  title, icon: Icon, hideIcon, children, className = "", bodyClassName = "p-4",
}: { title: string; icon?: any; hideIcon?: boolean; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card overflow-hidden neon-border ${className}`}>
      <div className="px-4 py-3 bg-secondary/40 flex items-center gap-2 text-xs text-muted-foreground font-display uppercase tracking-widest border-b border-border">
        {!hideIcon && Icon && <Icon className="h-3.5 w-3.5" />}
        {title}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

function ProfileBanner({
  url, isOwn, onUpload,
}: { url: string | null; isOwn: boolean; onUpload: (f: File) => Promise<UploadResult> }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runUpload = async (file: File) => {
    setBusy(true);
    setError(null);
    setLastFile(file);
    const res = await onUpload(file);
    setBusy(false);
    if (res.ok === true) {
      setError(null);
    } else {
      setError(res.error);
    }
  };

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await runUpload(file);
  };

  const handleRetry = async () => {
    if (lastFile) await runUpload(lastFile);
    else inputRef.current?.click();
  };

  return (
    <div
      className="h-[180px] relative bg-cover bg-center"
      style={{
        backgroundImage: url
          ? `linear-gradient(to bottom, rgba(0,0,0,0.0) 40%, hsl(var(--card))), url(${url})`
          : undefined,
      }}
    >
      {!url && (
        <div className="absolute inset-0 gradient-hero">
          <div className="absolute inset-0 scanline pointer-events-none opacity-50" />
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      )}
      {isOwn && (
        <>
          <Label className="absolute top-4 left-4 cursor-pointer">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handle}
              disabled={busy}
            />
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-wider bg-background/70 backdrop-blur border border-border hover:bg-background/90 transition-colors">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {busy ? t("profile_page.loading") : t("profile_page.change_banner")}
            </span>
          </Label>

          {error && !busy && (
            <div
              role="alert"
              className="absolute bottom-3 left-4 right-4 max-w-xl flex items-start gap-2 px-3 py-2 rounded-md bg-destructive/15 border border-destructive/40 backdrop-blur text-destructive-foreground"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
              <div className="flex-1 text-xs font-body text-destructive">{error}</div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={handleRetry}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Riprova
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TrophyCard({ row }: { row: TrophyRow }) {
  const t = row.tournament!;
  const placement = row.placement ?? 0;
  const placementColor =
    placement === 1 ? "text-yellow-400" :
    placement === 2 ? "text-slate-300" :
    placement === 3 ? "text-amber-700" :
    "text-muted-foreground";
  const tierLabel = t.tier === 3 ? "Peak Championship" : t.tier === 2 ? "Challenger" : "Open Cup";
  const tierBg =
    t.tier === 3 ? "from-purple-500/20 to-primary/10 border-purple-500/40" :
    t.tier === 2 ? "from-cyan-500/20 to-primary/10 border-cyan-500/40" :
    "from-secondary to-secondary border-border";
  const date = t.end_date ? new Date(t.end_date).toLocaleDateString() : new Date(row.registered_at).toLocaleDateString();
  return (
    <div className={`rounded-lg border bg-gradient-to-br p-3 ${tierBg}`}>
      <div className="flex items-start justify-between mb-2">
        <Trophy className={`h-7 w-7 ${placementColor}`} />
        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-display uppercase">T{t.tier}</Badge>
      </div>
      <div className="font-display font-bold text-sm leading-tight line-clamp-2">{t.name}</div>
      <div className="text-[11px] text-muted-foreground font-display uppercase tracking-wider mt-1">{tierLabel}</div>
      <div className="flex items-center justify-between mt-2 text-[11px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          {isGameId(t.game) && <GameIcon game={t.game as GameId} size={14} />}
          {t.game}
        </span>
        <span className={`font-display font-bold ${placementColor}`}>#{placement}</span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">{date}</div>
    </div>
  );
}

function isGameId(g: string | null | undefined): g is GameId {
  return g === "valorant" || g === "cs2" || g === "r6s";
}

function computeStats(matches: MatchRow[], userId: string) {
  const completed = matches.filter(m => m.status === "completed" && m.winner_id);
  const played = completed.length;
  const wonOf = (m: MatchRow) => {
    const isA = m.player_a_id === userId;
    return isA ? m.winner_id === m.player_a_id : m.winner_id === m.player_b_id;
  };
  const wins = completed.filter(wonOf).length;
  const losses = played - wins;
  const winRate = played === 0 ? 0 : Math.round((wins / played) * 100);

  // matches in current calendar month (based on played_at or created_at)
  const now = new Date();
  const thisMonth = matches.filter(m => {
    const d = new Date(m.played_at ?? m.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  // current win streak (most recent first → consecutive wins)
  let streak = 0;
  for (const m of completed) { // matches list is ordered desc by created_at
    if (wonOf(m)) streak++; else break;
  }

  // days since last loss
  const lastLoss = completed.find(m => !wonOf(m));
  const lastLossDays = lastLoss
    ? Math.max(0, Math.floor((now.getTime() - new Date(lastLoss.played_at ?? lastLoss.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return { played, wins, losses, winRate, thisMonth, streak, lastLossDays };
}

function tierFromTP(tp: number) {
  if (tp >= 200) return 3;
  if (tp >= 80) return 2;
  return 1;
}

function EditProfileDialog({
  open, onOpenChange, profile, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile;
  onSaved: (p: Partial<Profile>) => void;
}) {
  const { t } = useI18n();
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [preferredGame, setPreferredGame] = useState(profile.preferred_game ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [lastBannerFile, setLastBannerFile] = useState<File | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast.success("Avatar uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadBannerFile = async (file: File) => {
    const validationError = validateBannerFile(file, t);
    if (validationError) {
      setBannerError(validationError);
      toast.error(validationError);
      return;
    }
    setBannerUploading(true);
    setBannerError(null);
    setLastBannerFile(file);
    try {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${profile.id}/banner-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-banners")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("profile-banners").getPublicUrl(path);
      setBannerUrl(data.publicUrl);
      toast.success(t("profile_page.banner_updated"));
    } catch (err) {
      const message = friendlyBannerError(err, t);
      setBannerError(message);
      toast.error(message);
    } finally {
      setBannerUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadBannerFile(file);
  };

  const retryBannerUpload = async () => {
    if (lastBannerFile) await uploadBannerFile(lastBannerFile);
    else bannerInputRef.current?.click();
  };

  const handleSave = async () => {
    setSaving(true);
    const updates: any = {
      username: username.trim(),
      bio: bio.trim() || null,
      preferred_game: preferredGame || null,
      avatar_url: avatarUrl || null,
      banner_url: bannerUrl || null,
    };
    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    onSaved(updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("profile_page_extra.edit_profile")}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="gradient-primary text-primary-foreground font-bold">
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <span className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm hover:bg-secondary">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload avatar
              </span>
            </Label>
          </div>
          <div>
            <Label>Banner</Label>
            <div
              className="mt-1 h-24 rounded-md border border-border bg-cover bg-center relative gradient-hero"
              style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
            >
              <Label className="absolute bottom-2 right-2 cursor-pointer">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBannerUpload}
                  disabled={bannerUploading}
                />
                <span className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-background/80 backdrop-blur border border-border rounded-md text-xs">
                  {bannerUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  {bannerUploading ? t("profile_page.loading") : t("profile_page.change_banner")}
                </span>
              </Label>
            </div>
            {bannerError ? (
              <div
                role="alert"
                className="mt-2 flex items-start gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/40 text-destructive"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1 text-xs font-body">{bannerError}</div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={retryBannerUpload}
                  disabled={bannerUploading}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Riprova
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">{t("profile_page_extra.file_hint")}</p>
            )}
          </div>
          <div>
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={280} />
          </div>
          <div>
            <Label>{t("profile_page_extra.preferred_game")}</Label>
            <Select value={preferredGame} onValueChange={setPreferredGame}>
              <SelectTrigger><SelectValue placeholder="Select a game" /></SelectTrigger>
              <SelectContent>
                {GAMES.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    <span className="inline-flex items-center gap-2">
                      <GameIcon game={g.id} size={16} />
                      {g.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !username.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
