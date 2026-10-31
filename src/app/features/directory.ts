import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogService } from '../core/catalog.service';
import { ProjectCardComponent } from '../shared/project-card';

@Component({
  selector: 'app-directory',
  imports: [ProjectCardComponent],
  template: `
    <section class="directory-page page-wrap">
      <div class="page-heading">
        <div>
          <p class="eyebrow">THE COLLECTION / {{ group()?.label ?? 'EXPLORE' }}</p>
          <h1>{{ group()?.label ?? 'Every creation, in one place.' }}</h1>
          <p class="lede">
            {{
              group()?.description ??
                'Explore applications, useful tools, reusable libraries and experiments.'
            }}
          </p>
        </div>
        <span class="index-number" aria-hidden="true">{{
          filtered().length.toString().padStart(2, '0')
        }}</span>
      </div>
      <div class="filter-bar">
        <div class="search-field">
          <label for="search">Search the collection</label
          ><input
            id="search"
            type="search"
            [value]="query()"
            (input)="query.set(value($event))"
            placeholder="Find your next discovery…"
          />
        </div>
        <div>
          <label for="category">Category</label
          ><select id="category" [value]="category()" (change)="category.set(value($event))">
            <option value="">All categories</option>
            @for (item of catalog.data()?.taxonomy?.categories ?? []; track item.id) {
              <option [value]="item.id">{{ item.label }}</option>
            }
          </select>
        </div>
        <div>
          <label for="technology">Technology</label
          ><select id="technology" [value]="technology()" (change)="technology.set(value($event))">
            <option value="">All technologies</option>
            @for (item of catalog.data()?.taxonomy?.technologies ?? []; track item.id) {
              <option [value]="item.id">{{ item.label }}</option>
            }
          </select>
        </div>
      </div>
      <p class="result-count" role="status">
        {{ filtered().length }} projects <span>• Curated, connected, always evolving</span>
      </p>
      <h2 class="sr-only">Projects</h2>
      <div class="project-grid">
        @for (project of filtered(); track project.id) {
          <app-project-card
            [project]="project"
            [typeLabel]="
              catalog.data()?.taxonomy?.typeLabels?.[project.projectType] ?? project.projectType
            "
          />
        } @empty {
          <div class="empty-state">
            <h2>No discoveries here yet.</h2>
            <p>Try another search or clear the filters.</p>
            <button class="button" (click)="reset()">Reset filters</button>
          </div>
        }
      </div>
    </section>
  `,
})
export class DirectoryComponent {
  protected readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly url = toSignal(this.route.url);
  protected readonly group = computed(() => {
    const path =
      '/' +
      (this.url()
        ?.map((s) => s.path)
        .join('/') ?? '');
    return this.catalog.groups().find((g) => g.route === path);
  });
  protected readonly query = signal('');
  protected readonly category = signal('');
  protected readonly technology = signal('');
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const group = this.group();
    return this.catalog
      .projects()
      .filter(
        (p) =>
          (!group || group.types.includes(p.projectType)) &&
          (!this.category() || p.category === this.category()) &&
          (!this.technology() || p.technologies?.includes(this.technology())) &&
          (!q ||
            [
              p.name,
              p.description,
              p.category,
              p.projectType,
              ...(p.facets ?? []),
              ...p.repositories.map((r) => r.ref),
            ]
              .join(' ')
              .toLowerCase()
              .includes(q)),
      );
  });
  value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
  reset(): void {
    this.query.set('');
    this.category.set('');
    this.technology.set('');
  }
}
