import { Service, InjectionToken, computed, inject, signal, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface AuthConfig {
  production: boolean;
  passwordHash: string;
  authStorageKey: string;
  authExpiryMs: number;
}
interface Session {
  version: 1;
  accountName: string;
  unlockedAt: number;
}
export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AR Atrium auth configuration', {
  factory: () => environment,
});
export async function sha1(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

@Service()
export class AuthService {
  private readonly config = inject(AUTH_CONFIG);
  private readonly router = inject(Router);
  private readonly session = signal<Session | null>(null);
  private timer?: ReturnType<typeof setTimeout>;
  readonly configured = /^[a-f\d]{40}$/i.test(this.config.passwordHash);
  readonly unlocked = computed(() => this.configured && this.session() !== null);
  readonly accountName = computed(() => this.session()?.accountName ?? '');
  readonly persistent = signal(true);

  constructor() {
    this.restore();
    const onStorage = (event: StorageEvent) => {
      if (event.key === this.config.authStorageKey || event.key === null) {
        this.restore();
        if (!this.isUnlocked()) void this.router.navigate(['/lock']);
      }
    };
    window.addEventListener('storage', onStorage);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      window.removeEventListener('storage', onStorage);
    });
  }
  async unlock(accountName: string, password: string): Promise<boolean> {
    if (
      !this.configured ||
      !accountName.trim() ||
      (await sha1(password)) !== this.config.passwordHash.toLowerCase()
    )
      return false;
    const session: Session = {
      version: 1,
      accountName: accountName.trim(),
      unlockedAt: Date.now(),
    };
    try {
      localStorage.setItem(this.config.authStorageKey, JSON.stringify(session));
      this.persistent.set(true);
    } catch {
      this.persistent.set(false);
    }
    this.session.set(session);
    this.scheduleExpiry();
    return true;
  }
  isUnlocked(): boolean {
    if (!this.valid(this.session())) this.lock();
    return this.unlocked();
  }
  lock(): void {
    clearTimeout(this.timer);
    this.session.set(null);
    try {
      localStorage.removeItem(this.config.authStorageKey);
    } catch {
      /* Storage may be disabled. */
    }
  }
  private valid(value: unknown): value is Session {
    if (!this.configured || !value || typeof value !== 'object') return false;
    const session = value as Partial<Session>;
    if (
      session.version !== 1 ||
      typeof session.accountName !== 'string' ||
      !session.accountName.trim() ||
      typeof session.unlockedAt !== 'number' ||
      !Number.isFinite(session.unlockedAt)
    )
      return false;
    const age = Date.now() - session.unlockedAt;
    return age >= 0 && (this.config.authExpiryMs === 0 || age < this.config.authExpiryMs);
  }
  private restore(): void {
    let value: unknown = null;
    try {
      const raw = localStorage.getItem(this.config.authStorageKey);
      if (raw) value = JSON.parse(raw);
    } catch {
      this.persistent.set(false);
    }
    if (this.valid(value)) {
      this.session.set(value);
      this.scheduleExpiry();
    } else this.lock();
  }
  private scheduleExpiry(): void {
    clearTimeout(this.timer);
    if (!this.session() || this.config.authExpiryMs === 0) return;
    const delay = Math.min(
      2147483647,
      Math.max(1, this.config.authExpiryMs - (Date.now() - this.session()!.unlockedAt)),
    );
    this.timer = setTimeout(() => {
      if (!this.isUnlocked())
        void this.router.navigate(['/lock'], { queryParams: { returnUrl: this.router.url } });
      else this.scheduleExpiry();
    }, delay);
  }
}
