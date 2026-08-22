'use client';
import { useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export default function PeakMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduce, wheelMultiplier: .9, touchMultiplier: 1.15 });
    const updateLenis = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    const cursor = root.current?.querySelector<HTMLElement>('.peak-cursor');
    const xTo = cursor ? gsap.quickTo(cursor, 'x', { duration: .25, ease: 'power3' }) : null;
    const yTo = cursor ? gsap.quickTo(cursor, 'y', { duration: .25, ease: 'power3' }) : null;
    const onMove = (event: PointerEvent) => { xTo?.(event.clientX); yTo?.(event.clientY); };
    const interactive = gsap.utils.toArray<HTMLElement>('a, button, .rank-row');
    const cursorEnter = () => cursor?.classList.add('is-active');
    const cursorLeave = () => cursor?.classList.remove('is-active');
    if (!coarse) {
      window.addEventListener('pointermove', onMove, { passive: true });
      interactive.forEach((el) => { el.addEventListener('pointerenter', cursorEnter); el.addEventListener('pointerleave', cursorLeave); });
    }

    if (!reduce) {
      const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
      intro.from('.nav', { autoAlpha: 0, y: -24, duration: .7 })
        .from('.hero-title .solid-line', { yPercent: 120, autoAlpha: 0, duration: .9 }, '-=.25')
        .from('.hero-title > span:not(.solid-line)', { yPercent: 120, autoAlpha: 0, duration: .9 }, '-=.72')
        .from('.hero-reveal', { y: 28, autoAlpha: 0, stagger: .08, duration: .65 }, '-=.5')
        .from('.hero-console', { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', scale: 1.08, duration: 1.15 }, '-=1');

      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => gsap.to('.nav', { yPercent: self.direction === 1 && self.scroll() > 120 ? -125 : 0, duration: .35, ease: 'power3.out', overwrite: true }) });

      gsap.utils.toArray<HTMLElement>('h2').forEach((heading) => {
        SplitText.create(heading, {
          type: 'lines,words', mask: 'lines', autoSplit: true, aria: 'auto',
          onSplit(self) { return gsap.from(self.words, { yPercent: 115, rotation: 2, autoAlpha: 0, stagger: .035, duration: .8, ease: 'power4.out', scrollTrigger: { trigger: heading, start: 'top 86%', once: true } }); },
        });
      });

      gsap.utils.toArray<HTMLElement>('.reveal-item').forEach((el) => gsap.from(el, { y: 55, autoAlpha: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 87%', once: true } }));
      gsap.to('.ticker-track', { xPercent: -28, ease: 'none', scrollTrigger: { trigger: '.ticker', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      gsap.to('.hero-art > img', { yPercent: 12, scale: 1.02, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .8 } });
      gsap.utils.toArray<HTMLElement>('.image-story, .team-poster').forEach((section) => {
        const picture = section.querySelector('img');
        if (picture) {
          gsap.fromTo(picture, { yPercent: -7, scale: 1.12 }, { yPercent: 7, scale: 1.02, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 } });
          gsap.from(section, { clipPath: 'polygon(0 12%, 100% 0, 100% 0, 0 0)', scrollTrigger: { trigger: section, start: 'top 90%', end: 'top 35%', scrub: 1 } });
        }
      });
      gsap.utils.toArray<HTMLElement>('.path-card').forEach((card, index) => gsap.from(card, { x: 90, autoAlpha: 0, duration: .85, scrollTrigger: { trigger: card, start: 'top 84%', once: true }, delay: index * .05 }));
    }

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      window.removeEventListener('pointermove', onMove);
      interactive.forEach((el) => { el.removeEventListener('pointerenter', cursorEnter); el.removeEventListener('pointerleave', cursorLeave); });
    };
  }, { scope: root });

  return <div ref={root}><div className="peak-cursor" aria-hidden="true" />{children}</div>;
}
