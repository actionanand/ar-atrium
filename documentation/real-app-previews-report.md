# Real preview implementation report

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

## Additional files and validation

- public/previews/policy-hub/home-desktop.png: real public homepage, visually reviewed.
- public/data/apps/policy-hub.json: optional preview configuration only; business fields unchanged.
- public/data/generated/catalog.json: regenerated with that preview.
- README.md: maintenance-guide link.

Catalogue validation/build passed with 77 projects and unchanged repository/hosting/npm counts. Angular tests: 28 passed. Catalogue/configuration tests: 20 passed. Lint, tooling/browser typechecks and formatting passed. Existing CDK unit-test focus warning remains.

The full initial browser run passed all 55 existing regressions and the capture test, but four new error-state cases failed because Chromium reused the loaded image from memory. The test now uses a distinct missing-image URL. Final focused run: all six preview tests passed, including the newly added real Policy Hub asset check. No failing preview assertions remain.

Screenshots generated for testing: .cache/playwright-results/real-preview-real-preview-<width>-<theme>/synthetic-home.png and loaded-preview.png; protected-synthetic-home.png in the protected capture test directory; policy-hub-real-preview.png in the published asset test directory. The synthetic fixtures are test-only and never published. The public asset is the real Policy Hub image listed above. Mobile loaded-preview.png and the original public capture were visually inspected.

Final production build passed after registering the real asset. The packaged image exists at dist/ar-atrium/browser/previews/policy-hub/home-desktop.png. The /ar-atrium/ base path and identical SPA 404 fallback were verified, and the committed production hash placeholder was restored. No production credential was used.

Twelve targeted mobile axe audits across both themes reported zero violations. Existing incomplete hero contrast/modal-focus checks need manual review; this is not a full WCAG certification.
