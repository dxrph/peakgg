import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Star, X } from "lucide-react";

type Teammate = { id: string; username: string; avatar_url: string | null };
type Votes = { communication: number; fairplay: number; punctuality: number };

interface Props {
  matchId: string;
  teammates: Teammate[];
  open: boolean;
  onClose: () => void;
}

export default function PostMatchVoteModal({ matchId, teammates, open, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [votes, setVotes] = useState<Votes>({ communication: 4, fairplay: 4, punctuality: 4 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setIdx(0); setVotes({ communication: 4, fairplay: 4, punctuality: 4 }); }
  }, [open]);

  if (!open || teammates.length === 0) return null;
  const current = teammates[idx];
  if (!current) return null;

  const submit = async (skip = false) => {
    if (!skip) {
      setSubmitting(true);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { toast.error("Non sei loggato"); setSubmitting(false); return; }
      const { error } = await supabase.from("reputation_votes").insert({
        voter_id: u.user.id,
        player_id: current.id,
        match_id: matchId,
        communication: votes.communication,
        fairplay: votes.fairplay,
        punctuality: votes.punctuality,
      });
      setSubmitting(false);
      if (error) { toast.error(error.message); return; }
    }
    if (idx + 1 < teammates.length) {
      setIdx(idx + 1);
      setVotes({ communication: 4, fairplay: 4, punctuality: 4 });
    } else {
      toast.success("Grazie per i voti!");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display uppercase">
            <Star className="h-4 w-4 text-primary" /> Vota i compagni · {idx + 1}/{teammates.length}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar><AvatarImage src={current.avatar_url ?? undefined} /><AvatarFallback>{current.username[0]?.toUpperCase()}</AvatarFallback></Avatar>
            <div>
              <p className="font-display text-lg">{current.username}</p>
              <p className="text-xs text-muted-foreground">Com'è andata con questo player?</p>
            </div>
          </div>
          {(["communication","fairplay","punctuality"] as const).map(k => (
            <div key={k}>
              <div className="flex justify-between mb-2">
                <span className="text-sm capitalize">{k === "fairplay" ? "Fair Play" : k === "communication" ? "Comunicazione" : "Puntualità"}</span>
                <span className="font-mono text-primary">{votes[k]}/5</span>
              </div>
              <Slider min={1} max={5} step={1} value={[votes[k]]} onValueChange={(v) => setVotes({ ...votes, [k]: v[0] })} />
            </div>
          ))}
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="ghost" onClick={() => submit(true)}><X className="h-4 w-4 mr-1" /> Salta</Button>
          <Button onClick={() => submit(false)} disabled={submitting}>
            {idx + 1 === teammates.length ? "Invia e chiudi" : "Avanti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}