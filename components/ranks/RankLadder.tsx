'use client';

import {useState} from 'react';
import {PEAK_RANKS, getRankByCode} from '../../lib/internal-pages-models.mjs';

type Rank = {code: string; name: string; mark: string};

export default function RankLadder() {
  const [selected, setSelected] = useState('01');
  const active = getRankByCode(selected) as Rank;
  return <section className="rank-ladder internal-wrap" aria-labelledby="rank-ladder-title">
    <h2 className="sr-only" id="rank-ladder-title">PeakGG rank progression</h2>
    <ol className="rank-index" aria-label="Select a competitive rank">{(PEAK_RANKS as Rank[]).map(rank => <li key={rank.code}><button type="button" aria-pressed={active.code === rank.code} onClick={() => setSelected(rank.code)}><span>{rank.code}</span>{rank.name}</button></li>)}</ol>
    <div className={`rank-stage rank-stage-${active.code}`} aria-live="polite">
      <div className="rank-stage-grid" aria-hidden="true"/>
      <RankEmblem rank={active}/>
      <div className="rank-stage-name"><span>{active.code} / 07</span><strong>{active.name}</strong></div>
    </div>
    <aside className="rank-information"><p className="internal-kicker">PROGRESSION / SELECTED</p><dl><div><dt>TIER NAME</dt><dd>{active.name}</dd></div><div><dt>TIER NUMBER</dt><dd>{active.code}</dd></div><div><dt>STATUS</dt><dd>COMPETITIVE TIER</dd></div></dl><p>PROGRESSION SYSTEM<br/><strong>IN DEVELOPMENT</strong></p></aside>
  </section>;
}

function RankEmblem({rank}: {rank: Rank}) {
  const shapes: Record<string, React.ReactNode> = {
    notch: <><path d="M60 18 92 38 78 94 60 110 42 94 28 38Z"/><path d="m60 38 13 12-13 35-13-35Z" className="rank-accent"/></>,
    split: <><path d="m60 13 38 32-18 68H64L50 81l-10 32H22l18-68Z"/><path d="m60 13 4 100" className="rank-accent stroke"/></>,
    cross: <><path d="m60 10 17 25 31 7-22 26 4 38-30-14-30 14 4-38-22-26 31-7Z"/><path d="m60 35 14 25-14 28-14-28Z" className="rank-accent"/></>,
    frame: <><path d="M20 26 60 8l40 18v61l-40 29-40-29Zm18 15v38l22 16 22-16V41L60 31Z"/><path d="M20 26h18v15H20m80-15H82v15h18" className="rank-accent"/></>,
    facet: <><path d="m60 5 46 31-9 58-37 25-37-25-9-58Zm0 25L39 47l7 39 14 11 14-11 7-39Z"/><path d="m14 36 25 11 21-17 21 17 25-11" className="rank-accent stroke"/></>,
    spire: <><path d="m60 3 23 31 27 16-17 63-33 10-33-10-17-63 27-16Zm0 27-15 28 7 40h16l7-40Z"/><path d="M10 50h25l25-20 25 20h25" className="rank-accent stroke"/></>,
    summit: <><path d="m60 2 20 25 32 9-8 29 12 31-33 5-23 23-23-23-33-5 12-31-8-29 32-9Zm0 25L37 54l10 42h26l10-42Z"/><path d="m8 36 29 18 23-27 23 27 29-18M16 65l31 31m57-31L73 96" className="rank-accent stroke"/></>,
  };
  return <svg className="rank-emblem" viewBox="0 0 120 128" role="img" aria-label={`${rank.name} rank emblem`}><title>{`${rank.name} rank emblem`}</title>{shapes[rank.mark]}</svg>;
}
