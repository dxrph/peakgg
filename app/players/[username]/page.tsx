import {notFound} from 'next/navigation';
import {ProductPage} from '../../../components/ui/ProductPage';
import {supabaseConfigured} from '../../../lib/supabase/config';
import {createClient} from '../../../lib/supabase/server';

export default async function Player({params}:{params:Promise<{username:string}>}){
  const {username}=await params;
  if(!supabaseConfigured)notFound();
  const supabase=await createClient();
  const {data}=await supabase.from('profiles').select('username,region,avatar_url,bio,looking_for_team,availability').eq('username',username).maybeSingle();
  if(!data)notFound();
  const p=data as Record<string,unknown>;
  return <ProductPage eyebrow="PEAKGG / PLAYER" title={String(p.username)} description={`${String(p.region)} / ${p.looking_for_team?'LOOKING FOR TEAM':'COMPETITOR'}`}>
    <section className="peak-container product-grid">
      <article className="product-card"><p className="mono-label">OVERVIEW</p><h2>{p.looking_for_team?'LFT OPEN':'COMPETING'}</h2><p>{String(p.bio||'NO BIO YET.')}</p></article>
      <article className="product-card"><p className="mono-label">AVAILABILITY</p><h2>{String(p.availability||'NOT SET')}</h2><p>PLAYER-PROVIDED COMPETITIVE AVAILABILITY.</p></article>
      <article className="product-card"><p className="mono-label">COMPETITIVE HISTORY</p><h2>NO RESULTS YET.</h2><p>VERIFIED COMPETITIVE DATA WILL APPEAR HERE.</p></article>
    </section>
  </ProductPage>
}
