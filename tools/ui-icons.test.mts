import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

test('Google Material Symbols Rounded stylesheet and ligature styling are configured', async () => {
  const html = await readFile('src/index.html', 'utf8');
  assert.match(
    html,
    /https:\/\/fonts.googleapis.com\/css2\?family=Material\+Symbols\+Rounded&display=block/,
  );
  assert.match(html, /fonts.gstatic.com.*crossorigin/);
  const css = await readFile('src/styles.scss', 'utf8');
  for (const rule of [
    'Material Symbols Rounded',
    'font-feature-settings',
    'font-variation-settings',
    'letter-spacing: normal',
    'text-transform: none',
  ])
    assert.ok(css.includes(rule), rule);
});

test('all actionable UI uses genuine symbols with appropriate navigation semantics', async () => {
  const paths = ['src/app/features', 'src/app/shared'];
  for (const directory of paths)
    for (const name of await readdir(directory)) {
      if (!name.endsWith('.ts') || name.endsWith('.spec.ts')) continue;
      const source = await readFile(`${directory}/${name}`, 'utf8');
      assert.doesNotMatch(source, /[↗→←↓☀☾✕]/, name);
      for (const element of source.matchAll(/<span[^>]*class="material-symbols-rounded"[^>]*>/g))
        assert.match(element[0], /aria-hidden="true"/, name);
      for (const link of source.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a\s*>/g)) {
        if (!link[0].includes('material-symbols-rounded')) continue;
        if (link[0].includes('target="_blank"')) assert.ok(link[0].includes('open_in_new'), name);
        if (link[0].includes('routerLink')) assert.ok(!link[0].includes('open_in_new'), name);
      }
    }
  const shell = await readFile('src/app/features/shell.ts', 'utf8');
  assert.match(shell, /Switch to light theme/);
  assert.match(shell, /Switch to dark theme/);
  assert.match(shell, /'light_mode' : 'dark_mode'/);
  const lock = await readFile('src/app/features/lock.ts', 'utf8');
  for (const icon of ['lock_open', 'visibility_off', 'visibility']) assert.ok(lock.includes(icon));
});

test('Policy Hub uses master and generated provenance matches its configured source', async () => {
  const manifest = JSON.parse(await readFile('public/data/catalog.manifest.json', 'utf8'));
  const policy = JSON.parse(await readFile('public/data/generated/policy-hub.json', 'utf8'));
  assert.equal(
    manifest.policyHub.sourceUrl,
    'https://raw.githubusercontent.com/actionanand/policy-hub/master/docs/.vitepress/data/apps.ts',
  );
  assert.equal(policy.sourceUrl, manifest.policyHub.sourceUrl);
});
