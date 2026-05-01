import { useMemo, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";
import { useI18n } from "@/i18n";

type QA = { q: string; a: string };
type Section = { title: string; items: QA[] };

export default function FAQPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const SECTIONS: Section[] = [
    { title: t("faq.section_getting_started"), items: [
      { q: t("faq.q_what_is_q"), a: t("faq.q_what_is_a") },
      { q: t("faq.q_free_q"), a: t("faq.q_free_a") },
      { q: t("faq.q_games_q"), a: t("faq.q_games_a") },
      { q: t("faq.q_register_q"), a: t("faq.q_register_a") },
    ]},
    { title: t("faq.section_ranks"), items: [
      { q: t("faq.q_rank_works_q"), a: t("faq.q_rank_works_a") },
      { q: t("faq.q_ranks_list_q"), a: t("faq.q_ranks_list_a") },
      { q: t("faq.q_smurf_q"), a: t("faq.q_smurf_a") },
      { q: t("faq.q_elo_amount_q"), a: t("faq.q_elo_amount_a") },
    ]},
    { title: t("faq.section_tournaments"), items: [
      { q: t("faq.q_join_tournament_q"), a: t("faq.q_join_tournament_a") },
      { q: t("faq.q_tournament_free_q"), a: t("faq.q_tournament_free_a") },
      { q: t("faq.q_tournament_tiers_q"), a: t("faq.q_tournament_tiers_a") },
      { q: t("faq.q_prizes_q"), a: t("faq.q_prizes_a") },
    ]},
    { title: t("faq.section_teams"), items: [
      { q: t("faq.q_create_team_q"), a: t("faq.q_create_team_a") },
      { q: t("faq.q_invite_players_q"), a: t("faq.q_invite_players_a") },
      { q: t("faq.q_team_elo_q"), a: t("faq.q_team_elo_a") },
    ]},
    { title: t("faq.section_technical"), items: [
      { q: t("faq.q_regions_q"), a: t("faq.q_regions_a") },
      { q: t("faq.q_mobile_q"), a: t("faq.q_mobile_a") },
      { q: t("faq.q_bug_q"), a: t("faq.q_bug_a") },
    ]},
    { title: t("faq.section_account"), items: [
      { q: t("faq.q_delete_acc_q"), a: t("faq.q_delete_acc_a") },
      { q: t("faq.q_report_player_q"), a: t("faq.q_report_player_a") },
      { q: t("faq.q_banned_q"), a: t("faq.q_banned_a") },
    ]},
    { title: t("faq.section_legal"), items: [
      { q: t("faq.q_gdpr_q"), a: t("faq.q_gdpr_a") },
      { q: t("faq.q_data_q"), a: t("faq.q_data_a") },
      { q: t("faq.q_data_request_q"), a: t("faq.q_data_request_a") },
      { q: t("faq.q_data_delete_q"), a: t("faq.q_data_delete_a") },
    ]},
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS
      .map((s) => ({ ...s, items: s.items.filter((it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length > 0);
  }, [query, SECTIONS]);

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
            {t("faq.title_pre")} <span className="text-primary">{t("faq.title_accent")}</span>
          </h1>
          <p className="text-center text-muted-foreground font-body mt-4">
            {t("faq.subtitle")}
          </p>

          <div className="relative mt-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value.slice(0, 200))}
              placeholder={t("faq.search_placeholder")}
              className="pl-9 h-12 bg-card/60"
              aria-label={t("faq.search_placeholder")}
            />
          </div>

          <div className="mt-12 space-y-10">
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">{t("faq.no_results")}</p>
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
