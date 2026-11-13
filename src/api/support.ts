import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { ApiRequest, ApiResponse } from './types.ts';
import {
  enforceRateLimit,
  hasAdminPermission,
  setSecurityHeaders,
  validateOrigin,
  verifyAdminSessionAsync,
} from './middleware.ts';
import { getStoreDatabase } from '../server/db.ts';
import { sanitizeString } from '../server/orderService.ts';
import { bumpAdminVersion } from '../server/adminEvents.ts';

export interface SupportInquiryRecord {
  id: string;
  organization: string;
  contactEmail: string;
  estimatedQuantity: number;
  notes: string;
  createdAt: string;
}

export function createSupportInquiry(
  db: DatabaseSync,
  payload: {
    organization?: unknown;
    contactEmail?: unknown;
    estimatedQuantity?: unknown;
    notes?: unknown;
  }
): SupportInquiryRecord {
  const organization = sanitizeString(payload.organization).slice(0, 140);
  const contactEmail = sanitizeString(payload.contactEmail).toLowerCase().slice(0, 120);
  const notes = sanitizeString(payload.notes).slice(0, 2000);
  const qtyNum = Math.floor(Number(payload.estimatedQuantity));

  if (!organization || organization.length < 2) {
    throw new Error('Club, department, or organization name is required (min 2 characters).');
  }
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new Error('A valid contact email address is required.');
  }
  if (!Number.isFinite(qtyNum) || qtyNum < 15 || qtyNum > 50000) {
    throw new Error('Estimated quantity must be between 15 and 50,000 units.');
  }
  if (!notes || notes.length < 5) {
    throw new Error('Please provide garment details and customization notes.');
  }

  const record: SupportInquiryRecord = {
    id: `INQ-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    organization,
    contactEmail,
    estimatedQuantity: qtyNum,
    notes,
    createdAt: new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO support_inquiries (id, organization, contact_email, estimated_quantity, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    record.id,
    record.organization,
    record.contactEmail,
    record.estimatedQuantity,
    record.notes,
    record.createdAt
  );

  return record;
}

export function listSupportInquiries(db: DatabaseSync): SupportInquiryRecord[] {
  const rows = db
    .prepare(
      `SELECT id, organization, contact_email, estimated_quantity, notes, created_at
       FROM support_inquiries ORDER BY created_at DESC LIMIT 200`
    )
    .all() as Array<{
    id: string;
    organization: string;
    contact_email: string;
    estimated_quantity: number;
    notes: string;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    organization: r.organization,
    contactEmail: r.contact_email,
    estimatedQuantity: r.estimated_quantity,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export async function handleSupportApi(req: ApiRequest, res: ApiResponse) {
  setSecurityHeaders(res);

  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 30)) return;

  const method = req.method?.toUpperCase() || 'POST';

  if (method === 'GET') {
    const auth = await verifyAdminSessionAsync(req, false);
    if (!auth.authorized || !auth.identity) {
      return res.status(auth.statusCode || 401).json({
        success: false,
        error: auth.error || 'Administrative authorization required.',
      });
    }
    if (!hasAdminPermission(auth, 'viewDashboard')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Missing permission to view bulk inquiries.',
      });
    }
    try {
      const db = getStoreDatabase();
      const inquiries = listSupportInquiries(db);
      return res.status(200).json({ success: true, inquiries });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Unable to fetch bulk inquiries from database.',
      });
    }
  }

  if (method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: `Method ${method} Not Allowed on /api/support.` });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Malformed JSON payload.' });
    }
  }

  try {
    const db = getStoreDatabase();
    const inquiry = createSupportInquiry(db, body || {});
    bumpAdminVersion(db, 'support_inquiry_created', inquiry.contactEmail, inquiry.id);
    return res.status(201).json({
      success: true,
      inquiry: {
        id: inquiry.id,
        organization: inquiry.organization,
        contactEmail: inquiry.contactEmail,
        estimatedQuantity: inquiry.estimatedQuantity,
        createdAt: inquiry.createdAt,
      },
      message: 'Bulk order inquiry recorded cleanly with NITRRFIE Operations.',
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err?.message || 'Unable to submit bulk inquiry.',
    });
  }
}
