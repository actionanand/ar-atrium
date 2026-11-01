import { realpathSync, statSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
export function validatePreview(preview?: {
  imageUrl?: string;
  demoUrl?: string;
  demoPublic?: boolean;
}): void {
  function https(value: string) {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
      throw new Error('Preview URLs must be HTTPS without credentials, query strings or fragments');
  }
  if (preview?.imageUrl) {
    const value = preview.imageUrl;
    if (value.startsWith('https://')) https(value);
    else if (!/^previews\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.(?:png|jpg|jpeg|webp)$/.test(value))
      throw new Error('Preview asset must be a safe base-relative previews/ image path');
  }
  if (preview?.demoUrl) {
    https(preview.demoUrl);
    if (preview.demoPublic !== true)
      throw new Error('Live demo requires demoPublic: true after owner verification');
  }
}

export function verifyLocalPreview(
  preview: Parameters<typeof validatePreview>[0],
  publicRoot: string,
  projectId: string,
): void {
  try {
    validatePreview(preview);
    const image = preview?.imageUrl;
    if (!image || image.startsWith('https://')) return;
    const root = realpathSync(publicRoot);
    const file = realpathSync(resolve(root, image));
    const path = relative(root, file);
    if (path.startsWith('..') || isAbsolute(path) || !statSync(file).isFile())
      throw new Error('image must be a regular file within public/');
  } catch (error) {
    throw new Error(
      projectId +
        ': preview.imageUrl ' +
        JSON.stringify(preview?.imageUrl) +
        ' — missing or invalid public asset. Add the image under public/ or fix the source project JSON. ' +
        (error instanceof Error ? error.message : 'Validation failed'),
    );
  }
}
