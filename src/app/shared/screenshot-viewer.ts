import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-screenshot-viewer',
  template: `
    <section aria-label="Expanded screenshot" class="screenshot-viewer">
      <header>
        <h2>{{ data.name }} home screen</h2>
        <button type="button" aria-label="Close screenshot" (click)="dialog.close()">
          Close screenshot
        </button>
      </header>
      <button type="button" [attr.aria-pressed]="zoomed()" (click)="zoomed.set(!zoomed())">
        {{ zoomed() ? 'Fit image' : 'View original size' }}
      </button>
      <div
        class="image-scroll"
        tabindex="0"
        aria-label="Screenshot image; scroll when viewing original size"
        [class.zoomed]="zoomed()"
      >
        <img [src]="data.url" [alt]="data.alt" (error)="failed.set(true)" [hidden]="failed()" />
        @if (failed()) {
          <p role="status">Screenshot could not be loaded.</p>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .screenshot-viewer {
      background: var(--surface);
      color: var(--ink);
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 10px;
      height: calc(100dvh - 24px);
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-sizing: border-box;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    h2 {
      font-size: 1.1rem;
      margin: 0;
    }
    button {
      min-height: 44px;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 5px;
      background: var(--surface-soft);
      color: var(--ink);
      flex-shrink: 0;
    }
    .image-scroll {
      min-height: 0;
      flex: 1;
      overflow: auto;
      display: grid;
      place-items: center;
    }
    img {
      width: 100%;
      height: 100%;
      min-height: 0;
      object-fit: contain;
    }
    .zoomed {
      display: block;
    }
    .zoomed img {
      width: auto;
      height: auto;
      max-width: none;
    }
  `,
})
export class ScreenshotViewerComponent {
  protected readonly data = inject<{ url: string; alt: string; name: string }>(DIALOG_DATA);
  protected readonly dialog = inject(DialogRef);
  protected readonly zoomed = signal(false);
  protected readonly failed = signal(false);
}
