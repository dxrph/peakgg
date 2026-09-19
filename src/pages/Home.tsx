import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import AuthDialog, { type AuthMode } from "../components/AuthDialog";
import EnterPeakSection from "../components/EnterPeakSection";
import FindFiveSection from "../components/FindFiveSection";
import Hero from "../components/Hero";
import LiveStrip from "../components/LiveStrip";
import MatchSection from "../components/MatchSection";
import MomentsSection from "../components/MomentsSection";
import Navbar from "../components/Navbar";
import OpenCupSection from "../components/OpenCupSection";
import RankSection from "../components/RankSection";
import SearchOverlay from "../components/SearchOverlay";
import UpcomingSection from "../components/UpcomingSection";
import "../styles/home.css";

export default function Home() {
  const { t } = useTranslation();
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authOpen, setAuthOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const openAuth = useCallback((mode: AuthMode) => { setAuthMode(mode); setAuthOpen(true); }, []);
  return (
    <div className="home-root">
      <a className="skip-link" href="#main-content">{t("home.skip")}</a>
      <Navbar onSearch={() => setSearchOpen(true)} onAuth={openAuth} />
      <main id="main-content" tabIndex={-1}>
        <Hero onEnter={() => openAuth("signup")} />
        <LiveStrip />
        <OpenCupSection onRegister={() => openAuth("signup")} />
        <MatchSection />
        <RankSection />
        <FindFiveSection />
        <MomentsSection />
        <UpcomingSection onRegister={() => openAuth("signup")} />
        <EnterPeakSection onEnter={() => openAuth("signup")} />
      </main>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AuthDialog open={authOpen} mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
