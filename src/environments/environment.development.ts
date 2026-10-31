import type { AuthConfig } from '../app/core/auth.service';
export const environment: AuthConfig = {
  production: false,
  passwordHash: '8e7152d0eb52c340579f2d70a28eaf1a2c5ba1c5',
  authStorageKey: 'ar-atrium.auth.v1',
  authExpiryMs: 86400000,
};
