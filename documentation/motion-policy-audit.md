# AR Atrium motion audit — 2026-11-01

## Architecture and exact cause

This repository is an Angular standalone web application using GSAP/ScrollTrigger and CSS transitions. It has no Capacitor/Cordova configuration, Android application module, Kotlin/Java Views, Compose implementation or native animator. Android projects listed in the catalogue are metadata, not this application's runtime.

The device difference is explained by the browser's actual `window.matchMedia('(prefers-reduced-motion: reduce)').matches` result. Previously, GSAP only ran for `no-preference`; CSS independently suppressed transitions for `reduce`, and Skip Intro independently consulted the same media query. A device reporting `true` therefore intentionally rendered a static page. This is not evidence of a GPU or library failure. There was no in-app opt-in to override decorative web motion consistently.

## Complete animation inventory

| Implementation                                          | Location                         | Policy and lifecycle                                                                |
| ------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| Hero copy, emblem, architecture entrance                | `src/app/features/home.ts`       | Shared policy; scoped GSAP timeline/context                                         |
| Hero and middle architectural scroll depth              | `src/app/features/home.ts`       | Shared policy; scrubbed ScrollTriggers                                              |
| Intro, showcase cards and section headings              | `src/app/features/home.ts`       | Shared policy; one-time reveal triggers                                             |
| Button and project-card hover/focus transitions         | `src/styles.scss`                | Shared effective root attribute; Off also removes positional hover/focus transforms |
| Smooth document/anchor scrolling and carousel scrolling | `src/styles.scss`                | Shared CSS policy; disabled mode uses automatic scrolling                           |
| Skip Intro scroll                                       | `src/app/features/home.ts`       | Shared policy selects smooth/instant; focus behavior retained                       |
| Preview open/close and focus timers                     | `src/app/shared/project-card.ts` | Interaction delays, not frame animation; timers already cleared on destruction      |
| Session-expiry timeout                                  | `src/app/core/auth.service.ts`   | Business logic, not motion; unchanged                                               |
| Route focus requestAnimationFrame                       | `src/app/features/shell.ts`      | Focus scheduling, not visual animation; unchanged                                   |
| ScrollTrigger refresh requestAnimationFrame             | `src/app/features/home.ts`       | Coalesced layout refresh, cancelled on destruction                                  |

No CSS keyframe loops, Angular animation triggers, View Transition animations, native Android animators or Compose animations were found in application source. Essential loading/authentication status uses text and remains understandable without movement.

## Central policy

`MotionService` owns the real browser media query and exposes the selected mode, reported system preference and effective animation decision separately. System is the default. On explicitly enables decorative web motion even when the real media query reports reduced motion. Off disables decorative motion regardless of the device. The browser API is never patched or falsified.

The preference control is available before login and in the application footer. Its explanation explicitly describes the On override. Choices persist under `ar-atrium.motion.v1`; only `system`, `on` and `off` are accepted. Malformed or unavailable storage falls back to System, and blocked writes leave the current in-memory selection usable. Storage events synchronize tabs without write-back loops. System and storage listeners are removed on service destruction.

Root attributes `data-motion-mode` and `data-motion-enabled` communicate the policy to CSS. Before service initialization, CSS respects System. After initialization, CSS and GSAP follow the same effective decision, including explicit On. Off removes transitions, CSS animation and smooth scrolling, plus decorative hover translations.

Home's Angular effect owns one GSAP matchMedia instance per effective-policy lifetime. Cleanup reverts that instance and every scoped context before rebuilding. GSAP matchMedia now handles responsive composition only; components no longer make their own reduced-motion decisions. Disabling motion reverts inline animation states to the visible base layout. Image loads, font readiness, root resize and orientation changes refresh measurements. Component destruction disconnects observers/listeners, cancels refresh work and destroys the effect; async imports have a disposal guard. Theme changes do not create additional timelines.

No component-specific motion exception is needed for the current decorative animations. Future essential indicators must retain a readable static state and consume this shared policy rather than introducing another device query.

## Verification and limitations

`e2e/motion-policy.spec.ts` evaluates the exact required media query with both true and false results, then exercises every System/On/Off choice at 390px and 1440px. It measures computed hero translation before/after scrolling, checks final showcase visibility and CSS transition duration, toggles the system preference live, changes theme and viewport, and verifies persistence and unavailable/invalid storage. Browser preference and application mode are recorded separately in the `motion evidence` attachments. Existing tests cover the complete mobile/theme/motion matrix, navigation, previews and route lifecycle.

`motion.service.spec.ts` covers live system changes, explicit precedence, invalid storage, blocked storage, cross-tab changes and listener cleanup. Local commands: `npm run catalog:validate`, `npm run typecheck:tools`, `npm run typecheck:browser`, `npm run lint`, `npm run test:catalog`, `npm run test:ci`, `npm run format:check`, `npm run test:browser` and the configured GitHub Pages build.

Test results and measured movement are recorded in the completion response and local `.cache/playwright-results.json`; screenshots and attachments are local artifacts. An initial full-suite run was stopped after a login/navigation failure during active development; the isolated login reproduction and focused 13-case motion suite subsequently passed. Final validation uses stable source without concurrent edits.

Final stable run: **42 Playwright tests passed**, **20 Angular tests passed**, **18 catalogue/configuration tests passed**. Catalogue validation, tooling/browser type checks, lint and formatting passed. Twelve targeted mobile axe audits reported zero violations, with incomplete contrast/modal-focus checks still requiring manual review. Existing image-size development advisories and the unit environment's CDK focus warning remain.

The final GitHub Pages production build passed. `/ar-atrium/` and the identical `404.html` SPA fallback were verified using a synthetic test hash; the committed production placeholder was restored. The local build log is `.cache/motion-production-verification.log`.

Measured hero translation after 400px scroll:

| Exact reduce query | App mode | 390px displacement | 1440px displacement |
| ------------------ | -------- | ------------------ | ------------------- |
| true               | System   | 0px                | 0px                 |
| true               | On       | −15.60px           | +38.60px            |
| true               | Off      | 0px                | 0px                 |
| false              | System   | −15.60px           | +38.60px            |
| false              | On       | −15.60px           | +38.60px            |
| false              | Off      | 0px                | 0px                 |

In enabled cases CSS button transitions retain their 0.2s durations; disabled cases report 0s. The showcase reaches opacity 1 in every case. Exact raw evidence is in `.cache/motion-policy-evidence.json`. Reviewed the new lock-screen control, full mobile homepage and explicit-On screenshot visually. No animation assertions failed in the final run.

Physical device accessibility/browser configuration cannot be inferred from desktop emulation. No native Android Animator availability/scale tests apply to this checkout. If a native wrapper is introduced, it needs actual WebView media-query tests and separate native Animator scale checks. This implementation neither reads nor changes global Android settings, and web On must not be reused to bypass native accessibility restrictions.

No dependencies or workflows were added. Deployment remains restricted to pushes to `main-github`. Changes stay on `feature/1-basic-app` without commit, push, merge or deployment.

## Changed application and test files

- Added `src/app/core/motion.service.ts` and `src/app/core/motion.service.spec.ts`.
- Added `src/app/shared/motion-preference.ts`.
- Modified `src/app/features/home.ts`, `src/app/features/lock.ts`, `src/app/features/shell.ts` and `src/styles.scss`.
- Added `e2e/motion-policy.spec.ts`.
- Added this report; updated the supplied reduced-motion guide and README with the actual application policy.
