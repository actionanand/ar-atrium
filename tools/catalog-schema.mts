// Schemas are emitted to catalog/schemas for editor support; validation uses these same objects.
const text = { type: 'string', minLength: 1 };
const flag = { type: 'boolean' };
const texts = { type: 'array', items: text, uniqueItems: true };
const object = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'object',
  additionalProperties: false,
  properties,
  required,
});
const list = (items: unknown, extra = {}) => ({ type: 'array', items, ...extra });
const version = { const: 1 };
const link = object(
  {
    id: text,
    kind: { enum: ['web', 'github', 'docs', 'npm', 'apk', 'other'] },
    label: text,
    url: text,
    source: text,
    verified: text,
  },
  ['id', 'kind', 'label', 'url'],
);
const repository = object({ ref: text, role: text, order: { type: 'integer', minimum: 0 } }, [
  'ref',
  'role',
]);
const policyOverrides = object({
  name: text,
  description: text,
  iconUrl: { type: ['string', 'null'] },
  platform: { enum: ['web', 'android'] },
  releasedToPlayStore: flag,
  playStoreUrl: { type: ['string', 'null'] },
  hideAndroidLinks: flag,
});
const scalar = {
  name: text,
  description: text,
  category: text,
  projectType: text,
  featured: flag,
  visible: flag,
  needsReview: flag,
  classificationReview: flag,
  notes: list(text),
  iconUrl: text,
  order: { type: 'integer', minimum: 0 },
};
const part = object(
  { number: { type: 'integer', minimum: 1 }, title: text, repositoryRef: text, summary: text },
  ['number', 'title', 'repositoryRef'],
);
const variant = object(
  {
    id: text,
    label: text,
    order: { type: 'integer' },
    rootRepositoryRef: text,
    repositoryRefs: texts,
    description: text,
  },
  ['id', 'label', 'order', 'rootRepositoryRef', 'repositoryRefs'],
);
export const schemas = {
  project: object(
    {
      schemaVersion: version,
      id: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
      ...scalar,
      technologies: texts,
      facets: texts,
      relatedProjects: texts,
      preview: object({
        imageUrl: text,
        imageAlt: text,
        demoUrl: text,
        demoPublic: flag,
        iframeUrl: text,
        allowIframe: flag,
      }),
      repositories: list(repository),
      links: list(link),
      policyHub: object({ appId: text }, ['appId']),
      overrides: object({
        ...scalar,
        addLinks: list(link),
        removeLinks: texts,
        addRepositories: list(repository),
        links: list(object({ id: text, hidden: flag, label: text, url: text }, ['id'])),
        policyHub: policyOverrides,
      }),
      collection: {
        oneOf: [
          object({ mode: { const: 'series' }, parts: list(part, { minItems: 2 }) }, [
            'mode',
            'parts',
          ]),
          object({ mode: { const: 'variants' }, variants: list(variant, { minItems: 2 }) }, [
            'mode',
            'variants',
          ]),
        ],
      },
    },
    [
      'schemaVersion',
      'id',
      'name',
      'description',
      'category',
      'projectType',
      'visible',
      'featured',
      'repositories',
      'links',
      'overrides',
    ],
  ),
  manifest: object(
    {
      schemaVersion: version,
      title: text,
      tagline: text,
      description: text,
      projects: texts,
      repositories: text,
      hosting: text,
      taxonomy: text,
      policyHub: object({ repository: text, sourceUrl: text, websiteUrl: text, snapshot: text }, [
        'repository',
        'sourceUrl',
        'websiteUrl',
        'snapshot',
      ]),
    },
    [
      'schemaVersion',
      'title',
      'tagline',
      'description',
      'projects',
      'repositories',
      'hosting',
      'taxonomy',
      'policyHub',
    ],
  ),
  hosting: object(
    { schemaVersion: version, projects: { type: 'object', additionalProperties: list(link) } },
    ['schemaVersion', 'projects'],
  ),
  taxonomy: object(
    {
      schemaVersion: version,
      navigationGroups: list(
        object(
          { id: text, label: text, types: texts, description: text, showOnHome: flag, route: text },
          ['id', 'label', 'types', 'description', 'showOnHome', 'route'],
        ),
      ),
      typeLabels: { type: 'object', additionalProperties: text },
      categories: list(object({ id: text, label: text }, ['id', 'label'])),
      technologies: list(object({ id: text, label: text }, ['id', 'label'])),
    },
    ['schemaVersion', 'navigationGroups', 'typeLabels', 'categories', 'technologies'],
  ),
  repositories: object(
    {
      schemaVersion: version,
      checkedOn: text,
      repositories: {
        type: 'object',
        additionalProperties: object(
          {
            id: text,
            url: text,
            access: text,
            description: { type: ['string', 'null'] },
            homepage: { type: ['string', 'null'] },
            defaultBranch: { type: ['string', 'null'] },
            checkedOn: text,
            note: text,
            readmeUrl: text,
            readmeHeading: text,
            npmLinks: texts,
            expectedProjectType: text,
          },
          ['id', 'url', 'access'],
        ),
      },
    },
    ['schemaVersion', 'repositories'],
  ),
};
