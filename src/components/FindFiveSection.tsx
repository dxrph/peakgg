import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { rosterSlots, valorant } from "../data/mock";
import art from "../assets/peak-hero-cinematic.jpg";
export default function FindFiveSection() { const {t}=useTranslation(); const [show,setShow]=useState(false); const [role,setRole]=useState("all"); const [region,setRegion]=useState("all"); const filtered=useMemo(()=>rosterSlots.filter(s=>(role==="all"||s.role===role)&&(region==="all"||s.region===region)),[role,region]); return <section id="teams" className="editorial-section five-section">
  <header><span className="section-kicker">05 / {t("five.kicker")}</span><h2>{t("five.title")}</h2><p>{t("five.copy")}</p><button className="peak-button peak-button-primary" type="button" onClick={()=>setShow((v)=>!v)}>{t("five.cta")}</button></header>
  {show&&<div className="five-filters"><label>{t("five.role")}<select value={role} onChange={e=>setRole(e.target.value)}><option value="all">{t("five.all")}</option>{valorant.roles.map(r=><option key={r}>{r}</option>)}</select></label><label>{t("five.region")}<select value={region} onChange={e=>setRegion(e.target.value)}><option value="all">{t("five.all")}</option><option>EU West</option><option>EU Central</option></select></label></div>}
  <div className="roster-row">{filtered.map((slot,index)=><article key={slot.id}><span>0{index+1}</span><div className="roster-mark">+</div><h3>{slot.role}</h3><b>{t("five.openSlot")}</b><p>{t("five.sample")} / {slot.rank}<br/>{slot.region} / {slot.language}</p></article>)}</div>
  <div className="five-art"><img src={art} alt="" loading="lazy" width={1920} height={1080}/><p className="hand-note">{t("five.note")}</p></div>
  </section>; }