# Real preview implementation report

**Current review correction validation: complete Playwright suite — 61 passed, zero failures (one final run after all runtime/test changes).** Older implementation results below are retained as history and superseded by the final correction results.

## File-by-file changes

- src/app/core/catalog.models.ts: optional imageAlt, demoUrl and demoPublic fields; existing image and iframe fields retained.
- tools/catalog-schema.mts: source schema definitions for new fields.
- tools/catalog.mts: shared preview validation before generation.
- tools/preview-validation.mts: HTTPS/demo approval and base-relative asset path validation.
- public/data/generated/schemas/project.schema.json: regenerated from source definitions.
- src/app/shared/project-card.ts: loading/error states, retry state reset on reopening, optional safe demo action. Existing CDK behavior retained.
- src/styles.scss: screenshots use contain rather than crop.
- src/app/features/detail.ts: optional safe demo destination.
- tools/capture-preview.mts: owner-controlled temporary session and private region capture, no credential logging/state exports.
- tools/preview.test.mts: URL/path/demo and capture configuration validation tests.
- e2e/real-preview.spec.ts: real image requests, synthetic captures, fallback, demo and responsive/theme tests.
- tsconfig.e2e.json: permits direct typed capture-tool imports in browser tests.
- .gitignore: private authentication/session artifacts excluded.
- documentation/real-app-previews.md: capture, Android, privacy, JSON and maintenance instructions.
- This report: implementation results and missing asset inventory.

## Missing real assets

No project screenshot or public demo URL was invented. Policy Hub now has a reviewed real public homepage asset. The remaining 76 projects lack configured preview images:

- card-nest
- office-orbit
- wiki
- metro-pocket
- spendzo
- ping-metric
- globee
- qurio
- arblogz
- vault-nest
- office-pulse
- lingua-log
- ar-tamil-jathagam
- birthday-buddy
- expenzo
- who-called
- converter
- recipe-atlas
- ar-portfolio
- svg-forge
- lexora
- wifi-chat
- folder-flow
- mozhi-type
- glyph-forge
- universal-calendar
- byteschool
- resume-builder
- ng-pdf-rough-work
- image-local-upload
- ar-popover
- single-spa-showcase
- local-tell
- stillora
- flowra
- link-deck
- life-leaf
- click2chat
- arflix
- personix
- scrollix
- artamizhsolai
- care-chime
- docker-learning-series
- microfrontend-fundamentals
- angular-playground
- angular-lib-demo
- ng-my-libraries
- ng-rough-work
- angular-22
- angular-change-detection
- angular-deferrable
- angular-infinite-scroll
- angular-model-signal
- angular-graphql-lab
- ng-template-depth
- directive-deep-dive
- pipe-deep-dive
- ng-service-deep-dive
- ng-lifecycle
- ng-dropdown-ngtemplateoutlets
- ng-feature-pagination
- ng14-standalone-demo
- ng16-signal-milestone-release
- ngrx-module-based
- ngrx-standalone
- ng-dev-testing
- angular-testing
- angular-testing-2
- angular-tetsing-1
- angular-study
- angular-study-services
- angular-study-pipes
- angular-study-http
- angular-study-routing
- pdf-features-poc

## Scope and limitations

No application credentials or native Android device were provided. The interactive protected-session utility is implemented, but external protected applications were not accessed. Automated capture tests use clearly synthetic home screens only. Owners must review pixels for sensitive content before publication; input detection cannot identify private text/images. Iframes remain disabled. A demoPublic flag is an owner's declaration, not an automatic security certification. Existing business data, motion preferences, authentication and workflows are unchanged.

Policy Hub screenshot source: https://actionanand.github.io/policy-hub/ (public HTTP 200, page title Policy Hub), captured and visually reviewed on 2026-11-02. No demo URL was added.

## Original implementation validation (superseded by correction validation below)

- public/previews/policy-hub/home-desktop.png: real public homepage, visually reviewed.
- public/data/apps/policy-hub.json: optional preview configuration only; business fields unchanged.
- public/data/generated/catalog.json: regenerated with that preview.
- README.md: maintenance-guide link.

Catalogue validation/build passed with 77 projects and unchanged repository/hosting/npm counts. Angular tests: 28 passed. Catalogue/configuration tests: 20 passed. Lint, tooling/browser typechecks and formatting passed. Existing CDK unit-test focus warning remains.

The full initial browser run passed all 55 existing regressions and the capture test, but four new error-state cases failed because Chromium reused the loaded image from memory. The test now uses a distinct missing-image URL. Final focused run: all six preview tests passed, including the newly added real Policy Hub asset check. No failing preview assertions remain.

Screenshots generated for testing: .cache/playwright-results/real-preview-real-preview-<width>-<theme>/synthetic-home.png and loaded-preview.png; protected-synthetic-home.png in the protected capture test directory; policy-hub-real-preview.png in the published asset test directory. The synthetic fixtures are test-only and never published. The public asset is the real Policy Hub image listed above. Mobile loaded-preview.png and the original public capture were visually inspected.

Final production build passed after registering the real asset. The packaged image exists at dist/ar-atrium/browser/previews/policy-hub/home-desktop.png. The /ar-atrium/ base path and identical SPA 404 fallback were verified, and the committed production hash placeholder was restored. No production credential was used.

Twelve targeted mobile axe audits across both themes reported zero violations. Existing incomplete hero contrast/modal-focus checks need manual review; this is not a full WCAG certification.

## Review corrections

- src/app/shared/project-card.ts: real-image previews use a responsive viewport-sized area; the Expand screenshot action opens an owned CDK dialog. Closing/destroying the original preview also closes the image dialog. Existing hover, focus, modal and Escape lifecycle remains intact.
- src/app/shared/screenshot-viewer.ts: new near-full-screen viewer, light/dark tokens, fit/original-size modes, keyboard-scrollable original image, close button, Escape/backdrop handling and CDK focus trapping/restoration. No browser Fullscreen API or extra permission is needed.
- src/styles.scss: only real screenshot containers grow to clamp(220px, 40dvh, 380px); missing-image placeholders retain their compact sizing. Images remain contained rather than cropped.
- tools/preview-validation.mts: local paths are syntax-validated, resolved under public/, checked for file existence and regular-file status, and realpath-checked against symlink escapes. Permitted HTTPS images remain supported. Errors identify the project and image and explain how to fix the source JSON/public asset.
- tools/catalog.mts: both catalogue validation and generation verify local assets using the public directory corresponding to the catalogue's data root.
- tools/preview.test.mts: valid, missing, unsupported and traversal image tests, including actionable project-specific errors.
- e2e/real-preview.spec.ts: expansion, original-size viewing, keyboard focus, Escape, close button, backdrop and focus restoration; failed-image reopening; all prior successful/missing image, demo and protected-capture cases retained. Mocked catalogues now read the public fixture directly rather than refetching the same development server during route interception.

The secure manual capture utility, authentication, motion policy/notice, business metadata and deployment workflows are unchanged. Source generation was run; no generated schema/catalogue was hand-edited. No screenshot, storage-state or credential file was staged (the index is empty).

An initial strict Angular compilation exposed the CDK DialogRef component generic, which was corrected. The first concurrent validation attempt encountered Angular worker startup timeouts and slow desktop fixture refetches. Angular subsequently passed all 28 tests using a local ignored runner configuration with maxWorkers: 1. No application test configuration or workflow was changed for that local resource limit.

Additional hover-opened viewer verification passed: Escape restored focus to Expand screenshot. The expanded viewer axe audit reported zero violations, with incomplete aria-hidden-focus, aria-prohibited-attr and color-contrast checks requiring manual review. Evidence: .cache/screenshot-viewer-desktop.png and .cache/screenshot-viewer-axe.json. Ignore rules were verified for private capture, .auth and storage-state paths; the staged-file list is empty.

## Final correction results

- Complete Playwright suite: **61 passed, zero failed**, 4.8 minutes, after all runtime and test changes. This is a full run, not a sum of focused runs. Raw report: .cache/playwright-results.json.
- Catalogue build and validation: passed, 77 projects, 98 repositories, 70 hosted URLs and 9 npm links; existing missing metadata is unchanged.
- Catalogue/configuration tests: **21 passed**, including filesystem existence, valid paths, missing assets and unsafe/unsupported paths.
- Angular tests: **28 passed** with the ignored local one-worker configuration; the existing CDK JSDOM focus warning remains.
- Lint, formatting, tooling TypeScript and browser TypeScript checks: passed.
- Expanded dialog screenshot evidence: .cache/playwright-results/real-preview-real-preview-390-dark/expanded-preview.png and corresponding light/desktop test directories. Original-size mobile and fit-to-viewport desktop results were visually inspected.
- Protected capture fixture passed as part of the complete suite. The manual protected capture workflow remains unchanged.
- Security review: staged index is empty; no credential, storage-state or private screenshot is staged. Existing ignore patterns cover private capture/session paths.

Outstanding limitations remain the 76 projects without reviewed real assets, owner review of captured pixels, no authorized external protected-app/native-device capture in this session, and incomplete axe checks requiring manual review. The image dialog is a near-full-screen CDK view, not the browser Fullscreen API; original-size mode intentionally scrolls rather than cropping the image.

Final correction production build passed. The built index contains /ar-atrium/ as its base href; 404.html matches index.html. Verification used only a synthetic hash and restored PASSWORD_HASH_PLACEHOLDER. Log: .cache/preview-corrections-production.log. No push, merge or deployment was performed.
