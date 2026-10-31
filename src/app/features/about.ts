import { Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../core/catalog.service';

@Component({
  selector: 'app-about',
  imports: [NgOptimizedImage, RouterLink],
  template: `<section class="about-page page-wrap">
    <p class="eyebrow">BEHIND THE COLLECTION</p>
    <h1>A space for<br /><em>making things.</em></h1>
    <img ngSrc="ar_emblem.png" width="100" height="100" alt="AR Atrium emblem" />
    <p class="lede">{{ catalog.data()?.description }}</p>
    <div class="about-columns">
      <div>
        <h2>Built with curiosity.</h2>
        <p>
          AR Atrium brings applications, tools, studies, playground experiments and library
          workspaces into one connected collection. Each project keeps its own story, repositories
          and destinations.
        </p>
        <p>
          Learning projects are part of that story. A study or experiment does not need a published
          app or a live website to belong here.
        </p>
      </div>
      <div>
        <h2>Always evolving.</h2>
        <p>
          The collection is managed through individual JSON configurations. Android release
          information comes from Policy Hub, with explicit project overrides where needed.
        </p>
        <p>
          This browser lock is a convenience for a personal showcase. It does not secure publicly
          hosted static content or its configuration files.
        </p>
        <a class="button primary" routerLink="/explore">Find a discovery ↗</a>
      </div>
    </div>
  </section>`,
})
export class AboutComponent {
  protected readonly catalog = inject(CatalogService);
}
