import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Zap, Users, Lock, ArrowRight } from "lucide-react";

const values = [
  { icon: Target, title: "Fair Play", body: "Every match is fair. Anti-smurf, ELO-based, no pay-to-win." },
  { icon: Zap, title: "Competition", body: "From Open Cup to Peak Championship. Real stakes, real growth." },
  { icon: Users, title: "Community", body: "Discord, chat, LFT board. Your squad is here." },
  { icon: Lock, title: "Safety", body: "GDPR compliant. Your data is yours. Always." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="About PeakGG — Built by gamers, for gamers"
        description="PeakGG is a competitive gaming platform born in Brussels, Belgium. Fair matchmaking, real tournaments, and a community that pushes you to your peak."
        path="/about"
      />
      <Navbar />
      <main className="pt-24">
        {/* Hero */}
        <section className="container py-20 text-center animate-in fade-in duration-700">
          <h1 className="font-display font-black text-5xl md:text-7xl tracking-tight uppercase">
            We are <span className="text-primary">PeakGG</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-body">
            Built by gamers. For gamers who want more.
          </p>
        </section>

        {/* Mission */}
        <section className="container py-12">
          <Card className="p-8 md:p-12 bg-card/50 border-border">
            <h2 className="font-display font-bold text-3xl md:text-4xl uppercase mb-4 text-primary">Our Mission</h2>
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-body">
              PeakGG exists because competitive gaming deserves a better home. Fair matchmaking, real
              tournaments, a community that pushes you to your peak. We built what we wanted to play on.
            </p>
          </Card>
        </section>

        {/* Story */}
        <section className="container py-12">
          <Card className="p-8 md:p-12 bg-card/50 border-border">
            <h2 className="font-display font-bold text-3xl md:text-4xl uppercase mb-4 text-primary">Our Story</h2>
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-body">
              Started in 2026 in Brussels, Belgium. PeakGG was born from frustration with existing
              platforms — laggy, unfair, soulless. Two people, one vision: build the platform serious FPS
              players actually deserve.
            </p>
          </Card>
        </section>

        {/* Values */}
        <section className="container py-16">
          <h2 className="font-display font-bold text-3xl md:text-4xl uppercase mb-10 text-center">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="p-6 bg-card/60 border-border hover:border-primary/60 transition-colors">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl uppercase mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="container py-16">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground font-display mb-3">Founding Team</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl uppercase mb-10 text-center">The People Behind PeakGG</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[1, 2].map((i) => (
              <Card key={i} className="p-8 bg-card/60 border-border text-center">
                <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center border border-border">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl uppercase">Founder #{i}</h3>
                <p className="text-sm text-muted-foreground font-body mt-2">Building PeakGG from Brussels.</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container py-20 text-center">
          <h2 className="font-display font-black text-4xl md:text-5xl uppercase mb-6">Ready to compete?</h2>
          <Link to="/register">
            <Button size="lg" className="font-display uppercase tracking-wider">
              Start Playing <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
