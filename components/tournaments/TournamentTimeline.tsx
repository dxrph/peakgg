const stages=['REGISTRATION','CHECK-IN','ROUND 01','PLAYOFFS','FINAL'];
export default function TournamentTimeline(){return <ol className="t-timeline" aria-label="Tournament timeline">{stages.map((stage,index)=><li className={index===0?'is-active':''} aria-current={index===0?'step':undefined} key={stage}><span>0{index+1}</span><b>{stage}</b></li>)}</ol>}
