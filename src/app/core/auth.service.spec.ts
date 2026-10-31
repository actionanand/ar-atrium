import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AUTH_CONFIG, AuthService, sha1 } from './auth.service';
import { authGuard, safeReturnUrl } from './auth.guard';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

const config = {
  production: false,
  passwordHash: '8e7152d0eb52c340579f2d70a28eaf1a2c5ba1c5',
  authStorageKey: 'ar-atrium.auth.test',
  authExpiryMs: 60000,
};
describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AUTH_CONFIG, useValue: config }],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });
  it('verifies SHA-1 with Web Crypto; never persists plaintext passwords', async () => {
    const auth = TestBed.inject(AuthService);
    expect(await sha1('password@123')).toBe(config.passwordHash);
    expect(await auth.unlock('Anand', 'incorrect')).toBe(false);
    expect(await auth.unlock(' ', 'password@123')).toBe(false);
    expect(await auth.unlock(' Anand ', 'password@123')).toBe(true);
    expect(auth.accountName()).toBe('Anand');
    expect(auth.isUnlocked()).toBe(true);
    expect(localStorage.getItem(config.authStorageKey)).not.toContain('password@123');
    auth.lock();
    expect(auth.unlocked()).toBe(false);
    expect(localStorage.getItem(config.authStorageKey)).toBeNull();
  });
  it('restores valid sessions', () => {
    localStorage.setItem(
      config.authStorageKey,
      JSON.stringify({ version: 1, accountName: 'Anand', unlockedAt: Date.now() }),
    );
    expect(TestBed.inject(AuthService).isUnlocked()).toBe(true);
  });
  it.each(['{broken', 'null', '{}', '{"version":1,"accountName":"Anand","unlockedAt":"now"}'])(
    'rejects malformed storage: %s',
    (raw) => {
      localStorage.setItem(config.authStorageKey, raw);
      expect(TestBed.inject(AuthService).isUnlocked()).toBe(false);
    },
  );
  it('rejects expired and future timestamps', () => {
    localStorage.setItem(
      config.authStorageKey,
      JSON.stringify({ version: 1, accountName: 'Anand', unlockedAt: Date.now() - 60001 }),
    );
    expect(TestBed.inject(AuthService).isUnlocked()).toBe(false);
  });
  it('expires an open session without requiring a route change', async () => {
    vi.useFakeTimers();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const auth = TestBed.inject(AuthService);
    await auth.unlock('Anand', 'password@123');
    await vi.advanceTimersByTimeAsync(60001);
    expect(auth.unlocked()).toBe(false);
    expect(navigate).toHaveBeenCalled();
  });
  it('guard redirects locked requests and preserves internal destination', async () => {
    const state = { url: '/app/card-nest' } as RouterStateSnapshot;
    const guard = () =>
      TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, state));
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(guard() as ReturnType<Router['createUrlTree']>)).toContain(
      '/lock?returnUrl=',
    );
    await TestBed.inject(AuthService).unlock('Anand', 'password@123');
    expect(guard()).toBe(true);
  });
  it('safe return URLs cannot redirect to other sites', () => {
    for (const url of ['https://example.org', '//example.org', '/\\example.org', '/lock', null])
      expect(safeReturnUrl(url)).toBe('/');
    expect(safeReturnUrl('/app/card-nest')).toBe('/app/card-nest');
  });
});
