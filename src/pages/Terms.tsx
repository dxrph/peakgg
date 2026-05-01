import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  { title: "Acceptance", body: <p>By using PeakGG you agree to these terms.</p> },
  { title: "Eligibility", body: <p>You must be 16 or older (GDPR EU minimum age). By registering you confirm you meet this requirement.</p> },
  { title: "Account Rules", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>One account per person</li>
      <li>Accurate information required</li>
      <li>You are responsible for your account security</li>
    </ul>
  )},
  { title: "Prohibited Conduct", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>Cheating or hacking</li><li>Harassment</li><li>Account sharing</li>
      <li>Boosting</li><li>Account selling</li><li>Impersonation</li><li>Spam</li>
    </ul>
  )},
  { title: "Platform Rules", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>Fair play required</li><li>Respect other players</li><li>No exploitation of bugs or glitches</li>
    </ul>
  )},
  { title: "Tournament Rules", body: (
    <ul className="list-disc pl-6 space-y-1">
      <li>Follow the bracket schedule</li><li>Show up on time</li>
      <li>Report results honestly</li><li>Disputes are resolved by staff</li>
    </ul>
  )},
  { title: "Intellectual Property", body: <p>All PeakGG content, logos and platform code are owned by PeakGG.</p> },
  { title: "User Content", body: <p>You retain ownership of content you upload (clips, profile info) but grant PeakGG a license to display it on the platform.</p> },
  { title: "Disclaimer", body: <p>The platform is provided as-is, with no guarantee of uptime or continuous availability.</p> },
  { title: "Account Termination", body: <p>PeakGG may suspend or ban accounts that violate these terms without prior notice.</p> },
  { title: "Limitation of Liability", body: <p>PeakGG is not liable for losses resulting from platform downtime or user conduct.</p> },
  { title: "Governing Law", body: <p>These terms are governed by Belgian law and EU regulations.</p> },
  { title: "Contact", body: <p><a className="text-primary hover:underline" href="mailto:peakgg.official@gmail.com">peakgg.official@gmail.com</a></p> },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Terms of Service — PeakGG" description="The rules and conditions for using the PeakGG competitive gaming platform." path="/terms" />
      <Navbar />
      <main className="pt-24 pb-20">
        <article className="container max-w-3xl">
          <header className="mb-10">
            <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">Terms of Service</h1>
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
