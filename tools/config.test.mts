import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { injectProductionHash } = require('../scripts/inject-env.js') as {
  injectProductionHash: (source: string, hash?: string) => string;
};
const source = await readFile('src/environments/environment.ts', 'utf8');

test('Actions run only on pushes to main-github; feature validation stays local', async () => {
  const workflows = (await readdir('.github/workflows')).filter((name) => /\.ya?ml$/.test(name));
  assert.deepEqual(workflows, ['gh-pages.yml']);
  const workflow = await readFile('.github/workflows/gh-pages.yml', 'utf8');
  assert.match(workflow, /^on:\r?\n  push:\r?\n    branches: \[main-github\]\r?\npermissions:/m);
  assert.doesNotMatch(workflow, /pull_request|workflow_dispatch|feature\//);
});
test('production config retains placeholder; missing/invalid secrets fail without disclosure', () => {
  assert.match(source, /production: true/);
  assert.match(source, /PASSWORD_HASH_PLACEHOLDER/);
  for (const hash of [undefined, '', 'x'.repeat(40), 'a'.repeat(39), 'password@123'])
    assert.throws(() => injectProductionHash(source, hash), /40-character SHA-1/);
  const configured = injectProductionHash(source, 'a'.repeat(40));
  assert.ok(configured.includes('a'.repeat(40)));
  assert.ok(!configured.includes('PLACEHOLDER'));
  assert.throws(() => injectProductionHash(configured, 'b'.repeat(40)), /placeholder is missing/);
});
test('development hash, separate session key and production expiry configuration', async () => {
  const development = await readFile('src/environments/environment.development.ts', 'utf8');
  assert.match(development, /8e7152d0eb52c340579f2d70a28eaf1a2c5ba1c5/);
  for (const config of [source, development]) {
    assert.match(config, /ar-atrium\.auth\.v1/);
    assert.match(config, /authExpiryMs: 86400000/);
  }
});
test('GitHub Pages build uses repository base, correct deploy settings and SPA fallback', async () => {
  const workflow = await readFile('.github/workflows/gh-pages.yml', 'utf8');
  assert.match(workflow, /main-github/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /node-version-file: '\.nvmrc'/);
  assert.match(workflow, /publish_branch: gh-pages/);
  assert.match(workflow, /secrets.PASSWORD_HASH/);
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert.match(pkg.scripts['build:gh'], /--base-href \/ar-atrium\//);
  assert.match(await readFile('scripts/copy-error-page.mjs', 'utf8'), /404\.html/);
});
