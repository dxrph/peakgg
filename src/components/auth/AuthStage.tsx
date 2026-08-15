import { ReactNode } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

export default function AuthStage({ eyebrow, title, copy, children }: {
  eyebrow: string;
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-stage min-h-screen grid lg:grid-cols-[1.15fr_.85fr] bg-background text-foreground">
      <section className="auth-art relative hidden lg:flex min-h-screen overflow-hidden p-12 xl:p-16 flex-col justify-between">
        <Link to="/" className="relative z-10 inline-flex items-center gap-3 w-fit">
          <BrandLogo className="h-11 w-11" />
          <span className="font-display font-bold text-2xl tracking-tight">PEAKGG</span>
        </Link>
        <div className="relative z-10 max-w-3xl py-12">
          <p className="eyebrow mb-5">{eyebrow}</p>
          <h1 className="auth-statement font-display font-bold uppercase text-[clamp(4rem,8vw,8.5rem)] leading-[.76] tracking-[-.065em]">
            {title}
          </h1>
          <p className="mt-8 max-w-lg text-lg text-white/68 leading-relaxed">{copy}</p>
        </div>
        <div className="relative z-10 flex items-center justify-between text-[10px] uppercase tracking-[.28em] text-white/40 font-display">
          <span>EU Competitive Network</span><span>Season 00 / Live</span>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="absolute inset-0 ink-noise pointer-events-none opacity-35" />
        <div className="relative w-full max-w-[480px]">
          <Link to="/" className="lg:hidden inline-flex items-center gap-3 mb-12">
            <BrandLogo className="h-9 w-9" />
            <span className="font-display font-bold text-xl">PEAKGG</span>
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}

