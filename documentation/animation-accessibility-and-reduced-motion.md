# Animation not working on some devices: reduced-motion diagnosis and fixes

> **Scope:** Web applications (including Angular/GSAP), Android applications built with a WebView/Capacitor, native Android Views/Kotlin, and Jetpack Compose.  
> **Reference incident:** AR Atrium animations played on one laptop but not another. The affected browser reported `prefers-reduced-motion: reduce` as `true`; the working laptop reported `false`.  
> **Last reviewed:** 2026-11-01  
> **Purpose:** A reusable, repository-friendly technical guide. It describes a device preference, **not** a broken GPU, missing animation library, or proof that JavaScript failed to load.

## 1. Summary: what happened and why

The browser exposes a media feature called **`prefers-reduced-motion`**. It communicates whether the user or platform has requested less non-essential motion. It can be influenced by Windows accessibility settings, Android accessibility settings, browser configuration, or test emulation.

In AR Atrium, the GSAP setup used the condition:

```ts
motion: '(prefers-reduced-motion: no-preference)';
```

When that condition is false, AR Atrium deliberately does **not** start its decorative GSAP timeline. Separately, its CSS uses `@media (prefers-reduced-motion: reduce)` to turn off CSS animation and transition effects. Thus the same site may visibly animate on one device and appear static on another, even with identical deployed code.

**Important distinction:** The media query does **not** automatically disable every JavaScript animation. It only reports a preference. The site's code and styles decide how to respond. Native Android's animator duration scale is a separate platform mechanism that can actually make framework-driven animators end immediately.

| Observation                                    | Meaning                                                  | What to do                                                                              |
| ---------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Browser returns `true` for `reduce`            | This browser reports a request for less motion           | Check OS/browser settings and the app's motion policy                                   |
| Browser returns `false` for `reduce`           | No reduced-motion preference is reported to this page    | Diagnose GSAP initialization, asset loading and triggers if animations are still absent |
| Two laptops disagree                           | Their effective browser/OS motion preferences may differ | Compare the same URL, browser, console result and app preference                        |
| Android native animation duration scale is `0` | Android's framework animators may finish immediately     | Respect the system policy and show the completed UI state                               |
| Playwright passes but device does not animate  | Playwright may have forced `no-preference`               | Explicitly test both media preferences and real devices                                 |

## 2. The exact browser test — run this first

Open the affected site in Chrome, Edge, Firefox, or the WebView's remote debugging session, then open **Developer Tools → Console**.

**Required test (copy and paste exactly):**

```javascript
window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

Interpret the returned Boolean:

```javascript
// true  -> this browser currently requests reduced motion.
// false -> this browser currently reports no reduced-motion preference.
```

**Cross-check:**

```javascript
window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
```

Usually these two queries return opposite Booleans. An equivalent diagnostic with labels is:

```javascript
console.table({
  reducedMotionRequested: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  noMotionPreference: window.matchMedia('(prefers-reduced-motion: no-preference)').matches,
  page: location.href,
  userAgent: navigator.userAgent,
  appMotionMode: document.documentElement.dataset.motionMode ?? '(not set)',
  homeGsapState: document.querySelector('app-home')?.getAttribute('data-motion') ?? '(not found)',
});
```

To see whether the preference changes **while the page is open**:

```javascript
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
console.log('Initial reduced-motion preference:', mq.matches);
const onMotionChange = (event) => console.log('Reduced motion changed:', event.matches);
mq.addEventListener('change', onMotionChange);
// When finished, remove the listener:
// mq.removeEventListener('change', onMotionChange);
```

The console test is diagnostic, not a toggle: running it does not enable or disable animations.

### What fixed the difference between the two laptops?

- The **affected laptop** returned `true`.
- The **working laptop** returned `false`.
- AR Atrium's `no-preference` GSAP condition therefore enabled decorative animation only on the working laptop.

This directly explains the observed AR Atrium behavior. It does **not** prove that the same reason applies to every animation problem in other applications; verify those independently.

## 3. Why the setting might differ

- **Windows 11:** Settings → Accessibility → Visual effects → **Animation effects**. Turning Windows animation effects off commonly causes Chromium-based browsers to report reduced motion. Recheck the console after changing the setting; a browser restart or page reload may be necessary.
- **Windows 10:** Settings → Ease of Access → Display → **Show animations in Windows**.
- **Android 9+:** Settings → Accessibility → **Remove animations**, where available. OEM labels/menus vary. Also check Developer options and battery-saving behavior for native animations.
- **macOS:** System Settings → Accessibility → Display or Motion → **Reduce motion** (location varies by version).
- **Browser and testing:** Browser-level preferences, DevTools emulation, remote debugging, and Playwright's `reducedMotion` settings can override the effective value seen by a webpage.

Never change a user's system accessibility preference automatically. A device reporting `true` may have been deliberately configured to avoid uncomfortable motion.

## 4. Decide which type of Android app you are fixing

| App implementation                    | Which motion signal to check                                           | Effective implementation                                                        |
| ------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Angular / standard web app            | `matchMedia('(prefers-reduced-motion: reduce)')`                       | TypeScript motion policy + CSS + GSAP lifecycle                                 |
| Capacitor / Cordova / Android WebView | Same query **inside the actual WebView**, plus Android device settings | Web motion policy for web-rendered UI; native code for native views/plugins     |
| Native Android Views (Kotlin/Java)    | `ValueAnimator.areAnimatorsEnabled()` (API 26+), duration scale        | Central Kotlin motion policy; native animators and static final states          |
| Jetpack Compose                       | Framework motion duration scale and component animation state          | `snap()` or static layout when motion should be skipped; Compose-specific tests |

**WebView warning:** Do not assume that an Android device's Accessibility settings and every WebView version map to `prefers-reduced-motion` identically. **Run the JavaScript test inside the WebView** to check what the web content actually receives. Android native Animator behavior and web/GSAP behavior may differ within a hybrid app.

## 5. Fix for an entire Angular / web / Capacitor application

**Preferred product behavior:** Offer **System (default)**, **On**, and **Off** motion preferences in Settings. System respects the browser/OS preference; On opts into decorative web motion on this site; Off suppresses decorative web motion. Persist the user's choice locally. Tell users that choosing On may cause movement even when the device has a reduced-motion accessibility preference.

### 5.1 Centralize the decision

Example Angular service (`motion.service.ts`):

```ts
import { Injectable, computed, signal, OnDestroy } from '@angular/core';

export type MotionMode = 'system' | 'on' | 'off';
const KEY = 'app.motion.mode';

@Injectable({ providedIn: 'root' })
export class MotionService implements OnDestroy {
  private readonly query =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : undefined;
  private readonly reduced = signal(this.query?.matches ?? false);
  readonly mode = signal<MotionMode>(this.readMode());
  readonly animate = computed(() => {
    if (this.mode() === 'on') return true;
    if (this.mode() === 'off') return false;
    return !this.reduced();
  });
  private readonly changed = (event: MediaQueryListEvent) => this.reduced.set(event.matches);

  constructor() {
    this.query?.addEventListener('change', this.changed);
    this.updateRoot(this.mode());
  }

  setMode(mode: MotionMode): void {
    this.mode.set(mode);
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* no persistent storage */
    }
    this.updateRoot(mode);
  }

  private updateRoot(mode: MotionMode): void {
    if (typeof document !== 'undefined') document.documentElement.dataset['motionMode'] = mode;
  }

  private readMode(): MotionMode {
    try {
      const value = localStorage.getItem(KEY);
      if (value === 'system' || value === 'on' || value === 'off') return value;
    } catch {
      /* no persistent storage */
    }
    return 'system';
  }

  ngOnDestroy(): void {
    this.query?.removeEventListener('change', this.changed);
  }
}
```

**Integration note:** A `computed` signal can be read from a component or an Angular `effect()`. When it changes, properly revert/recreate the GSAP timeline and ScrollTriggers (for example with `gsap.context` + `revert()`). Do not create additional timelines on every signal change without cleanup, and do not leave content stuck with `opacity: 0`.

### 5.2 Match the CSS policy

A common existing rule makes **all** animations disappear when `reduce` is reported:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

That would **still block CSS motion even when the user selects On**. Instead, scope the reduced-motion rule to sites that have **not** explicitly opted in:

```css
/* System mode: respect browser/OS. Off mode: also stop all decorative CSS motion. */
@media (prefers-reduced-motion: reduce) {
  :root:not([data-motion-mode='on']) {
    scroll-behavior: auto !important;
  }
  :root:not([data-motion-mode='on']) *,
  :root:not([data-motion-mode='on']) *::before,
  :root:not([data-motion-mode='on']) *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
:root[data-motion-mode='off'] {
  scroll-behavior: auto !important;
}
:root[data-motion-mode='off'] *,
:root[data-motion-mode='off'] *::before,
:root[data-motion-mode='off'] *::after {
  animation: none !important;
  transition: none !important;
  scroll-behavior: auto !important;
}
```

Scope this policy to **decorative motion** when the app has essential loading/progress indicators; a progress indicator must remain understandable without animation. Check CSS specificity and stylesheet order. `scroll-behavior: auto` should also be applied on the scroll container itself when necessary (often `html`). Use an early initialization strategy if avoiding a first-paint style flash is important.

### 5.3 Centralize GSAP initialization and cleanup

For every animated route, inspect `motion.animate()` before creating motion. Use an Angular `effect` or suitable lifecycle hook to respond to preference changes, with owned GSAP contexts and cleanup. Prefer final visible states when motion is off; validate route re-entry and screen rotation.

**Do not globally fake `matchMedia` to return `false`**. Other libraries, CSS, and accessibility behavior rely on its real value. A product-specific motion policy is safer.

## 6. Fix for one Angular component only

If only one component needs repair, use a local preference check instead of changing the entire app:

```ts
import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';

@Component({ selector: 'app-example', template: `<div class="reveal">Welcome</div>` })
export class ExampleComponent {
  private readonly root = inject(ElementRef<HTMLElement>);
  constructor() {
    const destroyRef = inject(DestroyRef);
    let disposed = false;
    let revert: (() => void) | undefined;
    destroyRef.onDestroy(() => {
      disposed = true;
      revert?.();
    });
    afterNextRender(async () => {
      const [{ gsap }] = await Promise.all([import('gsap')]);
      if (disposed) return;
      const el = this.root.nativeElement.querySelector('.reveal');
      if (!el) return;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const context = gsap.context(() => {
        if (reduced) gsap.set(el, { opacity: 1, y: 0 });
        else gsap.from(el, { opacity: 0, y: 24, duration: 0.6, clearProps: 'all' });
      }, this.root.nativeElement);
      revert = () => context.revert();
    });
  }
}
```

This example checks at component initialization only. To support switching the OS motion preference **while the component is mounted**, subscribe to the media query's `change` event and rebuild its GSAP context, or inject the shared `MotionService`. Make sure the element remains visible in the non-animated case. When CSS also disables motion, ensure the component's CSS and policy agree.

## 7. Native Android (Kotlin): whole-app fix

Android native animations **do not use the JavaScript media query**. Android Animator APIs follow the system animation duration scale; `0` makes Animator-based animation finish immediately. Battery Saver can also disable native animators.

Useful checks:

- `ValueAnimator.areAnimatorsEnabled()` — Android API 26+, returns whether system animators are enabled.
- `ValueAnimator.getDurationScale()` — Android API 33+, returns Animator duration scale (`0f` means immediate completion).
- `Settings.Global.ANIMATOR_DURATION_SCALE` — available from API 17; primarily a diagnostic/compatibility read.

A small reusable policy (`MotionPolicy.kt`):

```kotlin
import android.animation.ValueAnimator
import android.content.Context
import android.os.Build
import android.provider.Settings

enum class MotionMode { SYSTEM, ON, OFF }

class MotionPolicy(private val context: Context) {
    private val prefs = context.getSharedPreferences("motion", Context.MODE_PRIVATE)

    fun mode(): MotionMode = runCatching {
        MotionMode.valueOf(prefs.getString("mode", MotionMode.SYSTEM.name)!!)
    }.getOrDefault(MotionMode.SYSTEM)

    fun setMode(mode: MotionMode) = prefs.edit().putString("mode", mode.name).apply()

    fun systemAnimatorsEnabled(): Boolean = if (Build.VERSION.SDK_INT >= 26) {
        ValueAnimator.areAnimatorsEnabled()
    } else {
        Settings.Global.getFloat(
            context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f
        ) > 0f
    }

    fun shouldRunNativeAnimator(): Boolean = mode() != MotionMode.OFF && systemAnimatorsEnabled()
}
```

**Critical Android limitation:** `ON` is an **application preference**, not permission to bypass system animator disabling. If Android's Animator duration scale is `0`, an Android `ValueAnimator` may still complete instantly. Do **not** silently change system-wide animation settings, demand special privileges, or invent a custom animation loop solely to evade a user's accessibility preference. Make the final state readable and expose why motion is disabled. Keep persistent preferences in DataStore for a larger app if appropriate; this sample uses SharedPreferences for brevity.

## 8. Native Android (Kotlin): fix just one View/component

```kotlin
fun showCard(card: android.view.View, policy: MotionPolicy) {
    card.animate().cancel()
    if (!policy.shouldRunNativeAnimator()) {
        card.alpha = 1f
        card.translationY = 0f
        return
    }
    card.alpha = 0f
    card.translationY = 24f * card.resources.displayMetrics.density
    card.animate()
        .alpha(1f)
        .translationY(0f)
        .setDuration(250L)
        .start()
}
```

Use this for **decorative** entrance motion. Do not make critical content depend on a completion listener that never fires as expected; always establish a correct, accessible final state. If the policy changes, cancel the current animator and render the final state before starting a new one.

### Jetpack Compose note

Compose animation timing is influenced by `MotionDurationScale` (where supported by its animation context). A scale of `0f` makes motion finish at the next frame. For a single component you can choose an immediate `snap()` animation spec or a static UI rather than a timed `tween()` when motion is disabled:

```kotlin
val alpha by animateFloatAsState(
    targetValue = if (visible) 1f else 0f,
    animationSpec = if (allowDecorativeMotion) tween(250) else snap(),
    label = "content alpha"
)
```

This snippet assumes `visible` and `allowDecorativeMotion` are provided by the composable. A `tween()` cannot guarantee movement if the platform/framework effectively scales animations to zero. Centralize `allowDecorativeMotion` via app state and test on real devices.

## 9. Android diagnostic commands (ADB, on a device you control)

```bash
adb devices
adb shell settings get global animator_duration_scale
adb shell settings get global transition_animation_scale
adb shell settings get global window_animation_scale
```

Typically `1.0` means normal scaling, `0.0` means disabled, and larger numbers slow the respective animation classes. These are **three different settings**, not a single reduced-motion Boolean. Battery Saver, OEM features and app libraries may also affect results.

To verify **WebView** content, enable debugging on a test build (subject to your app's security policy), connect the device, open `chrome://inspect/#devices` in desktop Chrome, inspect the WebView, and run the same JavaScript `window.matchMedia(...)` test in that frame. Do not enable WebView debugging indiscriminately in production builds.

To compare with browser behavior, record the JavaScript media-query result and the three native settings separately. They need not be identical.

## 10. Automated tests — include the exact `window.matchMedia` check

### 10.1 Required Playwright test cases (Angular/Capacitor browser layer)

Playwright normally **emulates `no-preference` unless you explicitly specify `reducedMotion`**. Tests that pass with the default setting alone may miss the issue observed on the affected laptop.

```ts
import { test, expect } from '@playwright/test';

for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`reports ${reducedMotion} and renders correctly`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/'); // supply a test login or test-auth fixture where needed

    // REQUIRED EXACT DEVICE-PREFERENCE TEST:
    const requested = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    expect(requested).toBe(reducedMotion === 'reduce');

    // The application must remain usable and all core content visible.
    await expect(page.locator('body')).toBeVisible();
    // Add assertions for heading visibility, controls, screenshots,
    // and computed animation transforms for the actual page.
  });
}
```

**Also add explicit app-mode tests** (with a Settings control or service fixture), not just media-query tests:

| Simulated browser preference | In-app mode | Expected decorative motion            |
| ---------------------------- | ----------- | ------------------------------------- |
| `reduce` (`true`)            | System      | Off/static                            |
| `no-preference` (`false`)    | System      | On                                    |
| `reduce` (`true`)            | On          | On **for web/GSAP** (explicit opt-in) |
| `no-preference` (`false`)    | Off         | Off/static                            |
| `reduce` (`true`)            | Off         | Off/static                            |

Do not merely assert that the GSAP bundle loaded. Measure computed opacity/transform **before and after** entrance or scrolling, and verify a final visible resting state with reduced motion. Test both directions of live preference changes, light/dark themes, mobile/desktop widths, route re-entry, and no leftover ScrollTriggers.

### 10.2 Native Android test cases

- Test with system Animator duration scale `1.0` and `0.0` on a test device/emulator.
- Test native `systemAnimatorsEnabled()` and your app's Off/System/On policy. On may **not** force native Animator motion when the OS scale is zero.
- Test the static fallback for every important View/Compose screen and verify clicks, focus, labels, and final visibility.
- Test Battery Saver when practical, as it may suppress native animators.
- If the app is hybrid, run both native ADB checks and the in-WebView JavaScript test.

## 11. Troubleshooting decision tree

```text
No motion on this device
  |
  +-- Web / WebView?
  |      |
  |      +-- Run: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  |             |
  |             +-- true  -> Inspect OS/browser preference + app motion gate.
  |             |            Respect by default; offer explicit in-app preference.
  |             |
  |             +-- false -> Inspect JS console errors, GSAP import/init,
  |                          visibility/opacity, ScrollTrigger registration,
  |                          element selectors, CSS overrides, and timing.
  |
  +-- Native Android Views / Compose?
         |
         +-- Check Animator enabled/scale and Battery Saver.
         +-- If disabled: render final state immediately.
         +-- If enabled: inspect lifecycle, cancellation, timing and layout.
```

## 12. Acceptance checklist for a permanent fix

- [ ] Required console check is documented and tested: `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
- [ ] The same site is tested where it returns **`true`** and **`false`**.
- [ ] Browser's actual preference is logged separately from the app's stored motion mode.
- [ ] System remains the default; optional On/Off choices are explicit and discoverable.
- [ ] Decorative motion stops on System+reduce and Off; content remains visible and usable.
- [ ] Web opt-in On changes both JavaScript and CSS behavior; preference changes are handled without a hard reload.
- [ ] GSAP contexts, observers, timers and ScrollTriggers are cleaned up on route change.
- [ ] Native Android code respects framework animation scales rather than trying to bypass system settings.
- [ ] Essential progress/status is communicated with text or static indicators as well as animation.
- [ ] Playwright covers all preference/mode combinations, real transform/opacity changes, and mobile widths.
- [ ] A physical Android/WebView check is performed for hybrid apps.
- [ ] No feature-branch GitHub Actions/deployment workflow was added as part of this fix.

## 13. References

1. MDN — [Using `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion) (device controls and semantics).
2. Playwright — [`page.emulateMedia` and `reducedMotion`](https://playwright.dev/docs/api/class-page#page-emulate-media).
3. Playwright — [`testOptions.reducedMotion`](https://playwright.dev/docs/api/class-testoptions#test-options-reduced-motion) (default browser-test emulation).
4. Android Developers — [`ValueAnimator.areAnimatorsEnabled()` and `getDurationScale()`](https://developer.android.com/reference/android/animation/ValueAnimator).
5. Android Developers — [`Settings.Global.ANIMATOR_DURATION_SCALE`](https://developer.android.com/reference/android/provider/Settings.Global).
6. Android Developers — [Compose `MotionDurationScale`](https://developer.android.com/reference/kotlin/androidx/compose/ui/MotionDurationScale).
7. Android Developers — [Compose animation quick guide](https://developer.android.com/develop/ui/compose/animation/quick-guide).

---

**Takeaway:** A reduced-motion preference is an accessibility request, not a defect. Diagnose what the platform reports, make the UI complete without animation, and implement a centralized, explicit motion preference when a web application needs user-selectable decorative motion. A global web override does not change Android's native animator duration scale.

## 14. AR Atrium implementation

AR Atrium now implements the shared policy described above. Choose System (default), On or Off on the lock screen or in the site footer. The real browser query remains unchanged; On overrides only this application's decorative web motion. CSS, GSAP and Skip Intro share the effective decision. See [the repository audit](motion-policy-audit.md) for the complete inventory, lifecycle handling and verification. Native Android examples in this guide are reference material, not code present in this checkout.
