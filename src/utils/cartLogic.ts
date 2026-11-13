import type { CartItem } from '../types/store.ts';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY';

export const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { symbol: string; label: string; rateFromINR: number; prefix: boolean }
> = {
  USD: { symbol: '$', label: 'USD ($)', rateFromINR: 0.012, prefix: true },
  EUR: { symbol: '€', label: 'EUR (€)', rateFromINR: 0.011, prefix: true },
  GBP: { symbol: '£', label: 'GBP (£)', rateFromINR: 0.0094, prefix: true },
  INR: { symbol: '₹', label: 'INR (₹)', rateFromINR: 1, prefix: true },
  JPY: { symbol: '¥', label: 'JPY (¥)', rateFromINR: 1.8, prefix: true },
};

export function formatPrice(amountInINR: number, currency: CurrencyCode = 'INR'): string {
  const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR;
  const converted = amountInINR * cfg.rateFromINR;

  if (currency === 'INR') {
    return `₹${amountInINR.toLocaleString('en-IN')}`;
  }
  if (currency === 'JPY') {
    return `¥${Math.round(converted).toLocaleString('en-US')}`;
  }
  // For USD, EUR, GBP
  const rounded = Math.round(converted);
  return `${cfg.symbol}${rounded.toLocaleString('en-US')}`;
}

export function calculateCartTotals(items: CartItem[], discountAmount: number = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const originalSubtotal = items.reduce((sum, item) => sum + item.product.originalPrice * item.quantity, 0);
  const cleanDiscount = Math.max(0, discountAmount);
  const totalSavings = Math.max(0, originalSubtotal - subtotal) + cleanDiscount;
  const handoverFee = 0; // Complimentary worldwide archive dispatch / campus handover
  const total = Math.max(0, subtotal - cleanDiscount) + handoverFee;

  return {
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    subtotal,
    originalSubtotal,
    discountAmount: cleanDiscount,
    totalSavings,
    handoverFee,
    total,
  };
}

export function formatINR(amount: number): string {
  return formatPrice(amount, 'INR');
}

export function calculateDiscountPercent(originalPrice: number, price: number): number {
  if (originalPrice <= price || originalPrice <= 0) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function generateOrderId(): string {
  const year = new Date().getFullYear();
  const random5 = Math.floor(10000 + Math.random() * 90000);
  return `NITRR-${year}-${random5}`;
}

export function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const formulaSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

// Re-export checkout-specific verification & routing logic from the dedicated checkout module
export {
  isValidRollNumber,
  isValidIndianPhone,
  isValidUtrNumber,
  getDepartmentFromRoll,
  buildWhatsAppVerificationUrl,
  buildWhatsAppStudentPingUrl,
  STORE_UPI_ID,
  COORDINATOR_PHONE,
  HOSTELS_LIST,
} from '../checkout/checkoutLogic.ts';
