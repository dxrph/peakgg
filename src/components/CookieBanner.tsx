import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cookieConsent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!v) setVisible(true);
    } catch {
      /* noop */
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
      window.loadGA?.();
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  const decline = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "declined");
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:bottom-6 md:max-w-md z-[100] animate-fade-in"
    >
      <div className="relative rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl p-4 md:p-5">
        <button
          onClick={decline}
          aria-label="Close"
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-primary/15 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold tracking-wide text-foreground text-base">
              We use cookies
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              We use essential cookies to run PeakGG and optional analytics
              cookies (Google Analytics) to improve the experience. Read our{" "}
              <Link to="/privacy" className="text-primary underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" onClick={accept} className="font-semibold">
                Accept all
              </Button>
              <Button size="sm" variant="outline" onClick={decline}>
                Only essential
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}