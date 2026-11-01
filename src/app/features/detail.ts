import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogService } from '../core/catalog.service';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink],
  template: `
    <section class="detail-page page-wrap">
      <a class="back-link" routerLink="/explore"
        ><span class="material-symbols-rounded" aria-hidden="true">arrow_back</span> Back to
        collection</a
      >
      @if (project(); as app) {
        <div class="detail-hero">
          <div>
            <p class="eyebrow">
              {{ catalog.data()?.taxonomy?.typeLabels?.[app.projectType] }} /
              {{ app.category.replaceAll('-', ' ') }}
            </p>
            <h1>{{ app.name }}</h1>
            <p class="lede">{{ app.description }}</p>
            <div class="tag-row">
              @for (facet of app.facets ?? []; track facet) {
                <span class="type-pill">{{ facet.replaceAll('-', ' ') }}</span>
              }
              @for (tech of app.technologies ?? []; track tech) {
                <span class="type-pill">{{ tech }}</span>
              }
            </div>
          </div>
          <div class="detail-mark" aria-hidden="true">{{ app.name.slice(0, 2) }}</div>
        </div>
        <div class="detail-layout">
          <div>
            <h2>Open & explore</h2>
            @if (app.preview?.demoPublic && app.preview.demoUrl; as demo) {
              <a class="button" [href]="demo" target="_blank" rel="noopener noreferrer"
                >Open live demo
                <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span></a
              >
            }
            <div class="destination-grid">
              @for (link of app.destinations; track link.id) {
                <a class="destination" [href]="link.url" target="_blank" rel="noopener noreferrer"
                  ><span class="eyebrow">{{ link.kind }}</span
                  ><strong
                    >{{ link.label }}
                    <span class="material-symbols-rounded" aria-hidden="true"
                      >open_in_new</span
                    ></strong
                  ><span class="destination-url">{{ link.url }}</span></a
                >
              } @empty {
                <p>No external destinations are available yet.</p>
              }
            </div>
            @if (app.collection; as collection) {
              @if (collection.mode === 'series') {
                <h2 class="section-title">The learning path</h2>
                <ol class="chapter-list">
                  @for (part of collection.parts; track part.number) {
                    <li>
                      <span class="chapter-number">{{
                        part.number.toString().padStart(2, '0')
                      }}</span>
                      <div>
                        <h3>
                          <a
                            [href]="repositoryUrl(part.repositoryRef)"
                            target="_blank"
                            rel="noopener noreferrer"
                            >{{ part.title }}
                            <span class="material-symbols-rounded" aria-hidden="true"
                              >open_in_new</span
                            ></a
                          >
                        </h3>
                        <p>{{ part.summary }}</p>
                      </div>
                    </li>
                  }
                </ol>
              } @else {
                <h2 class="section-title">Connected variants</h2>
                <div class="variant-tabs" role="group" aria-label="Choose a project variant">
                  @for (variant of collection.variants; track variant.id) {
                    <button
                      class="button"
                      [class.active]="selectedVariant() === variant.id"
                      [attr.aria-pressed]="selectedVariant() === variant.id"
                      (click)="selectedVariant.set(variant.id)"
                    >
                      {{ variant.label }}
                    </button>
                  }
                </div>
                @for (variant of collection.variants; track variant.id) {
                  @if (selectedVariant() === variant.id) {
                    <section class="variant-content" [attr.aria-label]="variant.label">
                      <p>{{ variant.description }}</p>
                      <ul class="repository-list">
                        @for (ref of variant.repositoryRefs; track ref) {
                          <li>
                            <a [href]="repositoryUrl(ref)" target="_blank" rel="noopener noreferrer"
                              >{{ ref }}
                              <span class="material-symbols-rounded" aria-hidden="true"
                                >open_in_new</span
                              ></a
                            >
                            @if (ref === variant.rootRepositoryRef) {
                              <span class="type-pill">Root configuration</span>
                            }
                          </li>
                        }
                      </ul>
                    </section>
                  }
                }
              }
            }
          </div>
          <aside>
            <h2>Project notes</h2>
            <p>
              {{ app.repositories.length }} connected
              {{ app.repositories.length === 1 ? 'repository' : 'repositories' }}.
            </p>
            @if (app.notes?.length) {
              <ul class="notes-list">
                @for (note of app.notes; track note) {
                  <li>{{ note }}</li>
                }
              </ul>
            }
            @if (app.needsReview || app.classificationReview) {
              <p class="review-note">
                Some metadata is awaiting review. Repository and website availability may vary.
              </p>
            }
            @if (app.android; as android) {
              <h3>Android</h3>
              <p>
                {{
                  android.releasedToPlayStore
                    ? 'Released on Google Play'
                    : 'No Play Store release listed'
                }}
              </p>
              <p class="micro-copy">
                Defaults imported from Policy Hub. Last checked
                {{ catalog.data()?.policyHub?.checkedOn }}.
              </p>
            }
            @if (app.relatedProjects?.length) {
              <h3>Related discoveries</h3>
              @for (id of app.relatedProjects; track id) {
                <a [routerLink]="['/app', id]"
                  >{{ relatedName(id) }}
                  <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span></a
                >
              }
            }
          </aside>
        </div>
      } @else {
        <div class="empty-state">
          <h1>Project not found.</h1>
          <p>It may be hidden or its address may have changed.</p>
          <a class="button" routerLink="/explore">Explore the collection</a>
        </div>
      }
    </section>
  `,
})
export class DetailComponent {
  protected readonly catalog = inject(CatalogService);
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  protected readonly project = computed(() =>
    this.catalog.projects().find((p) => p.id === this.params()?.get('id')),
  );
  protected readonly selectedVariant = linkedSignal(() => {
    const c = this.project()?.collection;
    return c?.mode === 'variants' ? (c.variants[0]?.id ?? '') : '';
  });
  repositoryUrl(ref: string): string {
    return this.project()?.repositories.find((r) => r.ref === ref)?.url ?? '';
  }
  relatedName(id: string): string {
    return this.catalog.projects().find((p) => p.id === id)?.name ?? id;
  }
}
