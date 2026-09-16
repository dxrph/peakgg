import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import { DISCORD_INVITE } from "@/lib/links";

export default function ComingSoonPage() {
  const [params] = useSearchParams();
  const feature = params.get("feature") || "This feature";
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title={`${feature} — Coming Soon | PeakGG`}
        description={`${feature} is coming soon to PeakGG — the competitive Valorant platform for European players. Join our Discord to be notified the moment it launches.`}
      />
      <Navbar />
      <main className="flex-1 container pt-32 pb-20 flex items-center justify-center">
        <div className="max-w-xl w-full text-center rounded-xl border border-border bg-card/60 backdrop-blur p-10 neon-border">
          <div className="mx-auto w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-5">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
            {feature} <span className="text-primary">Coming Soon</span>
          </h1>
          <p className="mt-3 text-muted-foreground font-body">
            We're building it. Join our Discord to get notified the moment it launches.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#5865F2] hover:bg-[#4752c4] text-white border-0 font-display uppercase tracking-wider">
                <MessageCircle className="h-4 w-4 mr-2" /> Join Discord
              </Button>
            </a>
            <Link to="/dashboard">
              <Button variant="outline" className="font-display uppercase tracking-wider">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}