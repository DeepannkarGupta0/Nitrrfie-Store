import type { AdminUser } from '../types/store.ts';

/**
 * Server-only institutional staff seed & owner configuration.
 * Never imported by frontend code so staff emails are never exposed in client bundles.
 */
export const PRIMARY_OWNER_EMAIL = 'heyvikrant24@gmail.com';

export const STAFF_EMAIL_SEED: readonly string[] = [
  'heyvikrant24@gmail.com',
  'admin@nitrrfie.in',
  'operations.head@nitrrfie.in',
  'logistics@nitrrfie.in',
  'store@nitrr.ac.in',
];

export function getDefaultRoleForEmail(email: string): AdminUser['role'] {
  const clean = email.toLowerCase().trim();
  if (clean === PRIMARY_OWNER_EMAIL || clean === 'admin@nitrrfie.in') return 'super_admin';
  if (clean === 'operations.head@nitrrfie.in') return 'operations_lead';
  if (clean === 'logistics@nitrrfie.in') return 'hostel_coordinator';
  if (clean === 'store@nitrr.ac.in') return 'verification_desk';
  return 'operations_lead';
}
