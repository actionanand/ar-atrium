import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const development =
  args.includes('--configuration=development') ||
  args.some((value, index) => value === '--configuration' && args[index + 1] === 'development');
if (!development) {
  if (existsSync('public/__audit.html')) {
    console.error(
      'Remove the local audit harness with node tools/a11y-preview.mjs clean before production builds.',
    );
    process.exit(1);
  }
  const source = await readFile('src/environments/environment.ts', 'utf8');
  if (!/passwordHash\s*:\s*['"][a-f\d]{40}['"]/i.test(source)) {
    console.error(
      'Production build requires a valid PASSWORD_HASH. Run scripts/inject-env.js with PASSWORD_HASH set, or use --configuration development.',
    );
    process.exit(1);
  }
}
const result = spawnSync(
  process.execPath,
  ['node_modules/@angular/cli/bin/ng.js', 'build', ...args],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
