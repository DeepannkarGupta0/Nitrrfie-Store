import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { PRODUCTS } from '../data/products.ts';
import { INITIAL_COUPONS } from '../data/coupons.ts';
import { getRoleTitleForRole } from '../config/clerk.ts';
import { STAFF_EMAIL_SEED, getDefaultRoleForEmail } from './staffConfig.ts';
import type { Product } from '../types/store.ts';

let singletonDb: DatabaseSync | null = null;
let singletonDbPath: string | null = null;

function ensureDirectoryForFile(filePath: string) {
  if (filePath === ':memory:' || filePath.startsWith('file:')) return;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function initializeSchema(db: DatabaseSync) {
  try {
    db.exec(`PRAGMA journal_mode = WAL;`);
  } catch {
    // Fallback to default journal mode on filesystems that restrict WAL sidecars
  }
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      original_price INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 50,
      in_stock INTEGER NOT NULL DEFAULT 1,
      version INTEGER NOT NULL DEFAULT 1,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS carts (
      user_id TEXT PRIMARY KEY,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES carts(user_id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      variant_key TEXT NOT NULL,
      color_name TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      size TEXT NOT NULL,
      custom_design_json TEXT,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, product_id, variant_key)
    );

    CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      utr_number TEXT,
      idempotency_key TEXT,
      status TEXT NOT NULL,
      total INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      cancelled_at TEXT,
      cancellation_reason TEXT,
      refund_status TEXT,
      updated_by TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_utr ON orders(utr_number);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value INTEGER NOT NULL,
      min_order_amount INTEGER NOT NULL DEFAULT 0,
      max_discount INTEGER,
      expires_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      usage_count INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      officer_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      details TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

    CREATE TABLE IF NOT EXISTS staff_roster (
      email TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      role_title TEXT NOT NULL,
      added_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_meta (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'unsubscribed')),
      consent_given INTEGER NOT NULL DEFAULT 1,
      consent_source TEXT NOT NULL DEFAULT 'newsletter_form',
      unsubscribe_token TEXT NOT NULL UNIQUE,
      confirmation_email_status TEXT NOT NULL DEFAULT 'pending',
      confirmation_message_id TEXT,
      confirmation_sent_at TEXT,
      confirmed_at TEXT,
      brevo_contact_synced INTEGER NOT NULL DEFAULT 0,
      brevo_contact_synced_at TEXT,
      subscribed_at TEXT NOT NULL,
      unsubscribed_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
    CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);

    CREATE TABLE IF NOT EXISTS support_inquiries (
      id TEXT PRIMARY KEY,
      organization TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      estimated_quantity INTEGER NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_support_inquiries_created_at ON support_inquiries(created_at DESC);
  `);

  // Non-destructive migration for existing newsletter_subscribers columns
  const existingCols = new Set(
    (db.prepare(`PRAGMA table_info(newsletter_subscribers)`).all() as Array<{ name: string }>).map(
      (col) => col.name
    )
  );
  if (!existingCols.has('confirmed_at')) {
    db.exec(`ALTER TABLE newsletter_subscribers ADD COLUMN confirmed_at TEXT`);
  }
  if (!existingCols.has('brevo_contact_synced')) {
    db.exec(`ALTER TABLE newsletter_subscribers ADD COLUMN brevo_contact_synced INTEGER NOT NULL DEFAULT 0`);
  }
  if (!existingCols.has('brevo_contact_synced_at')) {
    db.exec(`ALTER TABLE newsletter_subscribers ADD COLUMN brevo_contact_synced_at TEXT`);
  }

  // Non-destructive migration for existing orders table
  const existingOrderCols = new Set(
    (db.prepare(`PRAGMA table_info(orders)`).all() as Array<{ name: string }>).map(
      (col) => col.name
    )
  );
  if (!existingOrderCols.has('idempotency_key')) {
    db.exec(`ALTER TABLE orders ADD COLUMN idempotency_key TEXT`);
  }
  if (!existingOrderCols.has('version')) {
    db.exec(`ALTER TABLE orders ADD COLUMN version INTEGER NOT NULL DEFAULT 1`);
  }
  if (!existingOrderCols.has('cancelled_at')) {
    db.exec(`ALTER TABLE orders ADD COLUMN cancelled_at TEXT`);
  }
  if (!existingOrderCols.has('cancellation_reason')) {
    db.exec(`ALTER TABLE orders ADD COLUMN cancellation_reason TEXT`);
  }
  if (!existingOrderCols.has('refund_status')) {
    db.exec(`ALTER TABLE orders ADD COLUMN refund_status TEXT`);
  }
  if (!existingOrderCols.has('updated_by')) {
    db.exec(`ALTER TABLE orders ADD COLUMN updated_by TEXT`);
  }
  // Non-destructive migration for existing products table
  const existingProductCols = new Set(
    (db.prepare(`PRAGMA table_info(products)`).all() as Array<{ name: string }>).map(
      (col) => col.name
    )
  );
  if (!existingProductCols.has('version')) {
    db.exec(`ALTER TABLE products ADD COLUMN version INTEGER NOT NULL DEFAULT 1`);
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency
    ON orders(idempotency_key)
    WHERE idempotency_key IS NOT NULL
  `);
}

export function seedCatalogIfEmpty(db: DatabaseSync, catalog: Product[] = PRODUCTS) {
  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO products (
      id, slug, name, price, original_price, stock, in_stock, data_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const product of catalog) {
    const stock = typeof product.stock === 'number' ? Math.max(0, Math.floor(product.stock)) : 50;
    const inStock = product.inStock === false || stock <= 0 ? 0 : 1;
    const normalized: Product = {
      ...product,
      stock,
      inStock: inStock === 1,
    };
    insertStmt.run(
      product.id,
      product.slug,
      product.name,
      Math.max(0, Math.round(product.price)),
      Math.max(0, Math.round(product.originalPrice)),
      stock,
      inStock,
      JSON.stringify(normalized),
      now
    );
  }

  // Non-destructive migration: replace legacy Unsplash / placeholder URLs in already-seeded databases
  // with authentic catalog merchandise images while preserving any custom admin edits.
  const selectExistingStmt = db.prepare(`SELECT data_json FROM products WHERE id = ?`);
  const updateImageStmt = db.prepare(`UPDATE products SET data_json = ?, updated_at = ? WHERE id = ?`);

  for (const product of catalog) {
    const row = selectExistingStmt.get(product.id) as { data_json: string } | undefined;
    if (!row) continue;
    try {
      const parsed = JSON.parse(row.data_json) as Product;
      let changed = false;

      if (
        !parsed.image ||
        parsed.image.includes('images.unsplash.com') ||
        parsed.image === '/assets/aistudio/ecell-varsity-jacket_daef387e.png'
      ) {
        parsed.image = product.image;
        changed = true;
      }

      if (parsed.secondaryImage && parsed.secondaryImage.includes('images.unsplash.com')) {
        if (product.secondaryImage) {
          parsed.secondaryImage = product.secondaryImage;
        } else {
          delete parsed.secondaryImage;
        }
        changed = true;
      } else if (!parsed.secondaryImage && product.secondaryImage && changed) {
        parsed.secondaryImage = product.secondaryImage;
      }

      if (changed) {
        updateImageStmt.run(JSON.stringify(parsed), now, product.id);
      }
    } catch {
      // ignore malformed JSON rows
    }
  }
}

export function seedAdminFoundationIfEmpty(db: DatabaseSync) {
  const now = new Date().toISOString();

  // Seed initial coupons ONLY when coupons table has zero rows (with usage_count = 0)
  const couponCount = db.prepare(`SELECT COUNT(*) AS count FROM coupons`).get() as { count: number };
  if (couponCount.count === 0) {
    const insertCoupon = db.prepare(`
      INSERT OR IGNORE INTO coupons (
        code, discount_type, discount_value, min_order_amount, max_discount,
        expires_at, is_active, usage_count, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `);
    for (const c of INITIAL_COUPONS) {
      insertCoupon.run(
        c.code.toUpperCase(),
        c.discountType,
        Math.round(c.discountValue),
        Math.round(c.minOrderAmount || 0),
        typeof c.maxDiscount === 'number' ? Math.round(c.maxDiscount) : null,
        c.expiresAt || null,
        c.isActive ? 1 : 0,
        c.description,
        now,
        now
      );
    }
  }

  // Seed default institutional staff whitelist into centralized DB roster
  const insertStaff = db.prepare(`
    INSERT OR IGNORE INTO staff_roster (email, role, role_title, added_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const email of STAFF_EMAIL_SEED) {
    const cleanEmail = email.toLowerCase().trim();
    const role = getDefaultRoleForEmail(cleanEmail);
    insertStaff.run(
      cleanEmail,
      role,
      getRoleTitleForRole(role),
      'system',
      now,
      now
    );
  }

  db.prepare(`
    INSERT OR IGNORE INTO admin_meta (id, version, updated_at)
    VALUES ('global', 1, ?)
  `).run(now);
}

function loadDatabaseSyncConstructor(): typeof DatabaseSync {
  try {
    const req = createRequire(import.meta.url);
    const mod = req('node:sqlite') as { DatabaseSync?: typeof DatabaseSync };
    if (!mod?.DatabaseSync) {
      throw new Error('DatabaseSync export is missing from node:sqlite.');
    }
    return mod.DatabaseSync;
  } catch (err: any) {
    throw new Error(
      `SQLite runtime unavailable (${err?.message || 'node:sqlite not supported'}). Ensure Node.js 22.x is selected in Vercel Project Settings -> General -> Node.js Version.`
    );
  }
}

export function createStoreDatabase(dbPath: string): DatabaseSync {
  const DatabaseSyncCtor = loadDatabaseSyncConstructor();
  ensureDirectoryForFile(dbPath);
  const db = new DatabaseSyncCtor(dbPath);
  initializeSchema(db);
  seedCatalogIfEmpty(db);
  seedAdminFoundationIfEmpty(db);
  return db;
}

function resolveWritableDbPath(): string {
  const configured = process.env.STORE_DB_PATH?.trim();
  if (configured) return configured;

  const isServerlessReadOnly =
    process.env.VERCEL === '1' ||
    Boolean(process.env.VERCEL_ENV) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerlessReadOnly) {
    return path.join(os.tmpdir(), 'nitrr-store.db');
  }

  const defaultPath = path.join(process.cwd(), 'data', 'store.db');
  try {
    ensureDirectoryForFile(defaultPath);
    fs.accessSync(path.dirname(defaultPath), fs.constants.W_OK);
    return defaultPath;
  } catch {
    return path.join(os.tmpdir(), 'nitrr-store.db');
  }
}

export function getStoreDatabase(): DatabaseSync {
  const targetPath = resolveWritableDbPath();

  if (singletonDb && singletonDbPath === targetPath) {
    return singletonDb;
  }

  if (singletonDb) {
    try {
      singletonDb.close();
    } catch {
      // ignore close errors
    }
  }

  singletonDb = createStoreDatabase(targetPath);
  singletonDbPath = targetPath;
  return singletonDb;
}

export function closeStoreDatabaseSingletonForTest() {
  if (singletonDb) {
    try {
      singletonDb.close();
    } catch {
      // ignore close errors
    }
  }
  singletonDb = null;
  singletonDbPath = null;
}

export function runInTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    throw err;
  }
}
