import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { AuditLogEntry } from '../types/store.ts';

export interface AdminSyncEventPayload {
  type: 'admin_updated';
  reason: string;
  version: number;
  updatedAt: string;
  actorEmail?: string;
  targetId?: string;
  sourceClientId?: string;
}

type AdminEventListener = (event: AdminSyncEventPayload) => void;

const adminListeners = new Set<AdminEventListener>();

export function subscribeToAdminEvents(listener: AdminEventListener): () => void {
  adminListeners.add(listener);
  return () => {
    adminListeners.delete(listener);
  };
}

export function broadcastAdminEvent(event: AdminSyncEventPayload) {
  if (adminListeners.size === 0) return;
  for (const listener of adminListeners) {
    try {
      listener(event);
    } catch {
      // Isolate individual listener errors
    }
  }
}

export function getAdminMeta(db: DatabaseSync): { version: number; updatedAt: string } {
  const row = db
    .prepare(`SELECT version, updated_at FROM admin_meta WHERE id = 'global'`)
    .get() as { version: number; updated_at: string } | undefined;

  if (!row) {
    const now = new Date().toISOString();
    db.prepare(`INSERT OR IGNORE INTO admin_meta (id, version, updated_at) VALUES ('global', 1, ?)`).run(
      now
    );
    return { version: 1, updatedAt: now };
  }
  return { version: row.version, updatedAt: row.updated_at };
}

export function bumpAdminVersion(
  db: DatabaseSync,
  reason: string,
  actorEmail?: string,
  targetId?: string,
  sourceClientId?: string
): { version: number; updatedAt: string } {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO admin_meta (id, version, updated_at)
    VALUES ('global', 1, ?)
    ON CONFLICT(id) DO UPDATE SET
      version = admin_meta.version + 1,
      updated_at = excluded.updated_at
  `).run(now);

  const meta = getAdminMeta(db);
  broadcastAdminEvent({
    type: 'admin_updated',
    reason,
    version: meta.version,
    updatedAt: meta.updatedAt,
    actorEmail,
    targetId,
    sourceClientId,
  });

  return meta;
}

export function recordAuditLog(
  db: DatabaseSync,
  entry: {
    officerEmail: string;
    action: AuditLogEntry['action'];
    targetId?: string;
    details: string;
  }
): AuditLogEntry {
  const now = new Date().toISOString();
  const id = `log-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const officerEmail = (entry.officerEmail || 'system').toLowerCase().trim();

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, officer_email, action, target_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, now, officerEmail, entry.action, entry.targetId || null, entry.details);

  return {
    id,
    timestamp: now,
    officerEmail,
    action: entry.action,
    targetId: entry.targetId,
    details: entry.details,
  };
}
