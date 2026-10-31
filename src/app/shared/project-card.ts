import {
  Component,
  input,
  signal,
  computed,
  OnDestroy,
  viewChild,
  ElementRef,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import type { CompiledProject } from '../core/catalog.models';

@Component({
  selector: 'app-project-card',
  imports: [RouterLink, NgOptimizedImage, CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus],
  template: `
    <article
      class="project-card"
      (mouseenter)="scheduleOpen()"
      (mouseleave)="scheduleClose()"
      (focusout)="focusLeft($event)"
    >
      <div class="card-top">
        <span class="project-monogram" aria-hidden="true">{{ project().name.slice(0, 2) }}</span
        ><span class="type-pill">{{ typeLabel() }}</span>
      </div>
      <h3>
        <a [routerLink]="['/app', project().id]"
          >{{ project().name }}
          <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span></a
        >
      </h3>
      <p>{{ project().description }}</p>
      <div class="card-bottom">
        <span>{{ project().category.replaceAll('-', ' ') }}</span>
        <button
          #trigger
          type="button"
          cdkOverlayOrigin
          #origin="cdkOverlayOrigin"
          (click)="openDialog()"
          [attr.aria-expanded]="opened()"
          aria-haspopup="dialog"
          [attr.aria-label]="'Preview ' + project().name"
        >
          Preview <span class="material-symbols-rounded" aria-hidden="true">preview</span>
        </button>
      </div>
    </article>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="opened()"
      [cdkConnectedOverlayHasBackdrop]="modal()"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="16"
      (backdropClick)="close()"
      (detach)="opened.set(false)"
      (overlayKeydown)="keyDown($event)"
    >
      <section
        #panel
        class="preview-panel"
        [attr.role]="modal() ? 'dialog' : 'region'"
        [attr.aria-modal]="modal() ? true : null"
        [attr.aria-label]="project().name + ' preview'"
        cdkTrapFocus
        [cdkTrapFocus]="modal()"
        [cdkTrapFocusAutoCapture]="modal()"
        (mouseenter)="cancelClose()"
        (mouseleave)="scheduleClose()"
        (focusin)="cancelClose()"
      >
        <div class="preview-heading">
          <span class="eyebrow">PROJECT PREVIEW</span
          ><button type="button" (click)="close()" aria-label="Close preview" cdkFocusInitial>
            <span class="material-symbols-rounded" aria-hidden="true">close</span>
            <span class="icon-fallback" aria-hidden="true">Close</span>
          </button>
        </div>
        <div class="preview-visual">
          @if (project().preview?.imageUrl; as image) {
            <img
              [src]="image"
              [alt]="project().name + ' website screenshot'"
              loading="lazy"
              (error)="imageFailed.set(true)"
              [hidden]="imageFailed()"
            />
          }
          @if (!project().preview?.imageUrl || imageFailed()) {
            <img ngSrc="ar_emblem.png" width="76" height="76" alt="" /><span>{{
              project().name
            }}</span
            ><small>Website screenshot not yet available</small>
          }
        </div>
        <h3>{{ project().name }}</h3>
        <p>{{ project().description }}</p>
        <div class="preview-actions">
          @if (website(); as link) {
            <a class="button primary" [href]="link.url" target="_blank" rel="noopener noreferrer"
              >Open website
              <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span></a
            >
          }
          <a class="button" [routerLink]="['/app', project().id]" (click)="close()"
            >Project details</a
          >
        </div>
      </section>
    </ng-template>
  `,
})
export class ProjectCardComponent implements OnDestroy {
  readonly project = input.required<CompiledProject>();
  readonly typeLabel = input.required<string>();
  protected readonly opened = signal(false);
  protected readonly modal = signal(false);
  protected readonly imageFailed = signal(false);
  protected readonly website = computed(() =>
    this.project().destinations.find((l) => l.kind === 'web'),
  );
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private focusTimer?: ReturnType<typeof setTimeout>;
  private openTimer?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  scheduleOpen(): void {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    this.cancelClose();
    clearTimeout(this.openTimer);
    this.openTimer = setTimeout(() => {
      if (!this.opened()) {
        this.modal.set(false);
        this.opened.set(true);
      }
    }, 450);
  }
  scheduleClose(): void {
    clearTimeout(this.openTimer);
    if (!this.modal()) this.closeTimer = setTimeout(() => this.opened.set(false), 250);
  }
  cancelClose(): void {
    clearTimeout(this.closeTimer);
  }
  openDialog(): void {
    clearTimeout(this.openTimer);
    this.cancelClose();
    this.opened.set(false);
    this.modal.set(true);
    this.opened.set(true);
    this.focusTimer = setTimeout(() =>
      this.panel()?.nativeElement.querySelector('button')?.focus(),
    );
  }
  close(): void {
    const restore = this.modal();
    this.opened.set(false);
    this.modal.set(false);
    if (restore) this.trigger()?.nativeElement.focus();
  }
  keyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }
  focusLeft(event: FocusEvent): void {
    if (
      !this.modal() &&
      !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)
    )
      this.scheduleClose();
  }
  ngOnDestroy(): void {
    clearTimeout(this.focusTimer);
    clearTimeout(this.openTimer);
    clearTimeout(this.closeTimer);
  }
}
