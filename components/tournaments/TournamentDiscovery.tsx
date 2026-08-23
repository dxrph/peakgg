'use client';
import {useMemo,useState} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {filterTournaments,parseTournamentFilters,serializeTournamentFilters,type Tournament,type TournamentFilters as Values,type TournamentTab} from '@/data/tournaments';
import TournamentFilters from './TournamentFilters';
import TournamentPoster from './TournamentPoster';
import FeaturedTournament from './FeaturedTournament';

export default function TournamentDiscovery({items}:{items:Tournament[]}){
  const router=useRouter();
  const pathname=usePathname();
  const searchParams=useSearchParams();
  const[panel,setPanel]=useState(false);
  const values=useMemo(()=>parseTournamentFilters(new URLSearchParams(searchParams.toString())),[searchParams]);
  const results=filterTournaments(items.slice(1),values);
  const commit=(next:Values)=>{const query=serializeTournamentFilters(next);router.replace(query?`${pathname}?${query}`:pathname,{scroll:false})};
  const update=<K extends keyof Values>(key:K,value:Values[K])=>commit({...values,[key]:value});
  const reset=()=>commit({tab:'ALL',region:'ALL',format:'ALL',teamSize:'ALL'});
  return <><TournamentFilters values={values} panel={panel} onTab={(tab:TournamentTab)=>update('tab',tab)} onChange={update} onToggle={()=>setPanel(value=>!value)} onClose={()=>setPanel(false)}/>{items[0]?<FeaturedTournament tournament={items[0]}/>:<section className="t-featured"><div className="t-wrap t-empty" role="status"><h2>NO EVENTS ARE OPEN RIGHT NOW.</h2></div></section>}<section className="t-index" aria-labelledby="event-index-title"><div className="t-wrap"><header className="t-index-head"><div><p className="t-label">02 / EVENT INDEX</p><h2 id="event-index-title">CURRENT<br/>CIRCUIT</h2></div><p>OPEN EVENTS, LEAGUES<br/>AND SPECIAL FORMATS.</p></header><div className="t-index-divider"/>{results.length?<div className="t-poster-grid" aria-live="polite">{results.map(item=><TournamentPoster tournament={item} key={item.id}/>)}</div>:<div className="t-empty" role="status" aria-live="polite"><h3>NO EVENTS<br/>MATCH THESE FILTERS.</h3><button type="button" onClick={reset}>RESET FILTERS <span aria-hidden="true">→</span></button></div>}</div></section></>;
}
