import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');

test('loads only the approved display, UI, and mono font architecture',()=>{const layout=read('app/layout.tsx');assert.match(layout,/Big_Shoulders/);assert.match(layout,/Instrument_Sans/);assert.match(layout,/JetBrains_Mono/);assert.doesNotMatch(layout,/Space_Grotesk/);for(const variable of ['--font-display','--font-ui','--font-mono'])assert.ok(layout.includes(variable));});

test('the root layout supplies one shared navbar and footer to every route',()=>{const layout=read('app/layout.tsx');assert.match(layout,/SiteHeader/);assert.match(layout,/SiteFooter/);assert.match(layout,/getSessionUser/);for(const route of ['app/page.tsx','app/tournaments/page.tsx']){const source=read(route);assert.doesNotMatch(source,/components\/home\/(Header|Footer)/);}});

test('wordmark is reusable and contains the controlled Peak slash',()=>{const wordmark=read('components/shared/PeakGGWordmark.tsx');assert.match(wordmark,/PEAK/);assert.match(wordmark,/GG/);assert.match(wordmark,/peak-slash/);const header=read('components/shared/SiteHeader.tsx');const footer=read('components/shared/SiteFooter.tsx');assert.match(header,/PeakGGWordmark/);assert.match(footer,/PeakGGWordmark/);});

test('global navbar exposes exact numbered navigation and mobile footer',()=>{const header=read('components/shared/SiteHeader.tsx');for(const value of ['01','PLAY','02','TEAMS','03','RANKS','04','TOURNAMENTS','EU / CEST','ENTER','MENU +','CLOSE','EUROPE / SEASON 01','DISCORD','CONTACT','2026 PEAKGG'])assert.ok(header.includes(value),value);assert.match(header,/menu-open/);assert.match(header,/aria-expanded/);assert.match(header,/aria-current/);});

test('footer uses the exact three-zone identity and four link columns',()=>{const footer=read('components/shared/SiteFooter.tsx');for(const value of ['COMPETE.','CONNECT.','CLIMB.','PEAKGG /','COMPETITIVE NETWORK','BUILT FOR THE','NEXT GENERATION','OF COMPETITION.','COMPETE','PLAYERS','PEAKGG','LEGAL','COMPETITIVE CIRCUIT / S01'])assert.ok(footer.includes(value),value);assert.doesNotMatch(footer,/footer-mark/);});

test('tournament final CTA uses the approved editorial copy and action',()=>{const cta=read('components/tournaments/TournamentsFinalCta.tsx');for(const value of ['05 / NEXT MATCH','BUILT FOR','THE NEXT','MATCH.','THE CIRCUIT IS OPEN.','VIEW OPEN EVENTS'])assert.ok(cta.includes(value),value);assert.match(cta,/focusOpen/);});

test('global brand CSS encodes navbar, footer, typography and sticky offsets',()=>{const css=read('app/globals.css')+read('app/brand.css')+read('app/tournaments/tournaments.css');for(const selector of ['.peak-wordmark','.peak-slash','.site-nav','.mobile-menu','.site-footer','.footer-peak-marker','.final-cta'])assert.ok(css.includes(selector),selector);for(const family of ['var(--font-display','var(--font-ui','var(--font-mono'])assert.ok(css.includes(family),family);assert.match(css,/\.t-controls\{[^}]*top:76px/);assert.match(css,/@media\(max-width:900px\)/);});
