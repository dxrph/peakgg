import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Save, Send, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sanitizeText } from "@/lib/security";
import { logAdminAction } from "@/lib/admin";
import { WizardShell, Section, Field, Grid2 } from "./WizardShell";
import SummitPassBanner from "@/components/summit-pass/SummitPassBanner";
import { tournamentToSummitPass, type TournamentRow } from "@/components/summit-pass/adapter";
import {
  emptyWizardForm, STEPS, slugify, validateForPublish,
  GAME_MAPS, TIER_LABELS, TOURNAMENT_TYPES, VISIBILITIES, LANGUAGES,
  TEAM_SIZES, FORMATS, BO_OPTIONS, BRACKET_SIZES, REGIONS, PRIZE_CURRENCIES,
  type WizardForm, type Game,
} from "./types";

export default function TournamentWizardDialog({
  open, onOpenChange, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<WizardForm> & { id?: string };
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState<WizardForm>(emptyWizardForm);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setForm({ ...emptyWizardForm, ...(initial ?? {}) } as WizardForm);
    }
  }, [open, initial]);

  const update = (patch: Partial<WizardForm>) => setForm((f) => ({ ...f, ...patch }));

  // Auto-update map pool when game changes
  useEffect(() => {
    setForm((f) => ({ ...f, maps: { ...f.maps, map_pool: GAME_MAPS[f.game] } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.game]);

  const errors = useMemo(() => validateForPublish(form), [form]);

  const save = async (publish: boolean) => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("Tournament name required"); setStep(0); return; }
    if (publish && errors.length) { toast.error(`${errors.length} validation error(s)`); setStep(STEPS.length - 1); return; }

    setSubmitting(true);
    const slug = (form.slug || slugify(form.name)).slice(0, 60);

    const tournamentPayload = {
      name: sanitizeText(form.name).slice(0, 100),
      slug,
      game: form.game,
      tier_label: form.tier_label,
      tournament_type: form.tournament_type,
      visibility: publish ? form.visibility : "draft",
      status: form.status,
      featured: form.featured,
      banner_url: form.banner_url || null,
      logo_url: form.logo_url || null,
      organizer_name: form.organizer_name || null,
      organizer_discord: form.organizer_discord || null,
      short_description: sanitizeText(form.short_description).slice(0, 240) || null,
      description: sanitizeText(form.description).slice(0, 4000) || null,
      rules: sanitizeText(form.rules).slice(0, 4000) || null,
      rules_url: form.rules_url || null,
      language: form.language,
      timezone: form.timezone,
      max_teams: form.max_teams,
      min_teams: form.min_teams,
      team_size: form.team_size,
      prize_pool: form.prize_pool || null,
      prize_currency: form.prize_currency,
      reward_trophies: form.reward_trophies,
      reward_badge: form.reward_badge || null,
      reward_banner: form.reward_banner || null,
      format: form.format_advanced.format,
      bracket_type: form.format_advanced.format,
      bo: form.format_advanced.bo,
      map_mode: form.map_mode,
      map_pool: form.maps.map_pool,
      fixed_map: form.map_mode === "fixed" ? form.fixed_map : null,
      entry_type: form.entry_type,
      entry_cost_coins: form.entry_type === "paid" ? form.entry_cost_coins : 0,
      seeding_enabled: form.seeding_enabled,
      min_elo: form.eligibility.min_peak_elo,
      rank_max: form.eligibility.max_peak_elo,
      registration_open_at: form.registration_open_at || null,
      registration_close_at: form.registration_close_at || null,
      checkin_open_at: form.checkin_open_at || null,
      checkin_close_at: form.checkin_close_at || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      created_by: user.id,
      // Summit Pass overrides
      route_label: form.route_label?.trim() || null,
      permit_number: form.permit_number?.trim() || null,
      serial: form.serial?.trim() || null,
      stamp_line1: form.stamp_line1 ?? null,
      stamp_line2: form.stamp_line2 ?? null,
      show_stamp: form.show_stamp ?? true,
      summit_accent: form.summit_accent?.trim() || null,
    };

    let tournamentId = form.id;
    if (tournamentId) {
      const { error } = await supabase.from("tournaments").update(tournamentPayload).eq("id", tournamentId);
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      await logAdminAction({ action: publish ? "tournament_publish" : "tournament_update", targetType: "tournament", targetId: tournamentId });
    } else {
      const { data, error } = await supabase.from("tournaments").insert(tournamentPayload).select("id").maybeSingle();
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      tournamentId = data?.id;
      await logAdminAction({ action: publish ? "tournament_publish" : "tournament_create", targetType: "tournament", targetId: tournamentId });
    }

    if (tournamentId) {
      const settingsPayload = {
        tournament_id: tournamentId,
        eligibility_settings: form.eligibility as any,
        format_settings: form.format_advanced as any,
        registration_settings: form.registration as any,
        map_settings: form.maps as any,
        schedule_settings: form.schedule as any,
        reward_settings: form.rewards as any,
        visibility_settings: form.visibility_advanced as any,
        moderation_settings: form.moderation as any,
        staff_settings: form.staff as any,
        admin_notes: form.admin_notes || null,
      };
      const { error: sErr } = await supabase
        .from("tournament_settings")
        .upsert(settingsPayload, { onConflict: "tournament_id" });
      if (sErr) console.warn("Settings save failed:", sErr.message);
    }

    toast.success(publish ? "Tournament published" : "Draft saved");
    setSubmitting(false);
    onOpenChange(false);
    onSaved();
  };

  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b border-border bg-card/60 flex-row items-center justify-between space-y-0">
          <DialogTitle className="font-display tracking-wide flex items-center gap-2">
            {form.id ? "Edit Tournament" : "New Tournament"}
            <Badge variant="outline" className="font-display text-[10px] uppercase border-primary/40 text-primary">
              Step {step + 1} / {STEPS.length}
            </Badge>
            <Badge variant="outline" className="font-display text-[10px] uppercase">
              {STEPS[step].label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <WizardShell
          currentStep={step}
          onStepChange={setStep}
          footer={
            <div className="flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => save(false)} disabled={submitting}>
                  <Save className="h-4 w-4 mr-1" /> Save Draft
                </Button>
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={goPrev}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                )}
                {step < STEPS.length - 1 ? (
                  <Button size="sm" onClick={goNext}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => save(true)} disabled={submitting || errors.length > 0}>
                    <Send className="h-4 w-4 mr-1" /> Publish
                  </Button>
                )}
              </div>
            </div>
          }
        >
          {step === 0 && <StepBasic form={form} update={update} />}
          {step === 1 && <StepEligibility form={form} update={update} />}
          {step === 2 && <StepFormat form={form} update={update} />}
          {step === 3 && <StepRegistration form={form} update={update} />}
          {step === 4 && <StepMaps form={form} update={update} />}
          {step === 5 && <StepSchedule form={form} update={update} />}
          {step === 6 && <StepRewards form={form} update={update} />}
          {step === 7 && <StepVisibility form={form} update={update} />}
          {step === 8 && <StepModeration form={form} update={update} />}
          {step === 9 && <StepReview form={form} errors={errors} jumpTo={setStep} />}
        </WizardShell>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── Step 1: Basic Info ─────────── */
function StepBasic({ form, update }: { form: WizardForm; update: (p: Partial<WizardForm>) => void }) {
  return (
    <Section title="Basic Info" hint="Essential identity and presentation of your tournament.">
      <Grid2>
        <Field label="Tournament name *">
          <Input
            value={form.name}
            onChange={(e) => update({ name: e.target.value, slug: form.slug || slugify(e.target.value) })}
            maxLength={100}
            placeholder="PeakGG Open Cup #1"
          />
        </Field>
        <Field label="Slug (URL)" hint="auto-generated from name if empty">
          <Input value={form.slug} onChange={(e) => update({ slug: slugify(e.target.value) })} maxLength={60} placeholder="peakgg-open-cup-1" />
        </Field>
        <Field label="Game *">
          <Select value={form.game} onValueChange={(v) => update({ game: v as Game })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="valorant">Valorant</SelectItem>
              <SelectItem value="cs2">Counter-Strike 2</SelectItem>
              <SelectItem value="r6s">Rainbow Six Siege</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Tier *">
          <Select value={form.tier_label} onValueChange={(v) => update({ tier_label: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TIER_LABELS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Tournament type">
          <Select value={form.tournament_type} onValueChange={(v) => update({ tournament_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TOURNAMENT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Language">
          <Select value={form.language} onValueChange={(v) => update({ language: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l} className="uppercase">{l}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Short description" span={2}>
          <Input value={form.short_description} onChange={(e) => update({ short_description: e.target.value })} maxLength={240} placeholder="One-liner shown in cards" />
        </Field>
        <Field label="Full description *" span={2}>
          <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} maxLength={4000} rows={4} />
        </Field>
        <Field label="Cover banner URL"><Input value={form.banner_url} onChange={(e) => update({ banner_url: e.target.value })} placeholder="https://…" /></Field>
        <Field label="Logo / icon URL"><Input value={form.logo_url} onChange={(e) => update({ logo_url: e.target.value })} placeholder="https://…" /></Field>
        <Field label="Rules summary" span={2}>
          <Textarea value={form.rules} onChange={(e) => update({ rules: e.target.value })} maxLength={4000} rows={3} />
        </Field>
        <Field label="Rules URL"><Input value={form.rules_url} onChange={(e) => update({ rules_url: e.target.value })} placeholder="https://…" /></Field>
        <Field label="Organizer name"><Input value={form.organizer_name} onChange={(e) => update({ organizer_name: e.target.value })} maxLength={80} /></Field>
        <Field label="Organizer Discord"><Input value={form.organizer_discord} onChange={(e) => update({ organizer_discord: e.target.value })} maxLength={80} placeholder="user#0000" /></Field>
      </Grid2>
    </Section>
  );
}

/* ─────────── Step 2: Eligibility ─────────── */
function StepEligibility({ form, update }: { form: WizardForm; update: (p: Partial<WizardForm>) => void }) {
  const e = form.eligibility;
  const setE = (patch: Partial<typeof e>) => update({ eligibility: { ...e, ...patch } });
  return (
    <>
      <Section title="Regions & Ranks">
        <Grid2>
          <Field label="Allowed regions" span={2}>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => {
                const on = e.regions.includes(r);
                return (
                  <button key={r} type="button"
                    onClick={() => setE({ regions: on ? e.regions.filter(x => x !== r) : [...e.regions, r] })}
                    className={`text-xs px-2.5 py-1 rounded border font-display uppercase tracking-wide ${on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>
                    {r}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Allowed countries (comma sep)" span={2}>
            <Input value={e.countries.join(", ")} onChange={(ev) => setE({ countries: ev.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="IT, FR, BE, DE" />
          </Field>
          <Field label="Min PeakGG ELO"><Input type="number" value={e.min_peak_elo} onChange={(ev) => setE({ min_peak_elo: +ev.target.value || 0 })} /></Field>
          <Field label="Max PeakGG ELO"><Input type="number" value={e.max_peak_elo} onChange={(ev) => setE({ max_peak_elo: +ev.target.value || 9999 })} /></Field>
          <Field label="Min in-game rank"><Input value={e.min_game_rank ?? ""} onChange={(ev) => setE({ min_game_rank: ev.target.value })} placeholder="e.g. Silver 1" /></Field>
          <Field label="Max in-game rank"><Input value={e.max_game_rank ?? ""} onChange={(ev) => setE({ max_game_rank: ev.target.value })} placeholder="e.g. Immortal 3" /></Field>
          <Field label="Min account age (days)"><Input type="number" value={e.min_account_age_days} onChange={(ev) => setE({ min_account_age_days: +ev.target.value || 0 })} /></Field>
          <Field label="Min profile completion %"><Input type="number" min={0} max={100} value={e.min_profile_completion} onChange={(ev) => setE({ min_profile_completion: +ev.target.value || 0 })} /></Field>
        </Grid2>
      </Section>

      <Section title="Player Requirements">
        <SwitchRows rows={[
          ["Require Discord linked", e.require_discord, (v) => setE({ require_discord: v })],
          ["Require verified email", e.require_verified_email, (v) => setE({ require_verified_email: v })],
          ["Require team logo", e.require_team_logo, (v) => setE({ require_team_logo: v })],
          ["All players must have PeakGG account", e.require_all_peakgg_account, (v) => setE({ require_all_peakgg_account: v })],
          ["Captain-only registration", e.captain_only_registration, (v) => setE({ captain_only_registration: v })],
          ["Allow substitutes", e.allow_substitutes, (v) => setE({ allow_substitutes: v })],
          ["Allow mixed-country teams", e.allow_mixed_country, (v) => setE({ allow_mixed_country: v })],
          ["Allow free agents to register", e.allow_free_agents, (v) => setE({ allow_free_agents: v })],
          ["Allow solo players (waitlist)", e.allow_solo_waitlist, (v) => setE({ allow_solo_waitlist: v })],
        ]} />
        {e.allow_substitutes && (
          <Field label="Max substitutes per team"><Input type="number" value={e.max_substitutes} onChange={(ev) => setE({ max_substitutes: +ev.target.value || 0 })} /></Field>
        )}
      </Section>

      <Section title="Anti-Smurf & Integrity" hint="Recommended for prize tournaments.">
        <SwitchRows rows={[
          [`Require ${form.game === "valorant" ? "Riot ID" : form.game === "cs2" ? "Steam ID" : "Ubisoft ID"}`, e.require_game_id, (v) => setE({ require_game_id: v })],
          ["Require rank screenshot proof", e.require_rank_screenshot, (v) => setE({ require_rank_screenshot: v })],
          ["Require manual admin approval", e.require_manual_approval, (v) => setE({ require_manual_approval: v })],
          ["Block duplicate linked game accounts", e.block_duplicate_accounts, (v) => setE({ block_duplicate_accounts: v })],
          ["Auto-flag suspicious new accounts", e.flag_suspicious_accounts, (v) => setE({ flag_suspicious_accounts: v })],
        ]} />
      </Section>
    </>
  );
}

/* ─────────── Step 3: Format ─────────── */
function StepFormat({ form, update }: { form: WizardForm; update: (p: Partial<WizardForm>) => void }) {
  const f = form.format_advanced;
  const setF = (patch: Partial<typeof f>) => update({ format_advanced: { ...f, ...patch } });
  return (
    <>
      <Section title="Bracket Format">
        <Grid2>
          <Field label="Format">
            <Select value={f.format} onValueChange={(v) => setF({ format: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FORMATS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Bracket size">
            <Select value={String(f.bracket_size)} onValueChange={(v) => setF({ bracket_size: v === "custom" ? "custom" : (+v as 4 | 8 | 16 | 32 | 64) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BRACKET_SIZES.map((n) => <SelectItem key={n} value={String(n)}>{n} teams</SelectItem>)}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Team size">
            <Select value={f.team_size} onValueChange={(v) => { setF({ team_size: v }); update({ team_size: v }); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TEAM_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Best of (rounds)">
            <Select value={f.bo} onValueChange={(v) => setF({ bo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BO_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Grand final format">
            <Select value={f.grand_final_format} onValueChange={(v) => setF({ grand_final_format: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="same">Same as tournament</SelectItem>
                {BO_OPTIONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Seeding method">
            <Select value={f.seeding_method} onValueChange={(v) => setF({ seeding_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="peak_rank">By PeakGG rank</SelectItem>
                <SelectItem value="peak_points">By Peak Points</SelectItem>
                <SelectItem value="prev_results">Previous tournament results</SelectItem>
                <SelectItem value="approval_order">Admin approval order</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Grid2>
      </Section>

      <Section title="Extra Matches">
        <SwitchRows rows={[
          ["Third place match", f.third_place_match, (v) => setF({ third_place_match: v })],
          ["Lower bracket final", f.lower_bracket_final, (v) => setF({ lower_bracket_final: v })],
          ["Bronze final", f.bronze_final, (v) => setF({ bronze_final: v })],
          ["Group stage enabled", f.group_stage_enabled, (v) => setF({ group_stage_enabled: v })],
        ]} />
        {f.group_stage_enabled && (
          <Grid2>
            <Field label="Number of groups"><Input type="number" value={f.num_groups} onChange={(e) => setF({ num_groups: +e.target.value || 0 })} /></Field>
            <Field label="Teams per group"><Input type="number" value={f.teams_per_group} onChange={(e) => setF({ teams_per_group: +e.target.value || 0 })} /></Field>
            <Field label="Teams advancing per group"><Input type="number" value={f.teams_advancing} onChange={(e) => setF({ teams_advancing: +e.target.value || 0 })} /></Field>
          </Grid2>
        )}
      </Section>

      <Section title="Bracket Controls">
        <SwitchRows rows={[
          ["Allow manual bracket editing", f.allow_manual_bracket_edit, (v) => setF({ allow_manual_bracket_edit: v })],
          ["Lock bracket after publish", f.lock_bracket_after_publish, (v) => setF({ lock_bracket_after_publish: v })],
          ["Auto-generate when registration closes", f.auto_generate_bracket, (v) => setF({ auto_generate_bracket: v })],
          ["Allow late team replacement", f.allow_late_replacement, (v) => setF({ allow_late_replacement: v })],
        ]} />
      </Section>
    </>
  );
}

/* ─────────── Step 4: Registration ─────────── */
function StepRegistration({ form, update }: { form: WizardForm; update: (p: Partial<WizardForm>) => void }) {
  const r = form.registration;
  const setR = (patch: Partial<typeof r>) => update({ registration: { ...r, ...patch } });
  return (
    <>
      <Section title="Registration Mode">
        <Grid2>
          <Field label="Registration status">
            <Select value={r.status} onValueChange={(v) => setR({ status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["closed", "open", "invite_only", "waitlist_only"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Registration mode">
            <Select value={r.registration_mode} onValueChange={(v) => setR({ registration_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="captain_full_team">Captain registers full team</SelectItem>
                <SelectItem value="players_join_team">Players join team first</SelectItem>
                <SelectItem value="solo_queue">Solo queue / free agents</SelectItem>
                <SelectItem value="admin_invite_only">Admin invites only</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Approval">
            <Select value={r.approval} onValueChange={(v) => setR({ approval: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">Automatic</SelectItem>
                <SelectItem value="manual">Manual admin approval</SelectItem>
                <SelectItem value="invite_code">Invite code required</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {r.approval === "invite_code" && (
            <Field label="Invite code"><Input value={r.invite_code ?? ""} onChange={(e) => setR({ invite_code: e.target.value })} maxLength={20} /></Field>
          )}
          <Field label="Max teams"><Input type="number" value={form.max_teams} onChange={(e) => update({ max_teams: +e.target.value || 0 })} /></Field>
          <Field label="Min teams to start"><Input type="number" value={form.min_teams} onChange={(e) => update({ min_teams: +e.target.value || 0 })} /></Field>
        </Grid2>
      </Section>

      <Section title="Registration Questions" hint="Asked to teams during sign-up.">
        <Field label="Questions (one per line)" span={2}>
          <Textarea rows={4} value={r.questions.join("\n")} onChange={(e) => setR({ questions: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} />
        </Field>
      </Section>

      <Section title="Roster & Waitlist" hint="Roster lock prevents teams from changing players after registration closes.">
        <SwitchRows rows={[
          ["Allow waitlist", r.allow_waitlist, (v) => setR({ allow_waitlist: v })],
          ["Allow team edits after registration", r.allow_team_edits, (v) => setR({ allow_team_edits: v })],
          ["Lock roster before tournament", r.lock_roster, (v) => setR({ lock_roster: v })],
          ["Allow roster changes after lock (with admin approval)", r.allow_roster_changes_with_approval, (v) => setR({ allow_roster_changes_with_approval: v })],
          ["Require captain confirmation", r.require_captain_confirmation, (v) => setR({ require_captain_confirmation: v })],
          ["Require all players confirmation", r.require_all_players_confirmation, (v) => setR({ require_all_players_confirmation: v })],
        ]} />
        <Grid2>
          {r.allow_waitlist && (
            <Field label="Max waitlist teams"><Input type="number" value={r.max_waitlist} onChange={(e) => setR({ max_waitlist: +e.target.value || 0 })} /></Field>
          )}
          {r.lock_roster && (
            <Field label="Roster lock date">
              <Input type="datetime-local" value={r.roster_lock_at ?? ""} onChange={(e) => setR({ roster_lock_at: e.target.value })} />
            </Field>
          )}
        </Grid2>
      </Section>
    </>
  );
}

/* ─────────── Step 5: Maps ─────────── */
function StepMaps({ form, update }: { form: WizardForm; update: (p: Partial<WizardForm>) => void }) {
  const m = form.maps;
  const setM = (patch: Partial<typeof m>) => update({ maps: { ...m, ...patch } });
  const allMaps = GAME_MAPS[form.game];
  const togglePool = (map: string) => {
    const has = m.map_pool.includes(map);
    setM({ map_pool: has ? m.map_pool.filter(x => x !== map) : [...m.map_pool, map] });
  };
  return (
    <>
      <Section title="Map Pool" hint={`Map pool changes automatically based on the selected game (${form.game.toUpperCase()}).`}>
        <div className="flex flex-wrap gap-1.5">
          {allMaps.map((mp) => {
            const on = m.map_pool.includes(mp);
            return (
              <button key={mp} type="button" onClick={() => togglePool(mp)}
                className={`text-xs px-2.5 py-1 rounded border font-display uppercase tracking-wide ${on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>
                {mp}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Match Selection">
        <Grid2>
          <Field label="Map selection mode">
            <Select value={m.selection_mode} onValueChange={(v) => setM({ selection_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random from pool</SelectItem>
                <SelectItem value="admin_selected">Admin selected</SelectItem>
                <SelectItem value="team_veto">Team veto</SelectItem>
                <SelectItem value="captain_coinflip">Captain coinflip</SelectItem>
                <SelectItem value="higher_seed">Higher seed chooses</SelectItem>
                <SelectItem value="lower_seed">Lower seed chooses</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Veto format">
            <Select value={m.veto_format} onValueChange={(v) => setM({ veto_format: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ban_ban_pick_pick_decider">Ban / Ban / Pick / Pick / Decider</SelectItem>
                <SelectItem value="ban_ban_ban_ban_random">Ban / Ban / Ban / Ban / Random</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Server selection">
            <Select value={m.server_selection} onValueChange={(v) => setM({ server_selection: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["EU West", "EU Central", "EU East", "Best ping", "Admin selected", "Team agreement"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Side selection">
            <Select value={m.side_selection} onValueChange={(v) => setM({ side_selection: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["random", "higher_seed", "lower_seed", "coinflip"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Overtime rules">
            <Select value={m.overtime_rules} onValueChange={(v) => setM({ overtime_rules: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["enabled", "disabled", "game_default", "custom"].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Reporting mode">
            <Select value={m.reporting_mode} onValueChange={(v) => setM({ reporting_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="captain">Captain reports</SelectItem>
                <SelectItem value="both_confirm">Both teams confirm</SelectItem>
                <SelectItem value="admin_confirms">Admin confirms</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Grid2>
        <SwitchRows rows={[
          ["Map veto enabled", m.veto_enabled, (v) => setM({ veto_enabled: v })],
          ["Tactical pauses allowed", m.tactical_pauses, (v) => setM({ tactical_pauses: v })],
          ["Technical pauses allowed", m.technical_pauses, (v) => setM({ technical_pauses: v })],
          ["Screenshot proof required", m.screenshot_required, (v) => setM({ screenshot_required: v })],
          ["Demo / VOD required", m.demo_required, (v) => setM({ demo_required: v })],
          ["Rematch allowed", m.rematch_allowed, (v) => setM({ rematch_allowed: v })],
          ["Admin can override results", m.admin_can_override, (v) => setM({ admin_can_override: v })],
        ]} />
        <Grid2>
          <Field label="Max pauses per team"><Input type="number" value={m.max_pauses} onChange={(e) => setM({ max_pauses: +e.target.value || 0 })} /></Field>
          <Field label="Pause duration (min)"><Input type="number" value={m.pause_duration_min} onChange={(e) => setM({ pause_duration_min: +e.target.value || 0 })} /></Field>
          <Field label="Dispute window (min)"><Input type="number" value={m.dispute_window_min} onChange={(e) => setM({ dispute_window_min: +e.target.value || 0 })} /></Field>
          <Field label="No-show limit (min)"><Input type="number" value={m.noshow_limit_min} onChange={(e) => setM({ noshow_limit_min: +e.target.value || 0 })} /></Field>
        </Grid2>
      </Section>
    </>
  );
}

/* ─────────── Step 6: Schedule ─────────── */
function StepSchedule({ form, update }: { form: WizardForm; update: (p: Partial<WizardForm>) => void }) {
  const s = form.schedule;
  const setS = (patch: Partial<typeof s>) => update({ schedule: { ...s, ...patch } });
  return (
    <>
      <Section title="Key Dates" hint={`Timezone: ${form.timezone}`}>
        <Grid2>
          <Field label="Registration open"><Input type="datetime-local" value={form.registration_open_at} onChange={(e) => update({ registration_open_at: e.target.value })} /></Field>
          <Field label="Registration close"><Input type="datetime-local" value={form.registration_close_at} onChange={(e) => update({ registration_close_at: e.target.value })} /></Field>
          <Field label="Check-in open"><Input type="datetime-local" value={form.checkin_open_at} onChange={(e) => update({ checkin_open_at: e.target.value })} /></Field>
          <Field label="Check-in close"><Input type="datetime-local" value={form.checkin_close_at} onChange={(e) => update({ checkin_close_at: e.target.value })} /></Field>
          <Field label="Tournament start *"><Input type="datetime-local" value={form.start_date} onChange={(e) => update({ start_date: e.target.value })} /></Field>
          <Field label="Estimated end"><Input type="datetime-local" value={form.end_date} onChange={(e) => update({ end_date: e.target.value })} /></Field>
          <Field label="Timezone"><Input value={form.timezone} onChange={(e) => update({ timezone: e.target.value })} /></Field>
        </Grid2>
      </Section>

      <Section title="Match Scheduling">
        <Grid2>
          <Field label="Scheduling mode">
            <Select value={s.scheduling_mode} onValueChange={(v) => setS({ scheduling_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">All matches start immediately</SelectItem>
                <SelectItem value="fixed_round">Fixed round schedule</SelectItem>
                <SelectItem value="self_schedule">Teams schedule themselves</SelectItem>
                <SelectItem value="admin_manual">Admin manually schedules</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Check-in method">
            <Select value={s.checkin_method} onValueChange={(v) => setS({ checkin_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="captain">Captain only</SelectItem>
                <SelectItem value="full_team">Full team</SelectItem>
                <SelectItem value="discord_reaction">Discord reaction</SelectItem>
                <SelectItem value="admin_manual">Admin manual check-in</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Break between rounds (min)"><Input type="number" value={s.break_between_rounds_min} onChange={(e) => setS({ break_between_rounds_min: +e.target.value || 0 })} /></Field>
          <Field label="Max match duration (min)"><Input type="number" value={s.max_match_duration_min} onChange={(e) => setS({ max_match_duration_min: +e.target.value || 0 })} /></Field>
        </Grid2>
        <SwitchRows rows={[
          ["Auto-advance when score reported", s.auto_advance, (v) => setS({ auto_advance: v })],
          ["Auto-disqualify no-show", s.auto_disqualify_noshow, (v) => setS({ auto_disqualify_noshow: v })],
          ["Check-in required", s.checkin_required, (v) => setS({ checkin_required: v })],
        ]} />
        <Field label="Reminder notifications" hint="Comma-separated. Examples: 24h, 1h, 15min" span={2}>
          <Input value={s.reminders.join(", ")} onChange={(e) => setS({ reminders: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })} />
        </Field>
      </Section>
    </>
  );
}

/* ─────────── Step 7: Rewards ─────────── */
function StepRewards({ form, update }: { form: WizardForm; update: (p: Partial<WizardForm>) => void }) {
  const r = form.rewards;
  const setR = (patch: Partial<typeof r>) => update({ rewards: { ...r, ...patch } });
  return (
    <>
      <Section title="Prize Pool">
        <Grid2>
          <Field label="Prize pool amount"><Input value={form.prize_pool} onChange={(e) => update({ prize_pool: e.target.value })} placeholder="500" /></Field>
          <Field label="Currency">
            <Select value={form.prize_currency} onValueChange={(v) => update({ prize_currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIZE_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Prize distribution">
            <Select value={r.prize_distribution} onValueChange={(v) => setR({ prize_distribution: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="winner_takes_all">Winner takes all</SelectItem>
                <SelectItem value="top_2">Top 2</SelectItem>
                <SelectItem value="top_3">Top 3</SelectItem>
                <SelectItem value="top_4">Top 4</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="1st place reward"><Input value={r.prize_first ?? ""} onChange={(e) => setR({ prize_first: e.target.value })} /></Field>
          <Field label="2nd place reward"><Input value={r.prize_second ?? ""} onChange={(e) => setR({ prize_second: e.target.value })} /></Field>
          <Field label="3rd place reward"><Input value={r.prize_third ?? ""} onChange={(e) => setR({ prize_third: e.target.value })} /></Field>
          <Field label="MVP reward"><Input value={r.prize_mvp ?? ""} onChange={(e) => setR({ prize_mvp: e.target.value })} /></Field>
          <Field label="Clip of tournament reward"><Input value={r.prize_clip ?? ""} onChange={(e) => setR({ prize_clip: e.target.value })} /></Field>
        </Grid2>
      </Section>

      <Section title="Peak Points">
        <Grid2>
          <Field label="Participation"><Input type="number" value={r.pp_participation} onChange={(e) => setR({ pp_participation: +e.target.value || 0 })} /></Field>
          <Field label="Per win"><Input type="number" value={r.pp_win} onChange={(e) => setR({ pp_win: +e.target.value || 0 })} /></Field>
          <Field label="Runner-up"><Input type="number" value={r.pp_runner_up} onChange={(e) => setR({ pp_runner_up: +e.target.value || 0 })} /></Field>
          <Field label="Champion"><Input type="number" value={r.pp_champion} onChange={(e) => setR({ pp_champion: +e.target.value || 0 })} /></Field>
          <Field label="MVP"><Input type="number" value={r.pp_mvp} onChange={(e) => setR({ pp_mvp: +e.target.value || 0 })} /></Field>
        </Grid2>
      </Section>

      <Section title="Profile Rewards">
        <SwitchRows rows={[
          ["Trophy reward", r.reward_trophy, (v) => setR({ reward_trophy: v })],
          ["Badge reward", r.reward_badge, (v) => setR({ reward_badge: v })],
          ["Banner reward", r.reward_banner, (v) => setR({ reward_banner: v })],
          ["Profile title reward", r.reward_title, (v) => setR({ reward_title: v })],
        ]} />
        <Grid2>
          <Field label="Trophies awarded (count)"><Input type="number" value={form.reward_trophies} onChange={(e) => update({ reward_trophies: +e.target.value || 0 })} /></Field>
          <Field label="Badge code"><Input value={form.reward_badge} onChange={(e) => update({ reward_badge: e.target.value })} placeholder="cup_winner" /></Field>
          <Field label="Banner code"><Input value={form.reward_banner} onChange={(e) => update({ reward_banner: e.target.value })} placeholder="gold_anim" /></Field>
        </Grid2>
      </Section>
    </>
  );
}

/* ─────────── Step 8: Visibility ─────────── */
function StepVisibility({ form, update }: { form: WizardForm; update: (p: Partial<WizardForm>) => void }) {
  const v = form.visibility_advanced;
  const setV = (patch: Partial<typeof v>) => update({ visibility_advanced: { ...v, ...patch } });

  // Live preview config — re-renders on every edit.
  const previewRow: TournamentRow = {
    id: form.id ?? "preview",
    slug: form.slug || "preview",
    name: form.name || "Tournament",
    game: form.game,
    status: form.status,
    short_description: form.short_description || null,
    description: form.description || null,
    start_date: form.start_date || null,
    registration_close_at: form.registration_close_at || null,
    max_teams: form.max_teams,
    team_size: form.team_size,
    format: form.format_advanced.format,
    entry_cost_coins: form.entry_cost_coins,
    route_label: form.route_label || null,
    permit_number: form.permit_number || null,
    serial: form.serial || null,
    stamp_line1: form.stamp_line1 || null,
    stamp_line2: form.stamp_line2 || null,
    show_stamp: form.show_stamp ?? true,
    summit_accent: form.summit_accent || null,
  };
  const previewCfg = tournamentToSummitPass(previewRow, 0);

  return (
    <>
      <Section title="Visibility" hint="Draft tournaments are only visible to admins.">
        <Grid2>
          <Field label="Tournament visibility">
            <Select value={form.visibility} onValueChange={(val) => update({ visibility: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VISIBILITIES.map(x => <SelectItem key={x} value={x} className="capitalize">{x}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(val) => update({ status: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Grid2>
        <SwitchRows rows={[
          ["Featured on homepage", v.featured_homepage, (val) => { setV({ featured_homepage: val }); update({ featured: val }); }],
          ["Featured on tournaments page", v.featured_tournaments_page, (val) => setV({ featured_tournaments_page: val })],
          ["Send Discord announcement", v.discord_announce, (val) => setV({ discord_announce: val })],
          ["Show countdown on homepage", v.show_countdown, (val) => setV({ show_countdown: val })],
          ["Show in upcoming tournaments", v.show_in_upcoming, (val) => setV({ show_in_upcoming: val })],
          ["Allow social sharing", v.allow_social_sharing, (val) => setV({ allow_social_sharing: val })],
        ]} />
      </Section>

      <Section title="Promotion Copy">
        <Grid2>
          <Field label="Social title" span={2}><Input value={v.social_title ?? ""} onChange={(e) => setV({ social_title: e.target.value })} maxLength={120} /></Field>
          <Field label="Social description" span={2}><Textarea value={v.social_description ?? ""} onChange={(e) => setV({ social_description: e.target.value })} rows={2} maxLength={300} /></Field>
          <Field label="Social image URL" span={2}><Input value={v.social_image ?? ""} onChange={(e) => setV({ social_image: e.target.value })} placeholder="https://…" /></Field>
          <Field label="TikTok / Instagram caption" span={2}><Textarea value={v.social_caption ?? ""} onChange={(e) => setV({ social_caption: e.target.value })} rows={2} maxLength={500} /></Field>
          <Field label="Discord announcement text" span={2}><Textarea value={v.discord_announcement_text ?? ""} onChange={(e) => setV({ discord_announcement_text: e.target.value })} rows={3} maxLength={1500} /></Field>
        </Grid2>
        <Button type="button" variant="outline" size="sm" onClick={() => {
          const auto = `🏆 ${form.name}\n${form.short_description || form.tier_label} — ${form.game.toUpperCase()}\n📅 ${form.start_date || "TBA"}\n🎯 Prize: ${form.prize_pool || "TBA"} ${form.prize_currency}\nRegister: peakgg.net/tournaments/${form.slug}`;
          setV({ discord_announcement_text: auto, social_caption: auto });
        }}>
          Auto-generate announcement
        </Button>
      </Section>

      <Section title="Summit Pass Banner" hint="Overrides for the featured pass banner. Leave fields blank to use the derived defaults.">
        <Grid2>
          <Field label="Title accent" hint='red suffix after the title, e.g. "#1"'>
            <Input value={form.summit_accent ?? ""} onChange={(e) => update({ summit_accent: e.target.value })} maxLength={12} placeholder="#1" />
          </Field>
          <Field label="Route label" hint='e.g. "EU — West Face"'>
            <Input value={form.route_label ?? ""} onChange={(e) => update({ route_label: e.target.value })} maxLength={60} placeholder="EU — Open Face" />
          </Field>
          <Field label="Permit number">
            <Input value={form.permit_number ?? ""} onChange={(e) => update({ permit_number: e.target.value })} maxLength={20} placeholder="Nº 001" />
          </Field>
          <Field label="Serial (override)" hint="leave empty to auto-derive">
            <Input value={form.serial ?? ""} onChange={(e) => update({ serial: e.target.value })} maxLength={48} placeholder="PGG-VAL-EU-260516-CC1" />
          </Field>
          <Field label="Stamp line 1"><Input value={form.stamp_line1 ?? ""} onChange={(e) => update({ stamp_line1: e.target.value })} maxLength={24} /></Field>
          <Field label="Stamp line 2"><Input value={form.stamp_line2 ?? ""} onChange={(e) => update({ stamp_line2: e.target.value })} maxLength={24} /></Field>
          <Field label="Show stamp">
            <div className="flex items-center gap-2">
              <Switch checked={form.show_stamp ?? true} onCheckedChange={(val) => update({ show_stamp: val })} />
              <span className="text-xs text-muted-foreground">{form.show_stamp ?? true ? "Visible" : "Hidden"}</span>
            </div>
          </Field>
          <Field label="Registration closes at" hint="drives the countdown; defaults to start date">
            <Input type="datetime-local" value={form.registration_close_at?.slice(0, 16) ?? ""} onChange={(e) => update({ registration_close_at: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
          </Field>
        </Grid2>
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-2">Live preview</div>
          <div className="bg-background/40 rounded-md p-3 border border-border overflow-hidden">
            <SummitPassBanner config={previewCfg} />
          </div>
        </div>
      </Section>
    </>
  );
}

/* ─────────── Step 9: Moderation & Staff ─────────── */
function StepModeration({ form, update }: { form: WizardForm; update: (p: Partial<WizardForm>) => void }) {
  const m = form.moderation;
  const setM = (patch: Partial<typeof m>) => update({ moderation: { ...m, ...patch } });
  const s = form.staff;
  const setS = (patch: Partial<typeof s>) => update({ staff: { ...s, ...patch } });
  return (
    <>
      <Section title="Admin Permissions">
        <SwitchRows rows={[
          ["Allow admins to edit after publish", m.allow_edit_after_publish, (v) => setM({ allow_edit_after_publish: v })],
          ["Manually add teams", m.allow_manual_add_teams, (v) => setM({ allow_manual_add_teams: v })],
          ["Remove teams", m.allow_remove_teams, (v) => setM({ allow_remove_teams: v })],
          ["Ban teams from tournament", m.allow_ban_teams, (v) => setM({ allow_ban_teams: v })],
          ["Reset bracket", m.allow_reset_bracket, (v) => setM({ allow_reset_bracket: v })],
          ["Regenerate bracket", m.allow_regenerate_bracket, (v) => setM({ allow_regenerate_bracket: v })],
          ["Override scores", m.allow_score_override, (v) => setM({ allow_score_override: v })],
          ["Resolve disputes", m.allow_resolve_disputes, (v) => setM({ allow_resolve_disputes: v })],
          ["Lock registrations", m.allow_lock_registrations, (v) => setM({ allow_lock_registrations: v })],
          ["Pause tournament", m.allow_pause_tournament, (v) => setM({ allow_pause_tournament: v })],
          ["Cancel tournament", m.allow_cancel_tournament, (v) => setM({ allow_cancel_tournament: v })],
        ]} />
      </Section>

      <Section title="Moderation">
        <SwitchRows rows={[
          ["Report system enabled", m.report_system_enabled, (v) => setM({ report_system_enabled: v })],
          ["Allow match disputes", m.allow_match_disputes, (v) => setM({ allow_match_disputes: v })],
          ["Require evidence for disputes", m.require_evidence_for_dispute, (v) => setM({ require_evidence_for_dispute: v })],
          ["Auto-hide reported clips/messages", m.auto_hide_reported_content, (v) => setM({ auto_hide_reported_content: v })],
        ]} />
      </Section>

      <Section title="Staff">
        <Grid2>
          <Field label="Tournament admin (username)"><Input value={s.tournament_admin ?? ""} onChange={(e) => setS({ tournament_admin: e.target.value })} /></Field>
          <Field label="Caster / Streamer"><Input value={s.caster ?? ""} onChange={(e) => setS({ caster: e.target.value })} /></Field>
          <Field label="Support contact"><Input value={s.support_contact ?? ""} onChange={(e) => setS({ support_contact: e.target.value })} /></Field>
          <Field label="Referees (comma sep usernames)"><Input value={s.referees.join(", ")} onChange={(e) => setS({ referees: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })} /></Field>
        </Grid2>
      </Section>

      <Section title="Pre-Publish Checklist">
        <SwitchRows rows={[
          ["Rules completed", m.checklist_rules, (v) => setM({ checklist_rules: v })],
          ["Prize confirmed", m.checklist_prize, (v) => setM({ checklist_prize: v })],
          ["Discord channel ready", m.checklist_discord, (v) => setM({ checklist_discord: v })],
          ["Bracket settings checked", m.checklist_bracket, (v) => setM({ checklist_bracket: v })],
          ["Registration tested", m.checklist_registration, (v) => setM({ checklist_registration: v })],
          ["Staff assigned", m.checklist_staff, (v) => setM({ checklist_staff: v })],
        ]} />
      </Section>

      <Section title="Internal Admin Notes" hint="Visible only to admins.">
        <Textarea value={form.admin_notes} onChange={(e) => update({ admin_notes: e.target.value })} rows={3} maxLength={2000} />
      </Section>
    </>
  );
}

/* ─────────── Step 10: Review ─────────── */
function StepReview({ form, errors, jumpTo }: { form: WizardForm; errors: string[]; jumpTo: (i: number) => void }) {
  const summary: { label: string; value: string; step: number }[] = [
    { label: "Name", value: form.name || "—", step: 0 },
    { label: "Slug", value: form.slug || "—", step: 0 },
    { label: "Game / Tier", value: `${form.game.toUpperCase()} · ${form.tier_label}`, step: 0 },
    { label: "Type / Language", value: `${form.tournament_type} · ${form.language}`, step: 0 },
    { label: "Eligibility", value: `${form.eligibility.regions.join(", ") || "any"} · ELO ${form.eligibility.min_peak_elo}-${form.eligibility.max_peak_elo}`, step: 1 },
    { label: "Format", value: `${form.format_advanced.format} · ${form.format_advanced.bracket_size} teams · ${form.format_advanced.bo}`, step: 2 },
    { label: "Team size", value: form.team_size, step: 2 },
    { label: "Registration", value: `${form.registration.status} · ${form.registration.approval}`, step: 3 },
    { label: "Map pool", value: form.maps.map_pool.join(", ") || "—", step: 4 },
    { label: "Schedule", value: `Start ${form.start_date || "—"} (${form.timezone})`, step: 5 },
    { label: "Prize", value: `${form.prize_pool || "—"} ${form.prize_currency}`, step: 6 },
    { label: "Visibility", value: `${form.visibility} · status ${form.status}`, step: 7 },
    { label: "Staff", value: form.staff.tournament_admin || "—", step: 8 },
  ];
  return (
    <>
      <Section title="Pre-publish summary" hint="Click any row to jump back and edit.">
        <div className="rounded-lg border border-border divide-y divide-border bg-card/40">
          {summary.map((row) => (
            <button key={row.label} type="button" onClick={() => jumpTo(row.step)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted/30 transition-colors">
              <span className="text-[11px] font-display uppercase tracking-wider text-muted-foreground w-32 shrink-0">{row.label}</span>
              <span className="text-sm text-foreground truncate flex-1">{row.value}</span>
              <span className="text-[10px] text-muted-foreground">edit</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Validation">
        {errors.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400 font-display">
            ✓ Ready to publish
          </div>
        ) : (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-display text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> {errors.length} warning(s)
            </div>
            <ul className="text-xs text-amber-200/90 list-disc list-inside space-y-0.5">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </div>
        )}
      </Section>
    </>
  );
}

/* ─────────── Reusable: Switch rows ─────────── */
function SwitchRows({ rows }: { rows: [string, boolean, (v: boolean) => void][] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {rows.map(([label, value, onChange]) => (
        <label key={label} className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border bg-card/40 hover:border-primary/40 transition-colors cursor-pointer">
          <span className="text-xs text-foreground">{label}</span>
          <Switch checked={value} onCheckedChange={onChange} />
        </label>
      ))}
    </div>
  );
}