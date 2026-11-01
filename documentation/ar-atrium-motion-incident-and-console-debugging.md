# AR Atrium: animation absent on one Windows laptop — confirmed resolution and console investigation

**Status:** Resolved on the affected laptop; follow-up UX improvement recommended  
**Incident date:** 2026-11-01 (India local date)  
**Application:** AR Atrium — Angular + GSAP/ScrollTrigger, deployed on GitHub Pages  
**Production merge:** `30a0bbf` (contains motion preference fix `3d0aa28`)  
**Scope:** Web browser behavior. AR Atrium is not a native Android app. For WebView and native Android guidance, see [animation-accessibility-and-reduced-motion.md](animation-accessibility-and-reduced-motion.md).

## 1. Executive summary

The same AR Atrium site animated on one laptop but appeared static on the user's Windows-optimized laptop. Windows animation effects had intentionally been disabled. The affected browser therefore returned `true` for:

```javascript
window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

This is a **preference signal**, not a hardware limitation or a browser-wide ban on JavaScript animation. Earlier versions of AR Atrium gated GSAP on `no-preference`; the current production version correctly supports a site-level `System / On / Off` motion preference.

**The decisive finding was not just the Windows preference:** after deploying the new version, AR Atrium was still on its **default `System` mode**. Consequently its effective motion value was `false`, and the homepage was marked `reduced`. Changing the application preference to **`On`**, without altering Windows, made the homepage animation work.

Confirmed final state on the affected laptop:

| Signal                                      | Final observed value                | Interpretation                                    |
| ------------------------------------------- | ----------------------------------- | ------------------------------------------------- |
| Browser: `(prefers-reduced-motion: reduce)` | `true`                              | Windows/browser requests less motion              |
| `html.dataset.motionMode`                   | `'on'`                              | Visitor explicitly opted into website animations  |
| `html.dataset.motionEnabled`                | `'true'`                            | Centralized application policy permits animations |
| `app-home.dataset.motion`                   | `'active'`                          | Homepage GSAP branch is enabled                   |
| Visual outcome                              | Animations visible (user-confirmed) | Fix works without changing Windows settings       |

**Root cause:** `System` + browser reduced-motion request. **Working fix:** select `Motion → On` on the website, or save `ar-atrium.motion.v1 = 'on'` and reload. The current implementation is functioning as designed; the remaining improvement is making this option easier to discover.

## 2. Timeline: every console check we used, and why

### Step 1 — Compare the OS/browser motion preference

**Command:**

```javascript
window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

**Observed:**

- Affected Windows laptop: `true`.
- Other laptop where animations were visible: `false`.

**Why:** This checks the preference that CSS `@media (prefers-reduced-motion: reduce)` and app code can use. The difference explained why two laptops could render the same deployed code differently.

**Interpretation:**

- `true` means _reduce motion is requested_; it does **not** mean that the GPU is too slow, GSAP is missing, or browser animation is physically impossible.
- `false` means _no reduced-motion preference is being reported_; it does **not** guarantee that an app's animation code runs.

**Related check:**

```javascript
window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
```

For this incident, it would normally be `false` on the affected laptop and `true` on the other laptop. No output from that optional check was supplied in the investigation; do not describe it as an observed test.

### Step 2 — Inspect the deployed application's own policy

**Commands, run individually:**

```javascript
document.documentElement.dataset.motionMode;

document.documentElement.dataset.motionEnabled;

document.querySelector('app-home')?.dataset.motion;
```

**First screenshot — observed results:**

```text
window.matchMedia('(prefers-reduced-motion: reduce)').matches  → true
document.documentElement.dataset.motionMode                  → 'system'
document.documentElement.dataset.motionEnabled               → 'false'
document.querySelector('app-home')?.dataset.motion            → 'reduced'
```

**Why each command mattered:**

1. `motionMode` tells us the **selected website preference**. `system` is a valid default, not an app malfunction.
2. `motionEnabled` tells us the **effective decision**, after combining the site setting with the browser preference. The value is a string, `'false'`, because it comes from an HTML `data-*` attribute.
3. `app-home.dataset.motion` tells us whether the **homepage animation implementation** took its active or reduced branch. This rules in/out a policy gate before spending time debugging scroll triggers.

These four checks isolated the issue more precisely than checking the Windows preference alone.

![Console before changing the site setting](images/motion-before-system.png)

### Step 3 — Enable this site's animations, keeping Windows optimized

**Recommended user-facing fix:** Use AR Atrium's **Motion** selector on the login screen or site footer and choose **On**.

**Console equivalent used in the investigation:**

```javascript
localStorage.setItem('ar-atrium.motion.v1', 'on');
location.reload();
```

**Why this works:**

- `localStorage.setItem(...)` saves the website-specific preference for the current origin and browser profile.
- `location.reload()` restarts the app so `MotionService` reads the new value and reinitializes GSAP.
- This does **not** enable Windows animations, modify Windows accessibility settings, fake the `matchMedia` response, or change other websites.

**Important detail:** A `localStorage` write in the same tab does not dispatch a `storage` event back to that tab. Without reloading, the existing Angular signal may still hold the old selection. Using the **in-app dropdown** calls `MotionService.setMode('on')` and updates immediately, without requiring reload. For a console-only override, **save and reload together**.

**Do not substitute these non-fixes:**

```javascript
// Do NOT just set the DOM attribute; it does not update Angular's service/GSAP lifecycle.
document.documentElement.dataset.motionEnabled = 'true';

// Do NOT redefine window.matchMedia or fake the OS setting.
// Do NOT disable accessibility preferences for every website.
```

### Step 4 — Run the combined diagnostic after reload

**Exact check used:**

```javascript
console.table({
  windowsReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  appMotionMode: document.documentElement.dataset.motionMode,
  appMotionEnabled: document.documentElement.dataset.motionEnabled,
  homeAnimationStatus: document.querySelector('app-home')?.dataset.motion,
});
```

**Second screenshot — observed values:**

```text
windowsReducedMotion  true
appMotionMode         'on'
appMotionEnabled      'true'
homeAnimationStatus   'active'
```

The user confirmed that animations were now visible. This establishes that the app was able to animate **despite** Windows continuing to request reduced motion.

**Why a final `undefined` may appear below the table:** `console.table()` prints output but returns `undefined`. The `undefined` shown by DevTools is normal, not an app error.

**Why `VM930:1` (or similar) appears:** It labels a script evaluated from the DevTools console, not an application-file failure.

![Console after setting website motion to On](images/motion-after-on.png)

### Step 5 — Understand the other red console messages

The final screenshot also showed messages similar to these:

```text
Uncaught (in promise) Error: Cannot read properties of undefined (reading 'get')
  ... chrome-extension://.../single-file-bootstrap.bundle.js
  ... chrome-extension://.../single-file-extension-background.js

Unchecked runtime.lastError: Could not establish connection.
Receiving end does not exist.

Attempting handshake with backend ...
```

**Assessment:** Their visible source URLs and messaging indicate **browser-extension code**, not `src/app/features/home.ts` or GSAP. In particular:

- `chrome-extension://...` is the extension's own origin, not AR Atrium's web origin.
- `Receiving end does not exist` generally means an extension message had no active receiver.
- A handshake log is diagnostic extension output, not by itself an AR Atrium error.
- The console shows these messages **while the user reports animations working**, so they are not evidence that GSAP was failing in this incident.

**Do not conclude that all extension errors are always harmless.** If investigating a separate browser issue, disable extensions temporarily or reproduce in a clean browser profile and compare. For AR Atrium motion debugging, prioritize errors that point to application scripts, failed GSAP imports, actual page exceptions, or unavailable resources.

### Step 6 — Verify that motion is actually visible

The final DOM values demonstrate that the app policy selected its animation branch; they **do not alone measure pixels moving**. In this incident, the user also reported that the animation visibly worked after the override.

For automated tests or a harder-to-diagnose future incident, measure the transform change:

```javascript
const art = document.querySelector('.hero-architecture');
if (!art) throw new Error('Open the unlocked homepage first');
const readY = () => new DOMMatrixReadOnly(getComputedStyle(art).transform).m42;
window.scrollTo({ top: 0, behavior: 'instant' });
await new Promise((resolve) => setTimeout(resolve, 1100));
const before = readY();
window.scrollTo({ top: 400, behavior: 'instant' });
await new Promise((resolve) => setTimeout(resolve, 1200));
const after = readY();
console.table({ before, after, displacement: after - before });
```

For a correctly positioned homepage, a nonzero displacement is evidence of scroll-driven motion. The exact number varies with viewport, layout and scroll conditions. Run only on a page with the `app-home` component loaded.

**Reusability:** This optional pixel check was not the command used to establish the screenshot result; it is an additional future debugging tool.

## 3. Source-code explanation (verified against the deployed branch)

**Central policy:** `src/app/core/motion.service.ts`

```ts
export type MotionMode = 'system' | 'on' | 'off';
const storageKey = 'ar-atrium.motion.v1';

readonly animate = computed(
  () => this.mode() === 'on' || (this.mode() === 'system' && !this.systemReduced()),
);
```

The policy truth table:

| Device requests reduced motion? | Website mode | Effective motion |
| ------------------------------- | ------------ | ---------------- |
| `true`                          | `system`     | `false`          |
| `true`                          | `on`         | `true`           |
| `true`                          | `off`        | `false`          |
| `false`                         | `system`     | `true`           |
| `false`                         | `on`         | `true`           |
| `false`                         | `off`        | `false`          |

**App controls:** `src/app/shared/motion-preference.ts` renders the `System / On / Off` selector. It is included in `src/app/features/lock.ts` and `src/app/features/shell.ts` (footer). Choosing a value calls the service directly and persists it.

**GSAP:** `src/app/features/home.ts` observes `motion.animate()` and rebuilds/cleans GSAP contexts when the effective decision changes. The homepage sets `data-motion="active"` or `data-motion="reduced"`.

**CSS:** `src/styles.scss` uses `html[data-motion-enabled='false']` to suppress decorative transitions and smooth scrolling when motion is off, while permitting an explicit On override after Angular initializes. The browser preference itself remains genuine.

**Deployment verified:** GitHub Pages workflow for `30a0bbf` completed successfully. The user reproduced the working state in the browser. These are independent checks; no new repository change is claimed in this document.

## 4. Permanent fix, per device: no Developer Tools required

1. Open AR Atrium in the desired browser/profile.
2. Find **Motion** on the login screen or at the bottom of the unlocked site.
3. Select **On**.
4. Optionally refresh the homepage to watch the entrance animation from the start.
5. Keep Windows **Animation effects** disabled if desired.

The selection is stored under `localStorage['ar-atrium.motion.v1']` and normally persists after refresh/reopening. It is per website origin and browser profile; clearing site data, using Private/Incognito mode, or using a different browser/device can require a new selection. Unavailable/blocked storage falls back to an in-memory setting, which may not survive navigation/reload.

**Reset to system default:** Select **System** in the website UI, or for emergency console troubleshooting:

```javascript
localStorage.setItem('ar-atrium.motion.v1', 'system');
location.reload();
```

**Turn off on this site:** Select **Off** in the UI, or:

```javascript
localStorage.setItem('ar-atrium.motion.v1', 'off');
location.reload();
```

## 5. Product-level follow-up: improve discoverability, not the animation engine

**Current outcome:** The shipped fix works, but first-time visitors on reduced-motion devices get `System` (as designed) and may assume AR Atrium is broken because they do not notice the selector.

**Recommended next feature:** When and only when the page is in `System` mode and the real browser reports reduced motion, show a compact, accessible **non-modal** explanation near the Motion setting (and optionally a contextual notice on the homepage):

> Your device requests reduced motion, so AR Atrium's decorative animations are paused. [Enable animations on this site] [Keep system setting]

- The **Enable** button calls the existing `MotionService.setMode('on')` API; do not directly modify DOM attributes or browser APIs.
- The **Keep** action should be respected (optionally remember its dismissal) and must never trap navigation.
- Keep System as the default; **do not silently force animation on all visitors**, because reduced motion may be an intentional accessibility choice.
- Make the existing Motion selector visible and discoverable on narrow screens without adding duplicate controls.
- Ensure the notice is accessible, keyboard operable, responsive and suitable in light/dark themes.
- Never pop up the notice on every page navigation or every refresh.
- For users who chose On or Off, do not show the notice.
- Do not alter the Windows setting, native Android settings, or unrelated apps.

**Optional UI example (concept, not an applied repository patch):**

```html
@if (motion.mode() === 'system' && motion.systemReduced()) {
<p class="motion-explanation">
  Your device requests reduced motion. AR Atrium animations are paused.
  <button type="button" (click)="motion.setMode('on')">Enable animations on this site</button>
</p>
}
```

Test semantics/focus and style before using it in production. Existing source already has a central motion service, so there is no need for another GSAP policy.

## 6. Regression test plan

**Test axes:** two browser media states, three app modes, and mobile/desktop widths.

| Browser emulation | Website setting | Expected `<html data-motion-enabled>` | Expected homepage |
| ----------------- | --------------- | ------------------------------------- | ----------------- |
| `reduce`          | System          | `'false'`                             | `reduced`         |
| `reduce`          | On              | `'true'`                              | `active`          |
| `reduce`          | Off             | `'false'`                             | `reduced`         |
| `no-preference`   | System          | `'true'`                              | `active`          |
| `no-preference`   | On              | `'true'`                              | `active`          |
| `no-preference`   | Off             | `'false'`                             | `reduced`         |

Existing test files:

- `src/app/core/motion.service.spec.ts` — service preference, live change, local storage, cleanup.
- `e2e/motion-policy.spec.ts` — uses `page.emulateMedia({ reducedMotion })`, checks the **exact** `window.matchMedia('(prefers-reduced-motion: reduce)').matches` query, the setting, homepage attributes, and actual scroll movement.
- `e2e/mobile-motion.spec.ts` and `e2e/animation-lifecycle.spec.ts` — complementary mobile and lifecycle scenarios.

Example Playwright assertion for an affected-laptop simulation:

```ts
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto('/'); // Make sure authentication/unlocked state is set up for this test.
expect(
  await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
).toBe(true);
await page.getByLabel('Motion preference', { exact: true }).selectOption('on');
await expect(page.locator('html')).toHaveAttribute('data-motion-enabled', 'true');
await expect(page.locator('app-home')).toHaveAttribute('data-motion', 'active');
```

**Additional UX regression after adding a notice:** Confirm the explanation appears only for `System + reduce`, that its Enable button switches to On, persists across reload, respects keyboard focus and theme/mobile layout, and does not reappear after an explicit selection. Measure actual frame/transform changes, not just the status attributes.

Local checks:

```bash
npm run lint
npm run test:ci
npm run typecheck:browser
npm run test:browser
npm run format:check
```

Note: These tests were part of earlier reported development validation; this document was authored after the user confirmed live behavior. Creating this document does not rerun the suite or modify the remote repository.

## 7. Future troubleshooting checklist

1. Confirm the correct URL, browser profile and deployed build; do not confuse local, preview and production versions.
2. On the affected device, run the **exact** `window.matchMedia('(prefers-reduced-motion: reduce)').matches` expression.
3. Read `data-motion-mode`, `data-motion-enabled` and `app-home[data-motion]`; distinguish _OS request_ from _site selection_ from _GSAP state_.
4. If System + reduced, choose **Motion → On**. For diagnostics, save to `localStorage` and **reload**.
5. Rerun the four-value `console.table()` and verify visible movement or measured displacement.
6. If status is `active` but motion is absent: inspect application `pageerror`, GSAP module loading, ScrollTrigger registration/refresh, CSS overriding transforms, viewport, layout and JavaScript errors.
7. Separate `chrome-extension://` or `runtime.lastError` messages from actual AR Atrium errors; use a clean profile if needed.
8. Revert to System or Off at any time if motion is uncomfortable.
9. For Android WebView, run the web query inside the actual WebView; for native Android, use platform Animator/Compose checks from the general guide.

## 8. References and related docs

- Existing project guide: [Animation accessibility and reduced motion](animation-accessibility-and-reduced-motion.md).
- Existing project audit: [Motion policy audit](motion-policy-audit.md).
- MDN: [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion).
- MDN: [`Window: storage event`](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event) — explains why a same-tab console `localStorage` write is followed by a reload.
- AR Atrium source: [`MotionService`](https://github.com/actionanand/ar-atrium/blob/main-github/src/app/core/motion.service.ts), [`MotionPreferenceComponent`](https://github.com/actionanand/ar-atrium/blob/main-github/src/app/shared/motion-preference.ts), [`HomeComponent`](https://github.com/actionanand/ar-atrium/blob/main-github/src/app/features/home.ts), [`motion-policy.spec.ts`](https://github.com/actionanand/ar-atrium/blob/main-github/e2e/motion-policy.spec.ts).
- Production workflow: [Successful deployment of `30a0bbf`](https://github.com/actionanand/ar-atrium/actions/runs/41233142859).

---

**Final lesson:** A browser reporting reduced motion can still animate when the visitor **explicitly opts in on that website**. The correct debug sequence is **browser preference → app preference → effective app policy → component state → observed movement**, not merely assuming that a red console error or a Windows setting proves the animation engine is broken.
