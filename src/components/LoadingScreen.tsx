import { Mountain } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#050505" }}
    >
      <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
        <Mountain className="h-7 w-7 text-primary-foreground" />
      </div>
      <span className="font-display font-bold text-xl tracking-[0.25em] text-foreground/80">
        PEAKGG
      </span>
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Loading…
      </span>
    </div>
  );
}