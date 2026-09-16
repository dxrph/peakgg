import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Crosshair, Play, Radio, Users } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import BrandLogo from "@/components/BrandLogo";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { RANKS, getRankByElo } from "@/lib/ranks";
import { isPublicPlayer, hasCompetitiveActivity } from "@/lib/public-users";
import { peakRaster } from "@/data/peakRaster";
import heroImage from "@/assets/peakgg-afterburn-hero.webp";
import rookie from "@/assets/ranks/rookie.png";
import contender from "@/assets/ranks/contender.png";
import rival from "@/assets/ranks/rival.png";
import expert from "@/assets/ranks/expert.png";
import elite from "@/assets/ranks/elite.png";
import master from "@/assets/ranks/master.png";
import apex from "@/assets/ranks/apex.png";
import "./homepage-editorial.css";

type Tournament = {
  id: string;
  slug: string | null;
  name: string;
  status: string | null;
  start_date: string | null;
  max_teams: number | null;
  team_size: number | string | null;
  format: string | null;
  short_description: string | null;
};

type Agent = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  region: string | null;
  language: string | null;
  availability: string | null;
  elo: number;
};

const rankImages = [rookie, contender, rival, expert, elite, master, apex];

function SectionLabel({ number, label }: { number: string; label: string }) {
  return <div className="eh-section-label"><span>{number}</span><i />{label}</div>;
}

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function tournamentHref(tournament?: Tournament | null) {
  return tournament?.slug ? `/tournaments/${tournament.slug}` : "/tournaments";
}

function SiteFooter() {
  const { t } = useI18n();
  const links = [
    ["Tournaments", "/tournaments"], ["Teams", "/teams"], [t("homeEditorial.footer.players"), "/free-agents"],
    [t("homeEditorial.footer.leaderboard"), "/leaderboard"], ["ELO", "/elo"], [t("homeEditorial.footer.about"), "/about"],
    ["FAQ", "/faq"], [t("homeEditorial.footer.contact"), "/contact"], ["Privacy", "/privacy"], [t("homeEditorial.footer.terms"), "/terms"],
  ];
  return <footer className="eh-footer">
    <Link to="/" className="eh-footer-brand" aria-label="PeakGG home"><BrandLogo /><b>PEAKGG</b></Link>
    <nav aria-label={t("homeEditorial.footer.navigation")}>
      {links.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}
    </nav>
    <p>© 2026 PEAKGG · {t("homeEditorial.footer.disclaimer")}</p>
  </footer>;
}

export default function EditorialHomepage() {
  const { t, tRank, locale } = useI18n();
  const { user } = useAuth();

  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ["editorial-home-tournaments"],
    queryFn: async () => {
      const { data } = await supabase.from("tournaments")
        .select("id, slug, name, status, start_date, max_teams, team_size, format, short_description")
        .neq("status", "completed").order("start_date", { ascending: true }).limit(4);
      return (data as Tournament[] | null) ?? [];
    },
  });

  const { data: signupRows = [] } = useQuery<Array<{ tournament_id: string }>>({
    queryKey: ["editorial-home-signups", tournaments.map((item) => item.id).join(",")],
    enabled: tournaments.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("tournament_team_signups").select("tournament_id")
        .in("tournament_id", tournaments.map((item) => item.id));
      return data ?? [];
    },
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["editorial-home-agents"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles")
        .select("id, username, display_name, avatar_url, role, region, language, availability")
        .eq("looking_for_team", true).eq("is_banned", false).not("role", "is", null)
        .order("last_active_at", { ascending: false }).limit(12);
      if (!profiles?.length) return [];
      const { data: stats } = await supabase.from("player_stats")
        .select("user_id, elo, wins, losses, matches_played").in("user_id", profiles.map((profile) => profile.id));
      const best = new Map<string, { elo: number; wins: number; losses: number; matches_played: number }>();
      (stats ?? []).forEach((row) => {
        const current = best.get(row.user_id);
        if (!current || (row.elo ?? 0) > current.elo) best.set(row.user_id, {
          elo: row.elo ?? 0, wins: row.wins ?? 0, losses: row.losses ?? 0, matches_played: row.matches_played ?? 0,
        });
      });
      return profiles.map((profile) => ({ ...profile, elo: best.get(profile.id)?.elo ?? 0 }))
        .filter((profile) => isPublicPlayer(profile) && hasCompetitiveActivity({ ...best.get(profile.id), elo: profile.elo })).slice(0, 5);
    },
  });

  const featured = tournaments[0] ?? null;
  const signupCounts = useMemo(() => signupRows.reduce<Record<string, number>>((counts, row) => {
    counts[row.tournament_id] = (counts[row.tournament_id] ?? 0) + 1;
    return counts;
  }, {}), [signupRows]);
  const registered = featured ? signupCounts[featured.id] ?? 0 : 0;
  const capacity = featured?.max_teams ?? 16;
  const teamSize = typeof featured?.team_size === "string" && featured.team_size.includes("v")
    ? featured.team_size : `${featured?.team_size ?? 5}v${featured?.team_size ?? 5}`;

  return <div className="peak-home">
    <SEO title="PeakGG — Competitive Valorant Europe" description="Build your Valorant roster, enter structured European competitions and earn your Peak rank." path="/" />
    <Navbar />
    <main>
      <section className="eh-hero" aria-labelledby="home-title">
        <img className="eh-hero-image" src={heroImage} alt="" />
        <div className="eh-hero-mask" />
        <div className="eh-grid-lines" aria-hidden="true" />
        <div className="eh-hero-rail eh-hero-rail-left"><span>01</span><span>VALORANT / EU</span><span>50.1109° N</span></div>
        <div className="eh-hero-copy">
          <p className="eh-kicker">{t("homeEditorial.hero.kicker")}</p>
          <h1 id="home-title"><span>{t("homeEditorial.hero.line1")}</span><span>{t("homeEditorial.hero.line2")}</span><span>{t("homeEditorial.hero.line3")}</span></h1>
          <p className="eh-hero-intro">{t("homeEditorial.hero.copy")}</p>
          <div className="eh-actions">
            <Link className="eh-button eh-button-primary" to="/register">{t("homeEditorial.hero.enter")}<ArrowRight /></Link>
            <a className="eh-button eh-button-text" href="#how-it-works"><Play />{t("homeEditorial.hero.watch")}</a>
          </div>
        </div>
        <div className="eh-hero-event">
          <span>{t("homeEditorial.hero.next")}</span>
          <strong>{featured?.name ?? t("homeEditorial.cup.fallbackTitle")}</strong>
          <small>{formatDate(featured?.start_date ?? null, locale, t("homeEditorial.common.tbd"))}</small>
        </div>
        <div className="eh-still-strip" aria-label={t("homeEditorial.hero.stills")}>
          <figure><img src={peakRaster.trophy} alt="" /><figcaption>EVENT / 001</figcaption></figure>
          <figure><img src={heroImage} alt="" /><figcaption>PLAYER / 005</figcaption></figure>
        </div>
        <a href="#live-signal" className="eh-scroll-cue" aria-label={t("homeEditorial.hero.scroll")}><ArrowDown /></a>
      </section>

      <section id="live-signal" className="eh-signal" aria-label={t("homeEditorial.signal.label")}>
        <div className="eh-signal-track">
          <div><Radio /><b>{t("homeEditorial.signal.closedBeta")}</b></div>
          <div><span>REGION</span><b>EUROPE</b></div>
          <div><span>{t("homeEditorial.signal.fixture")}</span><b>{featured?.name ?? t("homeEditorial.cup.fallbackTitle")}</b></div>
          <div><span>{t("homeEditorial.signal.rosters")}</span><b>{featured ? `${registered}/${capacity}` : "—"}</b></div>
          <div><span>GAME</span><b>VALORANT</b></div>
        </div>
      </section>

      <section id="how-it-works" className="eh-chapter eh-cup">
        <SectionLabel number="03" label={t("homeEditorial.cup.label")} />
        <div className="eh-cup-art"><img src={peakRaster.trophy} alt="" loading="lazy" /><span>OPEN<br />CUP</span></div>
        <article className="eh-cup-copy">
          <p className="eh-kicker">{featured?.status?.toUpperCase() ?? t("homeEditorial.cup.announced")}</p>
          <h2>{featured?.name ?? t("homeEditorial.cup.fallbackTitle")}</h2>
          <p>{featured?.short_description ?? t("homeEditorial.cup.fallbackCopy")}</p>
          <dl className="eh-event-meta">
            <div><dt>{t("homeEditorial.common.date")}</dt><dd>{formatDate(featured?.start_date ?? null, locale, t("homeEditorial.common.tbd"))}</dd></div>
            <div><dt>{t("homeEditorial.common.format")}</dt><dd>{featured?.format ?? t("homeEditorial.cup.elimination")}</dd></div>
            <div><dt>{t("homeEditorial.common.squad")}</dt><dd>{teamSize}</dd></div>
            <div><dt>{t("homeEditorial.common.slots")}</dt><dd>{featured ? `${registered}/${capacity}` : `0/${capacity}`}</dd></div>
          </dl>
          <Link className="eh-button eh-button-primary" to={tournamentHref(featured)}>{t("homeEditorial.cup.view")}<ArrowRight /></Link>
        </article>
        <div className="eh-bracket" aria-label={t("homeEditorial.cup.preview")}>
          <div className="eh-bracket-head"><span>{t("homeEditorial.cup.preview")}</span><small>{t("homeEditorial.cup.presentational")}</small></div>
          <div className="eh-bracket-body">
            <div className="eh-bracket-round"><span>R01</span><i /><i /><i /><i /></div>
            <div className="eh-bracket-round"><span>R02</span><i /><i /></div>
            <div className="eh-bracket-round eh-bracket-final"><span>FINAL</span><i /></div>
          </div>
        </div>
        <em className="eh-note">{t("homeEditorial.cup.note")}</em>
      </section>

      <section className="eh-chapter eh-ranks">
        <SectionLabel number="04" label={t("homeEditorial.ranks.label")} />
        <div className="eh-ranks-head"><h2>{t("homeEditorial.ranks.title")}</h2><p>{t("homeEditorial.ranks.copy")}</p></div>
        <div className="eh-rank-track">
          {RANKS.map((rank, index) => <Link to={`/elo?rank=${rank.name.toLowerCase()}`} className={`eh-rank eh-rank-${index + 1}`} key={rank.name}>
            <span className="eh-rank-index">0{index + 1}</span>
            <img src={rankImages[index]} alt={`${tRank(rank.name)} rank emblem`} loading="lazy" />
            <div><b>{tRank(rank.name)}</b><small>{rank.name === "Apex" ? `${rank.minElo}+ ELO` : `${rank.minElo}—${rank.maxElo}`}</small></div>
          </Link>)}
        </div>
      </section>

      <section className="eh-chapter eh-roster">
        <SectionLabel number="05" label={t("homeEditorial.roster.label")} />
        <header><h2>{t("homeEditorial.roster.title")}</h2><p>{t("homeEditorial.roster.copy")}</p></header>
        <div className="eh-roster-lineup">
          {Array.from({ length: 5 }, (_, index) => {
            const agent = agents[index];
            const rank = agent ? getRankByElo(agent.elo) : null;
            return <article className={`eh-player-slot ${agent ? "is-filled" : "is-open"}`} key={agent?.id ?? `open-${index}`}>
              <span className="eh-slot-number">0{index + 1}</span>
              {agent ? <>
                <div className="eh-player-avatar">{agent.avatar_url ? <img src={agent.avatar_url} alt="" loading="lazy" /> : <span>{agent.username.slice(0, 2).toUpperCase()}</span>}</div>
                <h3>{agent.display_name || agent.username}</h3>
                <dl><div><dt>ROLE</dt><dd>{agent.role}</dd></div><div><dt>RANK</dt><dd>{rank?.name} / {agent.elo}</dd></div><div><dt>REGION</dt><dd>{agent.region ?? "EU"}</dd></div><div><dt>LANG</dt><dd>{agent.language?.toUpperCase() ?? "—"}</dd></div></dl>
                <small>{agent.availability ?? t("homeEditorial.roster.available")}</small>
              </> : <><Crosshair /><h3>{t("homeEditorial.roster.openSlot")}</h3><p>{t("homeEditorial.roster.scouting")}</p></>}
            </article>;
          })}
        </div>
        <div className="eh-roster-actions"><Link className="eh-button eh-button-primary" to="/free-agents">{t("homeEditorial.roster.find")}<ArrowRight /></Link><Link className="eh-button eh-button-text" to="/teams"><Users />{t("homeEditorial.roster.build")}</Link></div>
      </section>

      <section className="eh-moment">
        <img src={peakRaster.crowd} alt="" loading="lazy" />
        <div className="eh-moment-mask" />
        <SectionLabel number="06" label={t("homeEditorial.moment.label")} />
        <div className="eh-moment-score"><span>00:42</span><i>ROUND 24 / MATCH POINT</i></div>
        <h2>{t("homeEditorial.moment.title")}</h2>
        <p>{t("homeEditorial.moment.copy")}</p>
      </section>

      <section className="eh-chapter eh-upcoming">
        <SectionLabel number="07" label={t("homeEditorial.upcoming.label")} />
        <div className="eh-upcoming-head"><h2>{t("homeEditorial.upcoming.title")}</h2><Link to="/tournaments">{t("homeEditorial.upcoming.all")}<ArrowRight /></Link></div>
        <div className="eh-schedule">
          {tournaments.length ? tournaments.map((tournament, index) => <Link to={tournamentHref(tournament)} className="eh-schedule-row" key={tournament.id}>
            <span>0{index + 1}</span><time>{formatDate(tournament.start_date, locale, t("homeEditorial.common.tbd"))}</time><strong>{tournament.name}</strong>
            <b>{tournament.format ?? t("homeEditorial.cup.elimination")}</b><em>{signupCounts[tournament.id] ?? 0}/{tournament.max_teams ?? 16}</em><i>{tournament.status ?? t("homeEditorial.cup.announced")}</i><ArrowRight />
          </Link>) : <div className="eh-schedule-empty"><span>—</span><strong>{t("homeEditorial.upcoming.empty")}</strong><Link to="/tournaments">{t("homeEditorial.upcoming.all")}<ArrowRight /></Link></div>}
        </div>
      </section>

      <section className="eh-enter">
        <SectionLabel number="08" label={t("homeEditorial.enter.label")} />
        <div className="eh-enter-mark" aria-hidden="true"><BrandLogo /></div>
        <h2><span>{t("homeEditorial.enter.line1")}</span><span>{t("homeEditorial.enter.line2")}</span></h2>
        <p>{t("homeEditorial.enter.copy")}</p>
        <Link className="eh-button eh-button-primary" to="/register">{t("homeEditorial.enter.cta")}<ArrowRight /></Link>
      </section>
    </main>
    <SiteFooter />
  </div>;
}