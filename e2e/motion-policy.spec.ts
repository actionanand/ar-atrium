import { test, expect } from '@playwright/test';

for (const reducedMotion of ['reduce', 'no-preference'] as const)
  for (const mode of ['system', 'on', 'off'] as const)
    for (const width of [390, 1440]) {
      test(`motion policy ${reducedMotion} ${mode} ${width}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion });
        await page.addInitScript(() =>
          localStorage.setItem(
            'ar-atrium.auth.v1',
            JSON.stringify({ version: 1, accountName: 'Motion audit', unlockedAt: Date.now() }),
          ),
        );
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto('/');
        const requested = await page.evaluate(
          () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        );
        expect(requested).toBe(reducedMotion === 'reduce');
        await page.getByLabel('Motion preference', { exact: true }).selectOption(mode);
        const enabled = mode === 'on' || (mode === 'system' && !requested);
        await expect(page.locator('html')).toHaveAttribute('data-motion-enabled', String(enabled));
        await page.reload();
        await expect(page.getByLabel('Motion preference', { exact: true })).toHaveValue(mode);
        await expect(page.locator('app-home')).toHaveAttribute(
          'data-motion',
          enabled ? 'active' : 'reduced',
        );
        await expect(page.locator('app-home')).toHaveAttribute('data-intro', 'complete');
        const visual = () =>
          page.locator('.hero-architecture').evaluate((e) => ({
            y: new DOMMatrixReadOnly(getComputedStyle(e).transform).m42,
            opacity: getComputedStyle(e).opacity,
          }));
        const cssDuration = await page
          .locator('.hero-actions .button')
          .evaluate((e) => getComputedStyle(e).transitionDuration);
        expect(cssDuration).toBe(enabled ? '0.2s, 0.2s' : '0s');
        const before = await visual();
        await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
        await page.waitForTimeout(1200);
        const after = await visual();
        if (enabled) expect(Math.abs(after.y - before.y)).toBeGreaterThan(5);
        else expect(after).toEqual(before);
        await page.locator('.device-stage').scrollIntoViewIfNeeded();
        await expect(page.locator('.device-frame').first()).toHaveCSS('opacity', '1');
        await page.getByRole('button', { name: /Switch to .* theme/ }).click();
        await page.emulateMedia({
          colorScheme: 'dark',
          reducedMotion: requested ? 'no-preference' : 'reduce',
        });
        await expect(page.locator('html')).toHaveAttribute(
          'data-motion-enabled',
          String(mode === 'on' || (mode === 'system' && requested)),
        );
        await page.getByLabel('Motion preference', { exact: true }).selectOption('off');
        await expect(page.locator('.hero h1')).toHaveCSS('opacity', '1');
        await expect(page.locator('.hero-architecture')).toHaveCSS('transform', 'none');
        await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
        await page.getByLabel('Motion preference', { exact: true }).selectOption('on');
        await expect(page.locator('app-home')).toHaveAttribute('data-intro', 'complete');
        await page.getByRole('link', { name: 'AR Atrium home', exact: true }).click();
        await page.setViewportSize({ width: width === 390 ? 1440 : 390, height: 900 });
        await expect(page.locator('.hero h1')).toHaveCSS('opacity', '1');
        await page.screenshot({ path: testInfo.outputPath('motion-policy.png') });
        await testInfo.attach('motion evidence', {
          body: JSON.stringify({ requested, mode, width, enabled, before, after }),
          contentType: 'application/json',
        });
        expect(errors).toEqual([]);
      });
    }

test('invalid and unavailable motion storage falls back safely', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ar-atrium.motion.v1', 'unexpected');
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'ar-atrium.motion.v1')
        throw new DOMException('Storage disabled', 'SecurityError');
      original.call(this, key, value);
    };
  });
  await page.goto('/lock');
  await expect(page.getByLabel('Motion preference', { exact: true })).toHaveValue('system');
  await page.getByLabel('Motion preference', { exact: true }).selectOption('on');
  await expect(page.locator('html')).toHaveAttribute('data-motion-enabled', 'true');
});
