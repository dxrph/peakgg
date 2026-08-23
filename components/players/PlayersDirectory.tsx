'use client';

import Link from 'next/link';
import {useMemo, useState} from 'react';
import {
  DEMO_PLAYERS, EMPTY_PLAYER_FILTERS, PLAYER_REGIONS, PLAYER_ROLES, PLAYER_STATUSES,
  filterPlayers, hasActivePlayerFilters, normalizePlayerFilters, playerFiltersToQuery,
} from '../../lib/internal-pages-models.mjs';
import type {DirectoryPlayer, PlayerFilters} from '../../lib/internal-pages-models';

export default function PlayersDirectory({initialFilters}: {initialFilters: PlayerFilters}) {
  const [filters, setFilters] = useState<PlayerFilters>(() => normalizePlayerFilters(initialFilters));
  const players = DEMO_PLAYERS as readonly DirectoryPlayer[];
  const visible = useMemo(() => filterPlayers(players, filters), [players, filters]);
  const active = hasActivePlayerFilters(filters);

  function update(next: Partial<PlayerFilters>) {
    const value = normalizePlayerFilters({...filters, ...next});
    setFilters(value);
    const query = playerFiltersToQuery(value);
    window.history.replaceState(null, '', query ? `/players?${query}` : '/players');
  }

  return <>
    <section className="players-controls" aria-label="Player directory filters">
      <div className="peak-container players-controls-grid">
        <div className="form-field players-search">
          <label htmlFor="player-search">SEARCH</label>
          <input id="player-search" name="search" type="search" autoComplete="off" placeholder="USERNAME, TEAM OR ROLE" value={filters.search} onChange={event => update({search: event.target.value})}/>
        </div>
        <Select id="region" label="REGION" options={PLAYER_REGIONS} value={filters.region} onChange={value => update({region: value})}/>
        <Select id="role" label="ROLE" options={PLAYER_ROLES} value={filters.role} onChange={value => update({role: value})}/>
        <Select id="status" label="TEAM STATUS" options={PLAYER_STATUSES} value={filters.status} onChange={value => update({status: value})}/>
        <div className="players-controls-meta">
          <p aria-live="polite">{String(visible.length).padStart(2, '0')} / {players.length} PLAYERS</p>
          <button type="button" className="peak-button secondary" onClick={() => update(EMPTY_PLAYER_FILTERS)} disabled={!active}>RESET FILTERS</button>
        </div>
      </div>
    </section>

    {visible.length === 0
      ? <section className="peak-container players-empty" aria-live="polite">
          <h2>NO PLAYERS MATCH THESE FILTERS.</h2>
          <p>ADJUST THE SEARCH, REGION, ROLE OR TEAM STATUS TO WIDEN THE DIRECTORY.</p>
          <button type="button" className="peak-button" onClick={() => update(EMPTY_PLAYER_FILTERS)}>CLEAR ALL FILTERS</button>
        </section>
      : <div className="peak-container players-results">
          <ul className="player-list" aria-label="Player directory results">
            {visible.map((player, index) => <li className="player-row" key={player.id}>
              <span className="player-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className="player-monogram" aria-hidden="true">{player.username.slice(0, 2)}</span>
              <span className="player-identity"><strong>{player.username}</strong><small>{player.team ?? 'FREE AGENT'}</small></span>
              <span className={`player-rank rank-tone-${player.rankSlug}`}><i aria-hidden="true"/>{player.rank}<small>{player.elo} ELO</small></span>
              <span className="player-meta"><small>ROLE</small>{player.role}</span>
              <span className="player-meta"><small>REGION</small>{player.region}</span>
              <span className={player.lookingForTeam ? 'player-status is-open' : 'player-status'}><i aria-hidden="true"/>{player.lookingForTeam ? 'LOOKING FOR TEAM' : 'IN TEAM'}</span>
              <Link className="text-cta" href={`/players/${player.username}`}>VIEW PROFILE <span aria-hidden="true">→</span></Link>
            </li>)}
          </ul>
          <p className="players-note">DIRECTORY SHOWS DEMO COMPETITORS UNTIL PUBLIC PROFILES OPEN.</p>
        </div>}
  </>;
}

function Select({id, label, options, value, onChange}: {id: string; label: string; options: readonly string[]; value: string; onChange: (value: string) => void}) {
  return <div className="form-field">
    <label htmlFor={`player-${id}`}>{label}</label>
    <select id={`player-${id}`} name={id} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </div>;
}
