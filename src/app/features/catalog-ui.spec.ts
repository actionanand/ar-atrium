import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { CatalogService } from '../core/catalog.service';
import { DirectoryComponent } from './directory';
import { DetailComponent } from './detail';
import type { Catalogue, CompiledProject } from '../core/catalog.models';

const project: CompiledProject = {
  id: 'json-project',
  name: 'JSON discovery',
  description: 'Configured entirely in JSON',
  category: 'new-category',
  projectType: 'library',
  visible: true,
  featured: true,
  repositories: [
    {
      ref: 'example/repo',
      role: 'primary',
      url: 'https://github.com/example/repo',
      access: 'public-metadata-verified',
    },
  ],
  links: [],
  destinations: [
    {
      id: 'npm-one',
      kind: 'npm',
      label: '@example/library',
      url: 'https://www.npmjs.com/package/@example/library',
    },
  ],
};
const data: Catalogue = {
  schemaVersion: 1,
  title: 'AR Atrium',
  tagline: 'One space. Every creation.',
  description: 'Collection',
  projects: [project],
  taxonomy: {
    schemaVersion: 1,
    typeLabels: { library: 'Library workspace' },
    navigationGroups: [
      {
        id: 'libraries',
        label: 'Libraries',
        route: '/libraries',
        types: ['library'],
        description: 'Reusable libraries',
        showOnHome: true,
      },
    ],
    categories: [{ id: 'new-category', label: 'New category' }],
    technologies: [],
  },
  policyHub: {
    checkedOn: '2026-10-31',
    sourceUrl: 'https://example.org/source',
    sourceSha256: 'a'.repeat(64),
  },
};
describe('JSON-driven catalogue UI', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'libraries', component: DirectoryComponent },
          { path: 'app/:id', component: DetailComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(CatalogService);
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url.endsWith('/data/generated/catalog.json'))
      .flush(data);
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('renders a new JSON project/category and supports search and empty states', async () => {
    const harness = await RouterTestingHarness.create('/libraries');
    expect(harness.routeNativeElement?.textContent).toContain('JSON discovery');
    expect(harness.routeNativeElement?.textContent).toContain('New category');
    const search =
      harness.routeNativeElement!.querySelector<HTMLInputElement>('input[type=search]')!;
    search.value = 'no results';
    search.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No discoveries here yet');
    search.value = 'JSON';
    search.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelectorAll('app-project-card')).toHaveLength(1);
  });
  it('renders npm destinations and reports unknown project IDs', async () => {
    const harness = await RouterTestingHarness.create('/app/json-project');
    expect(
      harness.routeNativeElement?.querySelector(
        'a[href="https://www.npmjs.com/package/@example/library"]',
      ),
    ).not.toBeNull();
    await harness.navigateByUrl('/app/missing');
    expect(harness.routeNativeElement?.textContent).toContain('Project not found');
  });
});
