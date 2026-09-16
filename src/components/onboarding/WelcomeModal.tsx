import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, User, Users, Swords, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";

/**
 * Shows a welcome wizard the first time a user lands on the dashboard
 * after sign-up. Persists dismissal in localStorage per user-id.
 */
export default function WelcomeModal() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `peakgg.welcome_seen.${user.id}`;
    if (!window.localStorage.getItem(key)) {
      // Slight delay so the dashboard renders first
      const id = window.setTimeout(() => setOpen(true), 400);
      return () => window.clearTimeout(id);
    }
  }, [user]);

  const dismiss = () => {
    if (user) {
      try { window.localStorage.setItem(`peakgg.welcome_seen.${user.id}`, "1"); } catch {}
    }
    setOpen(false);
  };

  const steps = [
    { icon: User, title: t("welcome.s1_title"), desc: t("welcome.s1_desc") },
    { icon: Users, title: t("welcome.s2_title"), desc: t("welcome.s2_desc") },
    { icon: Swords, title: t("welcome.s3_title"), desc: t("welcome.s3_desc") },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? dismiss() : setOpen(true))}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-primary/30">
        <div className="relative px-6 pt-7 pb-4 bg-gradient-to-br from-primary/15 via-card to-card">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 500px 250px at 30% 0%, hsl(var(--primary)), transparent 60%)",
            }}
          />
          <div className="relative flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-primary">
              {t("welcome.eyebrow")}
            </span>
          </div>
          <DialogHeader className="relative text-left">
            <DialogTitle className="text-2xl md:text-3xl font-display font-bold leading-tight">
              {t("welcome.title")}
            </DialogTitle>
            <DialogDescription className="font-body text-sm mt-1">
              {t("welcome.subtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-background/30 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/40 text-primary font-display font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <s.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="font-display font-semibold text-sm">{s.title}</span>
                </div>
                <p className="text-xs text-muted-foreground font-body mt-0.5 leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 pt-1 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={dismiss} size="sm">
            {t("welcome.skip")}
          </Button>
          <Link to="/settings" onClick={dismiss}>
            <Button variant="neon" size="lg" className="w-full sm:w-auto">
              {t("welcome.cta")}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}