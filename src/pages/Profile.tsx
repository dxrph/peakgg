import React, { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
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
import { Coins, Pencil, UserPlus, Upload, Loader2, Trophy, Swords, ImagePlus, Flame, Award, Users, Search } from "lucide-react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  peak_coins: number;
  preferred_game: string | null;
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
        .select("id, username, display_name, avatar_url, banner_url, bio, peak_coins, preferred_game")
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
          .select("id, game, status, played_at, created_at, player_a_id, player_b_id, team_a_id, team_b_id, score_a, score_b, winner_id, map")
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
          .select("user_id, game, elo, matches_played, wins, losses, win_streak, best_win_streak")
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
      <Navbar />
      <div className="container pt-20 pb-16">
        {/* Banner + header card (banner and header are stacked, no overlap) */}
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
          {/* Banner — strictly 180px, nothing overlaps it */}
          <ProfileBanner
            url={profile.banner_url}
            isOwn={isOwnProfile}
            onUpload={handleBannerUpload}
          />

          {/* Header section — dark background, avatar lives entirely inside */}
          <div className="relative bg-card px-4 md:px-8 py-4 md:py-5 border-t border-border">
            {/* Top-right action button */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              {isOwnProfile ? (
                <Button
                  onClick={() => setEditOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  <Pencil className="h-4 w-4 mr-2" /> {t("profile_page_extra.edit_profile")}
                </Button>
              ) : (
                ownsTeam && (
                  <Button onClick={handleInvite} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" /> Invite to {ownsTeam.name}
                  </Button>
                )
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              {/* Avatar with rank-coloured ring — fully inside the header */}
              <div
                className="rounded-full p-[3px] shrink-0 self-start md:self-center"
                style={{ background: rankInfo.gradient ?? rankInfo.hex }}
              >
                <Avatar className="w-24 h-24 border-4 border-card">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
                  <AvatarFallback className="gradient-primary text-primary-foreground font-display font-bold text-2xl">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Right column: username / @handle / RankBadge / ELO bar */}
              <div className="flex-1 min-w-0">
                <h1
                  className="font-display font-bold leading-tight text-foreground break-words"
                  style={{ fontSize: "24px", overflow: "visible", textOverflow: "clip" }}
                >
                  {profile.display_name || profile.username}
                </h1>
                <p
                  className="font-body text-muted-foreground break-words"
                  style={{ fontSize: "14px", overflow: "visible", textOverflow: "clip" }}
                >
                  @{profile.username}
                </p>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setRankModalOpen(true)}
                    className="rounded-md transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Mostra progressione ranghi"
                  >
                    <RankBadge elo={headerElo} size="lg" showLabel />
                  </button>
                  {team && (
                    <Link to={`/teams/${team.id}`} className="text-sm font-mono text-primary hover:underline">
                      [{team.tag}]
                    </Link>
                  )}
                </div>
                <EloProgressBar elo={headerElo} className="mt-3 w-full" />
                {profile.bio && (
                  <p className="text-sm mt-3 font-body max-w-prose text-muted-foreground">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* ELO + Coins — wraps below on mobile */}
              <div className="flex items-center gap-5 text-center md:self-start md:pt-1 md:pr-28">
                <div>
                  <div className="text-2xl font-display font-bold text-primary">{headerElo}</div>
                  <div className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">
                    ELO {getGameById(preferredGame).shortName}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold flex items-center gap-1 justify-center">
                    <Coins className="h-5 w-5 text-yellow-400" />
                    {profile.peak_coins}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Coins</div>
                </div>
              </div>
            </div>
          </div>

          {/* Per-game stats cards */}
          <div className="px-4 md:px-8 py-4 bg-secondary/20 border-t border-border">
            <div className="text-[11px] font-display uppercase tracking-widest text-muted-foreground mb-3">
              Giochi
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {GAMES.map((g) => {
                const s = stats[g.id];
                const preferred = profile.preferred_game === g.id;
                return (
                  <PerGameCard
                    key={g.id}
                    game={g.id}
                    stat={s}
                    preferred={preferred}
                    onClick={() => {
                      setRankModalGame(g.id);
                      setRankModalOpen(true);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <StatCard
            icon={Swords}
            label="Matches"
            value={matchStats.played}
            sub={`${matchStats.thisMonth} questo mese`}
          />
          <StatCard
            icon={Trophy}
            label="Wins"
            value={matchStats.wins}
            color="text-success"
            sub={matchStats.streak > 1 ? `🔥 ${matchStats.streak} streak` : "—"}
          />
          <StatCard
            icon={Swords}
            label="Losses"
            value={matchStats.losses}
            color="text-destructive"
            sub={matchStats.lastLossDays != null ? `Ultima sconfitta: ${matchStats.lastLossDays}gg fa` : "Nessuna sconfitta"}
          />
          <div className="rounded-lg border border-border bg-card p-4 text-center neon-border">
            <Trophy className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-xl font-display font-bold">{matchStats.winRate}%</div>
            <div className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-2">Win Rate</div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full transition-all ${matchStats.winRate >= 50 ? "bg-success" : "bg-destructive"}`}
                style={{ width: `${matchStats.winRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Team */}
        <SectionCard title="Team" icon={Users}>
          {team ? (
            <Link to={`/teams/${team.id}`} className="flex items-center gap-4 hover:bg-secondary/30 -m-2 p-2 rounded-md transition-colors">
              <Avatar className="h-14 w-14">
                <AvatarImage src={team.avatar_url ?? undefined} alt={team.name} />
                <AvatarFallback className="bg-secondary font-display font-bold">{team.tag.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold truncate">
                  {team.name} <span className="text-muted-foreground font-mono text-sm">[{team.tag}]</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {isGameId(team.game) && <GameIcon game={team.game as GameId} size={16} />}
                  <span className="text-xs text-muted-foreground uppercase font-display">{team.game}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">{t("profile_page_extra.avg_rank")}</span>
                  <RankBadge elo={team.avg_elo ?? 0} size="sm" showLabel />
                </div>
              </div>
              <Button size="sm" variant="outline">{t("profile_page_extra.go_to_team")}</Button>
            </Link>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground font-body">{t("profile_page_extra.no_team")}</p>
              <Link to="/teams">
                <Button size="sm" variant="outline"><Search className="h-4 w-4 mr-2" /> {t("profile_page_extra.search_team")}</Button>
              </Link>
            </div>
          )}
        </SectionCard>

        {/* Trophies */}
        <SectionCard title="Trofei" icon={Trophy} className="mt-6">
          {trophies.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">{t("profile_page_extra.no_trophies")}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {trophies.map(t => <TrophyCard key={t.id} row={t} />)}
            </div>
          )}
        </SectionCard>

        {/* Recent matches */}
        <SectionCard title="Recent Matches" icon={Swords} className="mt-6" bodyClassName="p-0">
          {matches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-body px-4">
              <Swords className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="mb-3">{t("profile_page_extra.no_matches")}</p>
              <Link to="/tournaments"><Button size="sm" variant="outline">{t("profile_page_extra.join_tournament")}</Button></Link>
            </div>
          ) : (
            <div>
              {matches.map((m) => {
                const isPlayerA = m.player_a_id === profile.id;
                const myScore = isPlayerA ? m.score_a : m.score_b;
                const oppScore = isPlayerA ? m.score_b : m.score_a;
                const won = m.winner_id ? (isPlayerA ? m.winner_id === m.player_a_id : m.winner_id === m.player_b_id) : null;
                const result = m.status !== "completed" ? "—" : won === null ? "—" : won ? "V" : "S";
                const date = new Date(m.played_at ?? m.created_at).toLocaleDateString();
                return (
                  <div key={m.id} className="grid grid-cols-[2rem_1fr_3.5rem_5rem_6rem] gap-3 px-4 py-3 border-t border-border items-center text-sm">
                    {isGameId(m.game) ? <GameIcon game={m.game as GameId} size={20} /> : <span className="w-5" />}
                    <span className="font-body truncate">vs <span className="text-muted-foreground">{m.map ?? "Avversario"}</span></span>
                    <Badge
                      className={`justify-center font-display font-bold ${
                        result === "V" ? "bg-success text-success-foreground hover:bg-success" :
                        result === "S" ? "bg-destructive text-destructive-foreground hover:bg-destructive" :
                        "bg-secondary text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {result}
                    </Badge>
                    <span className="font-mono text-foreground">{myScore ?? "-"} : {oppScore ?? "-"}</span>
                    <span className="text-xs text-muted-foreground text-right">{date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
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
        <DialogHeader><DialogTitle>Edit profile</DialogTitle></DialogHeader>
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
              <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG o WebP — max 5 MB</p>
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
            <Label>Preferred game</Label>
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
