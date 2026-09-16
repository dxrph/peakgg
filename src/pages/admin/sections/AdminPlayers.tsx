import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { adjustElo, banProfile, formatRelative, logAdminAction, unbanProfile, warnProfile } from "@/lib/admin";
import { AlertTriangle, Ban, Coins, MessageSquare, Search, Shield, ShieldCheck, TrendingUp, Flag } from "lucide-react";

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  ban_expires_at: string | null;
  warn_count: number;
  reputation_score: number;
  fast_track: boolean;
  fast_track_wins: number;
  ip_address: string | null;
  peak_coins: number;
  created_at: string;
};

type PlayerStat = { game: string; elo: number; matches_played: number; wins: number; losses: number };

type AutoFlag = {
  type: "high_winrate" | "duplicate_ip" | "ticket_spam" | "low_reputation";
  label: string;
  detail: string;
};

const GAMES = ["valorant", "cs2", "r6s"];

export default function AdminPlayers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "banned" | "flagged" | "fast_track">("all");
  const [list, setList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);

  async function load() {
    setLoading(true);
    let q = supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,email,is_banned,ban_reason,ban_expires_at,warn_count,reputation_score,fast_track,fast_track_wins,ip_address,peak_coins,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (search.trim()) {
      const s = search.trim().replace(/[%,]/g, "");
      q = q.or(`username.ilike.%${s}%,display_name.ilike.%${s}%,email.ilike.%${s}%,id.eq.${isUUID(s) ? s : "00000000-0000-0000-0000-000000000000"}`);
    }
    if (filter === "banned") q = q.eq("is_banned", true);
    if (filter === "fast_track") q = q.eq("fast_track", true);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    let rows = (data ?? []) as Profile[];
    if (filter === "flagged") rows = rows.filter((p) => p.warn_count > 0 || Number(p.reputation_score) < 3);
    setList(rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Player Management</h1>
        <p className="text-muted-foreground">Cerca, modera, modifica ELO e contatta i giocatori.</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Cerca per username, display name, email o ID utente..."
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="banned">Bannati</SelectItem>
              <SelectItem value="flagged">Con richiami / rep bassa</SelectItem>
              <SelectItem value="fast_track">Fast Track</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={load}>Cerca</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Risultati ({list.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Caricamento…</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground">Nessun giocatore trovato.</p>
          ) : (
            <div className="divide-y divide-border">
              {list.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="w-full flex items-center gap-4 py-3 text-left hover:bg-muted/40 px-2 rounded transition"
                >
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {p.avatar_url && <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{p.display_name || p.username}</span>
                      <span className="text-xs text-muted-foreground truncate">@{p.username}</span>
                      {p.is_banned && <Badge variant="destructive">BAN</Badge>}
                      {p.warn_count > 0 && <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">⚠ {p.warn_count}</Badge>}
                      {p.fast_track && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Fast Track</Badge>}
                      {Number(p.reputation_score) < 3 && <Badge variant="outline" className="border-red-500/50 text-red-500">Rep {Number(p.reputation_score).toFixed(1)}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{p.email ?? "—"} · iscritto {formatRelative(p.created_at)}</div>
                  </div>
                  <Coins className="h-3 w-3 text-yellow-500" />
                  <span className="text-sm tabular-nums">{p.peak_coins}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <PlayerDetailDialog
          player={selected}
          onClose={() => setSelected(null)}
          onChanged={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}

function isUUID(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function PlayerDetailDialog({ player, onClose, onChanged }: { player: Profile; onClose: () => void; onChanged: () => void }) {
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [flags, setFlags] = useState<AutoFlag[]>([]);
  const [reports, setReports] = useState<Array<{ id: string; reason: string; flag_type: string | null; auto_flagged: boolean; created_at: string; resolved: boolean }>>([]);
  const [busy, setBusy] = useState(false);

  // Warn / Ban state
  const [warnReason, setWarnReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState<string>("7");

  // ELO
  const [eloGame, setEloGame] = useState("valorant");
  const [eloDelta, setEloDelta] = useState("0");
  const [eloReason, setEloReason] = useState("Aggiustamento manuale admin");

  // DM
  const [dm, setDm] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: ps }, { data: rep }, { data: tickets }, { data: votes }, { data: dupIPs }] = await Promise.all([
        supabase.from("player_stats").select("game,elo,matches_played,wins,losses").eq("user_id", player.id),
        supabase.from("player_reports").select("id,reason,flag_type,auto_flagged,created_at,resolved").eq("player_id", player.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("tickets").select("id,created_at").eq("reporter_id", player.id).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from("reputation_votes").select("communication,fairplay,punctuality").eq("player_id", player.id),
        player.ip_address ? supabase.from("profiles").select("id,username").eq("ip_address", player.ip_address).neq("id", player.id) : Promise.resolve({ data: [] as Array<{ id: string; username: string }> }),
      ]);
      setStats((ps ?? []) as PlayerStat[]);
      setReports((rep ?? []) as typeof reports);

      // Compute auto-flags
      const af: AutoFlag[] = [];
      const totalMatches = (ps ?? []).reduce((a, s) => a + (s.matches_played ?? 0), 0);
      const totalWins = (ps ?? []).reduce((a, s) => a + (s.wins ?? 0), 0);
      const wr = totalMatches > 0 ? totalWins / totalMatches : 0;
      if (totalMatches >= 10 && wr >= 0.9) af.push({ type: "high_winrate", label: "Winrate ≥90%", detail: `${(wr * 100).toFixed(0)}% su ${totalMatches} match` });
      if ((dupIPs?.length ?? 0) > 0) af.push({ type: "duplicate_ip", label: "IP duplicato", detail: `${dupIPs!.length} altri account dallo stesso IP` });
      if ((tickets?.length ?? 0) >= 3) af.push({ type: "ticket_spam", label: "Ticket spam", detail: `${tickets!.length} ticket aperti negli ultimi 7gg` });
      if (Number(player.reputation_score) < 3 && (votes?.length ?? 0) >= 5) af.push({ type: "low_reputation", label: "Reputazione bassa", detail: `${Number(player.reputation_score).toFixed(2)}/5 su ${votes!.length} voti` });
      setFlags(af);
    })();
  }, [player.id, player.ip_address, player.reputation_score]);

  async function handleWarn() {
    if (!warnReason.trim()) return toast.error("Inserisci una motivazione");
    setBusy(true);
    const r = await warnProfile({ userId: player.id, reason: warnReason.trim() });
    if (r.error) { toast.error(r.error); setBusy(false); return; }
    await logAdminAction({ action: "warn_player", targetType: "profile", targetId: player.id, details: { reason: warnReason, newWarnCount: r.newWarnCount, autoBanned: r.autoBanned } });
    toast.success(r.autoBanned ? "Richiamo + auto-ban 7gg" : `Richiamo dato (${r.newWarnCount}/3)`);
    setBusy(false); onChanged();
  }

  async function handleBan() {
    if (!banReason.trim()) return toast.error("Inserisci una motivazione");
    setBusy(true);
    const days = banDays === "permanent" ? null : Number(banDays);
    const r = await banProfile({ userId: player.id, reason: banReason.trim(), durationDays: days });
    if (r.error) { toast.error(r.error.message); setBusy(false); return; }
    await logAdminAction({ action: "ban_player", targetType: "profile", targetId: player.id, details: { reason: banReason, durationDays: days } });
    await supabase.from("notifications").insert({ user_id: player.id, title: "Account sospeso", message: banReason });
    toast.success("Player bannato");
    setBusy(false); onChanged();
  }

  async function handleUnban() {
    setBusy(true);
    const r = await unbanProfile(player.id);
    if (r.error) { toast.error(r.error.message); setBusy(false); return; }
    await logAdminAction({ action: "unban_player", targetType: "profile", targetId: player.id });
    toast.success("Ban rimosso");
    setBusy(false); onChanged();
  }

  async function handleEloAdjust() {
    const delta = Number(eloDelta);
    if (!Number.isFinite(delta) || delta === 0) return toast.error("Delta ELO non valido");
    setBusy(true);
    const r = await adjustElo({ userId: player.id, game: eloGame, delta, reason: eloReason });
    if (r.error) { toast.error(r.error); setBusy(false); return; }
    await logAdminAction({ action: "elo_adjust", targetType: "player_stats", targetId: player.id, details: { game: eloGame, delta, before: r.eloBefore, after: r.eloAfter, reason: eloReason } });
    toast.success(`ELO ${eloGame}: ${r.eloBefore} → ${r.eloAfter}`);
    setBusy(false); onChanged();
  }

  async function handleSendDM() {
    if (!dm.trim()) return toast.error("Messaggio vuoto");
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBusy(false); return; }
    const { error } = await supabase.from("messages").insert({ sender_id: auth.user.id, receiver_id: player.id, body: dm.trim() });
    if (error) { toast.error(error.message); setBusy(false); return; }
    await supabase.from("notifications").insert({ user_id: player.id, title: "Messaggio dallo staff", message: dm.trim().slice(0, 140) });
    await logAdminAction({ action: "private_message_send", targetType: "profile", targetId: player.id, details: { length: dm.length } });
    toast.success("Messaggio inviato");
    setDm("");
    setBusy(false);
  }

  async function recordAutoFlag(f: AutoFlag) {
    const { error } = await supabase.from("player_reports").insert({
      player_id: player.id,
      reason: f.detail,
      flag_type: f.type,
      auto_flagged: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Flag registrato");
    const { data: rep } = await supabase.from("player_reports").select("id,reason,flag_type,auto_flagged,created_at,resolved").eq("player_id", player.id).order("created_at", { ascending: false }).limit(50);
    setReports((rep ?? []) as typeof reports);
  }

  async function resolveReport(id: string) {
    const { error } = await supabase.from("player_reports").update({ resolved: true }).eq("id", id);
    if (error) return toast.error(error.message);
    setReports((rs) => rs.map((r) => r.id === id ? { ...r, resolved: true } : r));
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
              {player.avatar_url && <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <div>{player.display_name || player.username}</div>
              <div className="text-xs font-normal text-muted-foreground">@{player.username} · {player.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Auto flags banner */}
        {flags.length > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Indicatori auto-flag</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {flags.map((f) => (
                <div key={f.type} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <Badge variant="outline" className="border-yellow-500/60 text-yellow-500 mr-2">{f.label}</Badge>
                    <span className="text-muted-foreground">{f.detail}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => recordAutoFlag(f)}><Flag className="h-3 w-3 mr-1" /> Registra</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="moderation">Modera</TabsTrigger>
            <TabsTrigger value="elo">ELO</TabsTrigger>
            <TabsTrigger value="dm">DM</TabsTrigger>
            <TabsTrigger value="reports">Report ({reports.filter(r => !r.resolved).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Reputazione" value={`${Number(player.reputation_score).toFixed(2)}/5`} />
              <Stat label="Richiami" value={`${player.warn_count}/3`} />
              <Stat label="Peak Coins" value={String(player.peak_coins)} />
              <Stat label="Iscritto" value={formatRelative(player.created_at)} />
              <Stat label="Status" value={player.is_banned ? "BANNATO" : "Attivo"} />
              <Stat label="Fast Track" value={player.fast_track ? `Sì (${player.fast_track_wins}W)` : "No"} />
              <Stat label="IP" value={player.ip_address ?? "—"} />
              <Stat label="Ban scade" value={player.ban_expires_at ? new Date(player.ban_expires_at).toLocaleString() : "—"} />
            </div>
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-semibold">Stats per gioco</h4>
              {stats.length === 0 ? <p className="text-xs text-muted-foreground">Nessuna statistica.</p> : (
                <div className="space-y-1">
                  {stats.map((s) => (
                    <div key={s.game} className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2">
                      <span className="uppercase font-semibold">{s.game}</span>
                      <span className="text-muted-foreground">ELO {s.elo} · {s.matches_played}M · {s.wins}W/{s.losses}L</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Richiamo (warn)</Label>
              <Textarea value={warnReason} onChange={(e) => setWarnReason(e.target.value)} placeholder="Motivazione del richiamo (visibile al player)" maxLength={500} />
              <Button disabled={busy} onClick={handleWarn} variant="outline">Dai richiamo ({player.warn_count}/3)</Button>
            </div>

            {player.is_banned ? (
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500" /> Account bannato</Label>
                <p className="text-xs text-muted-foreground">Motivo: {player.ban_reason ?? "—"}</p>
                <Button disabled={busy} onClick={handleUnban}>Rimuovi ban</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Ban className="h-4 w-4 text-red-500" /> Ban</Label>
                <Textarea value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Motivo del ban" maxLength={500} />
                <div className="flex gap-2">
                  <Select value={banDays} onValueChange={setBanDays}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 giorno</SelectItem>
                      <SelectItem value="3">3 giorni</SelectItem>
                      <SelectItem value="7">7 giorni</SelectItem>
                      <SelectItem value="30">30 giorni</SelectItem>
                      <SelectItem value="permanent">Permanente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button disabled={busy} onClick={handleBan} variant="destructive">Banna</Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="elo" className="space-y-3 pt-4">
            <Label className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Aggiusta ELO</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Select value={eloGame} onValueChange={setEloGame}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GAMES.map((g) => <SelectItem key={g} value={g}>{g.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" value={eloDelta} onChange={(e) => setEloDelta(e.target.value)} placeholder="Delta (+/-)" />
              <Input value={eloReason} onChange={(e) => setEloReason(e.target.value)} placeholder="Motivo" maxLength={200} />
            </div>
            <Button disabled={busy} onClick={handleEloAdjust}>Applica modifica ELO</Button>
            <p className="text-xs text-muted-foreground">Ogni modifica viene tracciata in elo_history e admin_logs.</p>
          </TabsContent>

          <TabsContent value="dm" className="space-y-3 pt-4">
            <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Messaggio diretto dallo staff</Label>
            <Textarea value={dm} onChange={(e) => setDm(e.target.value)} placeholder="Scrivi un messaggio al player..." maxLength={1000} rows={5} />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{dm.length}/1000</span>
              <Button disabled={busy} onClick={handleSendDM}>Invia DM</Button>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-2 pt-4">
            {reports.length === 0 ? <p className="text-sm text-muted-foreground">Nessun report.</p> : reports.map((r) => (
              <div key={r.id} className={`text-sm border border-border rounded p-3 ${r.resolved ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.auto_flagged && <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">AUTO</Badge>}
                    {r.flag_type && <Badge variant="outline">{r.flag_type}</Badge>}
                    <span className="text-xs text-muted-foreground">{formatRelative(r.created_at)}</span>
                  </div>
                  {!r.resolved && <Button size="sm" variant="outline" onClick={() => resolveReport(r.id)}>Risolvi</Button>}
                </div>
                <p className="mt-1">{r.reason}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Chiudi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold truncate flex items-center gap-1"><Shield className="h-3 w-3 opacity-0" />{value}</div>
    </div>
  );
}
