import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

declare global {
  interface Window {
    __atriumEntranceSamples: { opacity: number; transform: string }[];
  }
}

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}
async function art(page: Page) {
  return page.locator('.hero-architecture').evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return {
      transform: getComputedStyle(element).transform,
      y: matrix.m42,
      scale: matrix.m11,
      opacity: Number(getComputedStyle(element).opacity),
    };
  });
}
for (const viewport of viewports)
  for (const theme of ['light', 'dark'] as const)
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      test.describe(`${viewport.width} ${theme} ${reducedMotion}`, () => {
        test.use({
          viewport,
          colorScheme: theme,
          reducedMotion,
          hasTouch: viewport.width <= 850,
          isMobile: viewport.width <= 850,
        });
        test('responsive routes, drawer, previews and measured landing motion', async ({
          page,
          browser,
        }, testInfo) => {
          const key = `${viewport.width}-${theme}-${reducedMotion}`;
          const directory = resolve('.cache/mobile-audit', key);
          await mkdir(directory, { recursive: true });
          const errors: string[] = [];
          const failedRequests: { url: string; error: string | null }[] = [];
          const httpErrors: { url: string; status: number }[] = [];
          const warnings: string[] = [];
          page.on('pageerror', (error) => errors.push(error.message));
          page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
            else if (message.type() === 'warning') warnings.push(message.text());
          });
          page.on('requestfailed', (request) =>
            failedRequests.push({
              url: request.url(),
              error: request.failure()?.errorText ?? null,
            }),
          );
          page.on('response', (response) => {
            if (response.status() >= 400)
              httpErrors.push({ url: response.url(), status: response.status() });
          });
          await page.addInitScript((value) => {
            localStorage.setItem('ar-atrium.theme', value);
            window.__atriumEntranceSamples = [];
            setInterval(() => {
              const title = document.querySelector('.hero h1');
              if (title && window.__atriumEntranceSamples.length < 100)
                window.__atriumEntranceSamples.push({
                  opacity: Number(getComputedStyle(title).opacity),
                  transform: getComputedStyle(title).transform,
                });
            }, 40);
          }, theme);
          await page.goto('/lock');
          await expect(page.getByRole('heading', { name: 'Step into the Atrium' })).toBeVisible();
          await noOverflow(page);
          const passwordBounds = await page.locator('#password').boundingBox();
          if (viewport.width <= 850)
            expect(passwordBounds!.y + passwordBounds!.height).toBeLessThan(viewport.height);
          await page.screenshot({ path: resolve(directory, 'lock.png'), fullPage: true });
          await page.getByLabel('Username', { exact: true }).fill('Browser audit');
          await page.getByLabel('Password', { exact: true }).fill('password@123');
          await page.getByRole('button', { name: 'Show password', exact: true }).click();
          await expect(page.locator('#password')).toHaveAttribute('type', 'text');
          await page.getByRole('button', { name: 'Hide password', exact: true }).click();
          await page.getByRole('button', { name: /Unlock Atrium/ }).click();
          await expect(page.locator('app-home')).toHaveAttribute(
            'data-motion',
            reducedMotion === 'reduce' ? 'reduced' : 'active',
          );
          await expect(page.locator('app-home')).toHaveAttribute('data-intro', 'complete');
          await noOverflow(page);
          const entrance = await page.evaluate(() => window.__atriumEntranceSamples);
          if (reducedMotion === 'no-preference')
            expect(entrance.some((sample) => sample.opacity < 0.95)).toBe(true);
          else expect(entrance.every((sample) => sample.opacity === 1)).toBe(true);
          const before = await art(page);
          if (viewport.width <= 850) {
            const copy = await page.locator('.hero-copy').boundingBox();
            const stage = await page.locator('.hero-art-stage').boundingBox();
            expect(stage!.y).toBeGreaterThanOrEqual(copy!.y + copy!.height - 1);
            expect(before.opacity).toBe(1);
          }
          await page.screenshot({ path: resolve(directory, 'home-top.png') });
          await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }));
          await page.waitForTimeout(1200);
          const after = await art(page);
          if (reducedMotion === 'no-preference')
            expect(Math.abs(after.y - before.y)).toBeGreaterThan(5);
          else expect(after).toEqual(before);
          const firstShowcase = page.locator('.device-frame').first();
          const showcaseBefore = await firstShowcase.evaluate((e) => ({
            opacity: Number(getComputedStyle(e).opacity),
            transform: getComputedStyle(e).transform,
          }));
          await page.locator('.device-stage').scrollIntoViewIfNeeded();
          await page.waitForTimeout(1400);
          const showcaseAfter = await firstShowcase.evaluate((e) => ({
            opacity: Number(getComputedStyle(e).opacity),
            transform: getComputedStyle(e).transform,
          }));
          expect(showcaseAfter.opacity).toBe(1);
          if (reducedMotion === 'no-preference') {
            expect(showcaseBefore.opacity).toBeLessThan(1);
            expect(showcaseAfter.transform).not.toBe(showcaseBefore.transform);
          } else expect(showcaseBefore.opacity).toBe(1);
          for (const selector of ['.intro-section', '.featured-section', '.collection-paths']) {
            await page.locator(selector).scrollIntoViewIfNeeded();
            await page.waitForTimeout(950);
          }
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          await page.waitForTimeout(1000);
          await page.screenshot({ path: resolve(directory, 'home-full.png'), fullPage: true });
          const restingOpacity = await page
            .locator(
              '.hero-copy > *, .hero-art-stage, .intro-section > *, .device-frame, .section-heading',
            )
            .evaluateAll((elements) =>
              elements.map((element) => Number(getComputedStyle(element).opacity)),
            );
          expect(restingOpacity.every((opacity) => opacity === 1)).toBe(true);
          await page.getByRole('link', { name: 'Skip intro', exact: true }).click();
          await expect(page.locator('#featured-heading')).toBeFocused();
          await page.goto('/explore');
          await expect(
            page.getByRole('heading', { name: 'Apps & Tools', exact: true }),
          ).toBeVisible();
          await noOverflow(page);
          await page.screenshot({ path: resolve(directory, 'listing.png'), fullPage: true });
          await page.getByLabel('Search the collection').fill('Card Nest');
          await expect(page.locator('app-project-card')).toHaveCount(1);
          await page.getByLabel('Search the collection').fill('');
          await page.getByLabel('Category', { exact: true }).selectOption('finance');
          expect(await page.locator('app-project-card').count()).toBeGreaterThan(0);
          await page.getByLabel('Category', { exact: true }).selectOption('');
          if (viewport.width <= 850) {
            const menu = page.getByRole('button', { name: 'Open navigation', exact: true });
            await menu.tap();
            await expect(page.locator('#mobile-navigation')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Close navigation' })).toBeFocused();
            await page.keyboard.press('Shift+Tab');
            await page.keyboard.press('Shift+Tab');
            expect(
              await page
                .locator('#mobile-navigation')
                .evaluate((e) => e.contains(document.activeElement)),
            ).toBe(true);
            await page.keyboard.press('Escape');
            await expect(menu).toBeFocused();
            await menu.tap();
            await page.mouse.click(2, 180);
            await expect(page.locator('#mobile-navigation')).not.toBeVisible();
            await menu.tap();
            await expect(page.locator('#mobile-navigation [aria-current="page"]')).toContainText(
              'Apps & Tools',
            );
            await page.screenshot({ path: resolve(directory, 'navigation.png') });
            await page
              .locator('#mobile-navigation')
              .getByRole('link', { name: 'Playground', exact: true })
              .click();
            await expect(page).toHaveURL(/\/playground$/);
            await expect(page.locator('#mobile-navigation')).not.toBeVisible();
            await page.goto('/explore');
          }
          await page.getByRole('button', { name: 'Preview Card Nest', exact: true }).click();
          await expect(page.locator('.preview-panel')).toHaveAttribute('role', 'dialog');
          await expect(page.getByRole('button', { name: 'Close preview' })).toBeFocused();
          const preview = await page.locator('.preview-panel').boundingBox();
          expect(preview!.x).toBeGreaterThanOrEqual(0);
          expect(preview!.x + preview!.width).toBeLessThanOrEqual(viewport.width);
          expect(preview!.height).toBeLessThan(viewport.height);
          await page.screenshot({ path: resolve(directory, 'preview.png') });
          await page.getByRole('button', { name: 'Close preview' }).click();
          await expect(
            page.getByRole('button', { name: 'Preview Card Nest', exact: true }),
          ).toBeFocused();
          await page.goto('/app/ng-my-libraries');
          await expect(
            page.getByRole('heading', { name: 'Ng (Nx) Libraries', exact: true }),
          ).toBeVisible();
          await expect(page.locator('a[href*="npmjs.com/package/"]')).toHaveCount(5);
          await noOverflow(page);
          await page.screenshot({ path: resolve(directory, 'details.png'), fullPage: true });
          const catalogue = await page.request.get('/data/generated/catalog.json');
          expect((await catalogue.json()).projects).toHaveLength(77);
          const report = {
            viewport,
            theme,
            reducedMotion,
            browser: browser.version(),
            entrance,
            before,
            after,
            showcaseBefore,
            showcaseAfter,
            errors,
            failedRequests,
            httpErrors,
            warnings,
          };
          await writeFile(resolve(directory, 'measurements.json'), JSON.stringify(report, null, 2));
          await testInfo.attach('motion-and-network-evidence', {
            body: JSON.stringify(report, null, 2),
            contentType: 'application/json',
          });
          expect(errors).toEqual([]);
          expect(httpErrors).toEqual([]);
          expect(
            failedRequests.filter(
              (request) =>
                request.url.startsWith('http://localhost') &&
                !request.error?.includes('ERR_ABORTED'),
            ),
          ).toEqual([]);
        });
      });
    }
