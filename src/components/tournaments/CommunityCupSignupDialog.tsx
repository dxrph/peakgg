import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { DISCORD_INVITE } from "@/lib/links";

const schema = z.object({
  team_name: z.string().trim().min(2).max(60),
  team_tag: z.string().trim().max(8).optional().or(z.literal("")),
  team_logo_url: z.string().trim().url().max(500).optional().or(z.literal("")),
  community_name: z.string().trim().min(2).max(80),
  community_discord_url: z.string().trim().max(300).optional().or(z.literal("")),
  country_language: z.string().trim().min(2).max(80),
  average_rank: z.string().trim().max(40).optional().or(z.literal("")),
  captain_name: z.string().trim().min(2).max(80),
  captain_discord: z.string().trim().min(2).max(80),
  captain_email: z.string().trim().email().max(255),
  captain_riot_id: z.string().trim().min(3).max(60),
  player_1_riot_id: z.string().trim().min(3).max(60),
  player_2_riot_id: z.string().trim().min(3).max(60),
  player_3_riot_id: z.string().trim().min(3).max(60),
  player_4_riot_id: z.string().trim().min(3).max(60),
  player_5_riot_id: z.string().trim().min(3).max(60),
  substitute_1_riot_id: z.string().trim().max(60).optional().or(z.literal("")),
  substitute_2_riot_id: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tournamentId: string;
  onSuccess?: () => void;
}

export default function CommunityCupSignupDialog({ open, onOpenChange, tournamentId, onSuccess }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    captain_email: user?.email ?? "",
  });
  const [agreements, setAgreements] = useState({ a: false, b: false, c: false, d: false });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const allAgreed = agreements.a && agreements.b && agreements.c && agreements.d;

  const submit = async () => {
    if (!user) {
      toast.error("Please sign in to register your team");
      return;
    }
    if (!allAgreed) {
      toast.error("Please confirm all agreements");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fill all required fields");
      return;
    }
    setBusy(true);
    const payload = {
      tournament_id: tournamentId,
      captain_user_id: user.id,
      ...parsed.data,
      team_tag: parsed.data.team_tag || null,
      team_logo_url: parsed.data.team_logo_url || null,
      community_discord_url: parsed.data.community_discord_url || null,
      average_rank: parsed.data.average_rank || null,
      substitute_1_riot_id: parsed.data.substitute_1_riot_id || null,
      substitute_2_riot_id: parsed.data.substitute_2_riot_id || null,
      notes: parsed.data.notes || null,
      status: "pending",
      agreement_available: agreements.a,
      agreement_discord: agreements.b,
      agreement_rules: agreements.c,
      agreement_forfeit: agreements.d,
    };
    const { error } = await supabase.from("tournament_team_signups" as never).insert(payload as never);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    onSuccess?.();
  };

  const close = () => {
    if (busy) return;
    onOpenChange(false);
    setTimeout(() => setDone(false), 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? close() : onOpenChange(o))}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">Registration submitted</DialogTitle>
              <DialogDescription>
                Your team has been registered for PeakGG Community Cup #1. Our staff will review your registration and contact the captain if needed.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="font-display text-base mb-1">Next step: join the PeakGG Discord</p>
              <p className="text-muted-foreground">Communications, check-in and bracket announcements happen on Discord.</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={close}>Close</Button>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                <Button variant="neon">Join PeakGG Discord</Button>
              </a>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Register Your Team</DialogTitle>
              <DialogDescription>PeakGG Community Cup #1 — VALORANT 5v5, EU, Free Entry</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <Section title="Team">
                <Field label="Team name *"><Input value={form.team_name ?? ""} onChange={set("team_name")} maxLength={60} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Team tag"><Input value={form.team_tag ?? ""} onChange={set("team_tag")} maxLength={8} placeholder="PEAK" /></Field>
                  <Field label="Team logo URL"><Input value={form.team_logo_url ?? ""} onChange={set("team_logo_url")} maxLength={500} /></Field>
                </div>
                <Field label="Community / server name *"><Input value={form.community_name ?? ""} onChange={set("community_name")} maxLength={80} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Community Discord invite"><Input value={form.community_discord_url ?? ""} onChange={set("community_discord_url")} maxLength={300} placeholder="discord.gg/..." /></Field>
                  <Field label="Country / language *"><Input value={form.country_language ?? ""} onChange={set("country_language")} maxLength={80} placeholder="France · French/English" /></Field>
                </div>
                <Field label="Average rank (optional)"><Input value={form.average_rank ?? ""} onChange={set("average_rank")} maxLength={40} placeholder="Gold · Platinum" /></Field>
              </Section>

              <Section title="Captain">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Captain name *"><Input value={form.captain_name ?? ""} onChange={set("captain_name")} maxLength={80} /></Field>
                  <Field label="Captain Discord *"><Input value={form.captain_discord ?? ""} onChange={set("captain_discord")} maxLength={80} placeholder="username" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Captain email *"><Input type="email" value={form.captain_email ?? ""} onChange={set("captain_email")} maxLength={255} /></Field>
                  <Field label="Captain Riot ID *"><Input value={form.captain_riot_id ?? ""} onChange={set("captain_riot_id")} maxLength={60} placeholder="Name#TAG" /></Field>
                </div>
              </Section>

              <Section title="Players (5)">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Field key={i} label={`Player ${i} Riot ID *`}>
                    <Input value={form[`player_${i}_riot_id`] ?? ""} onChange={set(`player_${i}_riot_id`)} maxLength={60} placeholder="Name#TAG" />
                  </Field>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Substitute 1 Riot ID"><Input value={form.substitute_1_riot_id ?? ""} onChange={set("substitute_1_riot_id")} maxLength={60} /></Field>
                  <Field label="Substitute 2 Riot ID"><Input value={form.substitute_2_riot_id ?? ""} onChange={set("substitute_2_riot_id")} maxLength={60} /></Field>
                </div>
              </Section>

              <Section title="Notes (optional)">
                <Textarea value={form.notes ?? ""} onChange={set("notes") as never} maxLength={1000} placeholder="Anything our staff should know" />
              </Section>

              <Section title="Confirmations">
                <Agree checked={agreements.a} onChange={(v) => setAgreements((p) => ({ ...p, a: v }))}>
                  I confirm all players are available during the tournament schedule.
                </Agree>
                <Agree checked={agreements.b} onChange={(v) => setAgreements((p) => ({ ...p, b: v }))}>
                  I confirm all players will join the PeakGG Discord for communication and check-in.
                </Agree>
                <Agree checked={agreements.c} onChange={(v) => setAgreements((p) => ({ ...p, c: v }))}>
                  I confirm the team accepts the tournament rules.
                </Agree>
                <Agree checked={agreements.d} onChange={(v) => setAgreements((p) => ({ ...p, d: v }))}>
                  I understand that no-show may result in forfeit.
                </Agree>
              </Section>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={close} disabled={busy}>Cancel</Button>
              <Button variant="neon" onClick={submit} disabled={busy || !allAgreed} className="uppercase tracking-wider">
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Registration
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-display uppercase text-xs tracking-widest text-muted-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function Agree({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <span>{children}</span>
    </label>
  );
}