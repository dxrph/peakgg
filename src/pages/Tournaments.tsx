import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import SEO from "@/components/SEO";

/* ───────── Fonts (utility classes) ───────── */
const fSyne = { fontFamily: "'Syne', sans-serif", fontWeight: 800 } as const;
const fMono = { fontFamily: "'Space Mono', monospace" } as const;
const fBody = { fontFamily: "'Space Grotesk', sans-serif" } as const;

type Mode = "Solo" | "Duo" | "Stack";

/* ───────── NAV ───────── */
function Nav() {
  const links = ["Peak League", "Tournaments", "Teams", "Free Agents", "Leaderboard", "Ranked"];
  return (
    <nav
      className="sticky top-0 z-50 h-14 border-b border-line2 flex items-center px-8"
      style={{ background: "rgba(9,9,15,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="flex items-center gap-3 mr-10">
        <div
          className="w-7 h-7 bg-or"
          style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)" }}
        />
        <span className="text-white text-lg tracking-tight" style={fSyne}>PEAKGG</span>
      </div>
      <ul className="hidden md:flex items-center gap-7 flex-1" style={fBody}>
        {links.map((l) => {
          const active = l === "Tournaments";
          return (
            <li key={l}>
              <a
                href="#"
                className={`text-[13px] py-[18px] border-b-2 transition-colors ${
                  active ? "text-white border-or" : "text-g2 border-transparent hover:text-g1"
                }`}
              >
                {l}
              </a>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-3">
        <button
          className="hidden sm:inline-flex h-8 px-3 items-center text-white text-[11px]"
          style={{ ...fMono, background: "#5865f2" }}
        >
          DISCORD
        </button>
        <button className="text-g1 hover:text-white"><Bell size={18} /></button>
        <div className="w-8 h-8" style={{ background: "linear-gradient(135deg,#ff4d1a,#ff6535)" }} />
      </div>
    </nav>
  );
}

/* ───────── HERO ───────── */
function Hero({
  inQueue, activeMode, seconds, conflict, sessionLabel,
  onJoin, onLeave, onTab,
}: {
  inQueue: boolean; activeMode: Mode; seconds: number;
  conflict: string | null; sessionLabel: string;
  onJoin: () => void; onLeave: () => void; onTab: (m: Mode) => void;
}) {
  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  return (
    <section className="relative overflow-hidden border-b border-line2">
      {/* glows */}
      <div className="pointer-events-none absolute inset-0"
           style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,77,26,0.09), transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0"
           style={{ background: "radial-gradient(ellipse 40% 40% at 90% 100%, rgba(34,201,122,0.04), transparent 70%)" }} />
      {/* ghost ELO */}
      <div className="pointer-events-none absolute right-[-3vw] top-1/2 -translate-y-1/2 select-none"
           style={{
             ...fSyne, fontSize: "22vw", lineHeight: 1, color: "transparent",
             WebkitTextStroke: "1px rgba(255,77,26,0.07)",
           }}>
        ELO
      </div>

      <div className="relative max-w-[1140px] mx-auto px-8 py-20 grid gap-16 items-start"
           style={{ gridTemplateColumns: "minmax(0,1fr) 360px" }}>
        {/* LEFT */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <div className="flex items-center gap-3 mb-8">
            <span className="block w-[18px] h-px bg-or" />
            <span className="text-or text-[10px] uppercase tracking-[0.25em]" style={fMono}>
              Sistema ranked · Season 1
            </span>
          </div>

          <h1 className="text-white" style={{ ...fSyne, fontSize: "clamp(3rem, 7vw, 7rem)", lineHeight: 0.88, letterSpacing: "-3px" }}>
            <div>OGNI</div>
            <div className="text-or">MATCH</div>
            <div style={{ color: "transparent", WebkitTextStroke: "1px #2e2c42" }}>MUOVE</div>
            <div>IL RANK.</div>
          </h1>

          <p className="mt-8 text-g1 text-[14px] max-w-[400px]" style={{ ...fBody, lineHeight: 1.75 }}>
            ELO universale — solo, duo o full stack. I team guadagnano anche ELO separato nei tornei
            ufficiali. Un sistema, tutte le modalità.
          </p>

          {/* QUEUE BOX */}
          <div className="mt-10 bg-bg2 border border-line2 relative max-w-[520px]">
            <div className="absolute top-0 left-0 right-0 h-[2px]"
                 style={{ background: "linear-gradient(to right,#ff4d1a,#ff6535,transparent)" }} />
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="text-g2 text-[9px] uppercase tracking-[3px]" style={fMono}>// Matchmaking queue</span>
              <div className="flex">
                {(["Solo", "Duo", "Stack"] as Mode[]).map((m) => {
                  const active = m === activeMode;
                  return (
                    <button
                      key={m}
                      onClick={() => onTab(m)}
                      className="px-3 py-1 border text-[9px] uppercase tracking-[2px] -ml-px first:ml-0"
                      style={{
                        ...fMono,
                        color: active ? "#ff4d1a" : "#5c5a74",
                        borderColor: active ? "#ff4d1a28" : "#ffffff14",
                        background: active ? "#ff4d1a0d" : "transparent",
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-5 pb-5 flex items-center gap-5">
              <button
                onClick={onJoin}
                className="bg-or hover:bg-or2 text-white px-5 h-11 text-[12px] tracking-[2px] transition-colors"
                style={fMono}
              >
                → JOIN OPEN CUP
              </button>
              <div className="text-g2 text-[11px] leading-relaxed" style={fMono}>
                Mode: <span className="text-or">{activeMode}</span> · Format: <span className="text-or">Bo1</span>
                <br />Maps: Pool + Veto · Rank: <span className="text-or">Rookie</span>
              </div>
            </div>
          </div>

          {/* QUEUE STATUS BAR */}
          <AnimatePresence>
            {inQueue && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="mt-4 max-w-[520px] flex items-center gap-4 px-5 py-3 border"
                style={{ borderColor: "#ff4d1a28", background: "rgba(255,77,26,0.04)" }}
              >
                <span className="w-2.5 h-2.5 bg-or animate-pulse block" />
                <div className="flex-1 min-w-0">
                  <div className="text-or text-[12px]" style={{ ...fMono, fontWeight: 700 }}>
                    Open Cup · {activeMode}
                  </div>
                  <div className="text-g2 text-[10px]" style={fMono}>
                    Searching opponents — keep this tab open
                  </div>
                </div>
                <div className="text-or text-[22px] tabular-nums" style={fMono}>{fmt(seconds)}</div>
                <button
                  onClick={onLeave}
                  className="px-3 h-8 border text-[10px] tracking-[2px]"
                  style={{ ...fMono, color: "#ff2d55", borderColor: "rgba(255,45,85,0.4)" }}
                >
                  ESCI
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CONFLICT BAR */}
          <AnimatePresence>
            {conflict && (
              <motion.div
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: [0, 8, -8, 8, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-4 max-w-[520px] flex items-center gap-3 px-5 py-3 border"
                style={{ borderColor: "rgba(255,45,85,0.2)", background: "rgba(255,45,85,0.04)" }}
              >
                <span className="text-re text-[14px]" style={{ ...fMono, fontWeight: 700 }}>!</span>
                <div className="text-[12px] text-white" style={fMono}>
                  {conflict} <span className="text-g2">— {sessionLabel}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* RIGHT — ELO PANEL */}
        <motion.aside
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
          className="relative bg-bg2 border border-line2 w-full"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px]"
               style={{ background: "linear-gradient(to right,#ff4d1a,#ff6535,transparent)" }} />
          <div className="p-6">
            <div className="text-g2 text-[9px] uppercase tracking-[3px]" style={fMono}>// ELO · Personal rank</div>
            <div className="text-or mt-3" style={{ ...fSyne, fontSize: 62, letterSpacing: "-3px", lineHeight: 1 }}>0</div>
            <div className="text-g1 text-[11px] uppercase tracking-[2px] mt-1" style={fMono}>Rookie</div>
            <div className="mt-5 h-[2px] w-full bg-g3 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-or" style={{ width: "0%" }} />
            </div>
            <div className="flex justify-between mt-2 text-g2 text-[9px]" style={fMono}>
              <span>0</span><span>→ Iron @ 100</span>
            </div>
          </div>
          <div className="border-t border-line">
            {[
              ["ELO personale", "0", "#ff4d1a"],
              ["ELO team", "0", "#22c97a"],
              ["Rank team", "—", "#f5b800"],
              ["Partite giocate", "0", "#ffffff"],
              ["Win rate", "—", "#ffffff"],
            ].map(([k, v, c], i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3 border-b border-line last:border-b-0">
                <span className="text-g2 text-[11px]" style={fBody}>{k}</span>
                <span className="text-[12px]" style={{ ...fMono, fontWeight: 700, color: c as string }}>{v}</span>
              </div>
            ))}
          </div>
        </motion.aside>
      </div>
    </section>
  );
}

/* ───────── MODE SELECTOR ───────── */
const MODES: { num: string; icon: string; name: string; desc: string; tag: string; key: Mode }[] = [
  { num: "01", icon: "◈",   name: "Solo",  key: "Solo",
    desc: "Entra in queue da solo. Skill pura, ELO personale, partite veloci.", tag: "1 player · Bo1" },
  { num: "02", icon: "◈◈",  name: "Duo",   key: "Duo",
    desc: "Forma un duo con un amico. Stessa cup, sinergia in più.", tag: "2 players · Bo1" },
  { num: "03", icon: "◈◈◈", name: "Stack", key: "Stack",
    desc: "Full stack 5v5. Gioca con il tuo team in Open Cup.", tag: "5 players · Bo1" },
];

const MAPS = ["Ascent", "Bind", "Haven", "Lotus", "Sunset", "Split", "Icebox"];

function ModeSelector({ activeMode, onPick }: { activeMode: Mode; onPick: (m: Mode) => void }) {
  return (
    <section className="border-b border-line2">
      <div className="max-w-[1140px] mx-auto px-8 py-20">
        <div className="text-or text-[9px] uppercase tracking-[3px] mb-3" style={fMono}>// 01 · Modalità</div>
        <h2 className="text-white" style={{ ...fSyne, fontSize: "2.5rem", letterSpacing: "-1px" }}>
          Scegli come competere
        </h2>
        <p className="text-g2 text-[13px] mt-2 max-w-[500px]" style={fBody}>
          Tre modalità, una sola Open Cup. Cambia stile, mantieni l'ELO universale.
        </p>

        <div className="mt-10 flex flex-col md:flex-row">
          {MODES.map((m, i) => {
            const active = m.key === activeMode;
            return (
              <button
                key={m.key}
                onClick={() => onPick(m.key)}
                className={`relative flex-1 text-left p-7 border border-line2 ${
                  i > 0 ? "md:border-l-0" : ""
                } md:border-b-0 border-b transition-colors ${active ? "bg-bg3" : "bg-transparent hover:bg-bg2"}`}
              >
                <div
                  className="absolute top-0 left-0 right-0 bg-or transition-all"
                  style={{ height: active ? 2 : 0 }}
                />
                <div className="text-g2 text-[9px] tracking-[3px]" style={fMono}>{m.num}</div>
                <div className="text-white text-[22px] mt-3" style={fBody}>{m.icon}</div>
                <div className="text-white text-[17px] mt-3" style={fSyne}>{m.name}</div>
                <p className="text-g2 text-[11px] mt-2" style={{ ...fBody, lineHeight: 1.7 }}>{m.desc}</p>
                <span
                  className="inline-block mt-5 px-2 py-1 border text-[9px] tracking-[2px]"
                  style={{
                    ...fMono,
                    color: active ? "#ff4d1a" : "#5c5a74",
                    borderColor: active ? "#ff4d1a28" : "#ffffff14",
                    background: active ? "#ff4d1a0d" : "transparent",
                  }}
                >
                  {m.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Map pool */}
        <div className="mt-12 border-t border-line2 pt-8">
          <div className="flex items-center gap-4">
            <span className="text-g2 text-[9px] tracking-[3px]" style={fMono}>POOL MAPS — BO1</span>
            <span className="flex-1 h-px bg-line2" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {MAPS.map((map, i) => {
              const vetoed = i === 6;
              return (
                <span
                  key={map}
                  className="px-3 py-1.5 border text-[11px]"
                  style={{
                    ...fMono,
                    color: vetoed ? "#5c5a74" : "#ff4d1a",
                    borderColor: vetoed ? "#ffffff14" : "#ff4d1a28",
                    background: vetoed ? "transparent" : "#ff4d1a0d",
                    textDecoration: vetoed ? "line-through" : "none",
                    opacity: vetoed ? 0.25 : 1,
                  }}
                >
                  {map}
                </span>
              );
            })}
          </div>
          <div className="mt-5 px-4 py-3 text-[10px] text-g2"
               style={{ ...fMono, borderLeft: "2px solid #ff4d1a", background: "#ff4d1a0d", lineHeight: 1.7 }}>
            // Ogni team veta 1 mappa prima del match. La mappa finale viene sorteggiata tra quelle rimaste.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── TIER PATH ───────── */
const TIERS = [
  {
    n: "TIER 01", icon: "🥉", label: "Open Cup", labelColor: "#ff4d1a",
    name: "Open Cup", desc: "Free entry. Solo / Duo / Stack. ELO universale, partite ufficiali.",
    badge: "● Open Beta", badgeColor: "or",
    stats: [["Format", "Bo1"], ["Mappe", "Pool"], ["ELO ×", "1.0"]],
    active: true, corner: "#ff4d1a", dim: false,
  },
  {
    n: "TIER 02", icon: "🥈", label: "Challenger", labelColor: "#5c5a74",
    name: "Challenger Series", desc: "Sblocca al raggiungimento di Contender. Qualifica per la Championship.",
    badge: "🔒 Locked · Coming Later", badgeColor: "g",
    stats: [["Format", "Bo3"], ["Mappe", "Veto 2+2"], ["ELO ×", "1.5"]],
    active: false, corner: "#ffffff14", dim: true,
  },
  {
    n: "TIER 03", icon: "🏆", label: "Championship", labelColor: "#f5b800",
    name: "Peak Championship", desc: "Invite-only. I top player d'Europa. Premi cash, prestige reale.",
    badge: "⭐ Invite Only · Coming Later", badgeColor: "yw",
    stats: [["Format", "Bo3"], ["Mappe", "Veto 3+3"], ["ELO ×", "2.0"]],
    active: false, corner: "#f5b800", dim: true,
  },
];

function TierPath() {
  return (
    <section className="border-b border-line2">
      <div className="max-w-[1140px] mx-auto px-8 py-20">
        <div className="text-or text-[9px] uppercase tracking-[3px] mb-3" style={fMono}>// 02 · Percorso ranked</div>
        <h2 className="text-white" style={{ ...fSyne, fontSize: "2.5rem", letterSpacing: "-1px" }}>
          Solo Queue Cup Path
        </h2>
        <p className="text-g2 text-[13px] mt-2 max-w-[500px]" style={fBody}>
          Tre tier, una progressione. Inizia in Open Cup, scala verso la Championship.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-line2">
          {TIERS.map((t, i) => (
            <motion.div
              key={t.n}
              initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`relative p-8 ${t.active ? "bg-bg2" : "bg-bg"}`}
              style={{ opacity: t.dim ? 0.45 : 1 }}
            >
              {/* corner triangle */}
              <div className="absolute top-0 right-0"
                   style={{
                     width: 0, height: 0,
                     borderTop: `28px solid ${t.corner}`,
                     borderLeft: "28px solid transparent",
                   }} />
              <div className="text-g2 text-[9px] tracking-[3px]" style={fMono}>{t.n}</div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[16px]">{t.icon}</span>
                <span className="text-[9px] tracking-[3px]" style={{ ...fMono, color: t.labelColor }}>{t.label}</span>
              </div>
              <h3 className="text-white mt-3" style={{ ...fSyne, fontSize: "1.7rem", letterSpacing: "-0.5px" }}>
                {t.name}
              </h3>
              <p className="text-g2 text-[12px] mt-3" style={{ ...fBody, lineHeight: 1.7 }}>{t.desc}</p>
              <span
                className="inline-block mt-5 px-2.5 py-1 border text-[9px] tracking-[2px]"
                style={{
                  ...fMono,
                  color: t.badgeColor === "or" ? "#ff4d1a" : t.badgeColor === "yw" ? "#f5b800" : "#5c5a74",
                  borderColor: t.badgeColor === "or" ? "#ff4d1a28" : t.badgeColor === "yw" ? "#f5b800" : "#ffffff14",
                  background: t.badgeColor === "or" ? "#ff4d1a0d" : t.badgeColor === "yw" ? "#f5b8000d" : "transparent",
                }}
              >
                {t.badge}
              </span>
              <div className="mt-6 pt-5 border-t border-line grid grid-cols-3 gap-3">
                {t.stats.map(([k, v]) => (
                  <div key={k}>
                    <div className="text-g2 text-[9px] tracking-[2px]" style={fMono}>{k}</div>
                    <div className="text-white text-[13px] mt-1" style={{ ...fMono, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── TEAM ELO ───────── */
function TeamElo() {
  const rows: { t: string; f: string; fc: string; e: string; ec: string }[] = [
    { t: "Open Cup Team",     f: "Bo1", fc: "#ff4d1a", e: "±25",  ec: "#22c97a" },
    { t: "League Season",     f: "Bo2", fc: "#8f8da8", e: "±40",  ec: "#22c97a" },
    { t: "Challenger Cup",    f: "Bo3", fc: "#a78bfa", e: "±60",  ec: "#22c97a" },
    { t: "Peak Championship", f: "Bo5", fc: "#f5b800", e: "±100", ec: "#f5b800" },
  ];
  return (
    <section className="border-b border-line2">
      <div className="max-w-[1140px] mx-auto px-8 py-20">
        <div className="text-or text-[9px] uppercase tracking-[3px] mb-3" style={fMono}>// 03 · Team Tournaments</div>
        <h2 className="text-white" style={{ ...fSyne, fontSize: "2.5rem", letterSpacing: "-1px" }}>
          ELO doppio
        </h2>
        <p className="text-g2 text-[13px] mt-2 max-w-[600px]" style={fBody}>
          Personale + team — indipendenti, aggiornati insieme ad ogni partita ufficiale.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-px bg-line2">
          {/* Team card */}
          <div className="bg-bg p-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border flex items-center justify-center"
                   style={{ background: "#22c97a0d", borderColor: "#22c97a28" }}>
                <span className="text-gr text-[14px]" style={{ ...fMono, fontWeight: 700 }}>NF</span>
              </div>
              <div>
                <div className="text-white text-[20px]" style={fSyne}>NexusForce</div>
                <div className="text-g2 text-[11px]" style={fMono}>5 membri · Capitano: YourName</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line2">
              {[
                ["TEAM ELO", "840", "#22c97a"],
                ["RANK", "Silver II", "#f5b800"],
                ["PARTITE", "12", "#ffffff"],
                ["W/L", "8/4", "#ffffff"],
              ].map(([k, v, c]) => (
                <div key={k} className="bg-bg2 px-3 py-4 text-center">
                  <div className="text-g2 text-[8px] tracking-[2px]" style={fMono}>{k}</div>
                  <div className="text-[18px] mt-2" style={{ ...fMono, fontWeight: 700, color: c as string }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 px-4 py-3 text-[10px] text-g1"
                 style={{ ...fMono, borderLeft: "2px solid #ff4d1a", background: "#ff4d1a0d", lineHeight: 1.7 }}>
              <span className="text-or">ELO doppio:</span> ogni risultato in torneo team aggiorna sia
              il tuo ELO personale che quello del team. Due rank, una sola partita.
            </div>
          </div>

          {/* Format table */}
          <div className="bg-bg p-8">
            <div className="text-g2 text-[9px] tracking-[3px] mb-5" style={fMono}>// Formati tornei team</div>
            <table className="w-full" style={fBody}>
              <thead>
                <tr className="text-g2 text-[9px] tracking-[2px]" style={fMono}>
                  <th className="text-left pb-3 border-b border-line">TORNEO</th>
                  <th className="text-left pb-3 border-b border-line">FORMATO</th>
                  <th className="text-right pb-3 border-b border-line">ELO TEAM</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.t} className="border-b border-line group transition-colors hover:bg-bg2">
                    <td className="py-3 text-white text-[12px] group-hover:pl-1 transition-all">{r.t}</td>
                    <td className="py-3">
                      <span
                        className="px-2 py-0.5 border text-[9px] tracking-[2px]"
                        style={{ ...fMono, color: r.fc, borderColor: r.fc + "44" }}
                      >
                        {r.f}
                      </span>
                    </td>
                    <td className="py-3 text-right text-[12px]" style={{ ...fMono, fontWeight: 700, color: r.ec }}>
                      {r.e}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── PAGE ───────── */
export default function Tournaments() {
  const [inQueue, setInQueue] = useState(false);
  const [activeMode, setActiveMode] = useState<Mode>("Solo");
  const [seconds, setSeconds] = useState(0);
  const [conflict, setConflict] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState("");
  const conflictTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!inQueue) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [inQueue]);

  const showConflict = (msg: string) => {
    setConflict(msg);
    setSessionLabel(`Open Cup · ${activeMode}`);
    if (conflictTimer.current) window.clearTimeout(conflictTimer.current);
    conflictTimer.current = window.setTimeout(() => setConflict(null), 3500);
  };

  const handleJoin = () => {
    if (inQueue) return showConflict("Sei già in una sessione attiva");
    setSeconds(0);
    setInQueue(true);
  };

  const leaveQueue = () => {
    setInQueue(false);
    setSeconds(0);
  };

  const handleTab = (m: Mode) => {
    if (inQueue) return showConflict("Esci dalla queue per cambiare modalità");
    setActiveMode(m);
  };

  return (
    <div
      className="min-h-screen bg-bg text-white"
      style={{
        ...fBody,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent 0 51px, rgba(255,255,255,0.04) 51px 52px), repeating-linear-gradient(90deg, transparent 0 51px, rgba(255,255,255,0.04) 51px 52px)",
      }}
    >
      <SEO title="Ranked & Tournaments — PeakGG" description="Open Cup → Challenger → Peak Championship. ELO universale, percorso unico." />
      <Nav />
      <Hero
        inQueue={inQueue} activeMode={activeMode} seconds={seconds}
        conflict={conflict} sessionLabel={sessionLabel}
        onJoin={handleJoin} onLeave={leaveQueue} onTab={handleTab}
      />
      <ModeSelector activeMode={activeMode} onPick={handleTab} />
      <TierPath />
      <TeamElo />
    </div>
  );
}
