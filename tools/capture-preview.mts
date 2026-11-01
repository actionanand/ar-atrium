import type { Page } from '@playwright/test';
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// No tracing, video, persistent profiles, storage-state exports or credential logging.
export function captureOptions(env: Record<string, string | undefined>) {
  const url = new URL(env.CAPTURE_URL ?? '');
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol === 'http:' && url.hostname !== 'localhost')
  )
    throw new Error('Unsafe capture URL');
  if (
    env.CAPTURE_SYNTHETIC_DATA !== 'confirmed' ||
    !env.CAPTURE_SELECTOR ||
    !/^[a-z0-9-]+$/.test(env.CAPTURE_ID ?? '')
  )
    throw new Error('Confirm synthetic data and provide a reviewed content selector and ID');
  return { url: url.href, selector: env.CAPTURE_SELECTOR, id: env.CAPTURE_ID };
}
export async function captureRegion(page: Page, selector: string, output: string) {
  const target = page.locator(selector);
  if (
    (await target.count()) !== 1 ||
    (await target.evaluate(
      (e) =>
        e.matches('input, textarea, [contenteditable="true"]') ||
        !!e.querySelector('input, textarea, [contenteditable="true"]'),
    ))
  )
    throw new Error('Unsafe capture region');
  await target.screenshot({ path: output });
}
export async function capture(env: Record<string, string | undefined> = process.env) {
  const options = captureOptions(env);
  const browser = await chromium.launch({
    headless: false,
    channel: process.platform === 'win32' ? 'chrome' : undefined,
  });
  try {
    const context = await browser.newContext({
      viewport:
        env.CAPTURE_MOBILE === '1' ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(options.url);
    // Owner-controlled protected session: sign in manually in the browser, using a synthetic test account.
    // Resume from Playwright Inspector only once the intended home screen is ready.
    await page.pause();
    const target = page.locator(options.selector);
    if (
      (await target.count()) !== 1 ||
      (await target.locator('input, textarea, [contenteditable="true"]').count())
    )
      throw new Error('Capture region must be unique and contain no editable or credential fields');
    const directory = resolve('.cache/preview-captures');
    await mkdir(directory, { recursive: true });
    await captureRegion(page, options.selector, resolve(directory, options.id + '.png'));
  } finally {
    await browser.close();
  }
}
if (process.argv[1]?.endsWith('capture-preview.mts'))
  capture().catch(() => {
    console.error(
      'Capture failed. Review configuration and session locally; no private error details were logged.',
    );
    process.exitCode = 1;
  });
