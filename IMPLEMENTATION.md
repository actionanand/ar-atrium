# AR Atrium implementation review

Local implementation on feature/1-basic-app. No push, merge or deployment was performed.

## Delivered

- Migrated all 46 seed identities and their repository/link relationships. Added 31 Angular/PDF experiments, studies and library workspaces.
- JSON-only content management through individual project files, manifest, taxonomy, repository registry and separate multi-URL hosting registry. Generated runtime files are separate.
- Strict schemas and semantic validation, including duplicate JSON keys, IDs, repositories, links, classifications, groups, URLs and upstream metadata.
- Safe TypeScript AST import from Policy Hub, provenance-stamped generated cache, CI refresh failures, and explicit per-project metadata/link overrides.
- Guarded lazy Angular routes, SHA-1 convenience lock, storage/session expiry handling, search, category/technology filters, project details, group variants and learning chapters.
- Emerald light/dark UI, responsive navigation, reduced-motion support, reversible GSAP ScrollTrigger foundation and accessible CDK hover/tap previews.
- GitHub Actions validation and main-github-only Pages deployment configuration; secret validation and cross-platform SPA fallback generation.

## Inventory

{
"projects": 77,
"byProjectType": {
"application": 28,
"tool": 8,
"study": 14,
"playground": 25,
"library": 2
},
"repositories": 98,
"hostedUrls": 70,
"npmLinks": 9,
"policyHubProjects": 21,
"playStoreLinks": 15
}

Docker is one seven-chapter study. Single-spa is one project with two root variants and 14 repositories. Current/legacy AR Portfolio and LocalTell/data relationships are retained.

The final requested playground classifications are ng-lifecycle, ngrx-standalone, ng16-signal-milestone-release, ng-pdf-rough-work and pdf-features-poc. The two library workspaces are ng-my-libraries and angular-lib-demo. All nine confirmed npm destinations are retained.

## Verification

- 14 catalogue/configuration tests pass; 14 Angular authentication/UI tests pass.
- Lint, strict application/tooling type checking, formatting and git diff whitespace checks pass.
- Production Pages build passes with a synthetic test hash, /ar-atrium/ base and matching 404.html fallback. The production source placeholder was restored afterward. Initial bundle: 302.44 kB raw, 81.57 kB estimated transfer.
- Browser development login succeeds. Desktop/mobile layouts checked; mobile document width does not exceed its viewport.
- No axe violations in the eight saved representative snapshots. Manual-review items remain for gradient contrast and CDK focus sentinels; this is not a claim of complete WCAG certification. See public/data/generated/accessibility-report.json.
- HTTP checks: 69/70 hosted destinations respond successfully. The retained Birthday Buddy /tabs/home URL returns 404. All nine npm packages return 200 through npm registry metadata; npm website HEAD requests return bot-protection 403 responses. See public/data/generated/link-health.json.

## Remaining metadata and visual work

Projects without known hosted URLs (retained): `wiki`, `ar-portfolio`, `wifi-chat`, `folder-flow`, `resume-builder`, `ar-popover`, `care-chime`, `docker-learning-series`, `microfrontend-fundamentals`, `angular-testing`, `angular-testing-2`, `angular-tetsing-1`, `angular-study-services`, `angular-study-pipes`, `angular-study-http`.

Unresolved GitHub repository references (all returned 404 through the connector): `actionanand/wiki`, `actionanand/ar-tamil-jathagam`, `actionanand/ar-portfolio`, `actionanand/ar-portfolio-legacy-1`, `actionanand/resume-builder`, `actionanand/local-tell`. They may be private, renamed or unavailable; no projects were removed.

Other metadata marked for review: `wiki`, `ar-tamil-jathagam`, `ar-portfolio`, `wifi-chat`, `folder-flow`, `universal-calendar`, `byteschool`, `resume-builder`, `single-spa-showcase`, `local-tell`, `stillora`, `link-deck`, `life-leaf`, `click2chat`, `arflix`, `personix`, `scrollix`, `artamizhsolai`, `care-chime`, `angular-22`, `ng-lifecycle`.

Curated website screenshots and actual application/device composites are still needed. Preview panels display a labeled fallback when no screenshot is configured, and cinematic device scenes are explicitly illustrative. Optional iframe rendering remains disabled until embedding policies are reviewed. The functional cinematic foundation is implemented; production cinematic artwork is not claimed complete.

## Manual GitHub setup

Configure the PASSWORD_HASH Actions secret with a 40-character hexadecimal SHA-1 digest. Allow the deployment workflow to write contents and configure Pages to serve the gh-pages branch root. Deployment remains restricted to main-github. The client-side lock does not secure public static assets.

## Modified files

- `.github/workflows/gh-pages.yml`
- `.gitignore`
- `.prettierignore`
- `README.md`
- `package-lock.json`
- `package.json`
- `src/app/app.config.ts`
- `src/app/app.html`
- `src/app/app.routes.ts`
- `src/app/app.scss`
- `src/app/app.spec.ts`
- `src/app/app.ts`
- `src/environments/environment.development.ts`
- `src/environments/environment.ts`
- `src/index.html`
- `src/main.ts`
- `src/styles.scss`
- `tsconfig.json`

## Added implementation files

- `catalog/research/additions.json`
- `catalog/research/pdf-features-poc.json`
- `catalog/research/seed-inventory.json`
- `public/data/apps/angular-22.json`
- `public/data/apps/angular-change-detection.json`
- `public/data/apps/angular-deferrable.json`
- `public/data/apps/angular-graphql-lab.json`
- `public/data/apps/angular-infinite-scroll.json`
- `public/data/apps/angular-lib-demo.json`
- `public/data/apps/angular-model-signal.json`
- `public/data/apps/angular-playground.json`
- `public/data/apps/angular-study-http.json`
- `public/data/apps/angular-study-pipes.json`
- `public/data/apps/angular-study-routing.json`
- `public/data/apps/angular-study-services.json`
- `public/data/apps/angular-study.json`
- `public/data/apps/angular-testing-2.json`
- `public/data/apps/angular-testing.json`
- `public/data/apps/angular-tetsing-1.json`
- `public/data/apps/ar-popover.json`
- `public/data/apps/ar-portfolio.json`
- `public/data/apps/ar-tamil-jathagam.json`
- `public/data/apps/arblogz.json`
- `public/data/apps/arflix.json`
- `public/data/apps/artamizhsolai.json`
- `public/data/apps/birthday-buddy.json`
- `public/data/apps/byteschool.json`
- `public/data/apps/card-nest.json`
- `public/data/apps/care-chime.json`
- `public/data/apps/click2chat.json`
- `public/data/apps/converter.json`
- `public/data/apps/directive-deep-dive.json`
- `public/data/apps/docker-learning-series.json`
- `public/data/apps/expenzo.json`
- `public/data/apps/flowra.json`
- `public/data/apps/folder-flow.json`
- `public/data/apps/globee.json`
- `public/data/apps/glyph-forge.json`
- `public/data/apps/image-local-upload.json`
- `public/data/apps/lexora.json`
- `public/data/apps/life-leaf.json`
- `public/data/apps/lingua-log.json`
- `public/data/apps/link-deck.json`
- `public/data/apps/local-tell.json`
- `public/data/apps/metro-pocket.json`
- `public/data/apps/microfrontend-fundamentals.json`
- `public/data/apps/mozhi-type.json`
- `public/data/apps/ng-dev-testing.json`
- `public/data/apps/ng-dropdown-ngtemplateoutlets.json`
- `public/data/apps/ng-feature-pagination.json`
- `public/data/apps/ng-lifecycle.json`
- `public/data/apps/ng-my-libraries.json`
- `public/data/apps/ng-pdf-rough-work.json`
- `public/data/apps/ng-rough-work.json`
- `public/data/apps/ng-service-deep-dive.json`
- `public/data/apps/ng-template-depth.json`
- `public/data/apps/ng14-standalone-demo.json`
- `public/data/apps/ng16-signal-milestone-release.json`
- `public/data/apps/ngrx-module-based.json`
- `public/data/apps/ngrx-standalone.json`
- `public/data/apps/office-orbit.json`
- `public/data/apps/office-pulse.json`
- `public/data/apps/pdf-features-poc.json`
- `public/data/apps/personix.json`
- `public/data/apps/ping-metric.json`
- `public/data/apps/pipe-deep-dive.json`
- `public/data/apps/policy-hub.json`
- `public/data/apps/qurio.json`
- `public/data/apps/recipe-atlas.json`
- `public/data/apps/resume-builder.json`
- `public/data/apps/scrollix.json`
- `public/data/apps/single-spa-showcase.json`
- `public/data/apps/spendzo.json`
- `public/data/apps/stillora.json`
- `public/data/apps/svg-forge.json`
- `public/data/apps/universal-calendar.json`
- `public/data/apps/vault-nest.json`
- `public/data/apps/who-called.json`
- `public/data/apps/wifi-chat.json`
- `public/data/apps/wiki.json`
- `public/data/catalog.manifest.json`
- `public/data/generated/accessibility-report.json`
- `public/data/generated/catalog.json`
- `public/data/generated/link-health.json`
- `public/data/generated/policy-hub.json`
- `public/data/generated/report.json`
- `public/data/generated/schemas/hosting.schema.json`
- `public/data/generated/schemas/manifest.schema.json`
- `public/data/generated/schemas/project.schema.json`
- `public/data/generated/schemas/repositories.schema.json`
- `public/data/generated/schemas/taxonomy.schema.json`
- `public/data/hosting-apps.json`
- `public/data/project-types.json`
- `public/data/repositories.json`
- `scripts/build.mjs`
- `scripts/copy-error-page.mjs`
- `scripts/inject-env.js`
- `src/app/core/auth.guard.ts`
- `src/app/core/auth.service.spec.ts`
- `src/app/core/auth.service.ts`
- `src/app/core/catalog.models.ts`
- `src/app/core/catalog.service.ts`
- `src/app/core/theme.service.ts`
- `src/app/features/about.ts`
- `src/app/features/catalog-ui.spec.ts`
- `src/app/features/detail.ts`
- `src/app/features/directory.ts`
- `src/app/features/home.ts`
- `src/app/features/lock.ts`
- `src/app/features/shell.ts`
- `src/app/shared/project-card.ts`
- `tools/a11y-preview.mjs`
- `tools/catalog-schema.mts`
- `tools/catalog.mts`
- `tools/catalog.test.mts`
- `tools/check-links.mts`
- `tools/config.test.mts`
- `tools/policy-hub.mts`
- `tsconfig.tools.json`
- `IMPLEMENTATION.md`

The pre-existing, user-supplied reference/ directory is input evidence and is excluded from the implementation file inventory. Python bytecode is ignored and is not copied into public assets.
