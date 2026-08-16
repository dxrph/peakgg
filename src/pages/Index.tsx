import { ArrowUpRight, ChevronRight, Menu, Play, Trophy, Users, Swords, BarChart3, Shield, Globe2 } from "lucide-react";
import SEO from "@/components/SEO";

const nav = ["Tournaments", "Teams", "Players", "Ranks", "Leagues", "Community"];

const tournaments = [
  { eyebrow: "UPCOMING TOURNAMENT", title: "COMMUNITY CUP #04", meta: "MAY 24 — 25", cta: "VIEW TOURNAMENT", variant: "trophy" },
  { eyebrow: "UPCOMING TOURNAMENT", title: "SOLO QUEUE CUP #02", meta: "MAY 31 · FREE ENTRY", cta: "JOIN NOW", variant: "mask" },
  { eyebrow: "PEAK LEAGUE", title: "SEASON 1", meta: "ONGOING", cta: "OPEN LEAGUE", variant: "monolith" },
];

const players = [
  ["01", "RAZEKING", "2,184 ELO", "+42"],
  ["02", "SIHRO", "2,056 ELO", "+18"],
  ["03", "NEPTUNE", "1,987 ELO", "+31"],
  ["04", "BOTEX", "1,875 ELO", "-9"],
];

function PeakMark({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? "peak-mark peak-mark--small" : "peak-mark"} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 5 5 55h14l13-24 13 24h14L32 5Z" fill="currentColor"/>
      <path d="M32 22 19 47h9l4-8 4 8h9L32 22Z" fill="#fff"/>
    </svg>
  );
}

function MascotArt() {
  return (
    <div className="mascot-art" aria-hidden="true">
      <div className="mascot-slash mascot-s1" />
      <div className="mascot-slash mascot-s2" />
      <div className="mascot-city" />
      <div className="mascot-body">
        <div className="hood" />
        <div className="face">
          <span className="eye eye-l" />
          <span className="eye eye-r" />
          <span className="mask-cut m1" />
          <span className="mask-cut m2" />
          <span className="mask-cut m3" />
        </div>
        <div className="shoulder shoulder-l" />
        <div className="shoulder shoulder-r" />
      </div>
      <div className="ink ink-a" />
      <div className="ink ink-b" />
    </div>
  );
}

function CardArt({ type }: { type: string }) {
  return (
    <div className={`card-art card-art--${type}`} aria-hidden="true">
      <div className="card-art-grid" />
      {type === "trophy" && <div className="trophy-shape"><span/><i/><b/></div>}
      {type === "mask" && <div className="mini-mask"><span/><i/></div>}
      {type === "monolith" && <div className="monolith"><span/><i/></div>}
    </div>
  );
}

export default function Index() {
  return (
    <div className="pg-site">
      <SEO
        title="PeakGG — Compete Beyond Ranked"
        description="Find teammates, enter tournaments, build a team and climb the Peak ranks."
        path="/"
      />

      <header className="pg-nav">
        <a href="/" className="pg-brand" aria-label="PeakGG home">
          <PeakMark small />
          <span>PEAK<span>GG</span></span>
        </a>
        <nav className="pg-navlinks" aria-label="Primary">
          <a className="active" href="/">Home</a>
          {nav.map((item) => <a key={item} href={`/${item.toLowerCase()}`}>{item}</a>)}
        </nav>
        <div className="pg-nav-actions">
          <a className="pg-play" href="/register">PLAY NOW</a>
          <button className="pg-lang"><Globe2 size={15}/> EN <ChevronRight size={13}/></button>
          <button className="pg-menu" aria-label="Open menu"><Menu/></button>
        </div>
      </header>

      <main>
        <section className="pg-hero">
          <div className="pg-paper-noise" />
          <div className="hero-copy">
            <div className="hero-kicker">EU COMPETITIVE GAMING STARTS HERE</div>
            <h1>
              <span>COMPETE</span>
              <span className="red">BEYOND</span>
              <span>RANKED.</span>
            </h1>
            <p>Find teammates.<br/>Enter tournaments.<br/>Climb the Peak ranks.</p>
            <div className="hero-actions">
              <a className="btn-red" href="/register">PLAY NOW <ArrowUpRight size={16}/></a>
              <a className="btn-ghost" href="#how"><span className="play-dot"><Play size={12} fill="currentColor"/></span> HOW IT WORKS</a>
            </div>
          </div>
          <MascotArt />
          <div className="hero-stats">
            {[['3,847','PLAYERS ONLINE'],['1,263','TEAMS'],['24','LIVE TOURNAMENTS'],['$12,450','PRIZE POOL LIVE']].map(([n,l]) => (
              <div className="stat" key={l}><strong>{n}</strong><span>{l}</span><i/></div>
            ))}
          </div>
        </section>

        <section className="pg-tournaments" id="how">
          <div className="section-head">
            <div><span>COMPETE FOR MORE</span><h2>ACTIVE COMPETITIONS</h2></div>
            <a href="/tournaments">VIEW ALL TOURNAMENTS <ArrowUpRight size={15}/></a>
          </div>
          <div className="tournament-grid">
            {tournaments.map((t, i) => (
              <article className="t-card" key={t.title}>
                <div className="t-card-copy">
                  <small>{t.eyebrow}</small>
                  <h3>{t.title}</h3>
                  <p>{t.meta}</p>
                  <a href="/tournaments">{t.cta} <ArrowUpRight size={14}/></a>
                </div>
                <CardArt type={t.variant}/>
                <span className="card-index">0{i+1}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="pg-live-grid">
          <div className="panel live-panel">
            <div className="panel-title"><span>LIVE <b>MATCHES</b></span><a href="/tournaments">VIEW ALL</a></div>
            <div className="feature-match">
              <div className="team"><div className="team-mark">N</div><b>NOVA CREW</b></div>
              <div className="score"><span>● LIVE</span><strong>13 - 10</strong><small>ASCENT · BEST OF 1</small></div>
              <div className="team"><div className="team-mark alt">V</div><b>VENOM</b></div>
            </div>
            <div className="match-list">
              {[['ECLIPSE','7 - 9','WOLVES','LIVE'],['REBELS','10 - 13','DYNASTY','LIVE'],['INFERNO','13 - 8','FALCON','15:30'],['UNITY','0 - 0','PHOENIX','17:00']].map(r => (
                <div className="match-row" key={r[0]}><b>{r[0]}</b><strong>{r[1]}</strong><b>{r[2]}</b><span>{r[3]}</span></div>
              ))}
            </div>
          </div>

          <div className="panel players-panel">
            <div className="panel-title"><span>TOP <b>PLAYERS</b></span><a href="/leaderboard">VIEW LEADERBOARD</a></div>
            <div className="player-list">
              {players.map(([rank,name,elo,delta]) => (
                <div className="player-row" key={name}>
                  <strong>{rank}</strong>
                  <div className="player-avatar"><div className="mini-hood"/></div>
                  <div><b>{name}</b><span>{elo}</span></div>
                  <em className={delta.startsWith('-') ? 'down' : ''}>{delta}</em>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pg-feature-strip">
          <article>
            <Users/><span>FIND PLAYERS</span><p>Scout serious teammates by role, rank, region and availability.</p><ArrowUpRight/>
          </article>
          <article>
            <Shield/><span>BUILD A TEAM</span><p>Create a roster, recruit players and build your competitive identity.</p><ArrowUpRight/>
          </article>
          <article>
            <Trophy/><span>ENTER CUPS</span><p>Open cups, leagues and community events built for real competition.</p><ArrowUpRight/>
          </article>
          <article>
            <BarChart3/><span>CLIMB ELO</span><p>Every verified result shapes your Peak rating and seasonal position.</p><ArrowUpRight/>
          </article>
          <article>
            <Swords/><span>MAKE A NAME</span><p>Your matches, ranks and results become your competitive profile.</p><ArrowUpRight/>
          </article>
        </section>

        <section className="pg-ranks">
          <div className="ranks-copy"><small>7 RANKS. ONE PEAK.</small><h2>CLIMB UNTIL<br/><span>THEY KNOW YOUR NAME.</span></h2></div>
          <div className="rank-track">
            {['ROOKIE','CONTENDER','RIVAL','EXPERT','ELITE','MASTER','APEX'].map((rank, i) => (
              <div className={`rank-node r${i}`} key={rank}><div className="rank-glyph"><span>{i+1}</span></div><b>{rank}</b>{i<6 && <i/>}</div>
            ))}
          </div>
        </section>

        <section className="pg-cta">
          <div className="cta-crowd" />
          <div className="cta-red-slice" />
          <div className="cta-content">
            <small>THIS IS YOUR PEAK</small>
            <h2>YOUR JOURNEY<br/><span>STARTS HERE.</span></h2>
            <a className="btn-red" href="/register">CREATE ACCOUNT <ArrowUpRight size={16}/></a>
          </div>
        </section>
      </main>

      <footer className="pg-footer">
        <div className="footer-brand"><div className="pg-brand inverse"><PeakMark small/><span>PEAK<span>GG</span></span></div><p>The competitive platform for players who want more than ranked.</p></div>
        <div><b>PLAY</b><a href="/tournaments">Tournaments</a><a href="/teams">Teams</a><a href="/free-agents">Players</a><a href="/leagues">Leagues</a></div>
        <div><b>COMPETE</b><a href="/leaderboard">Leaderboards</a><a href="/elo">Peak ELO</a><a href="/faq">Rules</a></div>
        <div><b>COMMUNITY</b><a href="/free-agents">Find Players</a><a href="/contact">Discord</a><a href="/faq">Support</a></div>
        <div><b>COMPANY</b><a href="/about">About Us</a><a href="/contact">Contact</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div>
        <p className="copyright">© 2026 PeakGG. All rights reserved.</p>
      </footer>
    </div>
  );
}
