import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthStage from "@/components/auth/AuthStage";
import GoogleButton from "@/components/GoogleButton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { signInWithMagicLink } = useAuth();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("expired") === "1") {
      toast.error("Sessione scaduta. Richiedi un nuovo link sicuro.");
    }
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return toast.error("Inserisci la tua email.");
    setIsLoading(true);
    const { error } = await signInWithMagicLink(email.trim().toLowerCase());
    setIsLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <>
      <SEO title="Accesso sicuro — PeakGG" description="Accedi a PeakGG senza password con un link sicuro via email." path="/login" />
      <AuthStage
        eyebrow="// Player access protocol"
        title="Enter the arena."
        copy="Un solo link, zero password da ricordare. Accedi al tuo profilo, alla squadra, ai tornei e alla ladder PeakGG."
      >
        <div className="mb-9">
          <div className="inline-flex items-center gap-2 text-primary text-xs uppercase tracking-[.2em] font-display font-bold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Passwordless access
          </div>
          <h2 className="font-display uppercase font-bold text-4xl md:text-5xl leading-none tracking-[-.04em]">Bentornato, player.</h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">Ricevi un magic link monouso. Più veloce, più sicuro, più pulito.</p>
        </div>

        {sent ? (
          <div className="torn-panel p-7 md:p-8">
            <CheckCircle2 className="h-9 w-9 text-success mb-5" />
            <h3 className="font-display uppercase text-2xl font-bold">Controlla la posta</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Abbiamo inviato il link sicuro a <strong className="text-foreground">{email}</strong>. È valido una sola volta.</p>
            <Button variant="outline" className="mt-6 w-full" onClick={() => setSent(false)}>Usa un'altra email</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-[.18em] font-display">Email account</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" placeholder="player@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 pl-11 bg-card/65 border-white/10 rounded-xl" disabled={isLoading} />
              </div>
            </div>
            <Button className="w-full h-14 rounded-xl uppercase tracking-[.14em] font-display font-bold signal-button" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Invia link sicuro <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>
        )}

        <div className="my-7 flex items-center gap-4"><span className="h-px flex-1 bg-border" /><span className="text-[10px] uppercase tracking-[.24em] text-muted-foreground">oppure</span><span className="h-px flex-1 bg-border" /></div>
        <GoogleButton />
        <p className="text-center text-sm text-muted-foreground mt-7">Nuovo su PeakGG? <Link to="/register" className="text-primary font-semibold hover:underline">Crea il profilo</Link></p>
      </AuthStage>
    </>
  );
}

