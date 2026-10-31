# Mobile redesign and animation review

Implementation remains uncommitted on `feature/1-basic-app`. No push, merge or deployment was performed. The existing Pages workflow remains unchanged: pushes to `main-github` only, with no pull-request or manual trigger.

## Diagnosis and reference review

The original GSAP initialization and ScrollTrigger worked. Baseline Chromium measurements after scrolling 400px showed hero translation of 51.18px at 390px width and 46.32px at 1440px width. Reduced-motion cases correctly stayed static. The missing entrance, subtle scroll-only movement, and mobile artwork at opacity 0.22 behind the text made the animation difficult to perceive. At 390px, the artwork's right edge reached 487.5px. The original early reduced-motion return also did not handle preference changes, and layout/font refresh hooks were missing.

Reviewed PingMetric's dashboard, loading-indicator and global SCSS, plus commits `391f29c3` and `44ba1f76`. Its compact branded drawer, distinct lock action and generous touch targets informed the navigation. Its functional activity indicators intentionally retain motion; that exception is inappropriate for this decorative introduction. AR Atrium instead supplies a fully visible static reduced-motion composition.

Screenshot inspection found an additional issue in the first implementation: using GSAP's reserved `all` condition could rerun the media context on orientation changes, resetting completed reveals. An ordinary always-matching media query replaces it. A desktop reproduction measured opacity 1 for all completed content before and after full-page capture. The browser regression now asserts this explicitly.

## Changes

- Compact mobile header and native modal navigation drawer, CDK focus trap, active routes, close/backdrop/Escape handling and restored opener focus. Desktop navigation is retained.
- Dedicated mobile hero composition with a fully visible emblem below the copy, improved typography and aligned actions.
- Staggered hero copy, emblem and architectural entrance; reversible scroll depth; intro, showcase and section-heading reveals. Separate entrance and scroll wrappers prevent transform conflicts.
- GSAP context/media cleanup, live preference/breakpoint changes, image/font/layout refresh and route-disposal protection.
- Mobile featured project scroll-snap presentation with keyboard scrolling, readable descriptions and honest illustrative artwork.
- Larger filters, cards and controls; wrapping destination links; responsive details and previews; compact form-first lock screen.
- All 77 projects and JSON sources, classifications, hosting/npm/Policy Hub data, authentication and Material Symbols are preserved.

## Browser evidence

Chromium tests use installed Windows Chrome through Playwright's Chromium engine (version 156.0.8078.74). Every row runs light/dark themes and both motion preferences. Hero displacement is measured after a 400px scroll and scrub settling; reduced-motion displacement is zero. Small numerical differences between themes are expected from frame timing.

| Viewport   | Combinations | Hero translation, normal motion | Reduced motion | Result |
| ---------- | ------------ | ------------------------------- | -------------- | ------ |
| 320 × 568  | 4            | approximately −15px             | static         | Pass   |
| 360 × 800  | 4            | approximately −15px             | static         | Pass   |
| 375 × 812  | 4            | approximately −16px             | static         | Pass   |
| 390 × 844  | 4            | approximately −16px             | static         | Pass   |
| 430 × 932  | 4            | approximately −15px             | static         | Pass   |
| 768 × 1024 | 4            | approximately −13px             | static         | Pass   |
| 1440 × 900 | 4            | approximately +39px             | static         | Pass   |

The showcase changes from opacity 0 and translation 32px (mobile/tablet) or 64px (desktop) to opacity 1 and translation 0. Hero copy is sampled through its entrance from opacity 0 to 1. Reduced-motion content remains visible throughout. An additional lifecycle test covers live motion changes, breakpoint changes, carousel keyboard scrolling, route re-entry and logout cleanup.

Evidence is generated locally, excluded from Git:

- `.cache/mobile-audit/<width>-<theme>-<motion>/measurements.json`: exact computed transforms, entrance samples, browser version, errors and requests.
- Each case includes `lock.png`, `home-top.png`, `home-full.png`, `listing.png`, `details.png` and `preview.png`; mobile/tablet also includes `navigation.png`.
- `.cache/playwright-results.json`: runner results; failure traces are retained when applicable.
- `.cache/animation-baseline.json`: original movement and mobile artwork bounds.
- `.cache/production-verification.log`: production build and Pages fallback verification.

Visually reviewed light/dark viewport contact sheets for hero, lock, navigation, details, listing and previews, with readable individual mobile listing and mobile/desktop homepage inspections. Full-page screenshot review exposed the media-context reset described above, which was fixed and retested.

## Validation

- Playwright: 29 passed, covering 28 viewport/theme/motion combinations and one lifecycle test; 192 screenshots captured.
- Twelve targeted mobile axe audits across both themes: zero violations. Hero contrast and drawer `aria-hidden-focus` checks include incomplete results requiring manual review; drawer containment and focus restoration also pass actual keyboard tests. Raw results: `.cache/axe-mobile.json`.
- Catalogue validation: 77 projects, 98 repository references, 70 hosted URLs, 9 npm links; no source data changes.
- Tooling and browser-test TypeScript checks, lint and formatting checks pass.
- Catalogue/configuration tests: 18 pass. Angular tests: 16 pass.
- GitHub Pages production build passes with `/ar-atrium/`; generated `404.html` exactly matches `index.html`. A synthetic SHA-1 test value was injected locally and the production placeholder restored afterward.

The first navigation audit exposed focus escaping the drawer; adding the CDK focus trap fixed it. An early pair of concurrent Playwright runners collided while cleaning shared trace artifacts; the complete suite was subsequently run in one process. The screenshot-discovered media reset was fixed and the suite rerun with additional visibility assertions.

## Remaining observations

No runtime/console errors, HTTP errors or failed requests were recorded in the completed viewport matrix. Angular's development image-size advisory remains for the canonical 1254px emblem rendered at smaller sizes. The Angular unit environment also emits an existing CDK focus warning; real-browser focus behavior is covered. These checks do not constitute an exhaustive WCAG certification or testing on physical mobile devices.

Verified project screenshots are still unavailable for some projects; existing labeled emblem fallbacks remain. No project screenshots or cinematic assets were invented. The catalogue's existing metadata report still lists 15 projects without hosted URLs and six repository references requiring review; this UI task does not alter them.

## Exact files

Modified:

- `.prettierignore`
- `README.md`
- `package.json`
- `package-lock.json`
- `src/app/features/home.ts`
- `src/app/features/shell.ts`
- `src/styles.scss`

Added:

- `src/app/shared/mobile-navigation.ts`
- `src/app/shared/mobile-navigation.scss`
- `src/styles/_responsive.scss`
- `e2e/mobile-motion.spec.ts`
- `e2e/animation-lifecycle.spec.ts`
- `playwright.config.ts`
- `tsconfig.e2e.json`
- `MOBILE-ANIMATION-REVIEW.md`
