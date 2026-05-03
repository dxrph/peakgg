import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Factor = { id: string; friendly_name?: string | null; status: "verified" | "unverified"; created_at: string };

export default function MfaSection() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) setFactors([...(data.totp ?? [])] as Factor[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `TOTP ${new Date().toISOString().slice(0, 10)}` });
    setEnrolling(false);
    if (error || !data) { toast.error(error?.message ?? "Errore enroll"); return; }
    setEnrollData({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const verify = async () => {
    if (!enrollData) return;
    setVerifying(true);
    const ch = await supabase.auth.mfa.challenge({ factorId: enrollData.factorId });
    if (ch.error || !ch.data) { setVerifying(false); toast.error(ch.error?.message ?? "Errore challenge"); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId: enrollData.factorId, challengeId: ch.data.id, code: otp.trim() });
    setVerifying(false);
    if (error) { toast.error("Codice non valido"); return; }
    toast.success("MFA attivata");
    setEnrollData(null);
    setOtp("");
    load();
  };

  const cancelEnroll = async () => {
    if (!enrollData) return;
    await supabase.auth.mfa.unenroll({ factorId: enrollData.factorId });
    setEnrollData(null);
    setOtp("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Disattivare l'autenticazione a due fattori?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) { toast.error(error.message); return; }
    toast.success("MFA disattivata");
    load();
  };

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <section className="rounded-lg border border-border bg-card p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-display font-semibold text-lg mb-1 flex items-center gap-2">
            Two-Factor Authentication (TOTP)
            {verified.length > 0 ? (
              <ShieldCheck className="h-4 w-4 text-success" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-warning" />
            )}
          </h2>
          <p className="text-sm text-muted-foreground font-body mb-4">
            Aggiungi un secondo fattore con app come Google Authenticator, 1Password o Authy.
          </p>

          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : verified.length > 0 ? (
            <ul className="space-y-2 mb-3">
              {verified.map((f) => (
                <li key={f.id} className="flex items-center justify-between text-sm border border-border rounded p-2">
                  <span className="font-display">{f.friendly_name || "TOTP"}</span>
                  <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : enrollData ? (
            <div className="space-y-3">
              <div className="bg-background p-3 rounded inline-block">
                <img src={enrollData.qr} alt="QR MFA" className="w-44 h-44" />
              </div>
              <p className="text-xs text-muted-foreground font-mono break-all">Secret: {enrollData.secret}</p>
              <div>
                <Label>Inserisci il codice a 6 cifre</Label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="w-32" />
              </div>
              <div className="flex gap-2">
                <Button onClick={verify} disabled={otp.length !== 6 || verifying}>
                  {verifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Verifica
                </Button>
                <Button variant="ghost" onClick={cancelEnroll}>Annulla</Button>
              </div>
            </div>
          ) : (
            <Button onClick={startEnroll} disabled={enrolling}>
              {enrolling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Attiva 2FA
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
