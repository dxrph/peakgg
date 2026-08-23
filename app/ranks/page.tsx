import RankLadder from '../../components/ranks/RankLadder';
import {getRankBySlug} from '../../lib/internal-pages-models.mjs';

export default async function Ranks({searchParams}: {searchParams: Promise<{rank?: string}>}) {
  const query = await searchParams;
  const initial = getRankBySlug(query.rank);
  return <main className="internal-page ranks-page">
    <section className="ranks-intro internal-wrap">
      <div><p className="internal-kicker">03 / PROGRESSION</p><h1>CLIMB<br/>THE PEAK.</h1><p>SEVEN TIERS.<br/>ONE DIRECTION.</p></div>
      <div className="ranks-apex-signature" aria-hidden="true"><span>07 /</span><strong>APEX</strong><i/></div>
    </section>
    <RankLadder initialRank={initial.slug}/>
    <section className="rank-meaning"><div className="internal-wrap"><p className="internal-kicker">RANK ≠ TOURNAMENT POINTS</p><div className="rank-meaning-grid"><article><span>01 / PROGRESSION</span><h2>RANK</h2><p>REPRESENTS COMPETITIVE PROGRESSION.</p></article><article><span>02 / PERFORMANCE</span><h2>TOURNAMENT<br/>POINTS</h2><p>REPRESENT TOURNAMENT PERFORMANCE.</p></article></div></div></section>
  </main>;
}
