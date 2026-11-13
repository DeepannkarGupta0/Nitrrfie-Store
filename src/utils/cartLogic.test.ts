import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  formatINR,
  formatPrice,
  escapeCsvCell,
  calculateDiscountPercent,
  generateOrderId,
  isValidRollNumber,
  isValidIndianPhone,
  isValidUtrNumber,
  getDepartmentFromRoll,
  buildWhatsAppVerificationUrl,
} from './cartLogic';
import { CartItem, Product } from '../types/store';

const mockProduct1: Product = {
  id: 'test-1',
  slug: 'test-jacket',
  name: 'Varsity Jacket',
  club: 'E-Cell',
  clubShort: 'E-Cell',
  category: 'Outerwear',
  price: 1199,
  originalPrice: 1599,
  tagline: 'Test Tagline',
  description: 'Test Desc',
  image: '/test.png',
  badge: 'Test',
  colorways: [{ name: 'Black', hex: '#000000' }],
  sizes: ['M', 'L'],
  features: ['Feature 1'],
};

const mockProduct2: Product = {
  id: 'test-2',
  slug: 'test-tee',
  name: 'Campus Tee',
  club: 'NIT Raipur Heritage',
  clubShort: 'Heritage',
  category: 'Campus Essentials',
  price: 599,
  originalPrice: 799,
  tagline: 'Collegiate Tee',
  description: 'Heavyweight',
  image: '/tee.png',
  badge: 'Staple',
  colorways: [{ name: 'Sand', hex: '#d2b48c' }],
  sizes: ['L'],
  features: ['240 GSM'],
};

test('calculateCartTotals calculates subtotal, savings, free handover, and total accurately', () => {
  const items: CartItem[] = [
    {
      cartItemId: 'test-1-Black-L',
      product: mockProduct1,
      selectedColor: { name: 'Black', hex: '#000000' },
      selectedSize: 'L',
      quantity: 2,
    },
    {
      cartItemId: 'test-2-Sand-L',
      product: mockProduct2,
      selectedColor: { name: 'Sand', hex: '#d2b48c' },
      selectedSize: 'L',
      quantity: 1,
    },
  ];

  const result = calculateCartTotals(items);
  // Subtotal = 1199 * 2 + 599 * 1 = 2398 + 599 = 2997
  assert.equal(result.subtotal, 2997);
  // Original subtotal = 1599 * 2 + 799 * 1 = 3198 + 799 = 3997
  assert.equal(result.originalSubtotal, 3997);
  // Savings = 3997 - 2997 = 1000
  assert.equal(result.totalSavings, 1000);
  // Handover is always free for campus students
  assert.equal(result.handoverFee, 0);
  assert.equal(result.total, 2997);
  assert.equal(result.itemCount, 3);
});

test('calculateDiscountPercent returns accurate discount percentage', () => {
  assert.equal(calculateDiscountPercent(1599, 1199), 25);
  assert.equal(calculateDiscountPercent(799, 599), 25);
  assert.equal(calculateDiscountPercent(99, 49), 51);
  assert.equal(calculateDiscountPercent(500, 500), 0);
});

test('generateOrderId creates valid NITRR format', () => {
  const orderId = generateOrderId();
  assert.match(orderId, /^NITRR-2026-\d{5}$/);
});

test('isValidRollNumber checks standard student roll formats', () => {
  assert.equal(isValidRollNumber('21115042'), true);
  assert.equal(isValidRollNumber('22118001'), true);
  assert.equal(isValidRollNumber('EC-2026'), true);
  assert.equal(isValidRollNumber('123'), false);
  assert.equal(isValidRollNumber(''), false);
});

test('isValidIndianPhone validates 10-digit mobile numbers', () => {
  assert.equal(isValidIndianPhone('9876543210'), true);
  assert.equal(isValidIndianPhone('+91 98765 43210'), true);
  assert.equal(isValidIndianPhone('12345'), false);
});

test('isValidUtrNumber validates 12-digit Indian UPI and banking reference numbers', () => {
  assert.equal(isValidUtrNumber('408219384910'), true);
  assert.equal(isValidUtrNumber('123456789012'), true);
  assert.equal(isValidUtrNumber('SBIN004819201'), true);
  assert.equal(isValidUtrNumber('123'), false);
  assert.equal(isValidUtrNumber(''), false);
});

test('getDepartmentFromRoll parses branch and batch from 8-digit roll number', () => {
  const result = getDepartmentFromRoll('21115042');
  assert.equal(result.branch, 'Computer Science & Engineering');
  assert.equal(result.degree, 'B.Tech');
  assert.equal(result.batch, '2021–2025');

  const archResult = getDepartmentFromRoll('22121015');
  assert.equal(archResult.branch, 'Architecture (B.Arch)');
  assert.equal(archResult.degree, 'B.Arch');
});

test('buildWhatsAppVerificationUrl encodes order and UTR verification message', () => {
  const url = buildWhatsAppVerificationUrl({
    id: 'NITRR-2026-99999',
    customerName: 'Aman Sharma',
    rollNumber: '21115042',
    phone: '9827103849',
    total: 1199,
    handoverType: 'makerspace_desk',
    utrNumber: '408219384910',
    items: [{ name: 'Varsity Jacket', quantity: 1 }],
  });

  assert.ok(url.startsWith('https://wa.me/917974766166?text='));
  assert.ok(url.includes(encodeURIComponent('NITRR-2026-99999')));
  assert.ok(url.includes(encodeURIComponent('408219384910')));
});

test('formatINR and formatPrice default cleanly to Indian Rupee formatting', () => {
  assert.equal(formatINR(1199), '₹1,199');
  assert.equal(formatPrice(1199), '₹1,199');
});

test('escapeCsvCell neutralizes CSV formula injection and escapes quotes', () => {
  assert.equal(escapeCsvCell('=CMD()'), `"'=CMD()"`);
  assert.equal(escapeCsvCell('+1+1'), `"'+1+1"`);
  assert.equal(escapeCsvCell('-2+3'), `"'-2+3"`);
  assert.equal(escapeCsvCell('@SUM(A1)'), `"'@SUM(A1)"`);
  assert.equal(escapeCsvCell('Hello "World"'), `"Hello ""World"""`);
});

