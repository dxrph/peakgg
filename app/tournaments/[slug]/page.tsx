import Link from 'next/link';
import {notFound} from 'next/navigation';
import TournamentHeader from '../../../components/tournaments/TournamentHeader';
import RegistrationFlow from '../../../components/tournaments/RegistrationFlow';
import {EmptyState} from '../../../components/ui/ProductPage';
import {getTournamentBySlug,type Tournament as LocalTournament} from '../../../data/tournaments';
import {supabaseConfigured} from '../../../lib/supabase/config';
import {createClient} from '../../../lib/supabase/server';
import {getSessionUser} from '../../../lib/auth/session';

const tabs=['OVERVIEW','TEAMS','BRACKET','MATCHES','RULES','PRIZES'];
const localEvent=(event:LocalTournament)=>({
  ...event,
  status:event.status==='OPEN'?'REGISTRATION_OPEN':event.status,
  description:`${event.structure} tournament for ${event.capacity.toLowerCase()}. Registration closes ${event.registrationLock??'before check-in'}.`,
});

function EventNavigation(){return <nav className="peak-container product-actions tournament-subnav" aria-label="Tournament sections">{tabs.map((tab,index)=><Link className="peak-button secondary" key={tab} href={index===0?'#overview':`#${tab.toLowerCase()}`}>{tab}</Link>)}</nav>}

function LocalDetails({event}:{event:LocalTournament}){return <main className="product-page tournament-detail"><TournamentHeader event={localEvent(event)}/><EventNavigation/><section className="peak-container data-section" id="overview" aria-labelledby="overview-title"><div className="tournament-detail-heading"><div><p className="mono-label">EVENT DOSSIER / {event.code}</p><h2 id="overview-title">READY FOR<br/>THE BRACKET.</h2></div><p>{event.imageAlt}</p></div><dl className="tournament-facts">{[['DATE',event.date],['START',event.time??'TIME PENDING'],['REGION',event.region],['FORMAT',event.format],['CAPACITY',event.capacity],['STRUCTURE',event.structure],['REGISTRATION LOCK',event.registrationLock??'TO BE ANNOUNCED'],['STATUS',event.status]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section><section className="peak-container data-section tournament-coming" id="teams"><p className="mono-label">LIVE EVENT DATA</p><h2>TEAMS, BRACKET &amp; MATCHES APPEAR HERE WHEN REGISTRATION OPENS.</h2><Link className="peak-button secondary" href="/tournaments">BACK TO ALL EVENTS</Link></section></main>}

export default async function Tournament({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{register?:string;error?:string}>}){
  const {slug}=await params;const query=await searchParams;const fallback=getTournamentBySlug(slug);
  if(!supabaseConfigured){if(!fallback)notFound();return <LocalDetails event={fallback}/>}
  const supabase=await createClient();const {data}=await supabase.from('tournaments').select('*').eq('slug',slug).maybeSingle();
  if(!data){if(fallback)return <LocalDetails event={fallback}/>;notFound()}
  const event=data as Record<string,unknown>;const user=await getSessionUser();let team:{id:string;name:string}|null=null;let members:{user_id:string;username:string;primary_role:string}[]=[];let leadership='';
  if(user){const {data:membership}=await supabase.from('team_members').select('team_id,leadership').eq('user_id',user.id).eq('active',true).maybeSingle();if(membership){const own=membership as {team_id:string;leadership:string};leadership=own.leadership;const {data:teamData}=await supabase.from('teams').select('id,name').eq('id',own.team_id).single();team=teamData as {id:string;name:string}|null;const {data:roster}=await supabase.from('team_members').select('user_id,profiles(username,primary_role)').eq('team_id',own.team_id).eq('active',true);members=((roster||[]) as unknown as {user_id:string;profiles:{username:string;primary_role:string}}[]).map(x=>({user_id:x.user_id,...x.profiles}))}}
  const isLeader=['CAPTAIN','CO_CAPTAIN'].includes(leadership);
  return <main className="product-page tournament-detail"><TournamentHeader event={event} authenticated={Boolean(user)} hasTeam={Boolean(team)} isLeader={isLeader}/>{query.register==='1'&&team&&isLeader&&<RegistrationFlow event={event as {id:string;slug:string;name:string;roster_lock_at?:string;check_in_open_at?:string;start_at?:string}} team={team} members={members} error={query.error}/>}<EventNavigation/><section className="peak-container data-section"><EmptyState title="COMPETITIVE DATA IS BEING PREPARED." body="Published teams, matches, bracket, rules, and prizes will appear here as the event progresses."/></section></main>
}
