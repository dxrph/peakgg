import PeakMotion from './peak-motion';

const matches = [
  { game: 'VAL', phase: 'LIVE', left: 'NOVA', right: 'KRAKEN', score: '11 — 9' },
  { game: 'RL', phase: '18:30', left: 'APEX', right: 'ONYX', score: 'BO5' },
  { game: 'CS2', phase: '21:00', left: 'VANTA', right: 'ECHO', score: 'BO3' },
];
const ranks = [
  { rank: '01', player: 'Rift', role: 'Duelist', team: 'NOVA', rating: '1.42', trend: '+08' },
  { rank: '02', player: 'Nyx', role: 'Controller', team: 'KRAKEN', rating: '1.37', trend: '+03' },
  { rank: '03', player: 'Keon', role: 'Entry', team: 'VANTA', rating: '1.31', trend: '—' },
  { rank: '04', player: 'Sable', role: 'IGL', team: 'ECHO', rating: '1.29', trend: '+11' },
];

export default function Home() {
  return (
    <PeakMotion>
      <main className="site-shell">
        <div className="cinema-backdrop" aria-hidden="true">
          <img className="cinema-frame frame-hero" src="/assets/peakgg-hero-v2.webp" alt="" />
          <img className="cinema-frame frame-story" src="/assets/peakgg-story-v2.webp" alt="" />
          <img className="cinema-frame frame-team" src="/assets/peakgg-team-v2.webp" alt="" />
          <div className="cinema-grade" />
          <div className="cinema-noise" />
        </div>
        <nav className="nav" aria-label="Navigazione principale">
          <a className="brand" href="#top" aria-label="PeakGG home"><img className="brand-logo" src="/assets/peakgg-logo.png" alt="" /><span>PEAK<span className="accent">GG</span></span></a>
          <div className="nav-links"><a href="#competition">Competizioni</a><a href="#rankings">Rankings</a><a href="#teams">Teams</a></div>
          <a className="nav-cta" href="#join">Entra in PeakGG <span aria-hidden="true">↗</span></a>
        </nav>

        <section className="hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow hero-reveal"><span className="live-dot" /> Competitive gaming, finally connected</p>
            <h1 className="hero-title"><span className="solid-line">IL TUO GIOCO.</span><br /><span>IL TUO PICCO.</span></h1>
            <p className="hero-lede hero-reveal">Tornei, ranking verificati e scouting in un unico ecosistema competitivo. Costruisci il tuo team. Sfida i migliori. Fatti notare.</p>
            <div className="hero-actions hero-reveal"><a className="primary-action" href="#competition">Trova una competizione <span>→</span></a><a className="text-action" href="#rankings">Esplora i ranking</a></div>
            <div className="proof hero-reveal" aria-label="Statistiche dimostrative PeakGG"><div><strong>12.8K</strong><span>Player attivi</span></div><div><strong>480+</strong><span>Team verificati</span></div><div><strong>€35K</strong><span>Prize pool mensile</span></div></div>
          </div>
          <div className="hero-art hero-console">
            <img src="/assets/peakgg-hero-v2.webp" alt="Portale monumentale che conduce all'arena competitiva PeakGG" />
            <div className="hero-art-stamp"><span>SEASON // 01</span><strong>ENTER<br />THE PEAK</strong></div>
            <div className="match-console" aria-label="Partite competitive">
              <div className="console-head"><span>MATCH CENTER</span><span className="system-status">LIVE</span></div>
              <div className="match-list">{matches.slice(0, 2).map((match) => <div className="match-row" key={`${match.game}-${match.left}`}><span className="game-tag">{match.game}</span><span>{match.left} <i>vs</i> {match.right}</span><strong>{match.score}</strong><small>{match.phase}</small></div>)}</div>
            </div>
          </div>
        </section>

        <div className="ticker" aria-label="Giochi supportati"><div className="ticker-track"><span>VALORANT</span><i /> <span>COUNTER-STRIKE 2</span><i /> <span>ROCKET LEAGUE</span><i /> <span>LEAGUE OF LEGENDS</span><i /> <span>VALORANT</span><i /> <span>COUNTER-STRIKE 2</span></div></div>

        <section className="image-story cinema-chapter" data-frame="story" aria-label="La storia PeakGG">
          <img src="/assets/peakgg-story-v2.webp" alt="Montagna digitale attraversata da flussi di dati competitivi" />
          <div className="story-copy reveal-item"><span>THIS IS PEAKGG // 001</span><h2>NON È SOLO<br />UN ALTRO MATCH.</h2><p>È il momento in cui il talento trova una misura, un team trova il suo quinto e una performance diventa reputazione. PeakGG connette tutto ciò che succede prima, durante e dopo la competizione.</p><a href="#competition">SCOPRI L'ECOSISTEMA →</a></div>
        </section>

        <section className="competition section-pad cinema-chapter" data-frame="story" id="competition">
          <div className="section-kicker reveal-item"><span>01</span> COMPETE</div>
          <div className="section-heading reveal-item"><h2>OGNI MATCH<br />CONTA DAVVERO.</h2><p>Dal primo qualifier alla finale. Entra in competizioni strutturate, affronta avversari al tuo livello e trasforma ogni risultato in reputazione verificata.</p></div>
          <div className="format-grid">
            <article className="format-main reveal-item"><div className="format-label">NEXT UP · OPEN QUALIFIER</div><div className="format-orbit" aria-hidden="true"><span>64</span><small>TEAM</small></div><h3>PEAK SERIES<br />EUROPE // 07</h3><div className="format-meta"><span>VALORANT</span><span>12 SEP — 19:30</span><span>€5,000 PRIZE POOL</span></div><a href="#join">REGISTRATI ORA →</a></article>
            <article className="format-side reveal-item"><span>WEEKLY // SOLO</span><strong>1V1<br />LADDER</strong><p>Una settimana. Una classifica. Nessuna scusa.</p><a href="#join">JOIN QUEUE ↗</a></article>
            <article className="format-side muted-card reveal-item"><span>COMMUNITY // OPEN</span><strong>FIND<br />YOUR FIVE</strong><p>Profilo, ruolo e disponibilità. Il team giusto parte dai dati.</p><a href="#teams">FIND PLAYERS ↗</a></article>
          </div>
        </section>

        <section className="rank-section section-pad cinema-chapter" data-frame="team" id="rankings">
          <div className="rank-intro reveal-item"><div className="section-kicker"><span>02</span> PROVE IT</div><h2>IL RANKING<br />CHE NON MENTE.</h2><p>Performance, consistenza e qualità degli avversari. Un punteggio trasparente che racconta quanto vali davvero.</p></div>
          <div className="ranking-table reveal-item" role="table" aria-label="Top player dimostrativi">
            <div className="rank-head" role="row"><span>#</span><span>PLAYER</span><span>ROLE</span><span>TEAM</span><span>RATING</span><span>7D</span></div>
            {ranks.map((item) => <div className="rank-row" role="row" key={item.rank}><span className="rank-number">{item.rank}</span><strong><i>{item.player[0]}</i>{item.player}</strong><span>{item.role}</span><span>{item.team}</span><b>{item.rating}</b><em>{item.trend}</em></div>)}
            <a className="rank-link" href="#join">APRI IL RANKING COMPLETO <span>→</span></a>
          </div>
        </section>

        <section className="path section-pad" id="teams">
          <div className="path-sticky"><div className="section-kicker"><span>03</span> GET SEEN</div><h2>DA PLAYER<br />A PROSPECT.</h2><p>Il talento senza contesto resta invisibile. PeakGG trasforma le tue prestazioni in un profilo competitivo leggibile da team, coach e organizzazioni.</p></div>
          <div className="path-steps">
            <article className="path-card"><span>01 / BUILD</span><h3>CREA IL TUO<br />PROFILO COMPETITIVO</h3><p>Ruolo, pool, disponibilità e risultati verificati. La tua identità da player, finalmente completa.</p><strong>PROFILE COMPLETENESS</strong><div><i style={{ width: '86%' }} /></div></article>
            <article className="path-card"><span>02 / CLIMB</span><h3>GIOCA. VINCI.<br />SCALA.</h3><p>Ogni competizione aggiorna il tuo rating e costruisce una storia di performance reale.</p><strong>RANK MOMENTUM</strong><div><i style={{ width: '68%' }} /></div></article>
            <article className="path-card"><span>03 / CONNECT</span><h3>FATTI TROVARE<br />DA CHI CONTA.</h3><p>Entra nei radar dei team attraverso filtri utili, dati chiari e risultati che parlano per te.</p><strong>SCOUT VISIBILITY</strong><div><i style={{ width: '93%' }} /></div></article>
          </div>
        </section>

        <section className="team-poster cinema-chapter" data-frame="team" aria-label="Community PeakGG">
          <img src="/assets/peakgg-team-v2.webp" alt="Cinque monoliti rappresentano i ruoli di un team PeakGG" />
          <div className="team-title reveal-item"><span>THE COMMUNITY</span><h2>NOI SIAMO<br /><b>PEAKGG.</b></h2><p>PLAYER · TEAM · COACH · CREATOR</p></div>
        </section>

        <section className="final-cta" id="join"><div className="cta-grid" aria-hidden="true"/><p className="section-kicker"><span>READY?</span> YOUR NEXT MATCH STARTS HERE</p><h2>NON GIOCARE<br />NELL’OMBRA.</h2><a href="mailto:join@peakgg.gg">CREA IL TUO PROFILO <span>↗</span></a><small>GRATIS PER I PLAYER · NESSUNA CARTA RICHIESTA</small></section>
        <footer><a className="brand" href="#top"><img className="brand-logo" src="/assets/peakgg-logo.png" alt="" /><span>PEAK<span className="accent">GG</span></span></a><p>THE COMPETITIVE LAYER FOR THE NEXT GENERATION.</p><div><a href="#competition">Competizioni</a><a href="#rankings">Rankings</a><a href="#teams">Teams</a></div><span>© 2026 PEAKGG — CONCEPT HOMEPAGE</span></footer>
      </main>
    </PeakMotion>
  );
}
