import { Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { safeReturnUrl } from '../core/auth.guard';
import { ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-lock',
  imports: [NgOptimizedImage, FormField, RouterLink],
  template: `
    <main class="lock-page" id="main-content">
      <button
        class="theme-lock"
        type="button"
        (click)="theme.toggle()"
        [attr.aria-label]="theme.dark() ? 'Switch to light theme' : 'Switch to dark theme'"
      >
        {{ theme.dark() ? 'Light mode' : 'Dark mode' }}
      </button>
      <section class="lock-story" aria-label="Welcome to AR Atrium">
        <a class="brand lock-brand" routerLink="/lock"
          ><img ngSrc="ar_emblem.png" width="60" height="60" alt="AR Atrium emblem" priority /> AR
          ATRIUM</a
        >
        <p class="eyebrow">THE CREATIVE COLLECTION</p>
        <h1>One space.<br /><em>Every creation.</em></h1>
        <p class="lede">
          Ideas turned into applications. Experiments turned into discoveries. Welcome to my corner
          of the web.
        </p>
        <div class="entrance" aria-hidden="true">
          <span></span><span></span><span></span
          ><img ngSrc="ar_emblem.png" width="120" height="120" alt="" />
        </div>
        <span class="micro-copy">BUILT WITH CURIOSITY. ALWAYS EVOLVING.</span>
      </section>
      <section class="lock-panel" aria-labelledby="unlock-heading">
        <div class="lock-form">
          <p class="eyebrow">YOUR INVITATION INSIDE</p>
          <h2 id="unlock-heading">Step into the Atrium</h2>
          <p>Enter your details to explore the collection.</p>
          <form (submit)="unlock($event)">
            <label for="username">Username</label
            ><input
              id="username"
              autocomplete="username"
              [formField]="fields.username"
              placeholder="Your name"
            />
            <label for="password">Password</label>
            <div class="password-field">
              <input
                id="password"
                autocomplete="current-password"
                [type]="showPassword() ? 'text' : 'password'"
                [formField]="fields.password"
                aria-describedby="login-message"
              /><button
                type="button"
                (click)="showPassword.update(toggle)"
                [attr.aria-pressed]="showPassword()"
                aria-controls="password"
              >
                {{ showPassword() ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p id="login-message" role="status" class="form-message">{{ message() }}</p>
            @if (!auth.configured) {
              <p role="alert">This build needs its production password configuration.</p>
            }
            <button
              class="button primary unlock-button"
              type="submit"
              [disabled]="busy() || !canUnlock() || !auth.configured"
            >
              {{ busy() ? 'Opening…' : 'Unlock Atrium →' }}
            </button>
          </form>
          <p class="lock-note">
            A personal collection, with a simple browser lock.<br />Public static content remains
            publicly accessible.
          </p>
        </div>
      </section>
    </main>
  `,
})
export class LockComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly credentials = signal({ username: '', password: '' });
  protected readonly fields = form(this.credentials, (path) => {
    required(path.username);
    required(path.password);
  });
  protected readonly showPassword = signal(false);
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly canUnlock = computed(
    () => !!this.credentials().username.trim() && !!this.credentials().password,
  );
  protected readonly toggle = (value: boolean) => !value;
  async unlock(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy() || !this.canUnlock()) return;
    this.busy.set(true);
    this.message.set('');
    try {
      const { username, password } = this.credentials();
      if (await this.auth.unlock(username, password)) {
        this.credentials.update((v) => ({ ...v, password: '' }));
        await this.router.navigateByUrl(
          safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')),
        );
      } else this.message.set('The password was not recognized. Please try again.');
    } catch {
      this.message.set('Unable to unlock. Use a secure HTTPS connection or localhost.');
    } finally {
      this.busy.set(false);
    }
  }
}
