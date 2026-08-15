import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Gamepad2, Loader2, MessageCircle, Radio, Send, ShieldCheck, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Listing = {
  id: string;
  user_id: string;
  game: string;
  type: string;
  rank: string | null;
  message: string | null;
  created_at: string;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    role: string | null;
    region: string | null;
    account_verified: boolean;
  };
};

const GAME_OPTIONS = [
  { value: "valorant", label: "VALORANT" },
  { value: "cs2", label: "Counter-Strike 2" },
  { value: "r6s", label: "Rainbow Six Siege" },
];

function timeAgo(value: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m fa`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h fa` : `${Math.round(hours / 24)}g fa`;
}

export default function PartyFinderBoard() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [game, setGame] = useState(profile?.preferred_game ?? "valorant");
  const [type, setType] = useState("party");
  const [rank, setRank] = useState(profile?.rank ?? "");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("lfp_board")
      .select("id, user_id, game, type, rank, message, created_at, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(24);
    if (error) {
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Listing[];
    const ids = [...new Set(rows.map((row) => row.user_id))];
    if (ids.length) {
      const { data: people } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, role, region, account_verified")
        .in("id", ids);
      const byId = new Map((people ?? []).map((person) => [person.id, person]));
      rows.forEach((row) => { row.profile = byId.get(row.user_id); });
    }
    setListings(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("party-finder-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "lfp_board" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const ownListing = useMemo(() => listings.find((listing) => listing.user_id === user?.id), [listings, user?.id]);

  const publish = async () => {
    if (!user) return;
    setSubmitting(true);
    await supabase.from("lfp_board").update({ is_active: false }).eq("user_id", user.id).eq("is_active", true);
    const { error } = await supabase.from("lfp_board").insert({
      user_id: user.id,
      game,
      type,
      rank: rank.trim() || null,
      message: message.trim() || null,
      is_active: true,
    });
    setSubmitting(false);
    if (error) return toast.error("Non è stato possibile pubblicare il party.");
    toast.success("Party pubblicato nella live board.");
    setOpen(false);
    setMessage("");
    load();
  };

  const closeOwnListing = async () => {
    if (!user || !ownListing) return;
    const { error } = await supabase.from("lfp_board").update({ is_active: false }).eq("id", ownListing.id);
    if (error) return toast.error("Non è stato possibile chiudere il party.");
    toast.success("Party chiuso.");
    load();
  };

  return (
    <section className="container max-w-6xl py-10">
      <div className="party-board tactical-panel overflow-hidden">
        <div className="p-5 md:p-7 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.24em] text-primary font-display font-bold">
              <Radio className="h-3.5 w-3.5 animate-pulse" /> Live Party Finder
            </div>
            <h2 className="font-display uppercase font-bold text-2xl md:text-3xl mt-2">Trova il tuo stack, adesso.</h2>
            <p className="text-sm text-muted-foreground mt-1">Annunci live per completare un party o trovare una squadra competitiva.</p>
          </div>
          {ownListing ? (
            <Button variant="outline" onClick={closeOwnListing}><X className="h-4 w-4 mr-2" />Chiudi il mio party</Button>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="signal-button"><Radio className="h-4 w-4 mr-2" />Apri un party</Button></DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle className="font-display uppercase text-2xl">Trasmetti la tua ricerca</DialogTitle></DialogHeader>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Gioco</Label><Select value={game} onValueChange={setGame}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GAME_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Obiettivo</Label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="party">Completa party</SelectItem><SelectItem value="team">Cerco squadra</SelectItem><SelectItem value="scrim">Cerco scrim</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>Rank indicativo</Label><Input value={rank} onChange={(event) => setRank(event.target.value)} placeholder="Es. Ascendant 2" maxLength={40} /></div>
                <div className="space-y-2"><Label>Messaggio</Label><Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ruolo cercato, orari, lingua e obiettivo…" maxLength={240} rows={4} /></div>
                <Button onClick={publish} disabled={submitting} className="w-full signal-button">{submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Pubblica live</Button>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-px bg-border/70">
          {loading ? (
            <div className="col-span-full bg-card/90 p-8 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Aggiornamento live board…</div>
          ) : listings.length === 0 ? (
            <div className="col-span-full bg-card/90 p-8 text-center text-muted-foreground">Nessun party attivo. Apri tu la prima ricerca.</div>
          ) : listings.slice(0, 6).map((listing) => {
            const person = listing.profile;
            return (
              <article key={listing.id} className="bg-card/95 p-5 hover:bg-secondary/50 transition-colors group">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 border border-primary/30"><AvatarImage src={person?.avatar_url ?? undefined} /><AvatarFallback>{(person?.username ?? "P").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5"><span className="font-display uppercase font-bold truncate">{person?.display_name ?? person?.username ?? "Player"}</span>{person?.account_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{person?.role ?? "Flex"} · {person?.region ?? "EU"}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />LIVE</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4"><Badge variant="secondary"><Gamepad2 className="h-3 w-3 mr-1" />{listing.game.toUpperCase()}</Badge><Badge variant="outline">{listing.type === "party" ? "Completa party" : listing.type === "scrim" ? "Scrim" : "Cerca team"}</Badge>{listing.rank && <Badge variant="outline">{listing.rank}</Badge>}</div>
                <p className="text-sm text-muted-foreground mt-3 min-h-10 line-clamp-2">{listing.message || "Disponibile per giocare e conoscere nuovi teammate."}</p>
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between"><span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{timeAgo(listing.created_at)}</span>{person?.username && <Button asChild variant="ghost" size="sm" className="h-8 group-hover:text-primary"><Link to={`/profile/${person.username}`}><MessageCircle className="h-3.5 w-3.5 mr-1.5" />Contatta</Link></Button>}</div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

