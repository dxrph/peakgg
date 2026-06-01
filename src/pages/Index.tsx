import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import HeroSection from "@/components/landing/HeroSection";
import CommunityCupBanner from "@/components/landing/CommunityCupBanner";
import PlatformStatsStrip from "@/components/landing/PlatformStatsStrip";
import StartCompetingSection from "@/components/landing/StartCompetingSection";
import PreLaunchCTA from "@/components/landing/PreLaunchCTA";
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
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="PeakGG — Compete. Rise. Dominate. | Competitive Valorant Platform"
        description="PeakGG is the competitive Valorant platform for serious European players. Ranked Open Cup tournaments, teams, free agents and the Peak rank system."
        keywords="PeakGG, competitive Valorant, Valorant tournaments, Valorant ranked, esports platform Belgium, Valorant teams Europe, Valorant free agents, Valorant ELO system, Open Cup"
        path="/"
        jsonLd={[orgSchema, siteSchema]}
      />
      <Navbar />
      <main>
        <HeroSection />
        <CommunityCupBanner />
        <PreLaunchCTA />
        <StartCompetingSection />
        <PlatformStatsStrip />
        <FeaturesSection />
        <HowItWorksSteps />
        <section className="container py-16 md:py-20">
          <ProgressionPath />
        </section>
        <RankShowcase />
        <TopPlayersWeek />
        <DiscordCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
