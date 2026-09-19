# Plan: PeakGG editorial art-direction reset

## Outcome
Replace the current homepage visual language with the approved dense black, off-white, and red esports poster system while retaining all working interactions and data boundaries.

## Implementation
1. Audit every homepage section and retain search, authentication, navigation, filters, rank controls, signup prompts, language switching, and legal dialogs.
2. Switch the display type to Archivo Black and rewrite the homepage styling around sharp rules, compressed section heights, full-bleed imagery, technical labels, and marker annotations.
3. Adjust section markup and localized copy only where needed to reproduce the specified composition. Keep structured demo content in the shared data file.
4. Create one original architecture/arena image for differentiated Open Cup and supporting crops, while preserving the existing cinematic asset elsewhere.
5. Verify the complete page at 1440×900, 1100×900, and 390×844, then correct visual rhythm, overflow, and interaction issues.

## Technical details
- Primary work: homepage components, hero/navbar styles, homepage styles, font import/token, EN/IT translations, and supporting local imagery.
- No database, access policies, migrations, functions, or authentication behavior changes.
- Validation: focused type checking, lint, tests, production build, browser interaction audit, screenshots, overflow and console checks.
