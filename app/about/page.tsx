import Image from 'next/image';
import Link from 'next/link';

const loop = [
  ['01', 'PLAYER', 'Build a competitive identity.'],
  ['02', 'TEAM', 'Create or join a five.'],
  ['03', 'TOURNAMENT', 'Enter structured events.'],
  ['04', 'MATCH', 'Operate from one room.'],
  ['05', 'RESULT', 'Verify every outcome.'],
  ['06', 'RANKING', 'Build a lasting record.'],
];

export default function About() {
  return <main className="internal-page about-page">
    <section className="about-intro internal-wrap">
      <div><p className="internal-kicker">PEAKGG / EUROPE</p><h1>COMPETE.<br/>CONNECT.<br/><span>CLIMB.</span></h1><p>A COMPETITIVE VALORANT PLATFORM<br/>BUILT AROUND PLAYERS, TEAMS<br/>AND REAL TOURNAMENT STRUCTURE.</p></div>
      <figure><Image src="/assets/peakgg-generated/open-cup-v2.png" alt="A red-lit entrance leading into a competitive arena" fill priority sizes="(max-width: 700px) 100vw, 38vw"/><figcaption>THE CIRCUIT / EUROPE</figcaption></figure>
    </section>
    <section className="about-platform"><div className="internal-wrap about-platform-grid"><p className="internal-kicker">01 / THE PLATFORM</p><div><h2>FIND PLAYERS.<br/>BUILD A TEAM.<br/>ENTER EVENTS.<br/>BUILD A RECORD.</h2><p>PeakGG connects the competitive path from player discovery to verified tournament history in one product.</p></div></div></section>
    <section className="about-loop"><div className="internal-wrap"><p className="internal-kicker">02 / THE LOOP</p><ol>{loop.map(([code, title, description]) => <li key={code}><span>{code}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></div></section>
    <section className="about-reason internal-wrap"><figure><Image src="/assets/peakgg-generated/community-cup-environment.png" alt="An empty red-lit tournament stage prepared for competition" fill sizes="(max-width: 700px) 100vw, 50vw"/><figcaption>EVENT OPERATIONS / ONE SYSTEM</figcaption></figure><div><p className="internal-kicker">03 / WHY PEAKGG</p><h2>COMPETITION SHOULD NOT LIVE<br/>ACROSS TEN DISCONNECTED TOOLS.</h2><p>PeakGG brings players, teams, events, match operations and competitive history into one system—so the next action is always clear.</p></div></section>
    <section className="about-cta"><div className="internal-wrap"><p className="internal-kicker">04 / NEXT MATCH</p><h2>THE NEXT<br/><span>MATCH</span> IS<br/>THE POINT.</h2><div><Link className="text-cta" href="/play">ENTER THE ARENA <span aria-hidden="true">→</span></Link><Link className="text-cta muted" href="/tournaments">VIEW TOURNAMENTS <span aria-hidden="true">→</span></Link></div></div></section>
  </main>;
}
