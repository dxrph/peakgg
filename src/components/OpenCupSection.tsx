import { useTranslation } from "react-i18next";
import art from "../assets/peak-hero-cinematic.jpg";
import { featuredTournament } from "../data/mock";
interface Props { onRegister: () => void }
export default function OpenCupSection({ onRegister }: Props) { const { t } = useTranslation(); return <section id="tournaments" className="editorial-section cup-section">
  <div className="cup-copy"><span className="section-kicker">02 / {t("cup.kicker")}</span><span className="hand-note">{t("cup.nextStop")}</span><h2>{t("cup.title")} <em>#{String(featuredTournament.number).padStart(3,"0")}</em></h2><div className="section-meta"><span>{featuredTournament.region} / {featuredTournament.slots} {t("cup.teams")}</span><span>VALORANT / {featuredTournament.format}</span></div><button className="peak-button peak-button-outline" type="button" onClick={onRegister}>{t("cup.cta")} ↗</button></div>
  <div className="cup-visual"><img src={art} alt="" /><span className="hand-note">{t("cup.map")}</span></div>
  <div className="cup-crops"><div><img src={art} alt="" /></div><div><img src={art} alt="" /></div><div><img src={art} alt="" /></div><p className="hand-note">{t("cup.standard")}</p></div>
  </section>; }