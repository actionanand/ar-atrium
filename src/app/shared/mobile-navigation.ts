import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Taxonomy } from '../core/catalog.models';

@Component({
  selector: 'app-mobile-navigation',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive, CdkTrapFocus],
  host: { '(window:resize)': 'onResize()' },
  styleUrl: './mobile-navigation.scss',
  template: `
    <dialog
      #dialog
      id="mobile-navigation"
      class="mobile-navigation"
      tabindex="-1"
      aria-labelledby="navigation-heading"
      (click)="backdrop($event)"
      (keydown.escape)="close()"
      (cancel)="close()"
      (close)="opened.set(false)"
    >
      <div class="drawer-content" [cdkTrapFocus]="opened()">
        <div class="drawer-heading">
          <a class="brand" routerLink="/" (click)="close()"
            ><img ngSrc="ar_emblem.png" width="40" height="40" alt="" /><span
              id="navigation-heading"
              >AR ATRIUM<small>One space. Every creation.</small></span
            ></a
          >
          <button
            #closeButton
            type="button"
            class="drawer-close"
            aria-label="Close navigation"
            (click)="close()"
          >
            <span class="material-symbols-rounded" aria-hidden="true">close</span
            ><span class="icon-fallback">Close</span>
          </button>
        </div>
        <nav class="drawer-links" aria-label="Mobile main navigation">
          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            ariaCurrentWhenActive="page"
            (click)="close()"
            >Welcome<span class="material-symbols-rounded" aria-hidden="true"
              >arrow_forward</span
            ></a
          >
          @for (group of groups(); track group.id) {
            <a
              [routerLink]="group.route"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
              (click)="close()"
              >{{ group.label
              }}<span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span></a
            >
          }
          <a
            routerLink="/about"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            (click)="close()"
            >About the Atrium<span class="material-symbols-rounded" aria-hidden="true"
              >arrow_forward</span
            ></a
          >
        </nav>
        <div class="drawer-footer">
          <p>Explore something worth discovering.</p>
          <button class="button" type="button" (click)="lock()">
            <span class="material-symbols-rounded" aria-hidden="true">lock</span>Lock the collection
          </button>
        </div>
      </div>
    </dialog>
  `,
})
export class MobileNavigationComponent {
  readonly groups = input.required<Taxonomy['navigationGroups']>();
  readonly lockRequested = output<void>();
  readonly opened = signal(false);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');
  private opener: HTMLElement | null = null;
  constructor() {
    const destroy = inject(DestroyRef);
    inject(Router)
      .events.pipe(takeUntilDestroyed(destroy))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) this.close();
      });
    destroy.onDestroy(() => this.dialog().nativeElement.close());
  }
  open(opener: HTMLElement): void {
    if (this.opened()) return;
    this.opener = opener;
    this.dialog().nativeElement.showModal();
    this.opened.set(true);
    this.closeButton().nativeElement.focus();
  }
  close(): void {
    if (!this.opened()) return;
    this.dialog().nativeElement.close();
    this.opened.set(false);
    this.opener?.focus({ preventScroll: true });
  }
  backdrop(event: MouseEvent): void {
    const bounds = this.dialog().nativeElement.getBoundingClientRect();
    if (
      event.target === this.dialog().nativeElement &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    )
      this.close();
  }
  onResize(): void {
    if (window.innerWidth > 850) this.close();
  }
  lock(): void {
    this.close();
    this.lockRequested.emit();
  }
}
