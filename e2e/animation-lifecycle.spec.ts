import { test, expect } from '@playwright/test';

test('motion preferences, breakpoint changes, carousel keys and route cleanup remain functional', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() =>
    localStorage.setItem(
      'ar-atrium.auth.v1',
      JSON.stringify({ version: 1, accountName: 'Lifecycle audit', unlockedAt: Date.now() }),
    ),
  );
  await page.goto('/');
  await expect(page.locator('app-home')).toHaveAttribute('data-intro', 'complete');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('app-home')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('.hero h1')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-architecture')).toHaveCSS('transform', 'none');
  const carousel = page.locator('.device-stage');
  await carousel.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => carousel.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('app-home')).toHaveAttribute('data-intro', 'complete');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('app-home')).toHaveAttribute('data-intro', 'complete');
  await page.getByRole('link', { name: 'Explore the collection', exact: true }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await page.getByRole('link', { name: 'AR Atrium home', exact: true }).click();
  await expect(page.locator('app-home')).toHaveAttribute('data-intro', 'complete');
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
  await expect
    .poll(() =>
      page
        .locator('.hero-architecture')
        .evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42),
    )
    .toBeGreaterThan(10);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('button', { name: 'Lock the collection', exact: true }).click();
  await expect(page).toHaveURL(/\/lock$/);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  expect(errors).toEqual([]);
});
