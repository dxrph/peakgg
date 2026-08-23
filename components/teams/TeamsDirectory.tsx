'use client';

import Link from 'next/link';
import Image from 'next/image';
import {useMemo, useState} from 'react';
import {filterTeams} from '../../lib/internal-pages-models.mjs';

export type TeamDirectoryItem = {
  id: string;
  slug: string;
  name: string;
  tag: string;
  region: string;
  logoUrl: string | null;
  recruiting: boolean;
  members: number;
};

type Filters = {search: string; region: string; status: string};

export default function TeamsDirectory({teams, initialFilters}: {teams: TeamDirectoryItem[]; initialFilters: Filters}) {
  const [filters, setFilters] = useState(initialFilters);
  const visible = useMemo(() => filterTeams(teams, filters) as TeamDirectoryItem[], [teams, filters]);
  const recruiting = visible.filter(team => team.recruiting).slice(0, 2);

  function update(next: Partial<Filters>) {
    const value = {...filters, ...next};
    setFilters(value);
    const query = new URLSearchParams();
    if (value.search) query.set('search', value.search);
    if (value.region !== 'ALL') query.set('region', value.region);
    if (value.status !== 'ALL') query.set('status', value.status.toLowerCase());
    window.history.replaceState(null, '', query.size ? `/teams?${query}` : '/teams');
  }

  return <>
    <section className="teams-controls" aria-label="Team directory filters">
      <div className="internal-wrap teams-controls-grid">
        <label className="teams-search" htmlFor="team-search"><span>SEARCH TEAMS</span><input id="team-search" name="search" type="search" value={filters.search} onChange={event => update({search: event.target.value})} autoComplete="off"/></label>
        <fieldset><legend>REGION /</legend>{['ALL', 'EUROPE'].map(region => <button type="button" key={region} aria-pressed={filters.region === region} onClick={() => update({region})}>{region}</button>)}</fieldset>
        <fieldset><legend>STATUS /</legend>{['ALL', 'RECRUITING'].map(status => <button type="button" key={status} aria-pressed={filters.status === status} onClick={() => update({status})}>{status}</button>)}</fieldset>
      </div>
    </section>

    {visible.length === 0 ? <TeamNetworkEmpty hasTeams={teams.length > 0}/> : <div className="internal-wrap teams-results" aria-live="polite">
      {recruiting.length > 0 ? <section className="teams-featured" aria-labelledby="featured-teams-title">
        <header><p className="internal-kicker">FEATURED / RECRUITING</p><span>{String(recruiting.length).padStart(2, '0')} / OPEN ROSTERS</span></header>
        <div className="teams-featured-grid">{recruiting.map((team, index) => <TeamRecord team={team} featured index={index} key={team.id}/>)}</div>
      </section> : null}
      <section className="teams-directory" aria-labelledby="team-directory-title">
        <header><p className="internal-kicker">TEAM DIRECTORY</p><span>{String(visible.length).padStart(2, '0')} / TEAMS</span></header>
        <h2 className="sr-only" id="team-directory-title">Team directory</h2>
        <div>{visible.map((team, index) => <TeamRecord team={team} index={index} key={team.id}/>)}</div>
      </section>
    </div>}
  </>;
}

function TeamRecord({team, featured = false, index}: {team: TeamDirectoryItem; featured?: boolean; index: number}) {
  return <article className={featured ? 'team-record team-record-featured' : 'team-record'}>
    <div className="team-record-index">{String(index + 1).padStart(2, '0')}</div>
    <div className="team-monogram" aria-hidden="true">{team.logoUrl ? <Image src={team.logoUrl} alt="" width={80} height={80} unoptimized/> : team.tag.slice(0, 3)}</div>
    <div className="team-record-name"><h3>{team.name}</h3><p>{team.tag}</p></div>
    <dl><div><dt>REGION</dt><dd>{team.region}</dd></div><div><dt>ROSTER</dt><dd>{team.members} / 7 PLAYERS</dd></div></dl>
    <p className={`team-status${team.recruiting ? ' is-open' : ''}`}><span aria-hidden="true"/>{team.recruiting ? 'RECRUITING' : 'ROSTER SET'}</p>
    <Link href={`/teams/${team.slug}`}>VIEW TEAM <span aria-hidden="true">→</span></Link>
  </article>;
}

function TeamNetworkEmpty({hasTeams}: {hasTeams: boolean}) {
  return <section className="internal-wrap teams-empty" aria-live="polite">
    <div><p className="internal-kicker">NETWORK / EMPTY</p><h2>{hasTeams ? <>NO TEAMS<br/>MATCH THESE FILTERS.</> : <>NO TEAMS IN THE<br/>NETWORK YET.</>}</h2><p>{hasTeams ? 'RESET THE DIRECTORY CONTROLS.' : 'BUILD THE FIRST FIVE.'}</p><Link className="peak-button" href="/teams/create">CREATE TEAM</Link></div>
    <ol aria-label="Team building flow"><li><b>01</b><strong>CREATE</strong><span>Establish your team identity.</span></li><li><b>02</b><strong>RECRUIT</strong><span>Build a five-player core.</span></li><li><b>03</b><strong>COMPETE</strong><span>Enter structured events.</span></li></ol>
  </section>;
}
