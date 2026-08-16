import { ArrowUpRight, CalendarDays, Clock3, Trophy, Users } from "lucide-react";
import PeakShell from "@/components/peak/PeakShell";
import SEO from "@/components/SEO";

const cups=[
 {state:"REGISTRATION OPEN",title:"COMMUNITY CUP #04",date:"MAY 24 — 25",teams:"16 TEAMS",format:"SINGLE ELIMINATION",accent:"red"},
 {state:"UPCOMING",title:"SOLO QUEUE CUP #02",date:"MAY 31",teams:"64 PLAYERS",format:"INDIVIDUAL",accent:"black"},
 {state:"LIVE",title:"PEAK LEAGUE — S1",date:"WEEK 03",teams:"12 TEAMS",format:"LEAGUE PLAY",accent:"dark"},
 {state:"UPCOMING",title:"OPEN CUP #05",date:"JUNE 07",teams:"32 TEAMS",format:"BO1 → BO3",accent:"paper"},
];

export default function Tournaments(){return <PeakShell title="TOURNAMENTS" kicker="ENTER THE ARENA" description="Open cups, leagues and competitive events designed for players who want more than ranked.">
 <SEO title="PeakGG Tournaments" description="Compete in PeakGG tournaments and leagues." path="/tournaments"/>
 <div className="competition-toolbar"><div><button className="active">ALL</button><button>OPEN</button><button>LIVE</button><button>UPCOMING</button></div><a href="/register">CREATE YOUR TEAM <ArrowUpRight size={15}/></a></div>
 <section className="competition-grid">
  {cups.map((c,i)=><article className={`competition-card ${c.accent}`} key={c.title}>
   <div className="competition-art"><span className="cup-number">0{i+1}</span><div className="cup-emblem"><Trophy/></div></div>
   <div className="competition-copy"><small>{c.state}</small><h2>{c.title}</h2><div className="competition-meta"><span><CalendarDays/>{c.date}</span><span><Users/>{c.teams}</span><span><Clock3/>{c.format}</span></div><a href="/register">VIEW EVENT <ArrowUpRight/></a></div>
  </article>)}
 </section>
 <section className="season-banner"><div><small>SEASON 01</small><h2>EVERY MATCH<br/><span>BUILDS YOUR NAME.</span></h2><p>Verified competition feeds your Peak rating, seasonal record and team history.</p></div><div className="season-score"><strong>24</strong><span>EVENTS</span><strong>186</strong><span>TEAMS</span><strong>428</strong><span>PLAYERS</span></div></section>
 </PeakShell>}
