import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import characterArtwork from "../assets/peak-hero-cinematic.jpg";
import { featuredTournament } from "../data/mock";
import "../styles/hero.css";

const formatTournamentDate = (date: string, language: string) => {
  const locale = language.startsWith("it") ? "it-IT" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T00:00:00Z`))
    .replace(/\./g, "")
    .toUpperCase();
};

export default function Hero() {
  const { t, i18n } = useTranslation();
  const heroRef = useRef<HTMLElement>(null);
  const tournamentDate = formatTournamentDate(featuredTournament.date, i18n.language);
  const tournamentNumber = String(featuredTournament.number).padStart(3, "0");

  useEffect(() => {
    const updateNavbar = () => {
      const hero = heroRef.current;
      if (!hero) return;
      document.body.classList.toggle("hero-nav-overlay", hero.getBoundingClientRect().bottom > 56);
    };

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });
    window.addEventListener("resize", updateNavbar);
    return () => {
      document.body.classList.remove("hero-nav-overlay");
      window.removeEventListener("scroll", updateNavbar);
      window.removeEventListener("resize", updateNavbar);
    };
  }, []);

  return (
    <section ref={heroRef} id="compete" data-section="hero" className="peak-hero">
      <div className="peak-hero-background" aria-hidden="true">
        <div className="peak-hero-backlight" />
        <img src={characterArtwork} alt="" width={1920} height={1080} />
        <div className="peak-hero-grain" />
        <div className="peak-hero-shade" />
      </div>

      <div className="peak-hero-left">
        <div className="peak-hero-left-top">
          <div className="peak-hero-micro" aria-label={t("hero.sectionNumber")}>
            <span className="peak-hero-number">{t("hero.sectionNumber")}</span>
            <div className="peak-hero-rail-words">
              <span>{t("hero.rail.compete")}</span>
              <span>{t("hero.rail.improve")}</span>
              <span>{t("hero.rail.belong")}</span>
            </div>
          </div>

          <div className="peak-hero-main">
            <div className="peak-hero-heading-wrap">
              <h1 className="peak-hero-heading">
                <span>{t("hero.headline.prove")}</span>
                <span>{t("hero.headline.you")}</span>
                <span>
                  {t("hero.headline.belong")}<b aria-hidden="true">.</b>
                </span>
              </h1>
              <span className="peak-hero-note">{t("hero.note")}</span>
            </div>

            <p className="peak-hero-copy">{t("hero.copy")}</p>

            <div className="peak-hero-ctas">
              <a className="peak-hero-cta peak-hero-cta-primary" href="#enter">
                {t("hero.enterPeak")}
              </a>
              <a className="peak-hero-cta peak-hero-cta-secondary" href="#tournaments">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 7h9L8 4l1-1 5 5-5 5-1-1 3-3H2V7Z" />
                </svg>
                {t("hero.exploreTournaments")}
              </a>
            </div>
          </div>
        </div>

        <div className="peak-hero-status">
          <div className="peak-hero-avatars" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
          <span>{t("hero.previewStatus")}</span>
        </div>
      </div>

      <aside className="peak-hero-event">
        <div className="peak-hero-event-head">
          <span>{t("hero.tournament.previewLabel")}</span>
        </div>

        <div className="peak-hero-event-title">
          <span>{t(featuredTournament.titleKey)}</span>
          <span>#{tournamentNumber}</span>
        </div>

        <div className="peak-hero-event-info">
          <div className="peak-hero-event-meta">
            <span>{tournamentDate}</span>
            <span>{featuredTournament.time} {featuredTournament.timezone}</span>
          </div>
          <a href="#tournaments" aria-label={t("hero.tournament.open")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M14 7l5 5-5 5" />
            </svg>
          </a>
        </div>

        <div className="peak-hero-event-visual">
          <div className="peak-hero-event-thumb" role="img" aria-label={t("hero.tournament.thumbnailAlt")}>
            <img src={characterArtwork} alt="" />
          </div>
        </div>
        <div className="peak-hero-event-script" aria-hidden="true">
          <span>{t("hero.tournament.play")}</span>
          <span>{t("hero.tournament.compete")}</span>
          <span>{t("hero.tournament.improve")}</span>
        </div>
      </aside>
    </section>
  );
}
