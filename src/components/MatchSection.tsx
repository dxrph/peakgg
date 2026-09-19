import { useState } from "react";
import { useTranslation } from "react-i18next";
import art from "../assets/peak-hero-cinematic.jpg";
export default function MatchSection() { const { t } = useTranslation(); const [open,setOpen]=useState(false); return <section className="editorial-section match-section">
  <div className="match-word"><span className="section-kicker">03 / {t("match.kicker")}</span><h2>{t("match.live")}</h2></div>
  <div className="score-panel"><span className="demo-label">{t("match.demo")}</span><div><b>VOID</b><strong>11</strong></div><span className="score-map">ASCENT / BO1</span><div><b>KOVA</b><strong>09</strong></div><button type="button" className="peak-button peak-button-outline" onClick={() => setOpen((v)=>!v)}>{t("match.cta")}</button>{open && <p className="format-info">{t("match.info")}</p>}</div>
  <div className="match-image"><img src={art} alt="" /></div>
  </section>; }