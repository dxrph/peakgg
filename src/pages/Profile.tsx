import { useEffect, useState } from "react";
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
import { Coins, Pencil, UserPlus, Upload, Loader2, Trophy, Swords } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { GAMES, getGameById, type GameId } from "@/lib/ranks";

const gameIcons: Record<string, string> = { valorant: "🎯", cs2: "💥", r6: "🛡️" };

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  elo: number;
  peak_coins: number;
  tournament_points: number;
  preferred_game: string | null;
  rank: string;
};

type TeamRow = {
  team: { id: string; name: string; tag: string; avatar_url: string | null; game: string } | null;
};

type MatchRow = {
  id: string; game: string; status: string; played_at: string | null; created_at: string;
  player_a_id: string | null; player_b_id: string | null;
  team_a_id: string | null; team_b_id: string | null;
  score_a: number | null; score_b: number | null;
  winner_id: string | null;
  map: string | null;
};

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, profile: myProfile } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [team, setTeam] = useState<TeamRow["team"] | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [ownsTeam, setOwnsTeam] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const isOwnProfile = !!user && !!profile && user.id === profile.id;

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio, elo, peak_coins, tournament_points, preferred_game, rank")
        .eq("username", username!)
        .maybeSingle();

      if (!active) return;
      if (!p) { setProfile(null); setLoading(false); return; }
      setProfile(p as Profile);

      const [{ data: tm }, { data: ms }] = await Promise.all([
        supabase
          .from("team_members")
          .select("team:teams(id, name, tag, avatar_url, game)")
          .eq("user_id", p.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("matches")
          .select("id, game, status, played_at, created_at, player_a_id, player_b_id, team_a_id, team_b_id, score_a, score_b, winner_id, map")
          .or(`player_a_id.eq.${p.id},player_b_id.eq.${p.id}`)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      if (!active) return;
      setTeam((tm as any)?.team ?? null);
      setMatches((ms as MatchRow[]) ?? []);

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
          <h1 className="text-2xl font-display font-bold mb-2">Profile not found</h1>
          <p className="text-muted-foreground mb-4">No player matches "{username}".</p>
          <Button onClick={() => navigate("/leaderboard")}>Browse leaderboard</Button>
        </div>
      </div>
    );
  }

  const stats = computeStats(matches, profile.id);

  const handleInvite = async () => {
    if (!ownsTeam) return;
    // Add notification — server-side INSERT not allowed; use a soft toast for now
    toast.success(`Invite sent to ${profile.username} for ${ownsTeam.name}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container pt-24 pb-16">
        {/* Header */}
        <div className="relative rounded-lg border border-border bg-card overflow-hidden mb-8 neon-border">
          <div className="h-32 md:h-44 gradient-hero relative">
            <div className="absolute inset-0 scanline pointer-events-none opacity-50" />
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-10 md:-mt-12">
              <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-card">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
                <AvatarFallback className="gradient-primary text-primary-foreground font-display font-bold text-2xl">
                  {profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-display font-bold">{profile.display_name || profile.username}</h1>
                  {team && (
                    <Link to={`/teams/${team.id}`} className="text-sm font-mono text-primary hover:underline">
                      [{team.tag}]
                    </Link>
                  )}
                  <RankBadge elo={profile.elo} size="md" />
                </div>
                <p className="text-sm text-muted-foreground font-body">@{profile.username}</p>
                {profile.bio && <p className="text-sm mt-2 font-body max-w-prose">{profile.bio}</p>}
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <div className="text-2xl font-display font-bold text-primary">{profile.elo}</div>
                  <div className="text-xs text-muted-foreground font-display uppercase">ELO</div>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold flex items-center gap-1 justify-center">
                    <Coins className="h-5 w-5 text-yellow-400" />
                    {profile.peak_coins}
                  </div>
                  <div className="text-xs text-muted-foreground font-display uppercase">Coins</div>
                </div>
                {profile.preferred_game && (
                  <div>
                    <div className="text-2xl">{gameIcons[profile.preferred_game] ?? "🎮"}</div>
                    <div className="text-xs text-muted-foreground font-display uppercase">
                      {getGameById(profile.preferred_game as GameId).shortName}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <EloProgressBar elo={profile.elo} className="mt-4 max-w-md" />

            <div className="mt-4 flex gap-2">
              {isOwnProfile ? (
                <Button onClick={() => setEditOpen(true)} variant="outline">
                  <Pencil className="h-4 w-4 mr-2" /> Edit profile
                </Button>
              ) : (
                ownsTeam && (
                  <Button onClick={handleInvite}>
                    <UserPlus className="h-4 w-4 mr-2" /> Invite to {ownsTeam.name}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Swords} label="Matches" value={stats.played} />
          <StatCard icon={Trophy} label="Wins" value={stats.wins} color="text-success" />
          <StatCard icon={Swords} label="Losses" value={stats.losses} color="text-destructive" />
          <StatCard icon={Trophy} label="Win Rate" value={`${stats.winRate}%`} color="text-primary" />
        </div>

        {/* Tournament points */}
        <div className="rounded-lg border border-border bg-card p-4 mb-8 neon-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-accent" />
            <div>
              <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">Tournament Points</div>
              <div className="text-2xl font-display font-bold">{profile.tournament_points}</div>
            </div>
          </div>
          <Badge variant="outline" className="font-display">Highest tier reached: T{tierFromTP(profile.tournament_points)}</Badge>
        </div>

        {/* Current team */}
        {team && (
          <div className="rounded-lg border border-border bg-card p-4 mb-8 neon-border">
            <h2 className="text-sm font-display uppercase tracking-wider text-muted-foreground mb-3">Current Team</h2>
            <Link to={`/teams/${team.id}`} className="flex items-center gap-4 hover:bg-secondary/30 -m-2 p-2 rounded-md transition-colors">
              <Avatar className="h-12 w-12">
                <AvatarImage src={team.avatar_url ?? undefined} alt={team.name} />
                <AvatarFallback className="bg-secondary font-display font-bold">{team.tag.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-display font-bold">{team.name} <span className="text-muted-foreground font-mono text-sm">[{team.tag}]</span></div>
                <div className="text-xs text-muted-foreground uppercase font-display">{team.game}</div>
              </div>
              <span className="text-primary text-sm font-display">View →</span>
            </Link>
          </div>
        )}

        {/* Match history */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-secondary/50 text-xs text-muted-foreground font-display uppercase tracking-widest">
            Recent Matches
          </div>
          {matches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-body">
              <Swords className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p>No matches played yet.</p>
            </div>
          ) : (
            matches.map((m) => {
              const isPlayerA = m.player_a_id === profile.id;
              const myScore = isPlayerA ? m.score_a : m.score_b;
              const oppScore = isPlayerA ? m.score_b : m.score_a;
              const won = m.winner_id ? (isPlayerA ? m.winner_id === m.player_a_id : m.winner_id === m.player_b_id) : null;
              const result = m.status !== "completed" ? "—" : won === null ? "—" : won ? "V" : "S";
              const date = new Date(m.played_at ?? m.created_at).toLocaleDateString();
              return (
                <div key={m.id} className="grid grid-cols-[2rem_1fr_4rem_5rem_5rem] gap-3 px-4 py-3 border-t border-border items-center text-sm">
                  <span>{gameIcons[m.game] ?? "🎮"}</span>
                  <span className="font-body truncate">{m.map ?? "Match"}</span>
                  <span className={`font-display font-bold ${result === "V" ? "text-success" : result === "S" ? "text-destructive" : "text-muted-foreground"}`}>
                    {result}
                  </span>
                  <span className="font-mono text-muted-foreground">{myScore ?? "-"} : {oppScore ?? "-"}</span>
                  <span className="text-xs text-muted-foreground text-right">{date}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          onSaved={(p) => setProfile({ ...profile, ...p })}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = "text-foreground" }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center neon-border">
      <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
      <div className="text-xl font-display font-bold">{value}</div>
      <div className="text-xs text-muted-foreground font-display uppercase tracking-wider">{label}</div>
    </div>
  );
}

function computeStats(matches: MatchRow[], userId: string) {
  const completed = matches.filter(m => m.status === "completed" && m.winner_id);
  const played = completed.length;
  const wins = completed.filter(m => {
    const isA = m.player_a_id === userId;
    return isA ? m.winner_id === m.player_a_id : m.winner_id === m.player_b_id;
  }).length;
  const losses = played - wins;
  const winRate = played === 0 ? 0 : Math.round((wins / played) * 100);
  return { played, wins, losses, winRate };
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
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [preferredGame, setPreferredGame] = useState(profile.preferred_game ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
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

  const handleSave = async () => {
    setSaving(true);
    const updates: any = {
      username: username.trim(),
      bio: bio.trim() || null,
      preferred_game: preferredGame || null,
      avatar_url: avatarUrl || null,
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
                  <SelectItem key={g.id} value={g.id}>{g.icon} {g.name}</SelectItem>
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
