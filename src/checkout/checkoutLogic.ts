import type { DepartmentInfo } from './types.ts';

export const STORE_UPI_ID = (import.meta.env?.VITE_STORE_UPI_ID as string | undefined) || 'nitrrfie.store@sbi';
export const COORDINATOR_PHONE = (import.meta.env?.VITE_COORDINATOR_PHONE as string | undefined) || '917974766166';

export const HOSTELS_LIST = [
  'Hostel H-1 (Sir M. Visvesvaraya Hall)',
  'Hostel H-2 (Dr. Homi Bhabha Hall)',
  'Hostel H-3 (Sir C.V. Raman Hall)',
  'Hostel H-4 (Acharya J.C. Bose Hall)',
  'Hostel H-5 (Srinivasa Ramanujan Hall)',
  'Hostel H-6 (Dr. A.P.J. Abdul Kalam Hall)',
  'Hostel H-7 (Vikram Sarabhai Hall)',
  'Hostel H-8 (Swami Vivekananda Hall)',
  'Hostel H-9 & H-10 Boys Hall',
  'PG & Research Scholars Hostel',
  'Mahanadi Girls Hostel (Tower 1)',
  'Indravati Girls Hostel (Tower 2)',
  'Shivnath Girls Hostel',
];

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount).replace('INR', '₹').trim();
}

export function isValidRollNumber(roll: string): boolean {
  const cleaned = roll.trim().toUpperCase();
  if (!cleaned) return false;
  return cleaned.length >= 4 && /^[A-Z0-9][A-Z0-9-]{3,19}$/.test(cleaned);
}

export function isValidIndianPhone(phone: string): boolean {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
}

export function isValidUtrNumber(utr: string): boolean {
  const cleaned = utr.trim().replace(/\s+/g, '');
  // Standard Indian Banking UPI / IMPS UTR is 12 digits, or up to 18 alphanumeric
  return /^[0-9]{12}$/.test(cleaned) || /^[A-Za-z0-9]{10,18}$/.test(cleaned);
}

export function getDepartmentFromRoll(roll: string): DepartmentInfo {
  const cleaned = roll.trim().toUpperCase();
  if (/^[0-9]{8}$/.test(cleaned)) {
    const yearPrefix = parseInt(cleaned.slice(0, 2), 10);
    const branchCode = cleaned.slice(2, 5);
    const gradYear = 2000 + yearPrefix + 4;
    const batch = `20${yearPrefix}–${gradYear}`;

    const branchMap: Record<string, string> = {
      '111': 'Biotechnology',
      '112': 'Biomedical Engineering',
      '113': 'Chemical Engineering',
      '114': 'Civil Engineering',
      '115': 'Computer Science & Engineering',
      '116': 'Electrical Engineering',
      '117': 'Electronics & Communication',
      '118': 'Mechanical Engineering',
      '119': 'Metallurgical & Materials',
      '120': 'Mining Engineering',
      '121': 'Architecture (B.Arch)',
      '122': 'Information Technology',
    };

    const branch = branchMap[branchCode] || 'Engineering Division';
    const degree = branchCode === '121' ? 'B.Arch' : 'B.Tech';

    return { branch, batch, degree };
  }

  if (cleaned.startsWith('MTECH') || cleaned.startsWith('PHD')) {
    return { branch: 'Postgraduate & Research', batch: '2024–2026', degree: 'M.Tech / Ph.D' };
  }

  return { branch: 'Campus Division', batch: 'Active Scholar', degree: 'NIT Raipur' };
}

export function buildWhatsAppVerificationUrl(
  order: {
    id: string;
    customerName: string;
    rollNumber?: string;
    phone: string;
    total: number;
    handoverType: string;
    deliveryAddress?: { addressLine: string; city: string; state: string; pincode: string };
    utrNumber?: string;
    items: { name: string; quantity: number }[];
  },
  coordinatorPhone = COORDINATOR_PHONE
): string {
  const itemsText = order.items.map((i) => `• ${i.name} (Qty: ${i.quantity})`).join('\n');
  let handoverPlace = 'Makerspace Desk (Ground Floor, Main Bldg)';
  if (order.handoverType === 'home_delivery') {
    handoverPlace = order.deliveryAddress
      ? `Pan-India Courier: ${order.deliveryAddress.addressLine}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}`
      : 'Pan-India Express Courier';
  } else if (order.handoverType === 'hostel_delivery') {
    handoverPlace = 'Hostel Handover';
  }

  const cleanRoll = order.rollNumber?.trim();
  const hasSpecificRoll = Boolean(cleanRoll && cleanRoll.toUpperCase() !== 'ALUMNI / DIRECT');

  const lines = [
    `🏛️ *NIT RAIPUR STORE — PAYMENT VERIFICATION*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Order ID:* ${order.id}`,
    `👤 *Customer:* ${order.customerName}`,
    ...(hasSpecificRoll ? [`🎓 *Roll / Batch:* ${cleanRoll}`] : []),
    `📱 *Phone:* ${order.phone}`,
    `🏢 *Fulfillment:* ${handoverPlace}`,
    `💰 *Amount Paid:* ₹${order.total.toLocaleString('en-IN')}`,
    `🔢 *UPI UTR / Ref:* ${order.utrNumber ? order.utrNumber : 'Verified / Confirmed'}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📦 *Items:*`,
    itemsText,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `✅ *Verified transaction — dispatched for processing.*`,
  ];
  const message = lines.join('\n');

  return `https://wa.me/${coordinatorPhone}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppStudentPingUrl(order: {
  id: string;
  customerName: string;
  phone: string;
  status: string;
  verificationStatus: string;
  utrNumber?: string;
  handoverType: string;
}): string {
  let cleanPhone = order.phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

  let statusText = 'being prepared for fulfillment';
  if (order.status === 'ready_for_handover') {
    statusText = order.handoverType === 'home_delivery'
      ? 'READY for courier pickup & nationwide dispatch with live tracking'
      : 'READY for collection at Makerspace Desk (Ground Floor, Main Building, 4:00 PM – 7:30 PM)';
  } else if (order.verificationStatus === 'desk_verified') {
    statusText = 'Payment verified by NITRRFIE Logistics Coordinator';
  }

  const message = [
    `👋 Hello ${order.customerName},`,
    `This is an update regarding your *NIT Raipur Store Order #${order.id}*.`,
    ``,
    `📌 *Status:* ${statusText}`,
    `🔢 *UTR Reference:* ${order.utrNumber || 'N/A'}`,
    `🏢 *Fulfillment:* ${order.handoverType === 'home_delivery' ? 'Pan-India Express Courier' : 'Campus Pickup Desk'}`,
    ``,
    `For any query, reply to this message or contact the NITRRFIE team.`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

