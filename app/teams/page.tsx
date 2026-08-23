import Image from 'next/image';
import Link from 'next/link';
import TeamsDirectory, {type TeamDirectoryItem} from '../../components/teams/TeamsDirectory';
import {supabaseConfigured} from '../../lib/supabase/config';
import {createClient} from '../../lib/supabase/server';

type Query = {search?: string; region?: string; status?: string};

export default async function Teams({searchParams}: {searchParams: Promise<Query>}) {
  const query = await searchParams;
  const teams = await loadTeams();
  return <main className="internal-page teams-page">
    <section className="teams-intro internal-wrap">
      <div className="teams-intro-copy"><p className="internal-kicker">02 / TEAM NETWORK</p><h1>BUILD YOUR FIVE.</h1><p className="teams-support">FIND A ROSTER.<br/>JOIN A TEAM.<br/>ENTER COMPETITION.</p><div className="teams-intro-actions"><Link className="peak-button" href="/teams/create">CREATE TEAM</Link><Link className="text-cta" href="/players">FIND PLAYERS <span aria-hidden="true">→</span></Link></div></div>
      <figure className="teams-intro-art"><Image src="/assets/home/community-lan.png" alt="A competitive team gathering around its match setup backstage" fill priority sizes="(max-width: 700px) 100vw, 40vw"/><figcaption>TEAM ENVIRONMENT / EUROPE</figcaption><i aria-hidden="true"/><b aria-hidden="true">05</b></figure>
    </section>
    <TeamsDirectory teams={teams} initialFilters={{search: query.search ?? '', region: query.region === 'EUROPE' ? 'EUROPE' : 'ALL', status: query.status === 'recruiting' ? 'RECRUITING' : 'ALL'}}/>
  </main>;
}

async function loadTeams(): Promise<TeamDirectoryItem[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  const {data} = await supabase.from('teams').select('id,slug,name,tag,region,logo_url,recruiting,team_members(count)').is('suspended_at', null).is('disbanded_at', null).order('created_at', {ascending: false});
  return ((data ?? []) as unknown as Array<{id:string;slug:string;name:string;tag:string;region:string;logo_url:string|null;recruiting:boolean;team_members:Array<{count:number}>}>).map(team => ({id: team.id, slug: team.slug, name: team.name, tag: team.tag, region: team.region, logoUrl: team.logo_url, recruiting: team.recruiting, members: team.team_members?.[0]?.count ?? 0}));
}
