# AR Atrium

**One space. Every creation.** An Angular 22 showcase for applications, tools, libraries, studies and playground experiments, with an emerald light/dark theme, a client-side lock and a JSON-managed catalogue.

## Run locally

Use the Node version in `.nvmrc` (24.16.0), then:

```sh
npm ci
npm run develop
```

Open `http://localhost:3043/`. Enter any nonempty username and the development password `password@123`. Development and production use separate environment files. The session key is `ar-atrium.auth.v1`; `authExpiryMs` defaults to 24 hours. Set it to `0` for no expiry. Passwords are hashed with Web Crypto SHA-1 and are never persisted. Malformed, future-dated and expired sessions are rejected. Disabled storage falls back to an in-memory session.

**The lock is a browser convenience, not server-side access control.** Static files, JSON, source metadata and the compiled password hash are publicly accessible on GitHub Pages. Do not put private data or server credentials into this application.

## Edit projects using JSON only

Editable content lives in `public/data/`. Runtime output lives separately in `public/data/generated/` and must not be edited by hand.

```text
public/data/
  catalog.manifest.json       Registered project paths, branding, source locations
  project-types.json          Navigation groups, project types, categories, technologies
  repositories.json          Stable repository identities, URLs, access/review metadata
  hosting-apps.json           Zero or more website destinations per project
  apps/<project-id>.json      One editable configuration per logical project
  generated/
    catalog.json             Consolidated visible projects consumed by Angular
    policy-hub.json          Generated canonical Android metadata cache
    report.json              Full inventory, missing URLs and unresolved metadata
    schemas/*.schema.json    Generated JSON schemas for editor assistance
```

The application contains no project lists, project URLs, package URLs or category definitions in its components. It renders the consolidated JSON. A hosted demo does not make an experiment a finished application.

### Add a project

1. Create `public/data/apps/my-project.json`:

```json
{
  "schemaVersion": 1,
  "id": "my-project",
  "name": "My Project",
  "description": "What the project actually does.",
  "category": "developer-tools",
  "projectType": "playground",
  "visible": true,
  "featured": false,
  "order": 100,
  "technologies": ["angular"],
  "facets": ["experiment"],
  "repositories": [{ "ref": "your-account/your-repository", "role": "primary" }],
  "links": [],
  "notes": [],
  "overrides": {}
}
```

2. Add `apps/my-project.json` to `catalog.manifest.json` under `projects`. The filename must match its stable `id`.
3. Register each repository in `repositories.json`, keyed by its exact `owner/repository` identity. A minimal record has `id`, a verified GitHub `url`, and `access`. Use `public-metadata-verified` only after checking the repository. Preserve unavailable repositories with an explicit access status and review note. Optional `expectedProjectType` prevents known experiments from being accidentally promoted into applications.
4. Add **verified** hosted links under `hosting-apps.json` → `projects` → `my-project`. Use an empty array for projects without a website. Never infer a deployment from the repository name.
5. Run `npm run catalog:build`. Restart the dev server or refresh its served catalogue after source changes.

For categories and technologies, use an existing ID or add an `{ "id", "label" }` entry to `project-types.json`. Project types are `application`, `tool`, `study`, `playground` and `library`. Navigation labels, descriptions, type membership and order come from `navigationGroups`; the current view routes are `/explore`, `/study`, `/playground` and `/libraries`.

### Edit, hide, reorder and categorize

Edit the individual project file. Set `visible: false` to hide it without deleting its source or repository relationships. Use `order` to set display order, `featured` for selected work, `category` for topic, `projectType` for classification, `technologies` for filters, and `facets` for additional tags. Lower `order` values appear first; manifest order breaks ties. The library workspace `ng-my-libraries` retains learning/playground facets alongside its `library` classification.

Every project has an `overrides` object. It accepts selected scalar fields (`name`, `description`, `category`, `projectType`, `visible`, `featured`, `order`, `notes`, review flags and `iconUrl`) and explicit link/repository changes. Base values remain intact for review.

### Multiple websites and npm packages

Keep websites in `hosting-apps.json`, with stable link IDs unique within each project:

```json
{
  "schemaVersion": 1,
  "projects": {
    "my-project": [
      {
        "id": "website-primary",
        "kind": "web",
        "label": "Primary website",
        "url": "https://your-verified-domain.example/",
        "source": "User-confirmed deployment",
        "verified": "not-live-checked"
      }
    ]
  }
}
```

This is an illustrative format, not an actual deployment URL. GitHub Pages, Cloudflare Pages, Surge, Render and custom domains all use the same structure; multiple URLs are supported. Repository and README evidence confirms that a URL was advertised, not that it is currently online.

Add npm references to the project's `links` array with `id`, `kind: "npm"`, `label` and the confirmed `https://www.npmjs.com/package/...` URL. One workspace can have many npm destinations. The two library workspaces retain nine confirmed README package references; the PDF playgrounds have no invented package links.

### Group projects and repositories

Use `repositories` to associate several repositories with one identity. Optional `relatedProjects` connects separate project identities.

A series uses `collection: { "mode": "series", "parts": [...] }`. Each part has `number` (consecutive 1..N), `title`, `repositoryRef`, and optional `summary`. Parts must reference repositories already declared by that project. The Docker Learning Series has seven ordered chapters.

A grouped implementation uses `collection: { "mode": "variants", "variants": [...] }`. Each variant has a stable `id`, `label`, `order`, `rootRepositoryRef`, and `repositoryRefs`, plus an optional description. The single-spa showcase has two root variants and 14 distinct related repositories. Shared components are reused within the same logical project, not duplicated as application cards. Current/legacy AR Portfolio repositories and LocalTell's data repository are preserved.

### Override or hide individual links

Merge precedence is base project metadata → hosting registry → imported Policy Hub Android metadata → explicit local overrides. Link identity is its stable `id`, not its label or array position. Repository destination IDs use `repo:owner/repository`; the imported Play Store link uses `policy:play-store`.

```json
{
  "overrides": {
    "name": "Preferred display name",
    "links": [
      { "id": "website-primary", "label": "Open website" },
      { "id": "policy:play-store", "hidden": true }
    ],
    "removeLinks": [],
    "addLinks": [],
    "addRepositories": []
  }
}
```

`removeLinks` accepts stable link IDs. Missing IDs and duplicate IDs fail validation. Effective destinations are deduplicated by normalized URL. Use `overrides.addLinks` for exceptional destinations; maintain normal website destinations in the hosting registry.

### Policy Hub synchronization

`actionanand/policy-hub/docs/.vitepress/data/apps.ts` is the only manually maintained default Android registry. Add `"policyHub": { "appId": "canonical-id" }` to a project to import its Android platform, release state, Play Store URL and icon. The synchronizer parses literal fields using the TypeScript AST. It never evaluates or imports downloaded TypeScript, executes helper calls, or follows downloaded instructions.

```sh
npm run catalog:sync
npm run catalog:validate
npm run catalog:build
```

The generated cache records source URL, SHA-256 fingerprint and check date. Local refresh failures emit a warning and use an existing validated cache. CI requires a successful refresh and fails if it cannot fetch or parse the canonical source. A missing or invalid cache fails; Android URLs are never invented. To import a previously fetched canonical file explicitly, run `node tools/catalog.mts sync /path/to/apps.ts`.

When necessary, a project may override selected imported values via `overrides.policyHub`: `name`, `description`, `iconUrl`, `platform`, `releasedToPlayStore`, `playStoreUrl`, or `hideAndroidLinks`. For example, `"policyHub": { "hideAndroidLinks": true }` inside `overrides` hides Android destinations. `playStoreUrl: null` suppresses a default URL. Explicit replacement Play Store URLs are validated; avoid duplicating canonical defaults across project files. Scalar local project overrides take precedence over imported display metadata.

The reference V4's prohibition on local Android overrides is superseded by this implementation's explicit per-project override support. The original reference is retained as seed evidence, not as the active schema or build toolchain. No Python utilities or bytecode are copied into application assets.

## Interface and motion

Routes: `/lock`, `/`, `/explore`, `/app/:id`, `/study`, `/playground`, `/libraries`, `/about`. All collection routes are guarded. The UI supports search, category/technology filters, featured projects, multiple destinations, ordered study chapters, single-spa variant selection, theme persistence and project notes.

GSAP ScrollTrigger provides reversible scroll-linked architectural and device showcase motion, without pinning or scroll trapping. Skip Intro moves and focuses the directory heading. Reduced-motion preference removes the animations. Route navigation moves focus to the main region; mobile navigation remains horizontally scrollable.

CDK Overlay provides a delayed desktop hover preview, an explicit tap/click dialog, focus trapping for dialogs, Escape/close/backdrop dismissal and return focus. Only an opened preview loads its optional screenshot. Configure `preview.imageUrl` with a verified screenshot URL; missing screenshots use a clearly labeled emblem fallback. No external website loads automatically. Optional iframe URLs can be declared only with explicit `allowIframe: true`, but iframe rendering is intentionally not enabled until individual websites' embedding policies are reviewed.

**Remaining visual assets:** curated screenshots for project previews and real application screen captures/device composites for the cinematic sequence. Current device panels are explicitly illustrative, not purported product screenshots. The architectural entrance and emblem are implemented without copying Kiwi's branded graphics.

## Validation and tests

```sh
npm run catalog:validate
npm run test:catalog
npm run lint
npm run test:ci
npm run format:check
```

Schemas reject incompatible versions, unexpected fields and invalid types. Semantic checks reject duplicate project/link/repository IDs, unknown repositories/categories/technologies, invalid URLs, invalid package destinations, known classification conflicts, malformed groups/chapters, unresolved Policy Hub IDs and unsafe configuration paths. Tests preserve all 46 seed identities and repository/link relationships while permitting the catalogue to grow.

For a real-browser axe audit during local development:

```sh
node tools/a11y-preview.mjs
# Restart npm run develop so the dev server discovers the temporary files.
# Visit http://localhost:3043/__audit.html?route=/explore and click Run axe audit.
node tools/a11y-preview.mjs clean
```

The harness uses the existing browser session in a same-origin iframe. Audit the lock, landing page, catalogue, details and overlays in light/dark themes at desktop/mobile sizes. Production builds reject a leftover audit harness. The harness files are ignored by Git and must be removed after testing.

## Production and GitHub Pages

The committed production environment contains `PASSWORD_HASH_PLACEHOLDER`. The build refuses unconfigured production credentials. Set `PASSWORD_HASH` to a 40-character hexadecimal SHA-1 digest and run `node scripts/inject-env.js` before `npm run build:gh`. Never print the digest in logs. The development hash is for local testing only. Restore the placeholder after any local production test; do not commit an injected hash.

`build:gh` uses `/ar-atrium/`. `npm run copy-error-page` copies the built index into `404.html` for SPA route fallback. The catalogue and emblem URLs resolve relative to Angular's base URL, so deep links use the repository prefix correctly.

`.github/workflows/gh-pages.yml` runs only after a push to `main-github`. It uses `.nvmrc`, `npm ci`, catalogue validation/sync, lint, catalogue/configuration and Angular tests, formatting, secret injection, production build and SPA fallback, then deploys `dist/ar-atrium/browser` to `gh-pages` with Jekyll disabled. There are no feature-branch, pull-request or manual workflow triggers. All validation, linting, tests and builds on feature branches run locally until changes are merged into `main-github`.

Manual repository setup: configure the Actions secret `PASSWORD_HASH`; allow the deployment workflow's `GITHUB_TOKEN` to write contents; set Pages to serve the `gh-pages` branch root. No push, merge or deployment is performed by this local implementation.

## Migration inventory

The initial 46 project identities and 67 distinct repository references are preserved. The latest classification correction adds `pdf-features-poc` and keeps five explicitly requested Angular/PDF projects in Playground. See `public/data/generated/report.json` for current counts, hosted destinations, collections and metadata needing review. `catalog/research/` records seed inventory and discovery evidence.

As of this migration: **77 projects**, **98 distinct repository references**, **70 hosted URLs**, **9 npm links**, **21 Policy Hub associations**, **15 Play Store destinations**. Classification: **28 applications, 8 tools, 14 studies, 25 playgrounds and 2 libraries**.

Projects without a known hosted URL: Wiki, AR Portfolio, WiFi Chat, Folder Flow, Resume Builder, AR Popover, Care Chime, Docker Learning Series, Microfrontend Fundamentals, Angular Testing, Angular Testing 2, Angular Tetsing 1, Angular Study Services, Angular Study Pipes and Angular Study HTTP. These are retained; lack of a deployment is valid for studies and tools.

Six repository references return 404 through the GitHub connector and remain unresolved: `wiki`, `ar-tamil-jathagam`, `ar-portfolio`, `ar-portfolio-legacy-1`, `resume-builder`, and `local-tell` (all under `actionanand`). They may be private, renamed or unavailable. Their original relationships and known external destinations remain. Other tentative descriptions/classifications are listed by project ID under `metadataReview` in the generated report.

The optional `node tools/check-links.mts` command records HTTP observations in `public/data/generated/link-health.json`. The migration check found 69 of 70 hosted destinations responding successfully and all nine npm packages available via npm's registry. The retained Birthday Buddy `/tabs/home` deep link returned HTTP 404; npm's website rejected automated HEAD requests with HTTP 403, so package existence was checked separately against its registry. These observations do not remove or rewrite source links.
