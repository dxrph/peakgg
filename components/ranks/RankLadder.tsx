'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {PEAK_RANKS, getRankBySlug} from '../../lib/internal-pages-models.mjs';
import type {PeakRank} from '../../lib/internal-pages-models';

const RANKS = PEAK_RANKS as readonly PeakRank[];

export default function RankLadder({initialRank}: {initialRank?: string}) {
  const [slug, setSlug] = useState(() => getRankBySlug(initialRank).slug);
  const active = getRankBySlug(slug);
  const activeIndex = RANKS.findIndex(rank => rank.slug === active.slug);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const onPopState = () => setSlug(getRankBySlug(new URLSearchParams(window.location.search).get('rank')).slug);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const select = useCallback((next: string, focus = false) => {
    const rank = getRankBySlug(next);
    setSlug(rank.slug);
    const query = new URLSearchParams(window.location.search);
    query.set('rank', rank.slug);
    window.history.replaceState(null, '', `/ranks?${query}`);
    if (focus) buttons.current[RANKS.findIndex(item => item.slug === rank.slug)]?.focus();
  }, []);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const keys: Record<string, number> = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1};
    if (event.key in keys) {
      event.preventDefault();
      const next = (activeIndex + keys[event.key] + RANKS.length) % RANKS.length;
      select(RANKS[next].slug, true);
      return;
    }
    if (event.key === 'Home') { event.preventDefault(); select(RANKS[0].slug, true); }
    if (event.key === 'End') { event.preventDefault(); select(RANKS[RANKS.length - 1].slug, true); }
  }

  return <section className="rank-ladder internal-wrap" aria-labelledby="rank-ladder-title" style={{['--rank-accent' as string]: active.accent, ['--rank-glow' as string]: active.glow}}>
    <h2 className="sr-only" id="rank-ladder-title">PeakGG rank progression</h2>

    <div className="rank-index" role="tablist" aria-orientation="vertical" aria-label="Select a competitive rank" onKeyDown={onKeyDown}>
      {RANKS.map((rank, index) => {
        const selected = rank.slug === active.slug;
        return <button
          key={rank.slug}
          ref={element => { buttons.current[index] = element; }}
          type="button"
          role="tab"
          id={`rank-tab-${rank.slug}`}
          aria-selected={selected}
          aria-controls="rank-stage-panel"
          tabIndex={selected ? 0 : -1}
          className={selected ? 'is-selected' : undefined}
          style={{['--rank-tab-accent' as string]: rank.accent}}
          onClick={() => select(rank.slug)}
        >
          <span>{rank.code}</span>{rank.name}<i aria-hidden="true"/>
        </button>;
      })}
    </div>

    <div className="rank-stage" id="rank-stage-panel" role="tabpanel" aria-labelledby={`rank-tab-${active.slug}`} tabIndex={-1}>
      <div className="rank-stage-grid" aria-hidden="true"/>
      <div className="rank-stage-halo" aria-hidden="true"/>
      <div className="rank-plate" key={active.slug}>
        <RankEmblem rank={active}/>
      </div>
      <div className="rank-stage-name"><span>{active.code} / 07</span><strong>{active.name}</strong></div>
    </div>

    <aside className="rank-information">
      <p className="internal-kicker">PROGRESSION / SELECTED</p>
      <dl aria-live="polite">
        <div><dt>TIER NAME</dt><dd>{active.name}</dd></div>
        <div><dt>TIER NUMBER</dt><dd>{active.code} / 07</dd></div>
        <div><dt>RATING RANGE</dt><dd>{active.elo} ELO</dd></div>
        <div><dt>STATUS</dt><dd>COMPETITIVE TIER</dd></div>
      </dl>
      <p>PROGRESSION SYSTEM<br/><strong>IN DEVELOPMENT</strong></p>
    </aside>
  </section>;
}

function RankEmblem({rank}: {rank: PeakRank}) {
  const shapes: Record<string, React.ReactNode> = {
    notch: <><path d="M60 18 92 38 78 94 60 110 42 94 28 38Z"/><path d="m60 38 13 12-13 35-13-35Z" className="rank-accent"/></>,
    split: <><path d="m60 13 38 32-18 68H64L50 81l-10 32H22l18-68Z"/><path d="m60 13 4 100" className="rank-accent stroke"/></>,
    cross: <><path d="m60 10 17 25 31 7-22 26 4 38-30-14-30 14 4-38-22-26 31-7Z"/><path d="m60 35 14 25-14 28-14-28Z" className="rank-accent"/></>,
    frame: <><path d="M20 26 60 8l40 18v61l-40 29-40-29Zm18 15v38l22 16 22-16V41L60 31Z"/><path d="M20 26h18v15H20m80-15H82v15h18" className="rank-accent"/></>,
    facet: <><path d="m60 5 46 31-9 58-37 25-37-25-9-58Zm0 25L39 47l7 39 14 11 14-11 7-39Z"/><path d="m14 36 25 11 21-17 21 17 25-11" className="rank-accent stroke"/></>,
    spire: <><path d="m60 3 23 31 27 16-17 63-33 10-33-10-17-63 27-16Zm0 27-15 28 7 40h16l7-40Z"/><path d="M10 50h25l25-20 25 20h25" className="rank-accent stroke"/></>,
    summit: <><path d="m60 2 20 25 32 9-8 29 12 31-33 5-23 23-23-23-33-5 12-31-8-29 32-9Zm0 25L37 54l10 42h26l10-42Z"/><path d="m8 36 29 18 23-27 23 27 29-18M16 65l31 31m57-31L73 96" className="rank-accent stroke"/></>,
  };
  const id = `rank-${rank.slug}`;
  return <svg className="rank-emblem" viewBox="0 0 120 128" role="img" aria-label={`${rank.name} rank emblem`}>
    <title>{`${rank.name} rank emblem`}</title>
    <defs>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stopColor="#FFFFFF"/><stop offset="0.32" stopColor="#D9D7D2"/>
        <stop offset="0.55" stopColor="#8D8F96"/><stop offset="0.78" stopColor="#EDEBE6"/><stop offset="1" stopColor="#6B6D74"/>
      </linearGradient>
      <linearGradient id={`${id}-tint`} x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor={rank.accent} stopOpacity="0.7"/><stop offset="1" stopColor={rank.accent} stopOpacity="0.05"/>
      </linearGradient>
      <filter id={`${id}-bevel`} x="-35%" y="-35%" width="170%" height="170%">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.55"/>
      </filter>
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise"/>
        <feColorMatrix in="noise" type="saturate" values="0"/>
      </filter>
    </defs>
    <g className="rank-emblem-body" filter={`url(#${id}-bevel)`} fill={`url(#${id}-metal)`}>{shapes[rank.mark]}</g>
    <g className="rank-emblem-tint" fill={`url(#${id}-tint)`} aria-hidden="true">{shapes[rank.mark]}</g>
    <g className="rank-emblem-grain" filter={`url(#${id}-grain)`} aria-hidden="true"><rect width="120" height="128"/></g>
  </svg>;
}

