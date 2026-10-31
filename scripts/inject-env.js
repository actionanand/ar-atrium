'use strict';
const fs = require('node:fs');
const path = require('node:path');

function injectProductionHash(source, hash) {
  if (typeof hash !== 'string' || !/^[a-f\d]{40}$/i.test(hash))
    throw new Error(
      'PASSWORD_HASH must be a 40-character SHA-1 digest. Configure the repository secret PASSWORD_HASH.',
    );
  const pattern = /(passwordHash\s*:\s*)['"]PASSWORD_HASH_PLACEHOLDER['"]/;
  if (!pattern.test(source))
    throw new Error(
      'Production passwordHash placeholder is missing; refusing to overwrite an existing value.',
    );
  return source.replace(pattern, (_match, prefix) => `${prefix}'${hash.toLowerCase()}'`);
}
module.exports = { injectProductionHash };
if (require.main === module) {
  try {
    const file = path.resolve(process.argv[2] ?? 'src/environments/environment.ts');
    const source = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, injectProductionHash(source, process.env.PASSWORD_HASH));
    console.log('Production configuration injected.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
