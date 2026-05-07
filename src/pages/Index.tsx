import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import HeroSection from "@/components/landing/HeroSection";
import PlatformStatsStrip from "@/components/landing/PlatformStatsStrip";
import StartCompetingSection from "@/components/landing/StartCompetingSection";
import PreLaunchCTA from "@/components/landing/PreLaunchCTA";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSteps from "@/components/landing/HowItWorksSteps";
import RankShowcase from "@/components/landing/RankShowcase";
import TopPlayersWeek from "@/components/landing/TopPlayersWeek";
import DiscordCTA from "@/components/landing/DiscordCTA";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PeakGG",
    url: "https://peakgg.net",
    logo: "https://peakgg.net/logo.png",
    description: "Competitive gaming platform for Valorant, CS2 and Rainbow Six Siege",
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
        title="PeakGG — Compete. Rise. Dominate. | Competitive Gaming Platform"
        description="PeakGG is the ultimate competitive gaming platform for Valorant, CS2 and Rainbow Six Siege. Ranked matchmaking, tournaments, team management and community for serious players."
        keywords="PeakGG, competitive gaming, Valorant tournaments, CS2 ranked, Rainbow Six Siege, esports platform Belgium, gaming community, ranked matchmaking FPS, FPS tournaments Europe, Valorant ELO system"
        path="/"
        jsonLd={[orgSchema, siteSchema]}
      />
      <Navbar />
      <main>
        <HeroSection />
        <PreLaunchCTA />
        <StartCompetingSection />
        <PlatformStatsStrip />
        <FeaturesSection />
        <HowItWorksSteps />
        <RankShowcase />
        <TopPlayersWeek />
        <DiscordCTA />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
