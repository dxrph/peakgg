import { ArrowUpRight, Search, Shield, Users2 } from "lucide-react";
import PeakShell from "@/components/peak/PeakShell";
import SEO from "@/components/SEO";

const teams=[['01','NOVA CREW','2,310 ELO','EU','8-1'],['02','PEAK ESPORTS','2,250 ELO','EU','7-2'],['03','VENOM CLAN','2,105 ELO','FR','7-3'],['04','ETERNAL FIRE','1,980 ELO','EU','6-3'],['05','APEX GAMING','1,875 ELO','BE','5-4'],['06','NIGHT SHIFT','1,804 ELO','NL','5-5']];
export default function Teams(){return <PeakShell title="TEAMS" kicker="BUILD YOUR ROSTER" description="Discover active teams, scout rosters and find your next competitive home.">
<SEO title="PeakGG Teams" description="Discover and build competitive teams on PeakGG." path="/teams"/>
<div className="directory-bar"><div className="directory-search"><Search size={17}/><input placeholder="SEARCH TEAM OR TAG"/></div><button className="active">TOP RATED</button><button>RECRUITING</button><button>NEW</button><a href="/register">CREATE TEAM <ArrowUpRight size={15}/></a></div>
<section className="team-directory">
 {teams.map(([rank,name,elo,region,form],i)=><article className="team-directory-row" key={name}>
  <strong>{rank}</strong><div className={`team-crest c${i}`}><Shield/></div><div className="team-name"><b>{name}</b><span>{region} · VERIFIED</span></div><div><small>PEAK RATING</small><b>{elo}</b></div><div><small>RECENT FORM</small><b>{form}</b></div><div className="team-roster"><Users2/><span>5 ACTIVE</span></div><a href="/register"><ArrowUpRight/></a>
 </article>)}
</section>
<section className="recruit-banner"><div className="recruit-mark">LFT</div><div><small>NO TEAM YET?</small><h2>GET FOUND BY<br/><span>THE RIGHT ROSTER.</span></h2></div><p>Create a competitive profile, set your roles and availability, then enter the Free Agent board.</p><a href="/free-agents">FIND PLAYERS <ArrowUpRight/></a></section>
</PeakShell>}
