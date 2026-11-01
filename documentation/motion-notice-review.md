# Motion preference discoverability

The Windows incident report confirms that the existing animation engine and explicit On override work. This change adds discoverability without changing `MotionService`, its storage key, GSAP or the CSS motion policy.

`MotionNoticeComponent` renders a non-modal, labelled explanation only when the browser requests reduced motion, the selected mode is System, and the visitor has not dismissed the notice. It appears below the application header and beside the existing pre-login motion control, after the unlock form so the fields remain in their existing positions.

“Enable animations on this site” calls `MotionService.setMode('on')`, using the existing persistence mechanism. On and Off choices suppress the notice. “Keep system setting” dismisses the explanation without changing System or enabling motion; its acknowledgement persists separately under `ar-atrium.motion-notice.v1`. Both actions return keyboard focus to the page heading when the action disappears. The existing selector remains available to change the preference later.

When local storage is blocked, On retains the existing service's in-memory behavior and Keep dismisses for the current component lifetime. Persistence across a reload is unavailable in that case. Clearing website data resets preferences and the notice acknowledgement.

Changed implementation files:

- `src/app/shared/motion-notice.ts` — shared notice, actions, safe dismissal storage and focus restoration.
- `src/app/features/lock.ts` — pre-login integration.
- `src/app/features/shell.ts` — prominent in-app integration.
- `src/app/shared/motion-notice.spec.ts` — both browser states and all modes, explicit opt-in and persistent Keep behavior.
- `e2e/motion-notice.spec.ts` — desktop/mobile notice behavior, exact browser query, persistence, focus and measured movement.
- This review document.

The supplied incident report appeared during implementation and was then reviewed in full; it remains unchanged. No dependencies, workflows, catalogue data or unrelated features changed. Work remains on `feature/1-basic-app` without commit, push, merge or deployment.

Validation: lint, browser TypeScript checking and formatting pass; all 28 Angular tests pass, including eight notice tests. The existing CDK unit-test focus warning remains. Twelve targeted axe audits across light/dark themes found zero violations; some hero contrast and modal-focus results remain incomplete and require manual review rather than implying full WCAG certification.

Browser coverage evaluates the exact `window.matchMedia('(prefers-reduced-motion: reduce)').matches` expression for true and false, and tests System/On/Off at mobile and desktop widths. It covers opt-in from the lock screen and the app, persisted On/Off choices, focus after the action disappears, persistent Keep System dismissal and actual computed hero translation. The existing viewport/theme/motion and lifecycle suites also run unchanged. Screenshots were inspected at 320px, 390px and 1440px, including light/dark notice layouts.

Local evidence lives in `.cache/playwright-results.json` and its test attachments, `.cache/playwright-results/`, `.cache/mobile-audit/` and `.cache/axe-mobile.json`. These artifacts remain excluded from Git.

Final browser run: **55 passed**, including all 13 new notice scenarios. The full run completed without failures. The initial run was intentionally stopped when the incident document became available, to incorporate its Keep System recommendation before final validation. Raw notice movement measurements are extracted to `.cache/motion-notice-evidence.json`.
