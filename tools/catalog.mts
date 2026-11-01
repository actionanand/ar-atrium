import { validatePreview } from './preview-validation.mts';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, relative, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv } from 'ajv';
import ts from 'typescript';
import { schemas } from './catalog-schema.mts';
import { parsePolicySource, validatePolicySnapshot, type PolicySnapshot } from './policy-hub.mts';
import type {
  Project,
  ProjectLink,
  Manifest,
  RepositoryRegistry,
  Taxonomy,
  Catalogue,
  CompiledProject,
} from '../src/app/core/catalog.models.ts';

export const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data');
const ajv = new Ajv({ allErrors: true, strict: true });
const validators = Object.fromEntries(
  Object.entries(schemas).map(([key, schema]) => [key, ajv.compile(schema)]),
);
export async function readJson(path: string): Promise<unknown> {
  try {
    const source = await readFile(path, 'utf8');
    const value: unknown = JSON.parse(source);
    const tree = ts.parseJsonText(path, source);
    function visit(node: ts.Node): void {
      if (ts.isObjectLiteralExpression(node)) {
        const keys = new Set<string>();
        for (const property of node.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const key = JSON.parse(property.name.getText(tree)) as string;
          if (keys.has(key)) throw new Error(`duplicate JSON property ${JSON.stringify(key)}`);
          keys.add(key);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
    return value;
  } catch (error) {
    throw new Error(
      `${path}: cannot read JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
export function validate<T>(kind: keyof typeof schemas, data: unknown, path: string): T {
  const check = validators[kind];
  if (!check(data))
    throw new Error(
      `${path}: ${check.errors?.map((error) => `${error.instancePath || '/'} ${error.message} ${JSON.stringify(error.params)}`).join('; ')}`,
    );
  return data as T;
}
export async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + '\n');
}
function sourcePath(root: string, path: string): string {
  const full = resolve(root, path);
  if (
    relative(root, full).startsWith('..') ||
    relative(root, full) === '' ||
    !path.endsWith('.json') ||
    path.includes('\\')
  )
    throw new Error(`Manifest: unsafe JSON path ${path}`);
  return full;
}
function unique(values: string[], context: string) {
  if (new Set(values).size !== values.length) throw new Error(`${context}: duplicate identifiers`);
}
export function validUrl(value: string, context: string): string {
  try {
    const url = new URL(value);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      !url.hostname.includes('.') ||
      url.username ||
      url.password ||
      value.trim() !== value ||
      /\s/.test(value)
    )
      throw new Error();
    return url.href.replace(/\/$/, '');
  } catch {
    throw new Error(`${context}: invalid HTTP(S) URL ${JSON.stringify(value)}`);
  }
}
function validateLink(link: ProjectLink, context: string) {
  validUrl(link.url, context);
  const url = new URL(link.url);
  if (link.kind !== 'play-store' && url.hostname === 'play.google.com')
    throw new Error(
      `${context}: default Android URLs belong in Policy Hub; use an explicit policyHub override`,
    );
  if (
    link.kind === 'npm' &&
    (url.hostname !== 'www.npmjs.com' || !url.pathname.startsWith('/package/'))
  )
    throw new Error(`${context}: invalid npm package URL`);
}

export function compileProject(
  base: Project,
  hosts: ProjectLink[],
  registry: RepositoryRegistry,
  taxonomy: Taxonomy,
  policy: PolicySnapshot,
  policyWebsite: string,
): CompiledProject {
  const fail = (message: string): never => {
    throw new Error(`apps/${base.id}.json: ${message}`);
  };
  const patch = base.overrides;
  const {
    addLinks = [],
    removeLinks = [],
    addRepositories = [],
    links: linkPatches = [],
    policyHub: androidPatch,
    ...scalars
  } = patch;
  const project = { ...base, ...scalars };
  if (!(project.projectType in taxonomy.typeLabels))
    fail(`unknown projectType ${project.projectType}`);
  if (!taxonomy.categories.some((c) => c.id === project.category))
    fail(`unknown category ${project.category}`);
  for (const tech of project.technologies ?? [])
    if (!taxonomy.technologies.some((t) => t.id === tech)) fail(`unknown technology ${tech}`);
  const refs = [...base.repositories, ...addRepositories];
  unique(
    refs.map((r) => r.ref),
    `${base.id}: repositories`,
  );
  const repositories = refs.map((ref) => {
    const repo = registry.repositories[ref.ref];
    if (!repo) return fail(`unknown repository reference ${ref.ref}`);
    if (repo.expectedProjectType && project.projectType !== repo.expectedProjectType)
      fail(
        `${ref.ref} is classified as ${repo.expectedProjectType} in repository registry; review its classification before changing it`,
      );
    return { ...ref, url: repo.url, access: repo.access };
  });
  const collection = project.collection ? structuredClone(project.collection) : undefined;
  if (collection) {
    if (!['study', 'playground'].includes(project.projectType))
      fail('collections must be study or playground projects');
    const checkRef = (ref: string) => {
      if (!refs.some((r) => r.ref === ref))
        fail(`collection reference ${ref} is not in project repositories`);
    };
    if (collection.mode === 'series') {
      collection.parts.forEach((p, i) => {
        if (p.number !== i + 1) fail('series chapters must be ordered 1..N');
        checkRef(p.repositoryRef);
      });
      unique(
        collection.parts.map((p) => p.repositoryRef),
        `${base.id}: series chapters`,
      );
    } else {
      unique(
        collection.variants.map((v) => v.id),
        `${base.id}: variants`,
      );
      for (const variant of collection.variants) {
        unique(variant.repositoryRefs, `${base.id}: variant repositories`);
        if (!variant.repositoryRefs.includes(variant.rootRepositoryRef))
          fail('variant root must appear in its repositoryRefs');
        variant.repositoryRefs.forEach(checkRef);
      }
    }
  }
  for (const l of base.links)
    if (l.kind === 'web') fail('website destinations must be maintained in hosting-apps.json');
  if (hosts.some((l) => l.kind !== 'web')) fail('hosting registry accepts only web links');
  const links: ProjectLink[] = [
    ...base.links,
    ...hosts,
    ...repositories.map((r) => ({
      id: `repo:${r.ref}`,
      kind: 'github' as const,
      label: `${r.role}: ${r.ref}`,
      url: r.url,
    })),
  ];
  links.forEach((l) => validateLink(l, base.id));
  let android;
  if (base.policyHub) {
    const imported = policy.apps.find((a) => a.id === base.policyHub?.appId);
    if (!imported) fail(`unresolved Policy Hub ID ${base.policyHub.appId}`);
    android = {
      platform: imported!.platform,
      releasedToPlayStore: imported!.releasedToPlayStore,
      playStoreUrl: imported!.playStoreUrl,
      iconUrl: imported!.icon
        ? new URL(imported!.icon!.replace(/^\//, ''), policyWebsite).href
        : undefined,
      ...androidPatch,
    };
  } else if (androidPatch) android = { ...androidPatch };
  if (android?.playStoreUrl) {
    const url = new URL(validUrl(android.playStoreUrl, `${base.id}: policyHub override`));
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'play.google.com' ||
      url.pathname !== '/store/apps/details' ||
      !url.searchParams.get('id')
    )
      fail('invalid Play Store override');
  }
  if (android?.iconUrl) validUrl(android.iconUrl, `${base.id}: icon`);
  if (
    android?.playStoreUrl &&
    android.releasedToPlayStore &&
    android.platform === 'android' &&
    !android.hideAndroidLinks
  )
    links.push({
      id: 'policy:play-store',
      kind: 'play-store',
      label: 'Google Play',
      url: android.playStoreUrl,
    });
  links.push(...addLinks);
  unique(
    links.map((l) => l.id),
    `${base.id}: links`,
  );
  unique(
    linkPatches.map((l) => l.id),
    `${base.id}: link overrides`,
  );
  for (const change of linkPatches) {
    const index = links.findIndex((l) => l.id === change.id);
    if (index < 0) fail(`override references missing link ID ${change.id}`);
    links[index] = { ...links[index], ...change };
  }
  for (const id of removeLinks)
    if (!links.some((l) => l.id === id)) fail(`removeLinks references missing link ID ${id}`);
  const destinations: ProjectLink[] = [];
  const urls = new Set<string>();
  for (const link of links) {
    validateLink(link, `${base.id}: ${link.id}`);
    const url = validUrl(link.url, base.id);
    if (link.hidden || removeLinks.includes(link.id) || urls.has(url)) continue;
    urls.add(url);
    destinations.push(link);
  }
  if (project.iconUrl) validUrl(project.iconUrl, `${base.id}: iconUrl`);
  validatePreview(project.preview);
  for (const url of [project.preview?.iframeUrl]) if (url) validUrl(url, `${base.id}: preview`);
  if (project.preview?.iframeUrl && !project.preview.allowIframe)
    fail('iframeUrl requires explicit allowIframe: true');
  if (collection?.mode === 'variants') collection.variants.sort((a, b) => a.order - b.order);
  const { overrides: _overrides, ...fields } = project;
  const iconUrl =
    scalars.iconUrl ??
    (androidPatch && Object.hasOwn(androidPatch, 'iconUrl')
      ? (androidPatch.iconUrl ?? undefined)
      : (android?.iconUrl ?? project.iconUrl));
  return {
    ...fields,
    iconUrl,
    name: scalars.name ?? androidPatch?.name ?? project.name,
    description: scalars.description ?? androidPatch?.description ?? project.description,
    repositories,
    destinations,
    android,
    collection,
  };
}

export async function buildCatalog(root = defaultRoot) {
  const manifest = validate<Manifest>(
    'manifest',
    await readJson(resolve(root, 'catalog.manifest.json')),
    'catalog.manifest.json',
  );
  validUrl(manifest.policyHub.sourceUrl, 'Policy Hub source');
  validUrl(manifest.policyHub.websiteUrl, 'Policy Hub website');
  const registry = validate<RepositoryRegistry>(
    'repositories',
    await readJson(sourcePath(root, manifest.repositories)),
    manifest.repositories,
  );
  const hosting = validate<{ projects: Record<string, ProjectLink[]> }>(
    'hosting',
    await readJson(sourcePath(root, manifest.hosting)),
    manifest.hosting,
  );
  const taxonomy = validate<Taxonomy>(
    'taxonomy',
    await readJson(sourcePath(root, manifest.taxonomy)),
    manifest.taxonomy,
  );
  unique(
    taxonomy.categories.map((c) => c.id),
    'categories',
  );
  unique(
    taxonomy.technologies.map((t) => t.id),
    'technologies',
  );
  unique(
    taxonomy.navigationGroups.map((g) => g.id),
    'navigationGroups',
  );
  const groupedTypes = taxonomy.navigationGroups.flatMap((g) => g.types);
  unique(groupedTypes, 'navigation group types');
  for (const type of Object.keys(taxonomy.typeLabels))
    if (!groupedTypes.includes(type))
      throw new Error(`Project type ${type} has no navigation group`);
  for (const group of taxonomy.navigationGroups) {
    if (
      !group.route.startsWith('/') ||
      group.route.startsWith('//') ||
      group.types.some((t) => !(t in taxonomy.typeLabels))
    )
      throw new Error(`Invalid navigation group ${group.id}`);
  }
  const repoUrls: string[] = [];
  for (const [slug, repo] of Object.entries(registry.repositories)) {
    if (repo.id !== slug || !/^[\w.-]+\/[\w.-]+$/.test(slug))
      throw new Error(`Repository ID mismatch: ${slug}`);
    const url = new URL(validUrl(repo.url, slug));
    if (url.hostname !== 'github.com' || url.pathname.toLowerCase() !== `/${slug.toLowerCase()}`)
      throw new Error(`Repository URL mismatch: ${slug}`);
    repoUrls.push(url.href.toLowerCase());
    for (const key of ['homepage', 'readmeUrl'])
      if (typeof repo[key] === 'string') validUrl(repo[key], slug);
  }
  unique(repoUrls, 'repository registry URLs');
  const policy = validatePolicySnapshot(
    await readJson(sourcePath(root, manifest.policyHub.snapshot)),
  );
  if (policy.sourceUrl !== manifest.policyHub.sourceUrl)
    throw new Error('Policy Hub snapshot does not match configured source URL');
  const files = await readdir(resolve(root, 'apps'));
  const actual = files.filter((f) => f.endsWith('.json')).map((f) => `apps/${f}`);
  for (const path of actual)
    if (!manifest.projects.includes(path))
      throw new Error(`${path}: project is not registered in manifest`);
  const projects: CompiledProject[] = [];
  for (const path of manifest.projects) {
    if (!/^apps\/[a-z0-9-]+\.json$/.test(path)) throw new Error(`Unexpected project path ${path}`);
    const project = validate<Project>('project', await readJson(sourcePath(root, path)), path);
    if (basename(path, '.json') !== project.id)
      throw new Error(`${path}: filename must match project ID ${project.id}`);
    projects.push(
      compileProject(
        project,
        hosting.projects[project.id] ?? [],
        registry,
        taxonomy,
        policy,
        manifest.policyHub.websiteUrl,
      ),
    );
  }
  unique(
    projects.map((p) => p.id),
    'projects',
  );
  for (const project of projects)
    for (const id of project.relatedProjects ?? [])
      if (!projects.some((p) => p.id === id))
        throw new Error(`${project.id}: unknown related project ${id}`);
  for (const id of Object.keys(hosting.projects))
    if (!projects.some((p) => p.id === id))
      throw new Error(`hosting-apps.json: unknown project ${id}`);
  projects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const catalogue: Catalogue = {
    schemaVersion: 1,
    title: manifest.title,
    tagline: manifest.tagline,
    description: manifest.description,
    taxonomy,
    projects: projects.filter((p) => p.visible),
    policyHub: {
      checkedOn: policy.checkedOn,
      sourceUrl: policy.sourceUrl,
      sourceSha256: policy.sourceSha256,
    },
  };
  const refs = new Set(projects.flatMap((p) => p.repositories.map((r) => r.ref)));
  const report = {
    projects: projects.length,
    visible: catalogue.projects.length,
    repositories: refs.size,
    byProjectType: Object.fromEntries(
      Object.keys(taxonomy.typeLabels).map((t) => [
        t,
        projects.filter((p) => p.projectType === t).length,
      ]),
    ),
    hostedUrls: projects.reduce(
      (n, p) => n + p.destinations.filter((l) => l.kind === 'web').length,
      0,
    ),
    npmLinks: projects.reduce(
      (n, p) => n + p.destinations.filter((l) => l.kind === 'npm').length,
      0,
    ),
    withoutHostedUrl: projects
      .filter((p) => !p.destinations.some((l) => l.kind === 'web'))
      .map((p) => p.id),
    unresolvedRepositories: [...refs].filter(
      (r) => registry.repositories[r].access !== 'public-metadata-verified',
    ),
    metadataReview: projects
      .filter((p) => p.needsReview || p.classificationReview)
      .map((p) => p.id),
    collections: projects.filter((p) => p.collection).map((p) => ({ id: p.id, ...p.collection })),
    policyHub: {
      projects: projects.filter((p) => p.policyHub).length,
      playStoreLinks: projects.filter((p) => p.destinations.some((l) => l.kind === 'play-store'))
        .length,
      ...catalogue.policyHub,
    },
  };
  return { catalogue, report, projects };
}

async function main() {
  const command = process.argv[2] ?? 'build';
  const manifest = validate<Manifest>(
    'manifest',
    await readJson(resolve(defaultRoot, 'catalog.manifest.json')),
    'catalog.manifest.json',
  );
  if (command === 'sync') {
    try {
      const source = process.argv[3]
        ? await readFile(resolve(process.argv[3]), 'utf8')
        : await fetch(manifest.policyHub.sourceUrl, { signal: AbortSignal.timeout(20000) }).then(
            (r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.text();
            },
          );
      const snapshot = parsePolicySource(source, manifest.policyHub.sourceUrl);
      await writeJson(sourcePath(defaultRoot, manifest.policyHub.snapshot), snapshot);
      console.log(`Policy Hub: synchronized ${snapshot.apps.length} apps (${snapshot.checkedOn}).`);
    } catch (error) {
      if (process.env['CI'] || process.env['POLICY_HUB_STRICT'] === '1' || process.argv[3])
        throw error;
      const cached = validatePolicySnapshot(
        await readJson(sourcePath(defaultRoot, manifest.policyHub.snapshot)),
      );
      console.warn(
        `WARNING: Policy Hub refresh failed; using validated generated cache from ${cached.checkedOn}. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else if (!['build', 'validate'].includes(command))
    throw new Error(`Unknown command ${command}`);
  const result = await buildCatalog();
  if (command !== 'validate') {
    await writeJson(resolve(defaultRoot, 'generated/catalog.json'), result.catalogue);
    await writeJson(resolve(defaultRoot, 'generated/report.json'), result.report);
    for (const [name, schema] of Object.entries(schemas))
      await writeJson(resolve(defaultRoot, `generated/schemas/${name}.schema.json`), {
        $schema: 'http://json-schema.org/draft-07/schema#',
        ...schema,
      });
  }
  console.log(
    `Catalogue: ${result.report.projects} projects, ${result.report.repositories} repositories, ${result.report.hostedUrls} hosted URLs, ${result.report.npmLinks} npm links. ${result.report.withoutHostedUrl.length} projects have no hosted URL; ${result.report.unresolvedRepositories.length} repository references need review. See public/data/generated/report.json.`,
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    console.error(`Catalogue error: ${error.message}`);
    process.exitCode = 1;
  });
