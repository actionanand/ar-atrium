import ts from 'typescript';
import { createHash } from 'node:crypto';

export interface PolicyApp {
  id: string;
  name: string;
  shortDescription: string;
  platform: 'web' | 'android';
  releasedToPlayStore: boolean;
  playStoreUrl?: string;
  icon?: string;
}
export interface PolicySnapshot {
  schemaVersion: 1;
  sourceUrl: string;
  sourceSha256: string;
  checkedOn: string;
  apps: PolicyApp[];
}

// Parse data only. Never execute remotely fetched TypeScript or its imports/helpers.
export function parsePolicySource(source: string, sourceUrl: string): PolicySnapshot {
  const file = ts.createSourceFile('apps.ts', source, ts.ScriptTarget.Latest, true);
  let appsNode: ts.ArrayLiteralExpression | undefined;
  function visit(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(file) === 'apps' &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    )
      appsNode = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!appsNode)
    throw new Error('Policy Hub: expected literal apps array; upstream schema may have changed');
  const fields = new Set([
    'id',
    'name',
    'shortDescription',
    'platform',
    'releasedToPlayStore',
    'playStoreUrl',
    'icon',
  ]);
  const apps = appsNode.elements.map((node) => {
    if (!ts.isObjectLiteralExpression(node))
      throw new Error('Policy Hub: unsupported app expression');
    const value: Record<string, unknown> = {};
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) throw new Error('Policy Hub: unsupported app property');
      const key = prop.name.getText(file).replace(/^['"]|['"]$/g, '');
      if (!fields.has(key)) continue;
      const v = prop.initializer;
      if (ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v)) value[key] = v.text;
      else if (v.kind === ts.SyntaxKind.TrueKeyword || v.kind === ts.SyntaxKind.FalseKeyword)
        value[key] = v.kind === ts.SyntaxKind.TrueKeyword;
      else throw new Error(`Policy Hub: ${key} must be a literal`);
    }
    return value;
  });
  return validatePolicySnapshot({
    schemaVersion: 1,
    sourceUrl,
    sourceSha256: createHash('sha256').update(source).digest('hex'),
    checkedOn: new Date().toISOString().slice(0, 10),
    apps,
  });
}

export function validatePolicySnapshot(value: unknown): PolicySnapshot {
  const fail = (message: string): never => {
    throw new Error(`Policy Hub: ${message}`);
  };
  if (!value || typeof value !== 'object') return fail('snapshot must be an object');
  const s = value as Record<string, unknown>;
  if (
    s['schemaVersion'] !== 1 ||
    !Array.isArray(s['apps']) ||
    !s['apps'].length ||
    typeof s['sourceUrl'] !== 'string' ||
    typeof s['sourceSha256'] !== 'string' ||
    !/^[a-f0-9]{64}$/.test(s['sourceSha256']) ||
    typeof s['checkedOn'] !== 'string'
  )
    return fail('incompatible snapshot schema or missing provenance');
  const ids = new Set<string>();
  for (const item of s['apps'] as unknown[]) {
    if (!item || typeof item !== 'object') return fail('invalid app');
    const a = item as Record<string, unknown>;
    for (const k of ['id', 'name', 'shortDescription'])
      if (typeof a[k] !== 'string' || !a[k]) return fail(`missing ${k}`);
    if (ids.has(a['id'] as string)) return fail(`duplicate app ID ${a['id']}`);
    ids.add(a['id'] as string);
    if (
      !['web', 'android'].includes(String(a['platform'])) ||
      typeof a['releasedToPlayStore'] !== 'boolean'
    )
      return fail(`invalid platform/release state for ${a['id']}`);
    if (a['playStoreUrl'] !== undefined) {
      const url = new URL(String(a['playStoreUrl']));
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'play.google.com' ||
        url.pathname !== '/store/apps/details' ||
        !url.searchParams.get('id') ||
        !a['releasedToPlayStore'] ||
        a['platform'] !== 'android'
      )
        return fail(`invalid Play Store URL or release state for ${a['id']}`);
    }
    if (a['releasedToPlayStore'] && !a['playStoreUrl'])
      return fail(`released app ${a['id']} has no Play Store URL`);
    if (
      a['icon'] !== undefined &&
      (typeof a['icon'] !== 'string' || !a['icon'].startsWith('/apps/'))
    )
      return fail(`invalid icon for ${a['id']}`);
  }
  return value as PolicySnapshot;
}
