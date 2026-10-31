import { copyFile } from 'node:fs/promises';
await copyFile('dist/ar-atrium/browser/index.html', 'dist/ar-atrium/browser/404.html');
console.log('GitHub Pages SPA fallback generated.');
