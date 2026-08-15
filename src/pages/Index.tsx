import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import HeroSection from "@/components/landing/HeroSection";
import StartCompetingSection from "@/components/landing/StartCompetingSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSteps from "@/components/landing/HowItWorksSteps";
import ProgressionPath from "@/components/landing/ProgressionPath";
import RankShowcase from "@/components/landing/RankShowcase";
import TopPlayersWeek from "@/components/landing/TopPlayersWeek";
import Footer from "@/components/landing/Footer";
import DiscordCTA from "@/components/landing/DiscordCTA";

const Index = () => {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PeakGG",
    url: "https://peakgg.net",
    logo: "https://peakgg.net/logo.png",
    description: "Competitive Valorant platform — ranked, tournaments, teams and free agents for serious players in Europe.",
    email: "peakgg.official@gmail.com",
    foundingDate: "2026",
    foundingLocation: "Brussels, Belgium",
    sameAs: [
      "https://instagram.com/peakgg",
      "https://tiktok.com/@peakgg",
      "https://x.com/peakgg",
      "https://discord.gg/peakgg",
    ],
  };
  const siteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PeakGG",
    url: "https://peakgg.net",
  };

  return (
    <div className="page-shell overflow-hidden">
      <SEO
        title="PeakGG — Competitive Valorant Platform"
        description="Competitive Valorant for serious European players: ranked Open Cup tournaments, teams, free agents and the Peak rank system."
        keywords="PeakGG, competitive Valorant, Valorant tournaments, Valorant ranked, esports platform Belgium, Valorant teams Europe, Valorant free agents, Valorant ELO system, Open Cup"
        path="/"
        jsonLd={[orgSchema, siteSchema]}
      />
      <Navbar />
      <main>
        <HeroSection />
        <div className="signal-marquee" aria-hidden>
          <div>PLAY YOUR ROLE • BUILD YOUR ROSTER • ENTER THE CUP • CLIMB THE PEAK • PLAY YOUR ROLE • BUILD YOUR ROSTER • ENTER THE CUP • CLIMB THE PEAK •</div>
        </div>
        <section className="editorial-section" data-index="01"><StartCompetingSection /></section>
        <section className="editorial-section" data-index="02"><FeaturesSection /></section>
        <section className="editorial-section" data-index="03"><HowItWorksSteps /></section>
        <section className="container py-16 md:py-24 editorial-section" data-index="04">
          <div className="paper-cut p-5 md:p-10"><ProgressionPath /></div>
        </section>
        <section className="editorial-section" data-index="05"><RankShowcase /></section>
        <section className="editorial-section" data-index="06"><TopPlayersWeek /></section>
        <section className="editorial-section" data-index="07"><DiscordCTA /></section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

