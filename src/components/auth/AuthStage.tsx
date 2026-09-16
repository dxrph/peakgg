import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import { Rail, Display } from "@/components/system";

interface AuthStageProps {
  eyebrow: string;
  title: string;
  copy: string;
  children: ReactNode;
}

const STATS = [
  { value: "7", label: "Peak tiers" },
  { value: "5v5", label: "Cup format" },
  { value: "EU", label: "Region" },
];

/**
 * Broadcast-style auth layout: a data-panel art column on the left,
 * the form column on the right. Shared by /login and /register.
 */
export default function AuthStage({ eyebrow, title, copy, children }: AuthStageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1.05fr_1fr]">
      {/* Art / statement column */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border p-12 auth-art">
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <BrandLogo className="h-6 w-6" />
            <span className="font-condensed font-black text-2xl uppercase leading-none">PEAKGG</span>
          </Link>
        </div>

        <div className="relative z-10">
          <Rail className="mb-5">{eyebrow.replace(/^\/\/\s*/, "")}</Rail>
          <Display as="p" className="auth-statement text-6xl xl:text-7xl">
            {title}
          </Display>
          <p className="mt-6 max-w-md text-sm text-muted-foreground font-body leading-relaxed">{copy}</p>
        </div>

        <div className="relative z-10 grid grid-cols-3 border border-border divide-x divide-border bg-background/40 mb-16">
          {STATS.map((s) => (
            <div key={s.label} className="px-4 py-4">
              <div className="bc-num text-3xl">{s.value}</div>
              <div className="mt-1.5 text-[9px] uppercase tracking-[0.24em] font-display font-bold text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Form column */}
      <main className="flex flex-col justify-center px-5 sm:px-10 lg:px-16 py-14">
        <div className="lg:hidden mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <BrandLogo className="h-5 w-5" />
            <span className="font-condensed font-black text-xl uppercase leading-none">PEAKGG</span>
          </Link>
        </div>
        <div className="w-full max-w-md mx-auto lg:mx-0">{children}</div>
      </main>
    </div>
  );
}
