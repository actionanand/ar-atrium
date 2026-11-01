export interface ProjectLink {
  id: string;
  kind: 'web' | 'github' | 'docs' | 'npm' | 'apk' | 'other' | 'play-store';
  label: string;
  url: string;
  source?: string;
  verified?: string;
  hidden?: boolean;
}
export interface RepositoryRef {
  ref: string;
  role: string;
  order?: number;
}
export interface Repository extends RepositoryRef {
  url: string;
  access: string;
}
export interface SeriesPart {
  number: number;
  title: string;
  repositoryRef: string;
  summary?: string;
}
export interface Variant {
  id: string;
  label: string;
  order: number;
  rootRepositoryRef: string;
  repositoryRefs: string[];
  description?: string;
}
export type Collection =
  { mode: 'series'; parts: SeriesPart[] } | { mode: 'variants'; variants: Variant[] };
export interface AndroidMetadata {
  name?: string;
  description?: string;
  iconUrl?: string | null;
  platform?: 'android' | 'web';
  releasedToPlayStore?: boolean;
  playStoreUrl?: string | null;
  hideAndroidLinks?: boolean;
}
export interface Project {
  schemaVersion?: number;
  id: string;
  name: string;
  description: string;
  category: string;
  projectType: string;
  visible: boolean;
  featured: boolean;
  order?: number;
  needsReview?: boolean;
  classificationReview?: boolean;
  relatedProjects?: string[];
  notes?: string[];
  iconUrl?: string;
  technologies?: string[];
  facets?: string[];
  preview?: {
    imageUrl?: string;
    imageAlt?: string;
    demoUrl?: string;
    demoPublic?: boolean;
    iframeUrl?: string;
    allowIframe?: boolean;
  };
  repositories: RepositoryRef[];
  links: ProjectLink[];
  collection?: Collection;
  policyHub?: { appId: string };
  overrides: Partial<
    Pick<
      Project,
      | 'name'
      | 'description'
      | 'category'
      | 'projectType'
      | 'visible'
      | 'featured'
      | 'needsReview'
      | 'classificationReview'
      | 'notes'
      | 'iconUrl'
      | 'order'
    >
  > & {
    addLinks?: ProjectLink[];
    removeLinks?: string[];
    addRepositories?: RepositoryRef[];
    links?: { id: string; hidden?: boolean; label?: string; url?: string }[];
    policyHub?: AndroidMetadata;
  };
}
export interface CompiledProject extends Omit<Project, 'repositories' | 'overrides'> {
  repositories: Repository[];
  destinations: ProjectLink[];
  android?: AndroidMetadata;
}
export interface Taxonomy {
  schemaVersion: number;
  navigationGroups: {
    id: string;
    label: string;
    types: string[];
    description: string;
    showOnHome: boolean;
    route: string;
  }[];
  typeLabels: Record<string, string>;
  categories: { id: string; label: string }[];
  technologies: { id: string; label: string }[];
}
export interface Manifest {
  schemaVersion: number;
  title: string;
  tagline: string;
  description: string;
  projects: string[];
  repositories: string;
  hosting: string;
  taxonomy: string;
  policyHub: { repository: string; sourceUrl: string; websiteUrl: string; snapshot: string };
}
export interface RepositoryRegistry {
  schemaVersion: number;
  repositories: Record<
    string,
    {
      id: string;
      url: string;
      access: string;
      expectedProjectType?: string;
      [key: string]: unknown;
    }
  >;
}
export interface Catalogue {
  schemaVersion: number;
  title: string;
  tagline: string;
  description: string;
  taxonomy: Taxonomy;
  projects: CompiledProject[];
  policyHub: { checkedOn: string; sourceUrl: string; sourceSha256: string };
}
