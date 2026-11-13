import type { Coupon } from '../types/store.ts';

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'NITRR10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 999,
    maxDiscount: 350,
    isActive: true,
    usageCount: 0,
    description: '10% off on orders above ₹999 for all students & faculty.',
  },
  {
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 99,
    minOrderAmount: 499,
    isActive: true,
    usageCount: 0,
    description: 'Flat ₹99 waiver covering domestic courier & packing fees.',
  },
  {
    code: 'ALUMNI20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 1999,
    maxDiscount: 800,
    isActive: true,
    usageCount: 0,
    description: '20% off on premium varsity jackets & archival drops for alumni.',
  },
  {
    code: 'WELCOME50',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 500,
    isActive: true,
    usageCount: 0,
    description: 'Flat ₹50 off on first campus merchandise order.',
  },
];
