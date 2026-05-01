import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  { title: "Who We Are", body: <p>PeakGG (peakgg.net) is a competitive gaming platform operated by PeakGG, based in Brussels, Belgium, European Union.</p> },
  { title: "Data We Collect", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>Email address</li><li>Username</li><li>Game statistics</li>
      <li>IP address (for security)</li><li>Browser type</li><li>Usage data</li><li>Cookies</li>
    </ul>
  )},
  { title: "Why We Collect It", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>Account management</li><li>Matchmaking</li><li>Tournament management</li>
      <li>Platform security</li><li>Analytics (Google Analytics 4)</li>
    </ul>
  )},
  { title: "Legal Basis (GDPR)", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>Consent (Art. 6.1.a)</li>
      <li>Contract performance (Art. 6.1.b)</li>
      <li>Legitimate interests (Art. 6.1.f)</li>
    </ul>
  )},
  { title: "Data Retention", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>Account data: kept until deletion request</li>
      <li>Security logs: kept 90 days</li>
      <li>Analytics data: kept 26 months</li>
    </ul>
  )},
  { title: "Third Parties", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>Supabase — database, EU region</li>
      <li>Google Analytics — analytics, opt-out available</li>
      <li>Discord — OAuth login</li>
    </ul>
  )},
  { title: "Your Rights (GDPR Art. 15–22)", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>Right to access</li><li>Right to rectification</li><li>Right to erasure</li>
      <li>Right to data portability</li><li>Right to restriction</li><li>Right to objection</li>
    </ul>
  )},
  { title: "How to Exercise Your Rights", body: <p>Email <a className="text-primary hover:underline" href="mailto:peakgg.official@gmail.com">peakgg.official@gmail.com</a>. We respond within 30 days.</p> },
  { title: "Cookies", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>Session cookies (necessary)</li>
      <li>Preference cookies (functional)</li>
      <li>Analytics cookies (only with consent)</li>
    </ul>
  )},
  { title: "Data Transfers", body: <p>All data is stored in the EU. No transfers outside the EU.</p> },
  { title: "Contact", body: <p><a className="text-primary hover:underline" href="mailto:peakgg.official@gmail.com">peakgg.official@gmail.com</a></p> },
  { title: "Changes", body: <p>We will notify users of significant changes by email.</p> },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Privacy Policy — PeakGG" description="How PeakGG collects, uses and protects your data. GDPR compliant policy for EU users." path="/privacy" />
      <Navbar />
      <main className="pt-24 pb-20">
        <article className="container max-w-3xl">
          <header className="mb-10">
            <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mt-2">Last updated: May 2026</p>
          </header>
          <div className="space-y-8 font-body text-foreground/90 leading-relaxed">
            {SECTIONS.map((s, i) => (
              <section key={s.title}>
                <h2 className="font-display font-bold text-xl md:text-2xl uppercase mb-3 text-primary">
                  {i + 1}. {s.title}
                </h2>
                <div className="text-base">{s.body}</div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
