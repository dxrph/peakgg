import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowRight, Crosshair, Menu, Play, Search, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { openPeakCommand } from "@/components/navigation/PeakCommandPalette";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";
import { RANKS, getRankByElo } from "@/lib/ranks";
import { isPublicPlayer, hasCompetitiveActivity } from "@/lib/public-users";
import { peakRaster } from "@/data/peakRaster";
import playerImage from "@/assets/editorial-player.webp";
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

function formatDate(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function tournamentHref(tournament?: Tournament | null) {
  return tournament?.slug ? `/tournaments/${tournament.slug}` : "/tournaments";
}

function SectionIndex({ number, label }: { number: string; label: string }) {
  return <div className="eh-index"><b>{number}</b><span>{label}</span></div>;
}

function HomeNavigation() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [
    [t("homeEditorial.nav.compete"), "/play"],
    [t("homeEditorial.nav.tournaments"), "/tournaments"],
    [t("homeEditorial.nav.players"), "/free-agents"],
    [t("homeEditorial.nav.teams"), "/teams"],
    [t("homeEditorial.nav.community"), "/about"],
  ];

  return <header className="eh-nav">
    <Link to="/" className="eh-wordmark" aria-label="PeakGG home"><BrandLogo /><strong>PEAK<span>GG</span></strong></Link>
    <nav className="eh-nav-center" aria-label={t("homeEditorial.nav.primary")}>
      {links.map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}
    </nav>
    <div className="eh-nav-actions">
      {user && <Button variant="ghost" size="icon" className="eh-search" onClick={openPeakCommand} aria-label={t("homeEditorial.nav.search")}><Search /></Button>}
      <LanguageSwitcher className="eh-language" />
      <Link className="eh-signin" to={user ? "/dashboard" : "/login"}>{user ? t("homeEditorial.nav.dashboard") : t("homeEditorial.nav.signIn")}</Link>
      <Link className="eh-nav-enter" to={user ? "/dashboard" : "/register"}>{t("homeEditorial.hero.enter")}</Link>
      <Button variant="ghost" size="icon" className="eh-menu" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={t("homeEditorial.nav.menu")}>
        {open ? <X /> : <Menu />}
      </Button>
    </div>
    {open && <nav className="eh-mobile-nav" aria-label={t("homeEditorial.nav.mobile")}>
      {links.map(([label, path], index) => <Link key={path} to={path} onClick={() => setOpen(false)}><small>0{index + 1}</small>{label}<ArrowRight /></Link>)}
      <Link to={user ? "/dashboard" : "/login"} onClick={() => setOpen(false)}>{user ? t("homeEditorial.nav.dashboard") : t("homeEditorial.nav.signIn")}<ArrowRight /></Link>
    </nav>}
  </header>;
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
  const featuredPlayer = agents[0] ?? null;
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
    <HomeNavigation />
    <main>
      <section className="eh-hero" aria-labelledby="home-title">
        <img className="eh-hero-image" src={peakRaster.hero} alt="" />
        <div className="eh-hero-treatment" aria-hidden="true" />
        <div className="eh-hero-grid" aria-hidden="true" />
        <div className="eh-hero-left-rail" aria-hidden="true"><b>01</b><span>50.1109° N / 08.6821° E</span><i /></div>
        <div className="eh-hero-copy">
          <p className="eh-kicker">{t("homeEditorial.hero.kicker")}</p>
          <h1 id="home-title"><span>{t("homeEditorial.hero.prove")}</span><span>{t("homeEditorial.hero.you")}</span><span>{t("homeEditorial.hero.belong")}</span></h1>
          <em className="eh-handwritten">{t("homeEditorial.hero.accent")}</em>
          <p className="eh-hero-intro">{t("homeEditorial.hero.copy")}</p>
          <div className="eh-actions">
            <Link className="eh-button eh-button-primary" to="/register">{t("homeEditorial.hero.enter")}<ArrowRight /></Link>
            <a className="eh-button eh-button-quiet" href="#open-cup"><Play />{t("homeEditorial.hero.watch")}</a>
          </div>
          <div className="eh-proof">
            <div className="eh-proof-marks" aria-hidden="true"><i /><i /><i /><i /></div>
            <span>{t("homeEditorial.hero.proof")}</span>
          </div>
        </div>
        <aside className="eh-next-event">
          <span>{t("homeEditorial.hero.next")}</span>
          <strong>{featured?.name ?? t("homeEditorial.cup.fallbackTitle")}</strong>
          <time>{formatDate(featured?.start_date ?? null, locale, t("homeEditorial.common.tbd"))}</time>
          <small>{featured?.status ?? t("homeEditorial.signal.closedBeta")}</small>
          <Link to={tournamentHref(featured)} aria-label={t("homeEditorial.cup.view")}><ArrowDownRight /></Link>
          <figure><img src={playerImage} alt="" /></figure>
        </aside>
        <a className="eh-scroll" href="#signal" aria-label={t("homeEditorial.hero.scroll")}><span>SCROLL</span><ArrowDownRight /></a>
      </section>

      <section id="signal" className="eh-signal" aria-label={t("homeEditorial.signal.label")}>
        <div className="eh-signal-track">
          <div className="eh-signal-lead"><i /> <b>{t("homeEditorial.signal.nextSignal")}</b></div>
          <div><span>{t("homeEditorial.signal.closedBeta")}</span><b>PEAKGG / EU</b></div>
          <div><span>{t("homeEditorial.signal.fixture")}</span><b>{featured?.name ?? t("homeEditorial.cup.fallbackTitle")}</b></div>
          <div><span>{t("homeEditorial.signal.registration")}</span><b>{featured ? `${registered}/${capacity}` : "—"}</b></div>
          <div><span>REGION</span><b>EUROPE</b></div>
        </div>
      </section>

      <section id="open-cup" className="eh-cup">
        <div className="eh-cup-side">
          <SectionIndex number="02" label={t("homeEditorial.cup.label")} />
           <figure><img src={playerImage} alt="" loading="lazy" /></figure>
          <em>{t("homeEditorial.cup.note")}</em>
        </div>
        <div className="eh-cup-stage">
          <img src={peakRaster.trophy} alt="" loading="lazy" />
          <div className="eh-cup-title"><small>EUROPE / VALORANT / {teamSize}</small><h2>OPEN<br />CUP</h2><b>{featured ? `#${featured.id.slice(0, 3).toUpperCase()}` : "#001"}</b></div>
          <div className="eh-cup-meta">
            <span>{featured?.name ?? t("homeEditorial.cup.fallbackTitle")}</span>
            <time>{formatDate(featured?.start_date ?? null, locale, t("homeEditorial.common.tbd"))}</time>
            <Link className="eh-button eh-button-primary" to={tournamentHref(featured)}>{t("homeEditorial.cup.view")}<ArrowRight /></Link>
          </div>
        </div>
        <aside className="eh-cup-cuts">
           <figure><img src={playerImage} alt="" loading="lazy" /></figure>
           <figure><img src={peakRaster.crowd} alt="" loading="lazy" /></figure>
           <figure><img src={peakRaster.hero} alt="" loading="lazy" /></figure>
          <em>{t("homeEditorial.cup.annotation")}</em>
        </aside>
        <div className="eh-bracket" aria-label={t("homeEditorial.cup.preview")}>
          <div><small>R01</small><i /><i /><i /><i /></div>
          <div><small>R02</small><i /><i /></div>
          <div><small>FINAL</small><i /></div>
          <span>{t("homeEditorial.cup.presentational")}</span>
        </div>
      </section>

      <section className="eh-match" aria-label={t("homeEditorial.match.label")}>
         <div className="eh-match-lead"><img src={playerImage} alt="" loading="lazy" /><h2>{t("homeEditorial.match.title")}</h2><span>EU / VALORANT</span></div>
        <div className="eh-match-scorebug"><small>{t("homeEditorial.signal.fixture")}</small><strong>{featured?.name ?? t("homeEditorial.cup.fallbackTitle")}</strong><span>{formatDate(featured?.start_date ?? null, locale, t("homeEditorial.common.tbd"))}</span><i>{featured?.status ?? t("homeEditorial.cup.announced")}</i></div>
         <div className="eh-match-stills"><img src={peakRaster.crowd} alt="" loading="lazy" /><img src={peakRaster.hero} alt="" loading="lazy" /></div>
      </section>

      <section className="eh-ranks">
        <header><SectionIndex number="03" label={t("homeEditorial.ranks.label")} /><h2>{t("homeEditorial.ranks.identity")}</h2></header>
        <div className="eh-rank-track">
          {RANKS.map((rank, index) => <Link to={`/elo?rank=${rank.name.toLowerCase()}`} className={`eh-rank eh-rank-${index + 1}`} key={rank.name}>
            <img src={rankImages[index]} alt={`${tRank(rank.name)} rank emblem`} loading="lazy" />
            <span><b>{tRank(rank.name)}</b><small>{rank.name === "Apex" ? `${rank.minElo}+` : rank.minElo}</small></span>
          </Link>)}
        </div>
        <aside className="eh-top-rank">
          <small>{t("homeEditorial.ranks.topRank")}</small>
          {featuredPlayer ? <><strong>{featuredPlayer.display_name || featuredPlayer.username}</strong><span>{getRankByElo(featuredPlayer.elo).name} / {featuredPlayer.elo}</span></> : <strong>{t("homeEditorial.ranks.noPlayer")}</strong>}
        </aside>
      </section>

      <section className="eh-roster">
        <header><SectionIndex number="04" label={t("homeEditorial.roster.label")} /><h2>{t("homeEditorial.roster.findFive")}</h2><p>{t("homeEditorial.roster.copy")}</p><Link className="eh-inline-link" to="/free-agents">{t("homeEditorial.roster.find")}<ArrowRight /></Link></header>
        <div className="eh-roster-lineup">
          {Array.from({ length: 5 }, (_, index) => {
            const agent = agents[index];
            const rank = agent ? getRankByElo(agent.elo) : null;
            return <article className={`eh-player-slot ${agent ? "is-filled" : "is-open"}`} key={agent?.id ?? `open-${index}`}>
              <small>0{index + 1}</small>
              {agent ? <><div className="eh-player-avatar">{agent.avatar_url ? <img src={agent.avatar_url} alt="" loading="lazy" /> : agent.username.slice(0, 2).toUpperCase()}</div><h3>{agent.display_name || agent.username}</h3><span>{agent.role} / {rank?.name}</span><i>{agent.region ?? "EU"} · {agent.language?.toUpperCase() ?? "—"}</i></> : <><Crosshair /><h3>{t("homeEditorial.roster.openSlot")}</h3><span>{t("homeEditorial.roster.scouting")}</span></>}
            </article>;
          })}
        </div>
         <aside className="eh-roster-art"><img src={playerImage} alt="" loading="lazy" /><em>{t("homeEditorial.roster.annotation")}</em></aside>
      </section>

      <section className="eh-moment">
        <img src={peakRaster.crowd} alt="" loading="lazy" />
        <div className="eh-moment-copy"><SectionIndex number="05" label={t("homeEditorial.moment.label")} /><h2>{t("homeEditorial.moment.define")}</h2></div>
        <div className="eh-moment-time"><strong>00:42</strong><span>ROUND 24 / MATCH POINT</span></div>
      </section>

      <section className="eh-upcoming">
         <header><SectionIndex number="06" label={t("homeEditorial.upcoming.label")} /><h2>{t("homeEditorial.upcoming.title")}</h2><Link className="eh-inline-link" to="/tournaments">{t("homeEditorial.upcoming.all")}<ArrowRight /></Link></header>
        <div className="eh-schedule">
          {tournaments.length ? tournaments.map((tournament, index) => <Link to={tournamentHref(tournament)} className="eh-schedule-row" key={tournament.id}>
            <small>0{index + 1}</small><time>{formatDate(tournament.start_date, locale, t("homeEditorial.common.tbd"))}</time><strong>{tournament.name}</strong><span>{tournament.format ?? t("homeEditorial.cup.elimination")}</span><b>{signupCounts[tournament.id] ?? 0}/{tournament.max_teams ?? 16}</b><i>{tournament.status ?? t("homeEditorial.cup.announced")}</i><ArrowRight />
          </Link>) : <div className="eh-schedule-empty"><strong>{t("homeEditorial.upcoming.empty")}</strong><Link to="/tournaments">{t("homeEditorial.upcoming.all")}<ArrowRight /></Link></div>}
        </div>
         <aside><img src={peakRaster.trophy} alt="" loading="lazy" /><span>EU / 2026</span></aside>
      </section>

      <section className="eh-enter">
         <img src={peakRaster.crowd} alt="" loading="lazy" />
        <div className="eh-enter-copy"><SectionIndex number="07" label={t("homeEditorial.enter.label")} /><em>{t("homeEditorial.enter.poster")}</em><h2>{t("homeEditorial.enter.line2")}</h2><Link className="eh-button eh-button-primary" to="/register">{t("homeEditorial.enter.cta")}<ArrowRight /></Link></div>
        <nav aria-label={t("homeEditorial.footer.navigation")}><Link to="/tournaments">TOURNAMENTS</Link><Link to="/teams">TEAMS</Link><Link to="/free-agents">{t("homeEditorial.footer.players")}</Link><Link to="/leaderboard">{t("homeEditorial.footer.leaderboard")}</Link><Link to="/about">{t("homeEditorial.footer.about")}</Link><Link to="/faq">FAQ</Link></nav>
      </section>
    </main>
    <footer className="eh-footer"><Link to="/" className="eh-wordmark"><BrandLogo /><strong>PEAK<span>GG</span></strong></Link><p>© 2026 PEAKGG · {t("homeEditorial.footer.disclaimer")}</p><nav><Link to="/privacy">PRIVACY</Link><Link to="/terms">{t("homeEditorial.footer.terms")}</Link><Link to="/contact">{t("homeEditorial.footer.contact")}</Link></nav></footer>
  </div>;
}