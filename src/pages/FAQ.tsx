import { useMemo, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";

type QA = { q: string; a: string };
type Section = { title: string; items: QA[] };

const SECTIONS: Section[] = [
  {
    title: "Getting Started",
    items: [
      { q: "What is PeakGG?", a: "PeakGG is a free competitive gaming platform for Valorant, CS2 and Rainbow Six Siege. Ranked matchmaking, tournaments, team management and community — all in one place." },
      { q: "Is PeakGG free?", a: "Yes, completely free. Register at peakgg.net and start competing immediately. No subscription required." },
      { q: "What games are supported?", a: "Valorant is live now. CS2 and Rainbow Six Siege are coming soon — leave your email on those pages to be notified first." },
      { q: "How do I create an account?", a: "Click \"Start Playing\" on the homepage, fill in your username and email, and you're in. Takes 30 seconds." },
    ],
  },
  {
    title: "Ranks & Matchmaking",
    items: [
      { q: "How does the rank system work?", a: "PeakGG uses an ELO-based system. Win matches to gain ELO, lose matches to lose ELO. Your rank updates automatically after every match." },
      { q: "What are the ranks?", a: "Rookie (0–499) → Contender (500–999) → Rival (1000–1499) → Expert (1500–1999) → Elite (2000–2499) → Master (2500–2999) → Apex (3000+)." },
      { q: "What is the anti-smurf system?", a: "PeakGG detects accounts that perform significantly above their rank and adjusts their ELO faster to place them correctly." },
      { q: "How much ELO do I gain or lose?", a: "Win: +25 ELO. Loss: −20 ELO. Minimum ELO is 0." },
    ],
  },
  {
    title: "Tournaments",
    items: [
      { q: "How do I join a tournament?", a: "Go to /tournaments, find an open tournament and click Register. Make sure you meet the rank requirement if any." },
      { q: "Are tournaments free?", a: "Open Cup tournaments are completely free. Future premium tiers may have entry fees paid with PeakCoins." },
      { q: "What are the tournament tiers?", a: "Open Cup (free, anyone) → Challenger Series (Contender rank required) → Peak Championship (Elite rank required, invite only)." },
      { q: "What are the prizes?", a: "Currently top 3 players receive exclusive rank badges and recognition. Prize pools with real value are coming in future seasons." },
    ],
  },
  {
    title: "Teams",
    items: [
      { q: "How do I create a team?", a: "Go to /teams and click \"Create Team\". Choose a name, tag (3 letters) and game." },
      { q: "How do I invite players?", a: "From your team page, click \"Invite Player\" and search by username." },
      { q: "What is team ELO?", a: "Separate from your personal ELO — it reflects your team's performance in team tournaments." },
    ],
  },
  {
    title: "Technical",
    items: [
      { q: "What regions are supported?", a: "Currently Europe. More regions coming soon." },
      { q: "Is there a mobile app?", a: "Not yet. The website is fully mobile responsive. A dedicated app is on the roadmap." },
      { q: "How do I report a bug?", a: "Use the form at /contact or post in #bug-report on our Discord." },
    ],
  },
  {
    title: "Account & Safety",
    items: [
      { q: "How do I delete my account?", a: "Go to Settings → Account → Delete Account. Your data will be permanently deleted within 30 days." },
      { q: "How do I report a player?", a: "Click the flag icon on any player's profile or match result." },
      { q: "What happens if I get banned?", a: "You will receive an email explaining the reason. You can appeal at /contact with subject \"Ban Appeal\"." },
    ],
  },
  {
    title: "Legal & Privacy",
    items: [
      { q: "Is PeakGG GDPR compliant?", a: "Yes. PeakGG is based in Belgium and fully compliant with EU GDPR regulations." },
      { q: "What data do you collect?", a: "Email, username, game stats, IP address for security, and usage data. Full details at /privacy." },
      { q: "How do I request my data?", a: "Email peakgg.official@gmail.com with subject \"Data Request\". We respond within 48 hours." },
      { q: "How do I request data deletion?", a: "Email peakgg.official@gmail.com with subject \"Data Deletion\". Completed within 30 days." },
    ],
  },
];

export default function FAQPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS
      .map((s) => ({ ...s, items: s.items.filter((it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  }, [query]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: SECTIONS.flatMap((s) => s.items).map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="FAQ — PeakGG"
        description="Frequently asked questions about PeakGG: ranks, matchmaking, tournaments, teams, account, privacy and more."
        path="/faq"
        jsonLd={faqJsonLd}
      />
      <Navbar />
      <main className="pt-24 pb-20">
        <section className="container max-w-3xl">
          <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-tight text-center">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-center text-muted-foreground font-body mt-4">
            Search or browse by category.
          </p>

          <div className="relative mt-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 200))}
              placeholder="Search a question..."
              className="pl-9 h-12 bg-card/60"
              aria-label="Search questions"
            />
          </div>

          <div className="mt-12 space-y-10">
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No question matches your search.</p>
            )}
            {filtered.map((section) => (
              <div key={section.title}>
                <h2 className="font-display font-bold text-2xl uppercase tracking-wider mb-4 text-primary">
                  {section.title}
                </h2>
                <Accordion type="single" collapsible className="border border-border rounded-lg bg-card/40">
                  {section.items.map((it, idx) => (
                    <AccordionItem key={idx} value={`${section.title}-${idx}`} className="px-4">
                      <AccordionTrigger className="text-left font-display font-semibold">
                        {it.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-foreground/85 font-body leading-relaxed">
                        {it.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
