import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { useI18n } from "@/i18n";
import { Trans } from "react-i18next";

export default function PrivacyPage() {
  const { t } = useI18n();
  const email = "peakgg.official@gmail.com";
  const list = (keys: string[]) => (
    <ul className="list-disc pl-6 space-y-1">
      {keys.map((k) => <li key={k}>{t(k)}</li>)}
    </ul>
  );
  const SECTIONS: { title: string; body: React.ReactNode }[] = [
    { title: t("privacy.s1_title"), body: <p>{t("privacy.s1_body")}</p> },
    { title: t("privacy.s2_title"), body: list(["privacy.s2_l1","privacy.s2_l2","privacy.s2_l3","privacy.s2_l4","privacy.s2_l5","privacy.s2_l6","privacy.s2_l7"]) },
    { title: t("privacy.s3_title"), body: list(["privacy.s3_l1","privacy.s3_l2","privacy.s3_l3","privacy.s3_l4","privacy.s3_l5"]) },
    { title: t("privacy.s4_title"), body: list(["privacy.s4_l1","privacy.s4_l2","privacy.s4_l3"]) },
    { title: t("privacy.s5_title"), body: list(["privacy.s5_l1","privacy.s5_l2","privacy.s5_l3"]) },
    { title: t("privacy.s6_title"), body: list(["privacy.s6_l1","privacy.s6_l2","privacy.s6_l3"]) },
    { title: t("privacy.s7_title"), body: list(["privacy.s7_l1","privacy.s7_l2","privacy.s7_l3","privacy.s7_l4","privacy.s7_l5","privacy.s7_l6"]) },
    { title: t("privacy.s8_title"), body: <p>{t("privacy.s8_body", { email })}</p> },
    { title: t("privacy.s9_title"), body: list(["privacy.s9_l1","privacy.s9_l2","privacy.s9_l3"]) },
    { title: t("privacy.s10_title"), body: <p>{t("privacy.s10_body")}</p> },
    { title: t("privacy.s11_title"), body: <p><a className="text-primary hover:underline" href={`mailto:${email}`}>{email}</a></p> },
    { title: t("privacy.s12_title"), body: <p>{t("privacy.s12_body")}</p> },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Privacy Policy — PeakGG" description="How PeakGG collects, uses and protects your data. GDPR compliant policy for EU users." path="/privacy" />
      <Navbar />
      <main className="pt-24 pb-20">
        <article className="container max-w-3xl">
          <header className="mb-10">
            <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">{t("privacy.title")}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t("privacy.last_updated")}</p>
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
