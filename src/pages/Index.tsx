import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LiveStatsBar from "@/components/landing/LiveStatsBar";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSteps from "@/components/landing/HowItWorksSteps";
import RankShowcase from "@/components/landing/RankShowcase";
import TopPlayersWeek from "@/components/landing/TopPlayersWeek";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <LiveStatsBar />
        <FeaturesSection />
        <HowItWorksSteps />
        <RankShowcase />
        <TopPlayersWeek />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
