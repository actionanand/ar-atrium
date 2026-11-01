import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MotionService } from '../core/motion.service';

@Component({
  selector: 'app-motion-notice',
  template: `
    @if (motion.mode() === 'system' && motion.systemReduced() && !dismissed()) {
      <aside aria-label="Animation preference" class="motion-notice">
        <p>Your device requests reduced motion. AR Atrium’s decorative animations are paused.</p>
        <button type="button" (click)="enable()">Enable animations on this site</button>
        <button class="keep-system" type="button" (click)="keepSystem()">
          Keep system setting
        </button>
      </aside>
    }
  `,
  styles: `
    .motion-notice {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px 20px;
      padding: 12px;
      margin-block: 12px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--surface-soft);
      color: var(--ink);
    }
    p {
      flex: 1 1 16rem;
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .keep-system {
      background: var(--surface);
      color: var(--ink);
    }
    button {
      min-height: 44px;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 5px;
      background: var(--accent);
      color: var(--accent-ink);
      font-size: 0.875rem;
      font-weight: 600;
      text-align: start;
    }
  `,
})
export class MotionNoticeComponent {
  protected readonly motion = inject(MotionService);
  private readonly document = inject(DOCUMENT);
  protected readonly dismissed = signal(this.readDismissal());
  private readDismissal(): boolean {
    try {
      return (
        this.document.defaultView?.localStorage.getItem('ar-atrium.motion-notice.v1') ===
        'dismissed'
      );
    } catch {
      return false;
    }
  }
  keepSystem(): void {
    this.dismissed.set(true);
    try {
      this.document.defaultView?.localStorage.setItem('ar-atrium.motion-notice.v1', 'dismissed');
    } catch {
      /* Dismiss for this component lifetime if storage is unavailable. */
    }
    this.restoreFocus();
  }
  enable(): void {
    this.motion.setMode('on');
    this.restoreFocus();
  }
  private restoreFocus(): void {
    // The action disappears: return keyboard focus to the page instead of losing it to body.
    const heading =
      this.document.getElementById('unlock-heading') ??
      this.document.querySelector<HTMLElement>('main h1');
    if (heading) {
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }
}
