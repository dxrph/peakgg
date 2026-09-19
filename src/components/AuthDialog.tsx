import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../integrations/supabase/client";

export type AuthMode = "signin" | "signup";

interface AuthDialogProps { open: boolean; mode: AuthMode; onClose: () => void; onModeChange: (mode: AuthMode) => void }

export default function AuthDialog({ open, mode, onClose, onModeChange }: AuthDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>("input")?.focus(), 0);
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", keydown); };
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!email.includes("@") || password.length < 6) { setMessage(t("auth.validation")); return; }
    setLoading(true);
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setLoading(false);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage(mode === "signup" && !result.data.session ? t("auth.checkEmail") : t("auth.success"));
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div ref={dialogRef} className="modal-shell auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="modal-close" type="button" onClick={onClose} aria-label={t("common.close")}>×</button>
      <span className="section-kicker">{t("auth.kicker")}</span>
      <h2 id="auth-title">{mode === "signin" ? t("auth.signIn") : t("auth.create")}</h2>
      <div className="auth-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => { onModeChange("signin"); setMessage(""); }}>{t("auth.signIn")}</button>
        <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => { onModeChange("signup"); setMessage(""); }}>{t("auth.create")}</button>
      </div>
      <form onSubmit={submit} noValidate>
        <label>{t("auth.email")}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        <label>{t("auth.password")}<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="peak-button peak-button-primary" type="submit" disabled={loading}>{loading ? t("auth.loading") : mode === "signin" ? t("auth.submitSignIn") : t("auth.submitCreate")}</button>
      </form>
    </div>
  </div>;
}