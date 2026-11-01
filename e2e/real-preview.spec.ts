import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
for (const width of [390, 1440])
  for (const theme of ['light', 'dark'] as const) {
    test(`real preview ${width} ${theme}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((t) => {
        localStorage.setItem('ar-atrium.theme', t);
        localStorage.setItem(
          'ar-atrium.auth.v1',
          JSON.stringify({ version: 1, accountName: 'Synthetic audit', unlockedAt: Date.now() }),
        );
      }, theme);
      // This fixture is visibly synthetic and never becomes catalogue content.
      await page.setContent(
        '<main style="background:white;color:black;padding:20px;min-height:600px"><h1>Synthetic preview fixture</h1><p>Sample home screen — no personal data</p></main>',
      );
      const screenshot = await page
        .locator('main')
        .screenshot({ path: info.outputPath('synthetic-home.png') });
      let requests = 0;
      let broken = false;
      await page.route('**/previews/test.png', async (route) => {
        requests++;
        await new Promise((resolve) => setTimeout(resolve, 700));
        await route.fulfill({ body: screenshot, contentType: 'image/png' });
      });
      await page.route('**/data/generated/catalog.json', async (route) => {
        const data = JSON.parse(readFileSync('public/data/generated/catalog.json', 'utf8'));
        data.projects.find((p: { id: string }) => p.id === 'card-nest').preview = {
          imageUrl: broken ? 'previews/broken.png' : 'previews/test.png',
          imageAlt: 'Synthetic home screen',
          demoUrl: 'https://example.com/demo',
          demoPublic: true,
        };
        await route.fulfill({ json: data });
      });
      await page.goto('/explore');
      expect(requests).toBe(0);
      await page.getByRole('button', { name: 'Preview Card Nest', exact: true }).click();
      const panel = page.locator('.preview-panel');
      await expect(panel.getByRole('status')).toContainText('Loading home-screen screenshot');
      await expect(panel.getByAltText('Synthetic home screen')).toBeVisible();
      await expect
        .poll(() =>
          panel
            .getByAltText('Synthetic home screen')
            .evaluate((e) => (e as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
      await expect(panel.getByRole('link', { name: 'Open live demo' })).toHaveAttribute(
        'rel',
        'noopener noreferrer',
      );
      await expect(panel.getByAltText('Synthetic home screen')).toHaveCSS('object-fit', 'contain');
      await page.screenshot({ path: info.outputPath('loaded-preview.png') });
      const expand = panel.getByRole('button', { name: 'Expand screenshot' });
      await expand.click();
      const viewer = page.getByRole('dialog', { name: 'Card Nest expanded screenshot' });
      await expect(viewer).toBeVisible();
      await expect(viewer.getByRole('button', { name: 'Close screenshot' })).toBeFocused();
      await viewer.getByRole('button', { name: 'View original size' }).click();
      await expect(viewer.getByRole('button', { name: 'Fit image' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page.screenshot({ path: info.outputPath('expanded-preview.png') });
      await page.keyboard.press('Escape');
      await expect(viewer).toHaveCount(0);
      await expect(expand).toBeFocused();
      await expand.click();
      await page.keyboard.press('Tab');
      expect(await viewer.evaluate((e) => e.contains(document.activeElement))).toBe(true);
      await viewer.getByRole('button', { name: 'Close screenshot' }).click();
      await expect(expand).toBeFocused();
      await expand.click();
      await page
        .locator('.cdk-overlay-backdrop')
        .last()
        .click({ position: { x: 2, y: 2 } });
      await expect(viewer).toHaveCount(0);
      await expect(expand).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(panel).toHaveCount(0);
      await page.unroute('**/previews/test.png');
      await page.route('**/previews/broken.png', (r) => r.fulfill({ status: 404 }));
      broken = true;
      await page.reload();
      await page.getByRole('button', { name: 'Preview Card Nest', exact: true }).click();
      await expect(panel).toContainText('Screenshot could not be loaded');
      await page.getByRole('button', { name: 'Close preview' }).click();
      await page.getByRole('button', { name: 'Preview Card Nest', exact: true }).click();
      await expect(panel).toContainText('Screenshot could not be loaded');
      await page.getByRole('button', { name: 'Close preview' }).click();
      await page.getByRole('button', { name: 'Preview Office Orbit', exact: true }).click();
      await expect(panel).toContainText('Home-screen screenshot not yet available');
      await expect(panel.getByRole('link', { name: 'Open live demo' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Close preview' }).click();
      await page.goto('/app/card-nest');
      await expect(page.getByRole('link', { name: 'Open live demo' })).toHaveAttribute(
        'href',
        'https://example.com/demo',
      );
    });
  }

test('protected owner capture rejects a credential form and captures only synthetic home content', async ({
  page,
}, info) => {
  const { captureRegion } = await import('../tools/capture-preview.mts');
  await page.setContent(
    '<main><input type="password" aria-label="Test password"><button>Enter test session</button></main>',
  );
  await expect(captureRegion(page, 'main', info.outputPath('rejected.png'))).rejects.toThrow();
  await page.getByLabel('Test password').fill('synthetic-test-only');
  await page.getByRole('button').click();
  await page.setContent(
    '<main><h1>Synthetic authenticated home</h1><p>Sample account only</p></main>',
  );
  await captureRegion(page, 'main', info.outputPath('protected-synthetic-home.png'));
});

test('published Policy Hub screenshot loads from the application base', async ({ page }, info) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'ar-atrium.auth.v1',
      JSON.stringify({ version: 1, accountName: 'Preview audit', unlockedAt: Date.now() }),
    ),
  );
  await page.goto('/explore');
  await page.getByRole('button', { name: 'Preview Policy Hub', exact: true }).click();
  const image = page.getByAltText('Policy Hub public homepage and application directory');
  await expect.poll(() => image.evaluate((e) => (e as HTMLImageElement).naturalWidth)).toBe(1440);
  await page.screenshot({ path: info.outputPath('policy-hub-real-preview.png') });
});
