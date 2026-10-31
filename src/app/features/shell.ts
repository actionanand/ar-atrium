import { Component, inject, DestroyRef } from '@angular/core';
import { NgOptimizedImage, DOCUMENT } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { CatalogService } from '../core/catalog.service';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';
import { MobileNavigationComponent } from '../shared/mobile-navigation';

@Component({
  selector: 'app-shell',
  imports: [
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MobileNavigationComponent,
  ],
  template: `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" routerLink="/" aria-label="AR Atrium home"
          ><img ngSrc="ar_emblem.png" width="40" height="40" alt="" priority /><span
            >AR ATRIUM</span
          ></a
        >
        <nav class="desktop-navigation" aria-label="Main navigation">
          @for (group of catalog.groups(); track group.id) {
            <a [routerLink]="group.route" routerLinkActive="active" ariaCurrentWhenActive="page">{{
              group.label
            }}</a>
          }
        </nav>
        <div class="nav-actions">
          <button
            type="button"
            (click)="theme.toggle()"
            [attr.aria-label]="theme.dark() ? 'Switch to light theme' : 'Switch to dark theme'"
          >
            <span class="material-symbols-rounded" aria-hidden="true">{{
              theme.dark() ? 'light_mode' : 'dark_mode'
            }}</span
            ><span class="icon-fallback">{{ theme.dark() ? 'Light' : 'Dark' }}</span></button
          ><button class="header-lock" type="button" (click)="lock()">
            Lock <span class="material-symbols-rounded" aria-hidden="true">lock</span>
          </button>
          <button
            #menuButton
            class="menu-trigger"
            type="button"
            aria-label="Open navigation"
            aria-controls="mobile-navigation"
            [attr.aria-expanded]="navigation.opened()"
            (click)="navigation.open(menuButton)"
          >
            <span class="material-symbols-rounded" aria-hidden="true">menu</span
            ><span class="icon-fallback">Menu</span>
          </button>
        </div>
      </div>
    </header>
    <app-mobile-navigation #navigation [groups]="catalog.groups()" (lockRequested)="lock()" />
    <main id="main-content" tabindex="-1">
      @if (catalog.loading()) {
        <div class="state-panel" role="status">Opening the collection…</div>
      } @else if (catalog.error()) {
        <div class="state-panel" role="alert">
          <h1>Something interrupted the visit.</h1>
          <p>{{ catalog.error() }}</p>
          <button class="button" (click)="catalog.load()">
            Try again <span class="material-symbols-rounded" aria-hidden="true">refresh</span>
          </button>
        </div>
      } @else {
        <router-outlet />
      }
    </main>
    <footer class="site-footer">
      <a class="brand" routerLink="/"
        ><img ngSrc="ar_emblem.png" width="32" height="32" alt="" /><span>AR ATRIUM</span></a
      >
      <p>{{ catalog.data()?.tagline }}</p>
      <a routerLink="/about"
        >About this collection
        <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span></a
      ><span>Made with curiosity.</span>
    </footer>
  `,
})
export class ShellComponent {
  protected readonly catalog = inject(CatalogService);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  constructor() {
    const destroy = inject(DestroyRef);
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(destroy),
      )
      .subscribe(() => {
        requestAnimationFrame(() => {
          this.document.getElementById('main-content')?.focus({ preventScroll: true });
          this.document.title = `${this.document.querySelector('h1')?.textContent?.trim() ?? 'Collection'} · AR Atrium`;
        });
      });
  }
  async lock(): Promise<void> {
    this.auth.lock();
    await this.router.navigate(['/lock']);
  }
}
