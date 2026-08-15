import { useCallback, useEffect, useState } from "react";
import { Fingerprint, KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string | null };

export default function PasskeySection() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [backendEnabled, setBackendEnabled] = useState(true);
  const supported = typeof window !== "undefined" && "PublicKeyCredential" in window;

  const load = useCallback(async () => {
    if (!supported) { setLoading(false); return; }
    try {
      const api = supabase.auth.passkey;
      if (!api?.list) { setBackendEnabled(false); setLoading(false); return; }
      const { data, error } = await api.list();
      if (error) {
        if (error.code === "passkey_disabled") setBackendEnabled(false);
        setLoading(false);
        return;
      }
      setPasskeys((data ?? []) as Passkey[]);
    } catch {
      setBackendEnabled(false);
    }
    setLoading(false);
  }, [supported]);

  useEffect(() => { load(); }, [load]);

  const register = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      toast.success("Passkey registrata. Ora puoi entrare con biometria o PIN del dispositivo.");
      await load();
    } catch (error: any) {
      if (error?.code === "passkey_disabled") {
        setBackendEnabled(false);
        toast.error("Le passkey devono essere abilitate nel progetto Supabase.");
      } else if (error?.name !== "NotAllowedError") toast.error(error?.message ?? "Registrazione passkey non riuscita.");
    }
    setBusy(false);
  };

  const remove = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Passkey rimossa.");
    load();
  };

  return (
    <section className="tactical-panel p-6 mb-6 overflow-hidden relative">
      <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative z-[1] flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 border border-primary/25 p-3"><Fingerprint className="h-6 w-6 text-primary" /></div>
          <div><div className="flex items-center gap-2 flex-wrap"><h2 className="font-display uppercase font-bold text-xl">Passkey access</h2>{backendEnabled && supported && <Badge variant="outline" className="border-success/30 text-success"><ShieldCheck className="h-3 w-3 mr-1" />Phishing resistant</Badge>}</div><p className="text-sm text-muted-foreground mt-1 max-w-xl">Entra con Face ID, impronta, PIN o security key. Il magic link rimane sempre disponibile come recupero.</p></div>
        </div>
        <Button onClick={register} disabled={busy || loading || !supported || !backendEnabled} className="signal-button shrink-0">{busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}Aggiungi passkey</Button>
      </div>
      {!supported && <p className="mt-4 text-xs text-warning">Questo browser o dispositivo non supporta WebAuthn.</p>}
      {!backendEnabled && <p className="mt-4 text-xs text-warning">Interfaccia pronta: per attivarla in produzione abilita Authentication → Passkeys nel progetto Supabase e configura dominio e origini PeakGG.</p>}
      {passkeys.length > 0 && (
        <div className="mt-5 border-t border-border pt-4 space-y-2">
          {passkeys.map((passkey) => (
            <div key={passkey.id} className="flex items-center gap-3 rounded-lg bg-background/45 border border-border p-3"><KeyRound className="h-4 w-4 text-primary" /><div className="min-w-0 flex-1"><div className="font-display text-sm uppercase truncate">{passkey.friendly_name || "Passkey"}</div><div className="text-[10px] text-muted-foreground">Creata {new Date(passkey.created_at).toLocaleDateString()}{passkey.last_used_at ? ` · ultimo uso ${new Date(passkey.last_used_at).toLocaleDateString()}` : ""}</div></div><Button variant="ghost" size="icon" onClick={() => remove(passkey.id)} disabled={busy} aria-label="Rimuovi passkey"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
          ))}
        </div>
      )}
    </section>
  );
}

