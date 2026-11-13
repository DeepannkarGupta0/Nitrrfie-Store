/**
 * Clerk Authentication Configuration
 * Configuration for Clerk authentication.
 * Reads publishable key exclusively from environment variables (VITE_CLERK_PUBLISHABLE_KEY).
 * No secrets or private credentials are hardcoded.
 */

export const RAW_CLERK_PUBLISHABLE_KEY: string =
  (import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim() || '';

/**
 * Validates that a string is a genuine Clerk publishable key (pk_test_... or pk_live_...)
 * whose base64 payload decodes to a valid Clerk frontend API domain ending in '$'.
 */
export function isValidClerkPublishableKey(key: string | undefined | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (!trimmed.startsWith('pk_test_') && !trimmed.startsWith('pk_live_')) {
    return false;
  }
  const parts = trimmed.split('_');
  if (parts.length !== 3 || !parts[2]) {
    return false;
  }
  if (trimmed.includes('your_clerk_publishable_key')) {
    return false;
  }
  try {
    const base64 = parts[2].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return decoded.endsWith('$') && decoded.length > 4 && decoded.slice(0, -1).includes('.');
  } catch {
    return false;
  }
}

export const IS_CLERK_CONFIGURED: boolean = isValidClerkPublishableKey(RAW_CLERK_PUBLISHABLE_KEY);

export const CLERK_PUBLISHABLE_KEY: string = IS_CLERK_CONFIGURED ? RAW_CLERK_PUBLISHABLE_KEY : '';

/**
 * Dynamically extract the Clerk Accounts URL from a valid publishable key (base64 encoded domain).
 */
export function getClerkAccountsUrl(key = CLERK_PUBLISHABLE_KEY): string {
  if (!isValidClerkPublishableKey(key)) return '';
  try {
    const raw = key.replace(/^pk_(test|live)_/, '').replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(raw).replace(/\$$/, '');
    return `https://${decoded.replace('.clerk.accounts.dev', '.accounts.dev')}`;
  } catch {
    return '';
  }
}

export const CLERK_ACCOUNTS_URL = getClerkAccountsUrl();

import type { AdminPermissions, AdminUser } from '../types/store.ts';

export const ROLE_TITLES: Record<AdminUser['role'], string> = {
  super_admin: 'Super Administrator & Store Owner',
  operations_lead: 'Operations Lead',
  verification_desk: 'Payment Verification Officer',
  hostel_coordinator: 'Hostel & Logistics Coordinator',
};

export const ROLE_PERMISSIONS: Record<AdminUser['role'], AdminPermissions> = {
  super_admin: {
    viewDashboard: true,
    updateOrderStatus: true,
    verifyPayments: true,
    cancelOrders: true,
    deleteOrders: true,
    manageProducts: true,
    deleteProducts: true,
    manageCoupons: true,
    manageStaff: true,
    manageNewsletter: true,
  },
  operations_lead: {
    viewDashboard: true,
    updateOrderStatus: true,
    verifyPayments: true,
    cancelOrders: true,
    deleteOrders: true,
    manageProducts: true,
    deleteProducts: true,
    manageCoupons: true,
    manageStaff: true,
    manageNewsletter: true,
  },
  verification_desk: {
    viewDashboard: true,
    updateOrderStatus: true,
    verifyPayments: true,
    cancelOrders: true,
    deleteOrders: false,
    manageProducts: true,
    deleteProducts: false,
    manageCoupons: true,
    manageStaff: false,
    manageNewsletter: true,
  },
  hostel_coordinator: {
    viewDashboard: true,
    updateOrderStatus: true,
    verifyPayments: true,
    cancelOrders: true,
    deleteOrders: false,
    manageProducts: true,
    deleteProducts: false,
    manageCoupons: false,
    manageStaff: false,
    manageNewsletter: false,
  },
};

export function normalizeAdminRole(role?: string | null): AdminUser['role'] {
  if (
    role === 'super_admin' ||
    role === 'operations_lead' ||
    role === 'verification_desk' ||
    role === 'hostel_coordinator'
  ) {
    return role;
  }
  if (role === 'admin') return 'super_admin';
  if (role === 'staff') return 'operations_lead';
  return 'operations_lead';
}

export function getRoleTitleForRole(role: AdminUser['role']): string {
  return ROLE_TITLES[role] || ROLE_TITLES.operations_lead;
}

export function getPermissionsForRole(role: AdminUser['role']): AdminPermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.operations_lead;
}
