import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Service, signal } from '@angular/core';

export type MotionMode = 'system' | 'on' | 'off';
const storageKey = 'ar-atrium.motion.v1';
function isMode(value: unknown): value is MotionMode {
  return value === 'system' || value === 'on' || value === 'off';
}

@Service()
export class MotionService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private readonly query = this.window?.matchMedia?.('(prefers-reduced-motion: reduce)');
  private readonly selected = signal<MotionMode>(this.readMode());
  readonly mode = this.selected.asReadonly();
  readonly systemReduced = signal(this.query?.matches ?? true);
  readonly animate = computed(
    () => this.mode() === 'on' || (this.mode() === 'system' && !this.systemReduced()),
  );

  constructor() {
    const changed = (event: MediaQueryListEvent) => this.systemReduced.set(event.matches);
    const stored = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null)
        this.selected.set(isMode(event.newValue) ? event.newValue : 'system');
    };
    this.query?.addEventListener('change', changed);
    this.window?.addEventListener('storage', stored);
    const updateRoot = () => {
      this.document.documentElement.dataset['motionMode'] = this.mode();
      this.document.documentElement.dataset['motionEnabled'] = String(this.animate());
    };
    updateRoot();
    effect(updateRoot);
    inject(DestroyRef).onDestroy(() => {
      this.query?.removeEventListener('change', changed);
      this.window?.removeEventListener('storage', stored);
    });
  }
  setMode(value: string): void {
    if (!isMode(value)) return;
    this.selected.set(value);
    try {
      this.window?.localStorage.setItem(storageKey, value);
    } catch {
      /* In-memory choice remains usable. */
    }
  }
  private readMode(): MotionMode {
    try {
      const value = this.window?.localStorage.getItem(storageKey);
      if (isMode(value)) return value;
    } catch {
      /* Storage may be disabled. */
    }
    return 'system';
  }
}
