import vandal from "@/assets/vandal-loader.png";

export default function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 overflow-hidden relative"
      style={{ background: "#050505" }}
    >
      {/* Glow backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.18), transparent 60%)",
        }}
      />

      {/* Vandal */}
      <div className="relative w-[min(520px,80vw)]">
        <img
          src={vandal}
          alt="PeakGG loading"
          width={1024}
          height={512}
          className="w-full h-auto drop-shadow-[0_0_25px_hsl(var(--primary)/0.55)] animate-[vandal-float_2.4s_ease-in-out_infinite]"
        />
        {/* Muzzle flash */}
        <span
          aria-hidden
          className="absolute left-[2%] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full blur-md animate-[muzzle_1.1s_ease-in-out_infinite]"
          style={{ background: "hsl(var(--primary))" }}
        />
      </div>

      <span className="font-display font-bold text-2xl tracking-[0.35em] text-foreground/90">
        PEAKGG
      </span>

      {/* Progress bar */}
      <div className="w-48 h-[3px] bg-foreground/10 rounded-full overflow-hidden">
        <span
          className="block h-full w-1/3 animate-[loader-slide_1.4s_ease-in-out_infinite]"
          style={{ background: "hsl(var(--primary))" }}
        />
      </div>

      <style>{`
        @keyframes vandal-float {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-6px); }
        }
        @keyframes muzzle {
          0%, 100% { opacity: 0; transform: translateY(-50%) scale(0.6); }
          50% { opacity: 0.9; transform: translateY(-50%) scale(1.3); }
        }
        @keyframes loader-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}