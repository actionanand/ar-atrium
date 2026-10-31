import type { AuthConfig } from '../app/core/auth.service';
export const environment: AuthConfig = {
  production: true,
  passwordHash: 'PASSWORD_HASH_PLACEHOLDER',
  authStorageKey: 'ar-atrium.auth.v1',
  authExpiryMs: 86400000,
};
