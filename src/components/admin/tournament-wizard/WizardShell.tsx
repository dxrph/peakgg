import { ReactNode } from "react";
import { Check } from "lucide-react";
import { STEPS } from "./types";

export function WizardShell({
  currentStep, onStepChange, children, footer,
}: {
  currentStep: number;
  onStepChange: (i: number) => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-0 h-[80vh] max-h-[80vh] overflow-hidden">
      {/* Sidebar steps */}
      <aside className="border-r border-border bg-muted/20 overflow-y-auto p-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-3 px-2">
          Steps
        </div>
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const active = i === currentStep;
            const done = i < currentStep;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onStepChange(i)}
                  className={`w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-md text-xs font-display uppercase tracking-wide transition-colors ${
                    active
                      ? "bg-primary/15 text-primary border border-primary/40"
                      : done
                      ? "text-foreground hover:bg-muted/40"
                      : "text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <span className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full border text-[10px] ${
                    active ? "border-primary text-primary" : done ? "border-emerald-500 text-emerald-500" : "border-border text-muted-foreground"
                  }`}>
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="truncate">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Body + sticky footer */}
      <div className="flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        <div className="border-t border-border bg-card/80 backdrop-blur p-3">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-3">
        <h3 className="font-display text-sm uppercase tracking-widest text-foreground">{title}</h3>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children, span = 1 }: { label: string; hint?: string; children: ReactNode; span?: 1 | 2 }) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className="block text-[11px] font-display uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground/70 mt-1">{hint}</p>}
    </div>
  );
}

export function Grid2({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}