import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Zap, Users, Lock, ArrowRight } from "lucide-react";
import { useI18n } from "@/i18n";

export default function AboutPage() {
  const { t } = useI18n();
  const values = [
    { icon: Target, title: t("about.value_fair_title"), body: t("about.value_fair_desc") },
    { icon: Zap, title: t("about.value_competition_title"), body: t("about.value_competition_desc") },
    { icon: Users, title: t("about.value_community_title"), body: t("about.value_community_desc") },
    { icon: Lock, title: t("about.value_safety_title"), body: t("about.value_safety_desc") },
  ];
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
            {t("about.hero_title_pre")} <span className="text-primary">{t("about.hero_title_accent")}</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-body">
            {t("about.hero_subtitle")}
          </p>
        </section>

        {/* Mission */}
        <section className="container py-12">
          <Card className="p-8 md:p-12 bg-card/50 border-border">
            <h2 className="font-display font-bold text-3xl md:text-4xl uppercase mb-4 text-primary">{t("about.mission_title")}</h2>
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-body">
              {t("about.mission_body")}
            </p>
          </Card>
        </section>

        {/* Story */}
        <section className="container py-12">
          <Card className="p-8 md:p-12 bg-card/50 border-border">
            <h2 className="font-display font-bold text-3xl md:text-4xl uppercase mb-4 text-primary">{t("about.story_title")}</h2>
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-body">
              {t("about.story_body")}
            </p>
          </Card>
        </section>

        {/* Values */}
        <section className="container py-16">
          <h2 className="font-display font-bold text-3xl md:text-4xl uppercase mb-10 text-center">{t("about.values_title")}</h2>
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

        {/* Founder */}
        <section className="container py-16">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground font-display mb-3">
            Founder
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl uppercase mb-10 text-center">
            The Person Behind PeakGG
          </h2>
          <div className="max-w-md mx-auto">
            <Card className="p-8 md:p-10 bg-card/60 border-border text-center relative overflow-hidden">
              {/* Subtle gradient aura behind avatar */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 50% 25%, hsl(var(--primary)), transparent 70%)"
                }}
              />
              <div className="relative">
                <div className="w-28 h-28 rounded-full mx-auto mb-5 flex items-center justify-center border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-accent/10 shadow-lg shadow-primary/10">
                  <span className="font-display font-bold text-4xl text-primary">O</span>
                </div>
                <h3 className="font-display font-bold text-2xl uppercase tracking-wide">Onyzuka</h3>
                <div className="w-12 h-0.5 gradient-primary mx-auto my-4 rounded-full opacity-60" />
                <p className="text-sm md:text-base text-muted-foreground font-body leading-relaxed">
                  "Building PeakGG for competitive FPS players who want to improve, compete, and find their squad."
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-20 text-center">
          <h2 className="font-display font-black text-4xl md:text-5xl uppercase mb-6">{t("about.cta_title")}</h2>
          <Link to="/register">
            <Button size="lg" className="font-display uppercase tracking-wider">
              {t("about.cta_button")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
