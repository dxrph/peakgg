import { useState } from "react";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, Mail, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthStage from "@/components/auth/AuthStage";
import GoogleButton from "@/components/GoogleButton";
import { useAuth } from "@/hooks/useAuth";
import { emailSchema, usernameSchema, isDisposableEmail } from "@/lib/security";
import { containsProfanity } from "@/lib/profanity";
import { toast } from "sonner";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { signInWithMagicLink } = useAuth();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validUsername = usernameSchema.safeParse(username.trim());
    if (!validUsername.success || containsProfanity(username)) return toast.error("Scegli un nickname valido.");
    const validEmail = emailSchema.safeParse(email.trim());
    if (!validEmail.success) return toast.error("Inserisci un indirizzo email valido.");
    setIsLoading(true);
    if (await isDisposableEmail(validEmail.data)) {
      setIsLoading(false);
      return toast.error("Le email temporanee non sono ammesse.");
    }
    const { error } = await signInWithMagicLink(validEmail.data, validUsername.data);
    setIsLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <>
      <SEO title="Crea il profilo — PeakGG" description="Entra nella piattaforma competitiva PeakGG senza password." path="/register" />
      <AuthStage
        eyebrow="// New challenger detected"
        title="Build your legacy."
        copy="Crea la tua identità competitiva, trova il roster giusto e conquista tornei, rank e riconoscimenti."
      >
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-primary text-xs uppercase tracking-[.2em] font-display font-bold mb-4">
            <Zap className="h-3.5 w-3.5" /> Create player identity
          </div>
          <h2 className="font-display uppercase font-bold text-4xl md:text-5xl leading-none tracking-[-.04em]">Il tuo climb parte qui.</h2>
          <p className="text-muted-foreground mt-4">Nessuna password: conferma l'email e completa il profilo dopo l'accesso.</p>
        </div>

        {sent ? (
          <div className="torn-panel p-7">
            <CheckCircle2 className="h-9 w-9 text-success mb-5" />
            <h3 className="font-display uppercase text-2xl font-bold">Profilo quasi pronto</h3>
            <p className="text-sm text-muted-foreground mt-2">Apri il link inviato a <strong className="text-foreground">{email}</strong> per attivare <strong className="text-foreground">{username}</strong>.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-[.18em] font-display">Nickname Peak</Label>
              <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" autoComplete="username" placeholder="YourCallsign" value={username} onChange={(e) => setUsername(e.target.value)} className="h-14 pl-11 bg-card/65 border-white/10 rounded-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-[.18em] font-display">Email account</Label>
              <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" placeholder="player@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 pl-11 bg-card/65 border-white/10 rounded-none" />
              </div>
            </div>
            <Button className="w-full h-14 rounded-none uppercase tracking-[.14em] font-display font-bold signal-button" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Crea profilo <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>
        )}
        <div className="my-7 flex items-center gap-4"><span className="h-px flex-1 bg-border" /><span className="text-[10px] uppercase tracking-[.24em] text-muted-foreground">oppure</span><span className="h-px flex-1 bg-border" /></div>
        <GoogleButton label="Continua con Google" />
        <p className="text-center text-sm text-muted-foreground mt-7">Hai già un profilo? <Link to="/login" className="text-primary font-semibold hover:underline">Accedi</Link></p>
      </AuthStage>
    </>
  );
}

