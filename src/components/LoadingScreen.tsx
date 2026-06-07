import { useEffect, useState } from "react";

const MICRO_COPY = [
  "Preparing the arena",
  "Syncing ranks",
  "Loading Open Cup",
  "Forging your path",
  "Calculating ELO",
];

export default function LoadingScreen() {
  const [copyIdx, setCopyIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setCopyIdx((i) => (i + 1) % MICRO_COPY.length),
      1600,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden animate-[ls-fade-in_0.4s_ease-out]"
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #0b0612 0%, #060309 55%, #030206 100%)",
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading PeakGG"
    >
      {/* Cinematic glows */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 70%, rgba(255,70,85,0.18), transparent 55%), radial-gradient(circle at 80% 20%, rgba(255,59,160,0.14), transparent 50%), radial-gradient(circle at 15% 25%, rgba(255,138,61,0.10), transparent 55%)",
        }}
      />
      {/* Faint mountain silhouette */}
      <svg
        aria-hidden
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 w-full h-[55%] opacity-[0.18] pointer-events-none"
        fill="none"
      >
        <defs>
          <linearGradient id="ls-mtn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4655" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0b0612" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,600 L0,420 L220,260 L360,360 L560,140 L760,340 L900,250 L1080,400 L1200,330 L1200,600 Z" fill="url(#ls-mtn)" />
      </svg>

      {/* Particles */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => {
          const left = (i * 53) % 100;
          const delay = (i % 9) * 0.6;
          const dur = 7 + (i % 5);
          const size = 1 + (i % 3);
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                bottom: "-10px",
                width: `${size}px`,
                height: `${size}px`,
                background:
                  i % 3 === 0 ? "#FF4655" : i % 3 === 1 ? "#FF3BA0" : "#FF8A3D",
                boxShadow: "0 0 6px currentColor",
                color: "currentColor",
                opacity: 0.55,
                animation: `ls-rise ${dur}s linear ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Centered stack */}
      <div className="relative flex flex-col items-center gap-7 px-6">
        {/* Peak logo with energy outline */}
        <div className="relative w-[140px] h-[140px] sm:w-[170px] sm:h-[170px]">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255,70,85,0.45), transparent 65%)",
              animation: "ls-pulse 2.4s ease-in-out infinite",
            }}
          />
          <svg
            viewBox="0 0 120 120"
            className="relative w-full h-full"
            fill="none"
          >
            <defs>
              <linearGradient id="ls-peak" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#FF4655" />
                <stop offset="60%" stopColor="#FF3BA0" />
                <stop offset="100%" stopColor="#FF8A3D" />
              </linearGradient>
            </defs>
            {/* Outer hex frame */}
            <path
              d="M60 6 L108 33 L108 87 L60 114 L12 87 L12 33 Z"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="1.5"
            />
            {/* Peak outline being drawn */}
            <path
              d="M22 88 L48 52 L62 70 L78 38 L98 88 Z"
              stroke="url(#ls-peak)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: "drop-shadow(0 0 8px rgba(255,70,85,0.55))",
                strokeDasharray: 260,
                strokeDashoffset: 260,
                animation:
                  "ls-draw 2.8s ease-in-out infinite, ls-flash 2.8s ease-in-out infinite",
              }}
            />
            {/* Energy spark rising to peak */}
            <circle
              r="2.6"
              fill="#fff"
              style={{
                filter: "drop-shadow(0 0 6px #FF4655)",
                animation: "ls-spark 2.8s ease-in-out infinite",
              }}
            >
              <animateMotion
                dur="2.8s"
                repeatCount="indefinite"
                path="M22 88 L48 52 L62 70 L78 38"
              />
            </circle>
            {/* Peak flash */}
            <circle
              cx="78"
              cy="38"
              r="4"
              fill="#fff"
              style={{
                filter: "drop-shadow(0 0 12px #FF4655)",
                animation: "ls-tip 2.8s ease-in-out infinite",
                transformOrigin: "78px 38px",
              }}
            />
          </svg>
        </div>

        {/* Main copy */}
        <div className="text-center space-y-2">
          <h2
            className="font-black uppercase text-2xl sm:text-3xl tracking-[0.22em] text-[#F4F0EA]"
            style={{
              fontFamily:
                "'Bebas Neue', 'Barlow Condensed', 'Rajdhani', sans-serif",
              textShadow:
                "0 0 18px rgba(255,70,85,0.35), 0 2px 8px rgba(0,0,0,0.6)",
              animation: "ls-text-pulse 2.4s ease-in-out infinite",
            }}
          >
            Climbing to the Peak<span className="text-[#FF4655]">…</span>
          </h2>
          <p
            key={copyIdx}
            className="text-xs sm:text-sm uppercase tracking-[0.28em] text-foreground/55 font-display animate-[ls-fade-in_0.5s_ease-out]"
          >
            {MICRO_COPY[copyIdx]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-[280px] sm:w-[320px] h-[3px] rounded-full overflow-hidden bg-white/[0.06] border border-white/[0.04] backdrop-blur-sm">
          <span
            className="block h-full rounded-full"
            style={{
              width: "40%",
              background:
                "linear-gradient(90deg, #FF4655 0%, #FF3BA0 50%, #FF8A3D 100%)",
              boxShadow:
                "0 0 12px rgba(255,70,85,0.55), 0 0 24px rgba(255,138,61,0.3)",
              animation: "ls-bar 1.8s cubic-bezier(0.65,0,0.35,1) infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes ls-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ls-rise {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 0.6; }
          100% { transform: translateY(-110vh) translateX(20px); opacity: 0; }
        }
        @keyframes ls-pulse {
          0%, 100% { opacity: 0.55; transform: scale(0.95); }
          50%      { opacity: 1;    transform: scale(1.08); }
        }
        @keyframes ls-draw {
          0%   { stroke-dashoffset: 260; }
          70%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ls-flash {
          0%, 65%  { filter: drop-shadow(0 0 8px rgba(255,70,85,0.55)); }
          75%      { filter: drop-shadow(0 0 22px rgba(255,255,255,0.9)); }
          100%     { filter: drop-shadow(0 0 8px rgba(255,70,85,0.55)); }
        }
        @keyframes ls-spark {
          0%, 100% { opacity: 1; }
          90%, 100% { opacity: 0; }
        }
        @keyframes ls-tip {
          0%, 70%  { opacity: 0; transform: scale(0.4); }
          78%      { opacity: 1; transform: scale(1.6); }
          100%     { opacity: 0; transform: scale(0.4); }
        }
        @keyframes ls-text-pulse {
          0%, 100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
        @keyframes ls-bar {
          0%   { transform: translateX(-110%); }
          100% { transform: translateX(260%); }
        }
      `}</style>
    </div>
  );
}