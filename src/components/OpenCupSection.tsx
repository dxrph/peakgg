import { useTranslation } from "react-i18next";
import art from "../assets/peak-hero-cinematic.jpg";
import arena from "../assets/peak-arena-editorial.jpg";
import { featuredTournament } from "../data/mock";
interface Props { onRegister: () => void }
export default function OpenCupSection({ onRegister }: Props) { const { t } = useTranslation(); return <section id="tournaments" className="editorial-section cup-section">
  <div className="cup-strip"><img src={art} alt="" loading="lazy" width={1920} height={1080}/><span className="hand-note">{t("cup.nextStop")}</span></div>
  <div className="cup-copy"><span className="section-kicker">02 / {t("cup.kicker")}</span><span className="hand-note">{t("cup.nextStop")}</span><span className="cup-star" aria-hidden="true">＊</span><h2><span>{t("cup.titleOpen")}</span><span>{t("cup.titleCup")}</span><em>#{String(featuredTournament.number).padStart(3,"0")}</em></h2><div className="section-meta"><span>{featuredTournament.region} / {featuredTournament.slots} {t("cup.teams")}</span><span>VALORANT / {featuredTournament.format}</span></div><button className="peak-button peak-button-outline" type="button" onClick={onRegister}>{t("cup.cta")} ↗</button></div>
  <div className="cup-visual"><img src={arena} alt="" loading="lazy" width={1600} height={1000}/><span className="hand-note">{t("cup.map")}</span></div>
  <div className="cup-crops"><div><img src={art} alt="" loading="lazy" width={1920} height={1080}/></div><div><img src={arena} alt="" loading="lazy" width={1600} height={1000}/></div><div><img src={art} alt="" loading="lazy" width={1920} height={1080}/></div><p className="hand-note">{t("cup.standard")}</p></div>
  </section>; }