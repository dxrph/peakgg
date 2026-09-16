import { ArrowDown, ArrowUp, Crown } from "lucide-react";
import PeakShell from "@/components/peak/PeakShell";
import SEO from "@/components/SEO";
const rows=[['01','RAZEKING','NOVA CREW','2,184','APEX','+42'],['02','SIHRO','VENOM','2,056','MASTER','+18'],['03','NEPTUNE','ETERNAL','1,987','MASTER','+31'],['04','BOTEX','—','1,875','ELITE','-9'],['05','VOID','NIGHT SHIFT','1,811','ELITE','+16'],['06','KAI','APEX GAMING','1,772','ELITE','+8'],['07','RUNE','ECLIPSE','1,728','EXPERT','+27'],['08','MAVE','—','1,694','EXPERT','-4']];
export default function Leaderboard(){return <PeakShell title="RANKINGS" kicker="PROVE WHERE YOU BELONG" description="One leaderboard. Seven ranks. Every verified result matters.">
<SEO title="PeakGG Rankings" description="PeakGG competitive player rankings and ELO leaderboard." path="/leaderboard"/>
<section className="leaderboard-top"><div><small>SEASON 01</small><h2>TOP OF THE PEAK</h2><p>EU · ALL ROLES · VERIFIED MATCHES</p></div><div className="champion-card"><Crown/><span>#01 PLAYER</span><strong>RAZEKING</strong><b>2,184 ELO</b></div></section>
<div className="leaderboard-table"><div className="lb-head"><span>RANK</span><span>PLAYER</span><span>TEAM</span><span>PEAK ELO</span><span>DIVISION</span><span>CHANGE</span></div>{rows.map((r,i)=><div className="lb-row" key={r[1]}><strong>{r[0]}</strong><div className="lb-player"><div className="lb-avatar">{r[1][0]}</div><b>{r[1]}</b></div><span>{r[2]}</span><b>{r[3]}</b><span className={`division d${i}`}>{r[4]}</span><em className={r[5].startsWith('-')?'down':''}>{r[5].startsWith('-')?<ArrowDown/>:<ArrowUp/>}{r[5]}</em></div>)}</div>
<section className="elo-explainer"><small>HOW IT WORKS</small><h2>WIN. CLIMB.<br/><span>HOLD YOUR POSITION.</span></h2><p>Peak ELO is built around verified competitive results. Strong opponents, consistent wins and tournament performance push you higher.</p><a href="/elo">UNDERSTAND PEAK ELO →</a></section>
</PeakShell>}
