'use client';
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function PeakMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({ desktop: '(min-width: 769px)', reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
      if (context.conditions?.reduce) return;
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro.from('.nav', { autoAlpha: 0, y: -18, duration: .6 })
        .from('.hero-title .solid-line', { yPercent: 110, autoAlpha: 0, duration: .8 }, '-=.2')
        .from('.hero-title > span:not(.solid-line)', { yPercent: 110, autoAlpha: 0, duration: .8 }, '-=.65')
        .from('.hero-reveal', { y: 24, autoAlpha: 0, stagger: .09, duration: .65 }, '-=.5')
        .from('.hero-console', { x: 50, autoAlpha: 0, duration: .8 }, '-=.75');
      gsap.utils.toArray<HTMLElement>('.reveal-item').forEach((el) => gsap.from(el, { y: 44, autoAlpha: 0, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 84%', once: true } }));
      gsap.to('.ticker-track', { xPercent: -25, ease: 'none', scrollTrigger: { trigger: '.ticker', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      gsap.utils.toArray<HTMLElement>('.path-card').forEach((card, index) => gsap.from(card, { x: 70, autoAlpha: 0, duration: .8, scrollTrigger: { trigger: card, start: 'top 82%', once: true }, delay: index * .04 }));
    });
    return () => mm.revert();
  }, { scope: root });
  return <div ref={root}>{children}</div>;
}
