export interface NavConfigItem {
  href: string;
  label: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  enabled: boolean;
}

// Primary site navigation (visible to all users)
export const mainNav: NavConfigItem[] = [
  { href: '/', label: 'Home', enabled: true },
  { href: '/shop', label: 'Shop', enabled: true },
  { href: '/support', label: 'Support', enabled: true },
];

// Links that appear only when the user is signed-in

export const accountNav: NavConfigItem[] = [
  { href: '/account', label: 'Account Settings', requiresAuth: true, enabled: true },
  { href: '/account/orders', label: 'My Orders', requiresAuth: true, enabled: true },
];


// Admin-only links
export const adminNav: NavConfigItem[] = [
  { href: '/admin', label: 'Admin', adminOnly: true, requiresAuth: true, enabled: true },
];

// Footer specific navigation
export const footerNav: NavConfigItem[] = [
  { href: '/', label: 'Home', enabled: true },
  { href: '/shop', label: 'Shop', enabled: true },
  { href: '/support', label: 'Support', enabled: true },
];

// Reserved for future features
export const futureNav: NavConfigItem[] = [];
