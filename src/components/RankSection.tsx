import { useState } from "react";
import { useTranslation } from "react-i18next";
import { rankNames } from "../data/mock";
export default function RankSection() { const { t }=useTranslation(); const [selected,setSelected]=useState<string | null>(null); return <section id="players" className="editorial-section rank-section">
  <header><span className="section-kicker">04 / {t("rank.kicker")}</span><h2>{t("rank.title")}</h2><p>{t("rank.copy")}</p></header>
  <div className="rank-track" tabIndex={-1}>{rankNames.map((rank,index)=><button type="button" key={rank} className={index===rankNames.length-1?"is-apex":""} onClick={()=>setSelected(rank)} aria-label={`${t("rank.select")} ${rank}`}><span className="rank-badge"><i /><i /></span><b>{rank}</b><small>0{index+1}</small></button>)}</div>
  <button className="peak-button peak-button-outline" type="button" onClick={()=>{ setSelected(rankNames[0]); document.querySelector<HTMLElement>(".rank-track")?.focus(); }}>{t("rank.cta")}</button>
  <aside><span>{t("rank.profile")}</span><strong>{selected ?? t("rank.slot")}</strong><p>{selected ? t("rank.selected",{rank:selected}) : t("rank.preview")}</p></aside>
  </section>; }