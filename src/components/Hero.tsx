import { useTranslation } from "react-i18next";

import characterArtwork from "../assets/hero-character.svg";
import { featuredTournament, playersOnline } from "../data/mock";
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
  const tournamentDate = formatTournamentDate(featuredTournament.date, i18n.language);
  const tournamentNumber = String(featuredTournament.number).padStart(3, "0");

  return (
    <section data-section="hero" className="peak-hero">
      <aside className="peak-hero-rail" aria-label={t("hero.sectionNumber")}>
        <span className="peak-hero-number">{t("hero.sectionNumber")}</span>
        <div className="peak-hero-rail-words">
          <span>{t("hero.rail.compete")}</span>
          <span>{t("hero.rail.improve")}</span>
          <span>{t("hero.rail.belong")}</span>
        </div>
      </aside>

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
          <a className="peak-hero-cta peak-hero-cta-secondary" href="#trailer">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m5.5 3 6 5-6 5V3Z" />
            </svg>
            {t("hero.watchTrailer")}
          </a>
        </div>

        <div className="peak-hero-status">
          <div className="peak-hero-avatars" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
          <span>{t("hero.playersOnline", { count: playersOnline.toLocaleString("en-US") })}</span>
        </div>
      </div>

      <div className="peak-hero-artwork" aria-hidden="true">
        <div className="peak-hero-backlight" />
        <img src={characterArtwork} alt="" />
        <div className="peak-hero-grain" />
      </div>

      <aside className="peak-hero-event">
        <div className="peak-hero-event-head">
          <span>{t("hero.tournament.label")}</span>
          <a href="#tournaments" aria-label={t("hero.tournament.open")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M14 7l5 5-5 5" />
            </svg>
          </a>
        </div>

        <div className="peak-hero-event-title">
          <span>{t(featuredTournament.titleKey)}</span>
          <span>#{tournamentNumber}</span>
        </div>

        <div className="peak-hero-event-meta">
          <span>{tournamentDate}</span>
          <span>{featuredTournament.time} {featuredTournament.timezone}</span>
        </div>

        <div className="peak-hero-event-visual">
          <div className="peak-hero-event-thumb" role="img" aria-label={t("hero.tournament.thumbnailAlt")}>
            <span>#{tournamentNumber}</span>
          </div>
          <div className="peak-hero-event-script" aria-hidden="true">
            <span>{t("hero.tournament.play")}</span>
            <span>{t("hero.tournament.compete")}</span>
            <span>{t("hero.tournament.improve")}</span>
          </div>
        </div>
      </aside>
    </section>
  );
}