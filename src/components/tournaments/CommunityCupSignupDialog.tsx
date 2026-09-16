import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert, Users, User, Trophy, Info } from "lucide-react";
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
  permanent_team_request_note: z.string().trim().max(500).optional().or(z.literal("")),
});

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tournamentId: string;
  onSuccess?: () => void;
}

const STEPS = [
  { key: "team", label: "Team", icon: Users },
  { key: "captain", label: "Captain", icon: User },
  { key: "players", label: "Players", icon: Trophy },
  { key: "rules", label: "Rules", icon: CheckCircle2 },
] as const;

export default function CommunityCupSignupDialog({ open, onOpenChange, tournamentId, onSuccess }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({ captain_email: user?.email ?? "" });
  const [agreements, setAgreements] = useState({ a: false, b: false, c: false, d: false, e: false });
  const [wantsPermanent, setWantsPermanent] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const allAgreed = agreements.a && agreements.b && agreements.c && agreements.d && agreements.e;

  const stepValid = useMemo(() => {
    if (step === 0) return (form.team_name?.trim().length ?? 0) >= 2 && (form.community_name?.trim().length ?? 0) >= 2 && (form.country_language?.trim().length ?? 0) >= 2;
    if (step === 1) return ["captain_name","captain_discord","captain_email","captain_riot_id"].every((k) => (form[k]?.trim().length ?? 0) >= 2);
    if (step === 2) return [1,2,3,4,5].every((i) => (form[`player_${i}_riot_id`]?.trim().length ?? 0) >= 3);
    if (step === 3) return allAgreed;
    return true;
  }, [step, form, allAgreed]);

  const next = () => {
    if (!stepValid) { toast.error("Please complete the required fields"); return; }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (!allAgreed) { toast.error("Please confirm all required agreements"); return; }
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Please fill all required fields"); return; }
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
      permanent_team_request_note: parsed.data.permanent_team_request_note || null,
      wants_permanent_team: wantsPermanent,
      status: "pending",
      agreement_available: agreements.a,
      agreement_discord: agreements.b,
      agreement_rules: agreements.c,
      agreement_forfeit: agreements.d,
    };
    const { error } = await supabase.from("tournament_team_signups" as never).insert(payload as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    onSuccess?.();
  };

  const close = () => {
    if (busy) return;
    onOpenChange(false);
    setTimeout(() => {
      setDone(false);
      setStep(0);
      setForm({ captain_email: user?.email ?? "" });
      setAgreements({ a: false, b: false, c: false, d: false, e: false });
      setWantsPermanent(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? close() : onOpenChange(o))}>
      <DialogContent className="max-w-2xl max-h-[92vh] p-0 flex flex-col gap-0 overflow-hidden">
        {done ? (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Registration submitted</DialogTitle>
              <DialogDescription>
                Your team is registered for PeakGG Community Cup #1. Staff will review your registration and contact the captain on Discord if needed.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm mt-4">
              <p className="font-display text-base mb-1">Next step: join the PeakGG Discord</p>
              <p className="text-muted-foreground">All check-in, communication and bracket announcements happen on Discord.</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm mt-3">
              <p className="font-display text-base mb-1">Want to keep this team after the tournament?</p>
              <p className="text-muted-foreground">Contact PeakGG staff and request to convert your roster into a permanent PeakGG team.</p>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" onClick={close}>Close</Button>
              <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                <Button variant="neon">Join PeakGG Discord</Button>
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Register Your Team</DialogTitle>
                <DialogDescription>PeakGG Community Cup #1 — VALORANT 5v5 · EU · Free Entry</DialogDescription>
              </DialogHeader>

              {/* Stepper */}
              <div className="flex items-center gap-2 mt-5">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const active = i === step;
                  const done = i < step;
                  return (
                    <div key={s.key} className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center border text-xs font-display shrink-0 ${
                          active ? "border-primary text-primary bg-primary/10" :
                          done ? "border-primary/40 text-primary bg-primary/5" :
                          "border-border text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className={`text-xs font-display uppercase tracking-wider truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>
                        {s.label}
                      </span>
                      {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-primary/40" : "bg-border"}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
              {/* Persistent banner */}
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex gap-3">
                <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div className="text-xs font-body text-foreground/85 leading-relaxed">
                  <span className="font-display text-accent uppercase tracking-wider">Important — Temporary Roster</span>
                  <p className="mt-1">
                    Registering for the PeakGG Community Cup creates a <strong>temporary tournament roster only</strong>. It does not create a permanent PeakGG team profile. If you want to keep this team on PeakGG after the tournament, you can contact staff to request conversion into a permanent team.
                  </p>
                </div>
              </div>

              {step === 0 && (
                <Card title="Team Identity" subtitle="Who you represent in this tournament">
                  <Field label="Team name *" hint="Public name shown in the bracket">
                    <Input value={form.team_name ?? ""} onChange={set("team_name")} maxLength={60} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Team tag" hint="Up to 8 characters">
                      <Input value={form.team_tag ?? ""} onChange={set("team_tag")} maxLength={8} placeholder="PEAK" />
                    </Field>
                    <Field label="Team logo URL" hint="Optional, public link">
                      <Input value={form.team_logo_url ?? ""} onChange={set("team_logo_url")} maxLength={500} />
                    </Field>
                  </div>
                  <Field label="Community / server name *" hint="The server, community or group your team represents">
                    <Input value={form.community_name ?? ""} onChange={set("community_name")} maxLength={80} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Community Discord invite" hint="Optional">
                      <Input value={form.community_discord_url ?? ""} onChange={set("community_discord_url")} maxLength={300} placeholder="discord.gg/..." />
                    </Field>
                    <Field label="Country / language *" hint="e.g. France · French/English">
                      <Input value={form.country_language ?? ""} onChange={set("country_language")} maxLength={80} />
                    </Field>
                  </div>
                  <Field label="Average team rank" hint="Optional, helps staff with seeding">
                    <Input value={form.average_rank ?? ""} onChange={set("average_rank")} maxLength={40} placeholder="Gold · Platinum" />
                  </Field>
                </Card>
              )}

              {step === 1 && (
                <Card title="Captain Info" subtitle="The captain is the main contact for staff communications">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Captain name *"><Input value={form.captain_name ?? ""} onChange={set("captain_name")} maxLength={80} /></Field>
                    <Field label="Captain Discord *" hint="Username, not display name"><Input value={form.captain_discord ?? ""} onChange={set("captain_discord")} maxLength={80} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Captain email *"><Input type="email" value={form.captain_email ?? ""} onChange={set("captain_email")} maxLength={255} /></Field>
                    <Field label="Captain Riot ID *" hint="Name#TAG"><Input value={form.captain_riot_id ?? ""} onChange={set("captain_riot_id")} maxLength={60} /></Field>
                  </div>
                </Card>
              )}

              {step === 2 && (
                <Card title="Players" subtitle="5 main players + optional 2 substitutes">
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Field key={i} label={`Player ${i} Riot ID *`}>
                        <Input value={form[`player_${i}_riot_id`] ?? ""} onChange={set(`player_${i}_riot_id`)} maxLength={60} placeholder="Name#TAG" />
                      </Field>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Field label="Substitute 1 Riot ID"><Input value={form.substitute_1_riot_id ?? ""} onChange={set("substitute_1_riot_id")} maxLength={60} /></Field>
                    <Field label="Substitute 2 Riot ID"><Input value={form.substitute_2_riot_id ?? ""} onChange={set("substitute_2_riot_id")} maxLength={60} /></Field>
                  </div>
                  <Field label="Notes for staff (optional)">
                    <Textarea value={form.notes ?? ""} onChange={set("notes") as never} maxLength={1000} placeholder="Anything our staff should know" />
                  </Field>
                </Card>
              )}

              {step === 3 && (
                <>
                  <Card title="Rules & Confirmation" subtitle="Required to complete your registration">
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
                    <Agree checked={agreements.e} onChange={(v) => setAgreements((p) => ({ ...p, e: v }))}>
                      I understand this registration does not create a permanent PeakGG team profile.
                    </Agree>
                  </Card>

                  <Card
                    title="Permanent Team Interest"
                    subtitle="Optional — let staff know if you want to keep this roster after the cup"
                    icon={<ShieldAlert className="h-4 w-4 text-primary" />}
                  >
                    <Agree checked={wantsPermanent} onChange={setWantsPermanent}>
                      I may be interested in keeping this team as a permanent PeakGG team after the tournament.
                    </Agree>
                    {wantsPermanent && (
                      <Field label="Permanent team request note (optional)">
                        <Textarea
                          value={form.permanent_team_request_note ?? ""}
                          onChange={set("permanent_team_request_note") as never}
                          maxLength={500}
                          placeholder="Tell staff anything relevant about your team's plans"
                        />
                      </Field>
                    )}
                  </Card>
                </>
              )}
            </div>

            {/* Sticky footer */}
            <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-2 bg-card/50">
              <Button variant="ghost" onClick={close} disabled={busy}>Cancel</Button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <Button variant="outline" onClick={back} disabled={busy}>
                    <ArrowLeft className="h-4 w-4 mr-1" />Back
                  </Button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button variant="neon" onClick={next} className="uppercase tracking-wider">
                    Next<ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button variant="neon" onClick={submit} disabled={busy || !allAgreed} className="uppercase tracking-wider">
                    {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit Registration
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Card({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 space-y-3">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-display uppercase tracking-wide text-sm">{title}</h3>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground font-body mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground font-body">{hint}</p>}
    </div>
  );
}
function Agree({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer rounded-md border border-border bg-background/40 p-2.5 hover:border-primary/40 transition-colors">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <span className="font-body">{children}</span>
    </label>
  );
}