import { test, expect } from '@playwright/test';

for (const reducedMotion of ['reduce', 'no-preference'] as const)
  for (const mode of ['system', 'on', 'off'] as const)
    for (const width of [390, 1440])
      test(`notice ${reducedMotion} ${mode} ${width}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion });
        await page.addInitScript((value) => {
          if (!localStorage.getItem('ar-atrium.motion.v1'))
            localStorage.setItem('ar-atrium.motion.v1', value);
        }, mode);
        await page.goto('/lock');
        expect(
          await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
        ).toBe(reducedMotion === 'reduce');
        const visible = mode === 'system' && reducedMotion === 'reduce';
        const action = page.getByRole('button', {
          name: 'Enable animations on this site',
          exact: true,
        });
        await expect(action).toHaveCount(visible ? 1 : 0);
        if (visible) {
          await expect(
            page.getByRole('complementary', { name: 'Animation preference' }),
          ).toContainText('decorative animations are paused');
          await page.screenshot({ path: testInfo.outputPath('notice-lock.png') });
          await action.click();
          await expect(action).toHaveCount(0);
          await expect(page.locator('#unlock-heading')).toBeFocused();
          expect(await page.evaluate(() => localStorage.getItem('ar-atrium.motion.v1'))).toBe('on');
          await page.reload();
          await expect(action).toHaveCount(0);
        }
        await page.evaluate(() =>
          localStorage.setItem(
            'ar-atrium.auth.v1',
            JSON.stringify({ version: 1, accountName: 'Notice audit', unlockedAt: Date.now() }),
          ),
        );
        await page.goto('/');
        const enabled =
          visible || mode === 'on' || (mode === 'system' && reducedMotion === 'no-preference');
        await expect(page.locator('app-home')).toHaveAttribute('data-intro', 'complete');
        await expect(action).toHaveCount(0);
        const y = () =>
          page
            .locator('.hero-architecture')
            .evaluate((e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).m42);
        const before = await y();
        await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
        await page.waitForTimeout(1200);
        const after = await y();
        if (enabled) expect(Math.abs(after - before)).toBeGreaterThan(5);
        else expect(after).toBe(before);
        await expect(page.locator('.hero h1')).toHaveCSS('opacity', '1');
        // Restore System live to verify the prominent in-app notice and its action too.
        await page.getByLabel('Motion preference', { exact: true }).selectOption('system');
        await expect(action).toHaveCount(reducedMotion === 'reduce' ? 1 : 0);
        if (reducedMotion === 'reduce') {
          await action.click();
          await expect(action).toHaveCount(0);
          await expect(page.locator('.hero h1')).toBeFocused();
        }
        await testInfo.attach('notice movement', {
          body: JSON.stringify({ reducedMotion, mode, width, enabled, before, after }),
          contentType: 'application/json',
        });
        await expect(page.locator('app-home')).toHaveAttribute('data-intro', 'complete');
        await page.screenshot({ path: testInfo.outputPath('notice-result.png') });
      });

test('keeping System dismisses the notice across reload and navigation without enabling motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lock');
  await page.getByRole('button', { name: 'Keep system setting', exact: true }).click();
  await expect(page.getByLabel('Motion preference', { exact: true })).toHaveValue('system');
  await expect(page.locator('html')).toHaveAttribute('data-motion-enabled', 'false');
  await page.reload();
  await expect(page.getByRole('complementary', { name: 'Animation preference' })).toHaveCount(0);
  await page.evaluate(() =>
    localStorage.setItem(
      'ar-atrium.auth.v1',
      JSON.stringify({ version: 1, accountName: 'Keep System audit', unlockedAt: Date.now() }),
    ),
  );
  await page.goto('/');
  await expect(page.getByRole('complementary', { name: 'Animation preference' })).toHaveCount(0);
  await expect(page.locator('.hero h1')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-architecture')).toHaveCSS('transform', 'none');
});
