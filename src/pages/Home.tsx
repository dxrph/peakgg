import { useTranslation } from "react-i18next";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import "../styles/home.css";

const sections = ["tournaments", "players", "teams", "community"] as const;

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="home-root">
      <a className="skip-link" href="#main-content">{t("home.skip")}</a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <div className="home-sections">
          {sections.map((id, index) => (
            <section key={id} id={id} className="home-section" aria-labelledby={`${id}-title`}>
              <span className="home-section-number">0{index + 2} / {t("home.preview")}</span>
              <h2 id={`${id}-title`}>{t(`home.${id}.title`)}</h2>
              <p>{t(`home.${id}.copy`)}</p>
              <span className="home-section-status">{t(`home.${id}.status`)}</span>
            </section>
          ))}
        </div>
        <section id="enter" className="home-entry" aria-labelledby="entry-title">
          <p className="font-label">{t("home.preview")}</p>
          <h2 id="entry-title">ENTER PEAK.</h2>
          <p id="signin">{t("home.entryStatus")}</p>
          <a className="site-nav-cta" href="#compete">{t("home.backTop")} ↑</a>
        </section>
      </main>
      <footer className="home-footer"><a href="/">PEAKGG</a><span>{t("home.footer")}</span></footer>
    </div>
  );
}
