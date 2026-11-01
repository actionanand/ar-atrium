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
