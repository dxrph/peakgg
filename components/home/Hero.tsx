'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useRef, type PointerEvent} from 'react';

export default function Hero() {
  const agentRef = useRef<HTMLDivElement>(null);

  const moveReveal = (event: PointerEvent<HTMLDivElement>) => {
    const agent = agentRef.current;
    if (!agent) return;
    const bounds = agent.getBoundingClientRect();
    agent.style.setProperty('--reveal-x', `${event.clientX - bounds.left}px`);
    agent.style.setProperty('--reveal-y', `${event.clientY - bounds.top}px`);
  };

  return <section className="hero-new" id="top">
    <div className="hero-atmosphere" aria-hidden="true"/>
    <div ref={agentRef} className="hero-agent" aria-label="Featured Valorant agents Jett and Phoenix" onPointerEnter={moveReveal} onPointerMove={moveReveal}>
      <Image className="hero-jett" src="/assets/agents/jett.png" alt="Jett, Valorant duelist, featured in the PeakGG arena" fill priority sizes="(max-width: 700px) 110vw, 68vw"/>
      <Image className="hero-phoenix" src="/assets/agents/phoenix.png" alt="Phoenix, Valorant duelist, revealed when hovering the hero artwork" fill loading="eager" sizes="68vw"/>
    </div>
    <div className="hero-wash"/>
    <div className="hero-poster-frame"/>
    <div className="hero-meta">PEAKGG / EUROPE / SEASON 01</div>
    <h1 className="hero-type">
      <span data-echo="RISE">RISE</span>
      <span data-echo="TO THE">TO THE</span>
      <strong data-echo="PEAK.">PEAK.</strong>
    </h1>
    <div className="hero-agent-cue" aria-hidden="true"><span>JETT</span><i/>PHOENIX</div>
    <div className="hero-side-copy">VALORANT / COMPETITIVE PLATFORM / EUROPE</div>
    <div className="hero-coordinates" aria-hidden="true">45.4642° N<br/>09.1900° E</div>
    <div className="hero-bottom">
      <p><b>THE NEXT MATCH STARTS HERE.</b> Find your five. Enter structured competition. Build your name.</p>
      <div><Link className="action red" href="/play">ENTER THE ARENA <span aria-hidden="true">↗</span></Link><Link className="action ghost" href="/teams">FIND A TEAM <span aria-hidden="true">↗</span></Link></div>
    </div>
    <div className="hero-count">01 / 11</div>
    <div className="hero-strip">PEAKGG // VALORANT COMPETITIVE PLATFORM // EUROPE // SEASON 01 //</div>
  </section>;
}
