# Real application previews

The CDK popup supports a real desktop or mobile home-screen image without cropping. Images are requested only after the overlay opens and use lazy loading. Loading, missing and failed-image states are separate; reopening retries a failed image. Existing focus trapping, hover delay, pointer transfer, Escape, backdrop and focus restoration remain intact. Iframes remain unrendered even for legacy `allowIframe` entries.

## JSON configuration

Edit only the project's source JSON, then run `npm run catalog:build`:

```json
"preview": {
  "imageUrl": "previews/my-project/home-mobile.webp",
  "imageAlt": "My Project home screen with sample tasks",
  "demoUrl": "https://example.com/demo",
  "demoPublic": true
}
```

This is an example, not a verified project destination. Omit demo fields unless the owner confirms that the URL provides an intentionally public guest/demo experience. Normal website links remain available. The demo opens in a new tab with `noopener noreferrer`, on both popup and detail page. No credentials are appended and no visitor login is automated.

Put reviewed images under `public/previews/`. Use base-relative paths beginning `previews/`, never `/previews/`; Angular's document base resolves these under `/ar-atrium/` even on deep routes. Allowed local extensions are PNG, JPEG and WebP. Path traversal, encoded paths, unsafe protocols and credentials are rejected. Remote images/demos require HTTPS without query strings or fragments, preventing accidental signed/token-bearing links. Prefer local reviewed assets to remote images that can change or disappear.

## Owner-controlled protected capture

Use a synthetic test account containing no real customer, financial or personal data. The utility opens a temporary browser session. Sign in manually in the browser, not in the shell or repository. No passwords need to be placed in environment variables; this protected interactive session is the supported credential workflow. No storage state, cookies, trace, HAR, persistent browser profile or video is exported.

Set non-secret configuration privately in your shell:

```powershell
$env:CAPTURE_URL = 'https://your-authorized-app.example/'
$env:CAPTURE_ID = 'my-project-home'
$env:CAPTURE_SELECTOR = '[data-public-preview]'
$env:CAPTURE_SYNTHETIC_DATA = 'confirmed'
$env:CAPTURE_MOBILE = '1'
node tools/capture-preview.mts
```

Use installed Chrome on Windows; install Playwright Chromium and its platform dependencies on Linux. In the opened browser, log in with the authorized test account and navigate to the intended home screen. Resume in Playwright Inspector only when ready. Choose a unique, non-editable region; input/textarea/contenteditable regions are rejected. Output is restricted by the CLI to ignored `.cache/preview-captures/<id>.png`. Failures log a generic message without URLs, credentials or browser exception details.

Review the private image manually before copying it to `public/previews/`. Check for names, account IDs, notifications, tokens, URLs, debug overlays and hidden sensitive content rendered as text or images. The utility cannot infer whether pixels contain private information. Never publish a capture from a real account. Remove temporary captures when finished and clear private shell configuration. Do not commit session files. `.gitignore` excludes common authentication/state artifacts, environment files and HAR files; this is a backstop, not a substitute for reviewing staged changes.

For Android-only projects, obtain an actual screenshot from an owner-authorized emulator/device running synthetic test data. Save it privately, inspect it, then publish the reviewed image with the same JSON configuration. No Android app is simulated in an iframe. No Android device/emulator was available in this implementation session.

## Maintenance and verification

Capture again when a home screen changes, preserving the asset name or updating its JSON path. Test desktop/mobile and both themes. Run catalogue validation/build, catalogue tests, Angular tests, lint, tooling/browser typechecks, formatting and Playwright. Source definitions in `tools/catalog-schema.mts` emit the editor schema; never edit the generated schema by hand.

`e2e/real-preview.spec.ts` creates clearly synthetic screenshot fixtures locally, checks lazy isolation, successful load, containment, failure/reopen, missing screenshots/no-demo, secure demo attributes and Escape lifecycle at mobile/desktop sizes in both themes. Its protected-session test exercises the shared capture function: login-form capture is rejected and a synthetic authenticated home is captured. Test fixtures are never copied into the public catalogue.

## Asset availability

Policy Hub now has a real, reviewed public homepage screenshot captured without authentication. The remaining 76 projects lack configured real preview assets. No external accounts were accessed, no private credentials were provided, and no safe public demo was independently established, so no project screenshots or demo URLs were invented. The feature is ready for owner-reviewed assets; production popups retain honest fallbacks until those assets are supplied. The file-by-file implementation report records validation and test artifacts separately.

Policy Hub screenshot source: https://actionanand.github.io/policy-hub/ (public HTTP 200, page title Policy Hub), captured and visually reviewed on 2026-11-02. No demo URL was added.
