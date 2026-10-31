import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) =>
  inject(AuthService).isUnlocked() ||
  inject(Router).createUrlTree(['/lock'], { queryParams: { returnUrl: state.url } });

export function safeReturnUrl(value: string | null): string {
  return value &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !value.startsWith('/lock')
    ? value
    : '/';
}
