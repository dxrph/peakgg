import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { useI18n } from "@/i18n";

export default function TermsPage() {
  const { t } = useI18n();
  const email = "peakgg.official@gmail.com";
  const list = (keys: string[]) => (
    <ul className="list-disc pl-6 space-y-1">{keys.map((k) => <li key={k}>{t(k)}</li>)}</ul>
  );
  const SECTIONS: { title: string; body: React.ReactNode }[] = [
    { title: t("terms.s1_title"), body: <p>{t("terms.s1_body")}</p> },
    { title: t("terms.s2_title"), body: <p>{t("terms.s2_body")}</p> },
    { title: t("terms.s3_title"), body: list(["terms.s3_l1","terms.s3_l2","terms.s3_l3"]) },
    { title: t("terms.s4_title"), body: list(["terms.s4_l1","terms.s4_l2","terms.s4_l3","terms.s4_l4","terms.s4_l5","terms.s4_l6","terms.s4_l7"]) },
    { title: t("terms.s5_title"), body: list(["terms.s5_l1","terms.s5_l2","terms.s5_l3"]) },
    { title: t("terms.s6_title"), body: list(["terms.s6_l1","terms.s6_l2","terms.s6_l3","terms.s6_l4"]) },
    { title: t("terms.s7_title"), body: <p>{t("terms.s7_body")}</p> },
    { title: t("terms.s8_title"), body: <p>{t("terms.s8_body")}</p> },
    { title: t("terms.s9_title"), body: <p>{t("terms.s9_body")}</p> },
    { title: t("terms.s10_title"), body: <p>{t("terms.s10_body")}</p> },
    { title: t("terms.s11_title"), body: <p>{t("terms.s11_body")}</p> },
    { title: t("terms.s12_title"), body: <p>{t("terms.s12_body")}</p> },
    { title: t("terms.s13_title"), body: <p><a className="text-primary hover:underline" href={`mailto:${email}`}>{email}</a></p> },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Terms of Service — PeakGG" description="The rules and conditions for using the PeakGG competitive gaming platform." path="/terms" />
      <Navbar />
      <main className="pt-24 pb-20">
        <article className="container max-w-3xl">
          <header className="mb-10">
            <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">{t("terms.title")}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t("terms.last_updated")}</p>
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
