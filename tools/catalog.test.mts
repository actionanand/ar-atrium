import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, rm, rmdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  buildCatalog,
  compileProject,
  defaultRoot,
  readJson,
  validate,
  validUrl,
} from './catalog.mts';
import { parsePolicySource, validatePolicySnapshot, type PolicySnapshot } from './policy-hub.mts';
import type {
  Project,
  ProjectLink,
  RepositoryRegistry,
  Taxonomy,
} from '../src/app/core/catalog.models.ts';

const result = await buildCatalog();
const registry = (await readJson(resolve(defaultRoot, 'repositories.json'))) as RepositoryRegistry;
const taxonomy = result.catalogue.taxonomy;
const hosts = (
  (await readJson(resolve(defaultRoot, 'hosting-apps.json'))) as {
    projects: Record<string, ProjectLink[]>;
  }
).projects;
const policy = validatePolicySnapshot(
  await readJson(resolve(defaultRoot, 'generated/policy-hub.json')),
);
const base = (await readJson(resolve(defaultRoot, 'apps/card-nest.json'))) as Project;
const compile = (
  app: Project = structuredClone(base),
  host = hosts[base.id],
  reg = registry,
  tax: Taxonomy = taxonomy,
  p: PolicySnapshot = policy,
) => compileProject(app, host, reg, tax, p, 'https://actionanand.github.io/policy-hub/');

test('duplicate JSON object keys cannot silently replace repository records', async () => {
  await mkdir('.cache', { recursive: true });
  const directory = await mkdtemp(resolve('.cache', 'json-test-'));
  const file = resolve(directory, 'duplicate.json');
  try {
    await writeFile(file, '{"repositories":{"same/id":{},"same/id":{}}}');
    await assert.rejects(readJson(file), /duplicate JSON property "same\/id"/);
  } finally {
    await rm(file, { force: true });
    await rmdir(directory);
  }
});

test('all 46 seed identities, relationships and links survive migration', async () => {
  const seed = (await readJson(resolve('catalog/research/seed-inventory.json'))) as {
    projects: { id: string; repositories: string[]; links: { url: string }[] }[];
  };
  for (const old of seed.projects) {
    const current = result.projects.find((p) => p.id === old.id);
    assert.ok(current, old.id);
    for (const ref of old.repositories)
      assert.ok(
        current.repositories.some((r) => r.ref === ref),
        `${old.id}: ${ref}`,
      );
    for (const link of old.links)
      assert.ok(
        current.destinations.some((l) => validUrl(l.url, '') === validUrl(link.url, '')),
        `${old.id}: ${link.url}`,
      );
  }
});
test('unique IDs, expected five project types, data-driven taxonomy', () => {
  assert.equal(new Set(result.projects.map((p) => p.id)).size, result.projects.length);
  assert.deepEqual(Object.keys(result.report.byProjectType).sort(), [
    'application',
    'library',
    'playground',
    'study',
    'tool',
  ]);
  for (const id of [
    'ng-lifecycle',
    'ngrx-standalone',
    'ng16-signal-milestone-release',
    'ng-pdf-rough-work',
    'pdf-features-poc',
  ])
    assert.equal(result.projects.find((p) => p.id === id)?.projectType, 'playground');
  for (const id of ['angular-lib-demo', 'ng-my-libraries'])
    assert.equal(result.projects.find((p) => p.id === id)?.projectType, 'library');
});
test('schemas reject wrong versions, unknown keys and incompatible values', () => {
  for (const app of [
    { ...base, schemaVersion: 4 },
    { ...base, typo: true },
    { ...base, visible: 'yes' },
    { ...base, overrides: { projectType: 123 } },
  ])
    assert.throws(() => validate('project', app, 'apps/card-nest.json'), /card-nest/);
});
test('reject broken, duplicate and incorrectly classified repositories', () => {
  assert.throws(
    () => compile({ ...base, repositories: [...base.repositories, ...base.repositories] }),
    /duplicate/,
  );
  assert.throws(
    () => compile({ ...base, repositories: [{ ref: 'missing/repo', role: 'primary' }] }),
    /unknown repository/,
  );
  const badRegistry = structuredClone(registry);
  badRegistry.repositories[base.repositories[0].ref].expectedProjectType = 'playground';
  assert.throws(() => compile(base, hosts[base.id], badRegistry), /classified as playground/);
  assert.throws(
    () => compile({ ...base, overrides: { projectType: 'finished' } }),
    /unknown projectType/,
  );
});
test('multiple hosted URLs and explicit overrides merge by stable ID, deduplicate URLs', () => {
  const project = compile(
    {
      ...base,
      overrides: {
        name: 'New name',
        order: 999,
        featured: false,
        links: [
          { id: 'test-beta', hidden: true },
          { id: hosts[base.id][0].id, label: 'Updated website' },
        ],
      },
    },
    [
      ...hosts[base.id],
      { id: 'test-beta', kind: 'web', label: 'Beta', url: 'https://example.org/beta' },
      { id: 'same-url', kind: 'web', label: 'Same website', url: hosts[base.id][0].url },
    ],
  );
  assert.equal(project.name, 'New name');
  assert.equal(project.order, 999);
  assert.equal(project.featured, false);
  assert.equal(project.destinations.filter((l) => l.kind === 'web').length, 1);
  assert.equal(project.destinations.find((l) => l.kind === 'web')?.label, 'Updated website');
  assert.throws(
    () => compile({ ...base, overrides: { links: [{ id: 'missing', hidden: true }] } }),
    /missing link/,
  );
  assert.throws(() => compile(base, [hosts[base.id][0], hosts[base.id][0]]), /duplicate/);
});
test('Policy Hub merge imports Android defaults then applies explicit local overrides', () => {
  const imported = compile();
  assert.equal(
    imported.android?.playStoreUrl,
    policy.apps.find((a) => a.id === base.policyHub?.appId)?.playStoreUrl,
  );
  const overridden = compile({
    ...base,
    overrides: {
      name: 'Local name',
      policyHub: { name: 'Imported override', hideAndroidLinks: true },
    },
  });
  assert.equal(overridden.name, 'Local name');
  assert.equal(
    overridden.destinations.some((l) => l.kind === 'play-store'),
    false,
  );
  const replacement = 'https://play.google.com/store/apps/details?id=example.override';
  assert.equal(
    compile({ ...base, overrides: { policyHub: { playStoreUrl: replacement } } }).destinations.find(
      (l) => l.kind === 'play-store',
    )?.url,
    replacement,
  );
  assert.throws(
    () => compile({ ...base, policyHub: { appId: 'unknown' } }),
    /unresolved Policy Hub/,
  );
});
test('invalid URLs, credentials, unwanted schemes and local default Android URLs fail', () => {
  for (const url of [
    'javascript:alert(1)',
    'ftp://example.org',
    'https://user:secret@example.org',
    'not a url',
    ' https://example.org',
  ])
    assert.throws(() => validUrl(url, 'test'), /invalid/);
  assert.throws(
    () =>
      compile({
        ...base,
        links: [
          {
            id: 'local-android',
            kind: 'other',
            label: 'Bad default',
            url: 'https://play.google.com/store/apps/details?id=x',
          },
        ],
      }),
    /Policy Hub/,
  );
});
test('Docker chapters stay ordered; single-spa variants share related components', () => {
  const docker = result.projects.find((p) => p.id === 'docker-learning-series')!;
  assert.equal(docker.repositories.length, 7);
  assert.equal(docker.collection?.mode, 'series');
  if (docker.collection?.mode === 'series')
    assert.deepEqual(
      docker.collection.parts.map((p) => p.number),
      [1, 2, 3, 4, 5, 6, 7],
    );
  const spa = result.projects.find((p) => p.id === 'single-spa-showcase')!;
  assert.equal(spa.repositories.length, 14);
  assert.equal(spa.collection?.mode, 'variants');
  if (spa.collection?.mode === 'variants') {
    const variants = spa.collection.variants;
    assert.equal(variants.length, 2);
    assert.ok(
      variants[0].repositoryRefs.filter((ref) => variants[1].repositoryRefs.includes(ref)).length >=
        9,
    );
  }
});
test('library package references preserved without inventing a PDF npm package', () => {
  assert.equal(
    result.projects
      .find((p) => p.id === 'ng-my-libraries')
      ?.destinations.filter((l) => l.kind === 'npm').length,
    5,
  );
  assert.equal(
    result.projects
      .find((p) => p.id === 'angular-lib-demo')
      ?.destinations.filter((l) => l.kind === 'npm').length,
    4,
  );
  assert.equal(
    result.projects
      .find((p) => p.id === 'ng-pdf-rough-work')
      ?.destinations.filter((l) => l.kind === 'npm').length,
    0,
  );
});
test('safe TypeScript parser never executes downloaded code and fails on changed syntax', () => {
  const source = `throw new Error('must never execute'); export const apps = [{id:'test',name:'Test',shortDescription:'Description',platform:'web',releasedToPlayStore:false,documents:evil()}];`;
  assert.equal(parsePolicySource(source, policy.sourceUrl).apps[0].id, 'test');
  assert.throws(
    () => parsePolicySource(`export const apps = [{ id: evil() }];`, policy.sourceUrl),
    /literal/,
  );
  assert.throws(
    () => parsePolicySource('export const apps = loadApps();', policy.sourceUrl),
    /expected literal/,
  );
  assert.throws(() => validatePolicySnapshot({ ...policy, schemaVersion: 3 }), /incompatible/);
});
