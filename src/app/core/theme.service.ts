import { Service, signal, effect } from '@angular/core';

@Service()
export class ThemeService {
  readonly dark = signal(this.readTheme());
  constructor() {
    effect(() => {
      const theme = this.dark() ? 'dark' : 'light';
      document.documentElement.dataset['theme'] = theme;
      document.documentElement.style.colorScheme = theme;
      try {
        localStorage.setItem('ar-atrium.theme', theme);
      } catch {
        /* Use in-memory preference. */
      }
    });
  }
  toggle(): void {
    this.dark.update((value) => !value);
  }
  private readTheme(): boolean {
    try {
      const saved = localStorage.getItem('ar-atrium.theme');
      if (saved) return saved === 'dark';
    } catch {
      /* Fall back to system theme. */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  }
}
