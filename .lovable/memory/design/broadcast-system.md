---
name: Broadcast design system
description: PeakGG broadcast-studio visual system — .bc-* CSS primitives, tokens, and homepage module architecture
type: design
---
Visual language: competitive broadcast/scoreboard, not neon cyberpunk. Matte graphite surfaces, 1px hairline borders, sharp geometry (one cut corner), oversized condensed data numerals.

- Tokens in `src/index.css`: background 228 14% 5%, primary 353 100% 63% (#ff4655), accent 22 100% 58%, `--live` 82 80% 55% (LIVE states ONLY), radius 0.25rem.
- Fonts: Barlow Condensed (display + numbers, `font-condensed` / `.bc-display` / `.bc-num`), Rajdhani (uppercase labels, `font-display`), DM Sans (body).
- Shared primitives: `src/components/system/index.tsx` → Rail, Panel, LiveTag, Chip, Display, StatBlock, SectionHead, Ticker. Reuse these instead of ad-hoc panels.
- CSS classes: `.bc-panel`, `.bc-rail`, `.bc-num`, `.bc-display`, `.bc-live`, `.bc-ticker`, `.bc-section`, `.bc-rules`, `.bc-scanlines`, `.bc-chip`, `.bc-hairline`.
- Legacy classes (`torn-panel`, `paper-cut`, `brush-title`, `signal-button`, `signal-marquee`, `editorial-section`, `auth-art`) are remapped to the broadcast language — do NOT restore the old torn-paper/glow versions.
- Homepage = modules in `src/components/home/*` (HomeHero, NextCupModule, PathModule, RosterModule, RanksModule, LadderModule, CommunityModule). Footer accepts `hideCta` to avoid double CTAs.
- Routes are lazy-loaded in `src/App.tsx`; keep new pages lazy.
