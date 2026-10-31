import { buildCatalog, defaultRoot, writeJson } from './catalog.mts';
import { resolve } from 'node:path';
const { projects } = await buildCatalog();
const urls = [
  ...new Set(
    projects.flatMap((project) =>
      project.destinations
        .filter((link) => ['web', 'npm'].includes(link.kind))
        .map((link) => link.url),
    ),
  ),
];
const pending = [...urls];
const results: { url: string; status: number | null; resolvedUrl?: string; error?: string }[] = [];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (pending.length) {
      const url = pending.shift()!;
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(8000),
          redirect: 'follow',
        });
        results.push({ url, status: response.status, resolvedUrl: response.url });
      } catch (error) {
        results.push({
          url,
          status: null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }),
);
results.sort((a, b) => a.url.localeCompare(b.url));
const npmPackages = await Promise.all(
  urls
    .filter((url) => new URL(url).hostname === 'www.npmjs.com')
    .map(async (url) => {
      const name = new URL(url).pathname.slice('/package/'.length);
      const metadataUrl = `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`;
      try {
        const response = await fetch(metadataUrl, { signal: AbortSignal.timeout(8000) });
        const data: unknown = response.ok ? await response.json() : null;
        const metadata = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
        return { name, metadataUrl, status: response.status, version: metadata['version'] };
      } catch (error) {
        return {
          name,
          metadataUrl,
          status: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
);
await writeJson(resolve(defaultRoot, 'generated/link-health.json'), {
  checkedOn: new Date().toISOString(),
  note: 'Point-in-time HTTP HEAD observations; failures may reflect bot protection, lack of HEAD support, or transient networking. URLs and projects are retained. npm registry metadata is checked separately.',
  results,
  npmPackages,
});
console.log(
  `Checked ${results.length} unique hosted/npm URLs: ${results.filter((r) => r.status !== null && r.status >= 200 && r.status < 400).length} successful HTTP responses. See generated/link-health.json for individual observations.`,
);
