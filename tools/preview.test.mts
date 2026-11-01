import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyLocalPreview } from './preview-validation.mts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePreview } from './preview-validation.mts';
import { captureOptions } from './capture-preview.mts';
test('preview paths and public demos reject unsafe or credential-bearing destinations', () => {
  for (const imageUrl of [
    '../secret.png',
    '/previews/a.png',
    'previews/../a.png',
    'previews/%2e%2e/a.png',
    'javascript:alert(1)',
    'https://u:p@example.com/a.png',
    'https://example.com/a?token=x',
  ])
    assert.throws(() => validatePreview({ imageUrl }));
  validatePreview({ imageUrl: 'previews/example/mobile.webp' });
  assert.throws(() => validatePreview({ demoUrl: 'https://example.com/demo' }));
  validatePreview({ demoUrl: 'https://example.com/demo', demoPublic: true });
  validatePreview(undefined);
});
test('private captures require owner confirmation and never accept credentials in URLs', () => {
  const env = {
    CAPTURE_URL: 'https://example.com/',
    CAPTURE_ID: 'example',
    CAPTURE_SELECTOR: 'main',
    CAPTURE_SYNTHETIC_DATA: 'confirmed',
  };
  assert.equal(captureOptions(env).id, 'example');
  assert.throws(() => captureOptions({ ...env, CAPTURE_SYNTHETIC_DATA: '' }));
  assert.throws(() =>
    captureOptions({ ...env, CAPTURE_URL: 'https://user:password@example.com/' }),
  );
  assert.throws(() => captureOptions({ ...env, CAPTURE_ID: '../public/data' }));
});

test('local preview files must exist within public and use supported paths', () => {
  const root = mkdtempSync(join(tmpdir(), 'atrium-preview-'));
  try {
    mkdirSync(join(root, 'previews'));
    writeFileSync(join(root, 'previews/home.png'), 'fixture');
    verifyLocalPreview({ imageUrl: 'previews/home.png' }, root, 'valid-project');
    verifyLocalPreview({ imageUrl: 'https://example.com/home.png' }, root, 'remote-project');
    assert.throws(
      () => verifyLocalPreview({ imageUrl: 'previews/missing.png' }, root, 'missing-project'),
      /missing-project.*previews\/missing.png.*Add the image/,
    );
    for (const imageUrl of [
      'previews/../home.png',
      'previews/a.svg',
      'previews/%2e%2e/home.png',
      '/previews/home.png',
    ])
      assert.throws(
        () => verifyLocalPreview({ imageUrl }, root, 'unsafe-project'),
        /unsafe-project/,
      );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
