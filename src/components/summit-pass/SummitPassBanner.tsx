import { useEffect, useState } from "react";
import "./summit-pass.css";
import { defaultSummitPass } from "./config";
import type { SummitPassConfig } from "./types";

type Props = { config?: Partial<SummitPassConfig> };

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function useCountdown(targetIso: string) {
  const [parts, setParts] = useState(() => compute(targetIso));
  useEffect(() => {
    const id = setInterval(() => setParts(compute(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return parts;
}

function compute(targetIso: string) {
  const target = new Date(targetIso).getTime();
  let d = Math.max(0, target - Date.now());
  const days = Math.floor(d / 864e5); d -= days * 864e5;
  const h = Math.floor(d / 36e5); d -= h * 36e5;
  const m = Math.floor(d / 6e4); d -= m * 6e4;
  const s = Math.floor(d / 1e3);
  return { days, h, m, s };
}

const TOPO_PATHS = [
  { len: 1400, d: "M120,470 C80,380 110,300 190,260 C280,215 340,230 400,180 C460,130 470,90 520,70 C560,55 600,60 618,68" },
  { len: 1300, d: "M170,470 C140,400 165,330 235,292 C310,252 360,262 412,216 C462,172 474,138 516,118 C552,102 588,106 618,112" },
  { len: 1200, d: "M225,470 C200,415 222,358 282,324 C348,288 384,294 430,252 C472,214 484,184 518,166 C548,150 584,152 618,156" },
  { len: 1050, d: "M285,470 C265,425 284,382 336,352 C392,322 414,326 452,290 C488,256 498,230 526,214 C552,198 588,198 618,200", hot: true },
  { len: 900, d: "M345,470 C330,432 348,398 392,374 C438,348 452,350 482,322 C512,294 520,274 542,260 C566,244 596,244 618,246" },
  { len: 760, d: "M408,470 C398,440 412,414 448,394 C486,372 494,372 518,350 C540,330 548,314 566,302 C586,290 606,290 618,292" },
];

export default function SummitPassBanner({ config }: Props) {
  const cfg: SummitPassConfig = { ...defaultSummitPass, ...config };
  const cd = useCountdown(cfg.countdownTarget);

  const remaining = Math.max(0, cfg.slotsTotal - cfg.slotsFilled);
  const warningText =
    cfg.slotsWarning ??
    (remaining > 0 ? `${remaining} spots before the window shuts` : "No spots left — window shut");

  // route checkpoint positions across the SVG (0..560)
  const cps = cfg.checkpoints.length;
  const xs = Array.from({ length: cps }, (_, i) => 8 + (i * (532 / Math.max(1, cps - 1))));
  const ys = Array.from({ length: cps }, (_, i) => 64 - (i * (54 / Math.max(1, cps - 1))));

  const altitudeLabels = cfg.altitudeLines ?? defaultSummitPass.altitudeLines!;
  // y positions roughly aligned with the contours
  const labelYs = [62, 110, 160, 208];

  return (
    <article className="summit-pass" aria-label={`PeakGG ${cfg.titleLine1} ${cfg.titleLine2} ${cfg.titleAccent} — Summit Pass`}>
      {/* MAIN */}
      <div className="sp-main">
        <span className="sp-punch" />

        <svg className="sp-topo" viewBox="0 0 620 480" aria-hidden="true">
          {TOPO_PATHS.map((p, i) => (
            <path
              key={i}
              d={p.d}
              className={p.hot ? "hot" : undefined}
              style={{ ["--len" as never]: p.len } as React.CSSProperties}
            />
          ))}
          {altitudeLabels.slice(0, 4).map((a, i) => (
            <text
              key={a.rank}
              x={500 + i * 6}
              y={labelYs[i] ?? 62 + i * 48}
              className={a.hot ? "hot" : undefined}
            >
              {a.elo} — {a.rank}
            </text>
          ))}
          <text className="summit-x" x="588" y="46">▲ APEX</text>
        </svg>

        <div className="sp-permit-head">
          <span><b>PeakGG</b> · Expedition permit</span>
          <span>Route <b>{cfg.routeLabel}</b></span>
          <span className="no">{cfg.permitNumber}</span>
        </div>

        <div className="sp-title">
          <div className="sp-pre">Summit objective — {cfg.game}</div>
          <h1 className="sp-h1">
            <span className="row"><span>{cfg.titleLine1}</span></span>
            <span className="row"><span>{cfg.titleLine2}{cfg.titleAccent ? <> <em>{cfg.titleAccent}</em></> : null}</span></span>
          </h1>
          <p className="sp-sub">{cfg.description}</p>
        </div>

        <div className="sp-route">
          <svg viewBox="0 0 560 74" preserveAspectRatio="none" aria-hidden="true">
            <path className="trail" d={`M${xs[0]},${ys[0]} C120,60 280,38 ${xs[xs.length - 1]},${ys[ys.length - 1]}`} />
            {cfg.checkpoints.map((cp, i) => {
              const isLast = i === cfg.checkpoints.length - 1;
              return (
                <g key={i}>
                  {isLast && <path className="flag" d={`M${xs[i]},${ys[i]} l0,-10 l9,3 l-9,3 Z`} />}
                  <circle
                    className={`cp${cp.done ? " done" : ""}${isLast ? " last" : ""}`}
                    cx={xs[i]}
                    cy={ys[i]}
                    r={4}
                  />
                </g>
              );
            })}
          </svg>
          <div className="sp-route-labels">
            {cfg.checkpoints.map((cp, i) => (
              <span key={i} className={i === cfg.checkpoints.length - 1 ? "last" : undefined}>
                <b>{cp.label}</b> · {cp.sub}
              </span>
            ))}
          </div>
        </div>

        <div className="sp-form">
          {cfg.formLines.map((f, i) => (
            <div className="sp-fline" key={i}>
              <span className="k">{f.key}</span>
              <span className="dots" />
              <span className={`v${f.valueColor === "green" ? " green" : ""}`}>
                {f.value}
                {f.valueSub ? <small>{f.valueSub}</small> : null}
              </span>
            </div>
          ))}
        </div>

        {cfg.stamp.show && (
          <div
            className={`sp-stamp${cfg.stamp.line1?.toLowerCase() === "summited" ? " summited" : ""}`}
            aria-hidden="true"
          >
            {cfg.stamp.line1}
            <small>{cfg.stamp.line2}</small>
          </div>
        )}
      </div>

      {/* PERFORATION */}
      <div className="sp-perf">
        <span className="sp-notch top" />
        <span className="sp-notch bot" />
      </div>

      {/* STUB */}
      <div className="sp-stub">
        <div className="sp-stub-head">
          <span>Summit pass</span>
          <b>Keep stub</b>
        </div>

        <div className="sp-cd" aria-live="off">
          <div className="lbl">{cfg.countdownLabel}</div>
          <div className="time">
            {pad(cd.days)}<span className="col">:</span>
            {pad(cd.h)}<span className="col">:</span>
            {pad(cd.m)}<span className="col">:</span>
            {pad(cd.s)}
          </div>
          <div className="units">
            <span>Days</span><span>Hrs</span><span>Min</span><span>Sec</span>
          </div>
        </div>

        <div className="sp-slots">
          <div className="lbl">
            <span>{cfg.slotsLabel}</span>
            <b>{cfg.slotsFilled} / {cfg.slotsTotal}</b>
          </div>
          <div className="sp-holes">
            {Array.from({ length: cfg.slotsTotal }).map((_, i) => (
              <span
                key={i}
                className={`sp-hole${i < cfg.slotsFilled ? " p" : ""}`}
                style={{ animationDelay: `${1.6 + i * 0.05}s` }}
              />
            ))}
          </div>
          {remaining > 0 && <div className="sp-holes-note">{warningText}</div>}
        </div>

        <div className="sp-barcode">
          <div className="bars" aria-hidden="true" />
          <div className="serial">{cfg.serial}</div>
        </div>

        <a href={cfg.ctaHref} className="sp-tear">
          <span className="t1">{cfg.ctaText}</span>
          <span className="t2">{cfg.ctaHoverText}</span>
        </a>
      </div>
    </article>
  );
}