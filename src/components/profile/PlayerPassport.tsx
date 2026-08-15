import { BadgeCheck, Copy, Gamepad2, Globe2, Languages, ShieldCheck, Sparkles, Swords, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type PassportProfile = {
  username: string;
  display_name: string | null;
  preferred_game: string | null;
  role: string | null;
  region: string | null;
  language: string | null;
  account_verified: boolean;
  looking_for_team: boolean;
  reputation_score: number;
};

export default function PlayerPassport({
  profile,
  elo,
  rank,
  winRate,
  matches,
  trophies,
  teamName,
}: {
  profile: PassportProfile;
  elo: number;
  rank: string;
  winRate: number;
  matches: number;
  trophies: number;
  teamName?: string | null;
}) {
  const readiness = [profile.preferred_game, profile.role, profile.region, profile.language, profile.account_verified].filter(Boolean).length;
  const completion = Math.round((readiness / 5) * 100);

  const copyPassport = async () => {
    const text = `${profile.display_name ?? profile.username} // ${rank} · ${elo} ELO · ${winRate}% WR — PeakGG Player Passport\n${window.location.href}`;
    await navigator.clipboard?.writeText(text);
    toast.success("Player Passport copiato.");
  };

  return (
    <section className="container mt-7">
      <div className="player-passport overflow-hidden">
        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          <div className="p-6 md:p-8 bg-foreground text-background relative overflow-hidden">
            <div className="passport-scanline" />
            <div className="relative z-[1]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[.3em] font-display text-primary">PeakGG // Player Passport</span>
                <span className="font-mono text-[9px] opacity-55">ID {profile.username.toUpperCase()}</span>
              </div>
              <div className="mt-8 flex items-end justify-between gap-5">
                <div>
                  <h2 className="font-display uppercase font-bold text-3xl md:text-5xl leading-none">{profile.display_name ?? profile.username}</h2>
                  <p className="font-mono text-xs mt-3 opacity-60">{profile.role ?? "FLEX"} / {(profile.preferred_game ?? "VALORANT").toUpperCase()} / {profile.region ?? "EU"}</p>
                </div>
                <div className="text-right shrink-0"><div className="font-display text-3xl md:text-5xl font-bold text-primary">{elo}</div><div className="text-[9px] uppercase tracking-[.2em] opacity-60">Current ELO</div></div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-8 border-t border-background/15 pt-5">
                <PassportStat label="Rank" value={rank} />
                <PassportStat label="Win rate" value={`${winRate}%`} />
                <PassportStat label="Matches" value={matches.toString()} />
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 bg-card text-foreground">
            <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] uppercase tracking-[.24em] text-primary font-display">Competitive identity</div><h3 className="font-display uppercase font-bold text-2xl mt-1">Readiness {completion}%</h3></div><Button variant="outline" size="sm" onClick={copyPassport}><Copy className="h-3.5 w-3.5 mr-1.5" />Condividi</Button></div>
            <div className="h-1.5 rounded-full bg-secondary mt-4 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${completion}%` }} /></div>
            <div className="grid grid-cols-2 gap-2 mt-5 text-xs">
              <PassportSignal icon={Gamepad2} label="Game" value={profile.preferred_game ?? "Da impostare"} ready={!!profile.preferred_game} />
              <PassportSignal icon={Swords} label="Role" value={profile.role ?? "Da impostare"} ready={!!profile.role} />
              <PassportSignal icon={Globe2} label="Region" value={profile.region ?? "Da impostare"} ready={!!profile.region} />
              <PassportSignal icon={Languages} label="Language" value={(profile.language ?? "—").toUpperCase()} ready={!!profile.language} />
              <PassportSignal icon={Users} label="Club" value={teamName ?? (profile.looking_for_team ? "Free agent" : "Nessuno")} ready={!!teamName || profile.looking_for_team} />
              <PassportSignal icon={Trophy} label="Trophies" value={trophies.toString()} ready={trophies > 0} />
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">{profile.account_verified ? <ShieldCheck className="h-3.5 w-3.5 text-success" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}{profile.account_verified ? "Identità PeakGG verificata" : "Completa la verifica per aumentare la fiducia"}<span className="ml-auto inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3" />REP {Number(profile.reputation_score ?? 5).toFixed(1)}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PassportStat({ label, value }: { label: string; value: string }) {
  return <div><div className="font-display uppercase font-bold text-sm md:text-lg truncate">{value}</div><div className="text-[8px] uppercase tracking-[.2em] opacity-50 mt-1">{label}</div></div>;
}

function PassportSignal({ icon: Icon, label, value, ready }: { icon: typeof Gamepad2; label: string; value: string; ready: boolean }) {
  return <div className="rounded-lg border border-border bg-background/50 p-3 flex items-center gap-2 min-w-0"><Icon className={ready ? "h-4 w-4 text-primary shrink-0" : "h-4 w-4 text-muted-foreground shrink-0"} /><div className="min-w-0"><div className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="font-display uppercase truncate">{value}</div></div></div>;
}

