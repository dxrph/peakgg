# PeakGG Tournament Discovery Design

## Objective

Build the public `/tournaments` discovery page as the first product extension of the approved PeakGG homepage. The page lets visitors understand available competitions, eligibility, timing, format, capacity, and next steps without authentication. Tournament detail, registration, check-in, brackets, match rooms, and administration remain out of scope.

## Direction

The page inherits PeakGG's locked competitive, editorial, Valorant-inspired, premium esports language: void black, black, graphite, paper, and Peak red; Space Grotesk and JetBrains Mono; sharp rectangular framing; cinematic environment imagery; restrained broadcast metadata. It must feel like the same product as the homepage, with less campaign motion and higher information density.

The memorable visual idea is a competitive circuit board: one dominant wide featured tournament followed by an authored collection whose cards vary in crop, proportion, and content hierarchy while sharing one status and metadata system.

## Information Architecture

1. Shared navigation with `TOURNAMENTS` active.
2. Compact 55–70vh tournament hero.
3. Sticky-capable discovery controls with category tabs and secondary filters.
4. One dominant Community Cup #01 featured event.
5. Filtered tournament collection and an intentional empty state.
6. Five-step competitive lifecycle.
7. Compact paper product-value section.
8. Restrained final competition CTA.
9. Shared PeakGG footer.

## Architecture

- `app/tournaments/page.tsx` is a server page responsible for composition and metadata.
- Tournament types and seeded content live in a focused data module. Seed/demo status is explicit in code and UI where time-sensitive content could otherwise imply live production data.
- A client-side discovery component owns only filter state, the mobile filter sheet, derived results, and reset behavior.
- Presentational sections and cards remain focused components. No giant route component and no duplicate tournament markup.
- Existing Header and Footer are adapted through small, backwards-compatible props or shared wrappers so homepage visuals and behavior remain unchanged.
- The future detail URL is represented as `/tournaments/community-cup-01`; no detail route is built. Links that cannot resolve to implemented content use a clearly disabled/preview state rather than causing broken navigation.

## Data Model

`Tournament` contains:

- `id`, `slug`, `name`, `code`
- `status`: `open | live | upcoming | invite | closed`
- `category`: `cup | league | special | scrim`
- `region`, `format`, `teamSize`
- optional `capacity`, `startDate`, `registrationClose`
- `image`, `imageAlt`, `imagePosition`, `visualVariant`
- `description`, `featured`, `detailAvailable`

Dates are seeded ISO values. No fake live countdown is displayed unless derived from the configured date; expired or unavailable timing falls back to neutral date/status copy.

## Filters

Primary tabs: All, Open, Live, Upcoming, Leagues, Special. Secondary filters: Region, Format, Team Size, Status. Every visible filter changes the local dataset. Tabs use native buttons with `aria-pressed`; selects use explicit labels and custom visual styling without replacing native keyboard behavior.

Desktop and tablet show the complete control bar. Mobile shows horizontally scrollable category tabs plus a 48px filter trigger opening an accessible modal sheet with focus management, Escape close, body scroll lock, and an explicit Apply/Reset action. Empty results show “NO TOURNAMENTS MATCH THESE FILTERS” and a reset button.

## Visual Composition

### Hero

A compact arena-led composition using an existing PeakGG environment asset, integrated with `TOURNAMENTS`, `FIND YOUR NEXT MATCH`, and restrained Europe/Season 01/Valorant metadata. It ends with a clear visual handoff into discovery rather than behaving like another homepage hero.

### Featured Event

Community Cup #01 is a wide broadcast block: cinematic image, title and description, registration status, Europe/16 Teams/5v5/Single Elimination metadata, lifecycle, and CTA states. It is not styled as a generic card.

### Collection

Six items use three editorial proportions and multiple composition variants. Community Cup is human/competition-led where a suitable approved asset exists; Open Cup is environment-led; Peak League is official/stage-led; Community Cup #02 uses an alternate campaign crop; 1v1 Showdown uses duel tension; Weekend Scrims uses practice/match-room atmosphere. Existing strong local assets are reused first; no weak AI people are introduced.

### Rhythm

Black hero and discovery → dense dark collection → paper competitive-value section → black final CTA/footer. Section spacing uses distinct impact, information, and breath tiers rather than identical padding.

## Status Language

All statuses include text. Peak red communicates open/live priority; paper and muted graphite communicate neutral/upcoming/closed states. No unrelated rainbow status palette is introduced.

## Motion

Motion is limited to a short hero image entrance, 150–220ms filter state feedback, 4–8px masked card image movement, CTA arrow movement, and the mobile sheet. No scroll-jacking, global fade-up system, 3D tilt, or continuous floating. `prefers-reduced-motion` removes nonessential transforms and transitions.

## Responsive Behavior

- 1920/1440: wide featured block, controlled maximum width, authored multi-column collection.
- 1024: featured layout retains hierarchy with reduced metadata density; collection becomes 2×N.
- 430/390: compact hero, scrollable category tabs, modal secondary filters, stacked featured event, vertical lifecycle, single-column collection, grouped footer.
- No unintended horizontal page overflow. Horizontal tab overflow remains locally contained and keyboard accessible.

## Accessibility

- Semantic landmarks, one `h1`, ordered heading hierarchy, skip link.
- Visible focus, native controls, explicit labels and selected/expanded states.
- Mobile sheet focus trap, Escape handling, focus return, and body scroll lock.
- Images have purposeful alt text; decorative marks are hidden.
- Status is never color-only; controls meet 44–48px touch targets.
- Contrast and reduced motion are verified.

## Performance

- Hero and featured media use responsive `next/image` sizing; only the hero is prioritized.
- Collection imagery is lazy-loaded with stable aspect ratios.
- Filtering does not add a dependency and derives results from local configuration.
- Client boundaries remain limited to navigation state and discovery state.
- No extra animation library is added for product-page micro-interactions.

## Testing

- Static tests validate the route, data model, unique assets/variants, filter labels, semantic structure, and future-detail scope boundary.
- Browser QA covers 1920×1080, 1440×1000, 1024×768, 430×932, and 390×844.
- Interaction QA covers tabs, every secondary filter, reset, empty state, mobile sheet, keyboard operation, links, focus, reduced motion, broken images, console errors, and horizontal overflow.
- Final verification runs lint, build, focused tests, and `git diff --check`.

## Scope Boundary

Do not build `/tournaments/[slug]`, registration, authentication, check-in, bracket, match room, leaderboard, admin, team, profile, or other internal routes. Do not redesign the homepage.
