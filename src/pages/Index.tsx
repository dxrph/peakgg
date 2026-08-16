import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Ticker } from "@/components/system";
import HomeHero from "@/components/home/HomeHero";
import NextCupModule from "@/components/home/NextCupModule";
import PathModule from "@/components/home/PathModule";
import RosterModule from "@/components/home/RosterModule";
import RanksModule from "@/components/home/RanksModule";
import LadderModule from "@/components/home/LadderModule";
import CommunityModule from "@/components/home/CommunityModule";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PeakGG",
  url: "https://peakgg.net",
  logo: "https://peakgg.net/logo.png",
  description:
    "Competitive Valorant platform — cups, teams, free agents and the Peak rating system for European players.",
  email: "peakgg.official@gmail.com",
  foundingDate: "2026",
  foundingLocation: "Brussels, Belgium",
  sameAs: ["https://discord.gg/peakgg"],
};

const siteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PeakGG",
  url: "https://peakgg.net",
};

const TICKER = [
  <>
    <b>Community Cup #1</b> <i>registration open</i>
  </>,
  <>
    <b>Free agent board</b> live
  </>,
  <>
    <i>Peak rating</i> season 1
  </>,
  <>
    <b>5v5</b> single elimination
  </>,
  <>
    Valorant <i>live</i> · CS2 soon · R6 soon
  </>,
];

export default function Index() {
  return (
    <div className="page-shell">
      <SEO
        title="PeakGG — Competitive Valorant Cups & Ladder"
        description="Build a roster, enter verified Valorant cups and climb the Peak rating. Competitive play for European players, no org required."
        keywords="PeakGG, competitive Valorant, Valorant tournaments, Valorant teams Europe, free agents, Peak rating, Open Cup"
        path="/"
        jsonLd={[orgSchema, siteSchema]}
      />
      <Navbar />
      <main>
        <HomeHero />
        <Ticker items={TICKER} />
        <NextCupModule />
        <PathModule />
        <RosterModule />
        <RanksModule />
        <LadderModule />
        <CommunityModule />
      </main>
      <Footer hideCta />
    </div>
  );
}
