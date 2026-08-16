import { ArrowUpRight, Globe2, Menu } from "lucide-react";
import { ReactNode } from "react";

const nav = [
  ["Tournaments", "/tournaments"],
  ["Teams", "/teams"],
  ["Players", "/free-agents"],
  ["Ranks", "/leaderboard"],
  ["Leagues", "/leagues"],
  ["Community", "/contact"],
];

function Mark(){return <svg className="peak-mark peak-mark--small" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5 5 55h14l13-24 13 24h14L32 5Z" fill="currentColor"/><path d="M32 22 19 47h9l4-8 4 8h9L32 22Z" fill="#fff"/></svg>}

export default function PeakShell({title,kicker,description,children}:{title:string;kicker:string;description?:string;children:ReactNode}){
  return <div className="pg-site pg-inner-site">
    <header className="pg-nav">
      <a href="/" className="pg-brand"><Mark/><span>PEAK<span>GG</span></span></a>
      <nav className="pg-navlinks"><a href="/">Home</a>{nav.map(([label,href])=><a key={href} className={location.pathname===href?"active":""} href={href}>{label}</a>)}</nav>
      <div className="pg-nav-actions"><a className="pg-play" href="/register">PLAY NOW</a><button className="pg-lang"><Globe2 size={15}/> EN</button><button className="pg-menu"><Menu/></button></div>
    </header>
    <section className="inner-hero">
      <div className="inner-grid"/><div className="inner-slash"/>
      <div className="inner-head"><small>{kicker}</small><h1>{title}</h1>{description&&<p>{description}</p>}</div>
      <div className="inner-emblem"><span/><i/><b/></div>
    </section>
    <main className="inner-main">{children}</main>
    <footer className="pg-footer compact">
      <div className="footer-brand"><div className="pg-brand inverse"><Mark/><span>PEAK<span>GG</span></span></div><p>Compete beyond ranked.</p></div>
      <div><b>PLAY</b><a href="/tournaments">Tournaments</a><a href="/teams">Teams</a><a href="/free-agents">Players</a></div>
      <div><b>COMPETE</b><a href="/leaderboard">Leaderboard</a><a href="/leagues">Leagues</a></div>
      <div><b>COMPANY</b><a href="/about">About</a><a href="/contact">Contact</a><a href="/terms">Terms</a></div>
      <a className="footer-cta" href="/register">ENTER PEAKGG <ArrowUpRight size={16}/></a>
    </footer>
  </div>
}
