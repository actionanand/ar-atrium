import { Service, DestroyRef, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Catalogue } from './catalog.models';

@Service()
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  readonly data = signal<Catalogue | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly projects = computed(() => this.data()?.projects ?? []);
  readonly featured = computed(() => this.projects().filter((p) => p.featured));
  readonly groups = computed(() => this.data()?.taxonomy.navigationGroups ?? []);
  private readonly destroyRef = inject(DestroyRef);
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http
      .get<Catalogue>(new URL('data/generated/catalog.json', this.document.baseURI).href)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data.schemaVersion !== 1 || !Array.isArray(data.projects) || !data.taxonomy) {
            this.error.set('The catalogue format is not supported.');
          } else this.data.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('The catalogue could not be loaded. Please try again.');
          this.loading.set(false);
        },
      });
  }
}
