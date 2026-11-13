import type { ApiRequest, ApiResponse } from './types.ts';
import {
  setSecurityHeaders,
  validateOrigin,
  enforceRateLimit,
  hasAdminPermission,
  verifyAdminSessionAsync,
} from './middleware.ts';
import { getStoreDatabase } from '../server/db.ts';
import {
  CartServiceError,
  adjustCatalogProductStock,
  deleteCatalogProduct,
  getAllCatalogProducts,
  getProductById,
  upsertCatalogProduct,
} from '../server/cartService.ts';
import { bumpAdminVersion, recordAuditLog } from '../server/adminEvents.ts';
import { subscribeToCatalogEvents } from '../server/productEvents.ts';
import type { Product } from '../types/store.ts';

function parseBody(req: ApiRequest): any {
  let body = req.body;
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }
  return body || {};
}

function getSourceClientId(req: ApiRequest): string | undefined {
  const raw = req.headers['x-client-instance-id'];
  return typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, 80) : undefined;
}

function getSubPath(req: ApiRequest): string {
  const url = (req as any).originalUrl || (req as any).url || '';
  const cleanUrl = url.split('?')[0];
  const idx = cleanUrl.indexOf('/api/products');
  if (idx === -1) return '';
  return cleanUrl.slice(idx + '/api/products'.length);
}

function handleCatalogEventsStream(req: ApiRequest, res: ApiResponse) {
  if (!validateOrigin(req, res)) return;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  res.write(
    `event: connected\ndata: ${JSON.stringify({ updatedAt: new Date().toISOString() })}\n\n`
  );

  const unsubscribe = subscribeToCatalogEvents((event) => {
    try {
      res.write(`event: catalog_updated\ndata: ${JSON.stringify(event)}\n\n`);
    } catch {
      // ignore closed socket
    }
  });

  const keepAlive = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      // ignore closed socket
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
}

export async function handleProductsApi(req: ApiRequest, res: ApiResponse) {
  const method = req.method?.toUpperCase() || 'GET';
  const subPath = getSubPath(req);

  if (
    method === 'GET' &&
    (subPath === '/events' || subPath === '/events/' || req.query?.stream === 'events')
  ) {
    return handleCatalogEventsStream(req, res);
  }

  setSecurityHeaders(res);
  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 60)) return;

  let db;
  try {
    db = getStoreDatabase();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Store database unavailable.',
      code: 'DB_UNAVAILABLE',
    });
  }

  const sourceClientId = getSourceClientId(req);

  if (method === 'GET') {
    try {
      const products = getAllCatalogProducts(db);
      return res.status(200).json({ success: true, products });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Unable to query catalog from database.',
        code: 'DB_READ_ERROR',
      });
    }
  }

  const auth = await verifyAdminSessionAsync(req, false);
  if (!auth.authorized || !auth.identity) {
    return res.status(auth.statusCode || 401).json({ error: auth.error });
  }

  const actorEmail = auth.identity.email || 'system';

  try {
    const body = parseBody(req);

    if (method === 'POST') {
      if (!hasAdminPermission(auth, 'manageProducts')) {
        return res.status(403).json({ error: 'Forbidden: Your role cannot create catalog items.' });
      }
      const product = body.product as Product | undefined;
      if (!product?.id || !product?.name) {
        return res.status(400).json({ error: 'Valid product payload with id and name is required.' });
      }
      const saved = upsertCatalogProduct(db, product);
      recordAuditLog(db, {
        officerEmail: actorEmail,
        action: 'PRODUCT_CREATED',
        targetId: saved.id,
        details: `Created product "${saved.name}" (₹${saved.price}, stock: ${saved.stock ?? 0}).`,
      });
      const meta = bumpAdminVersion(db, 'product_created', actorEmail, saved.id, sourceClientId);
      return res.status(200).json({ success: true, product: saved, metaVersion: meta.version });
    }

    if (method === 'PATCH') {
      if (!hasAdminPermission(auth, 'manageProducts')) {
        return res.status(403).json({ error: 'Forbidden: Your role cannot update catalog inventory.' });
      }
      if (body.action === 'adjust_stock' && typeof body.productId === 'string') {
        const delta = Math.trunc(Number(body.delta) || 0);
        const updated = adjustCatalogProductStock(db, body.productId, delta);
        if (!updated) {
          return res.status(404).json({ error: 'Product not found.' });
        }
        recordAuditLog(db, {
          officerEmail: actorEmail,
          action: 'STOCK_ADJUSTED',
          targetId: updated.id,
          details: `Adjusted stock for "${updated.name}" by ${delta >= 0 ? `+${delta}` : delta} (now ${updated.stock ?? 0} units).`,
        });
        const meta = bumpAdminVersion(db, 'stock_adjusted', actorEmail, updated.id, sourceClientId);
        return res.status(200).json({ success: true, product: updated, metaVersion: meta.version });
      }

      const product = body.product as Product | undefined;
      if (!product?.id) {
        return res.status(400).json({ error: 'Valid product payload with id is required.' });
      }
      const expectedVersion =
        typeof body.expectedVersion === 'number'
          ? body.expectedVersion
          : typeof product.version === 'number'
            ? product.version
            : undefined;
      const saved = upsertCatalogProduct(db, product, { expectedVersion });
      recordAuditLog(db, {
        officerEmail: actorEmail,
        action: 'PRODUCT_UPDATED',
        targetId: saved.id,
        details: `Updated product "${saved.name}" (₹${saved.price}, stock: ${saved.stock ?? 0}).`,
      });
      const meta = bumpAdminVersion(db, 'product_updated', actorEmail, saved.id, sourceClientId);
      return res.status(200).json({ success: true, product: saved, metaVersion: meta.version });
    }

    if (method === 'DELETE') {
      if (!hasAdminPermission(auth, 'deleteProducts')) {
        return res.status(403).json({ error: 'Forbidden: Your role cannot delete catalog items.' });
      }
      const productId = typeof body.productId === 'string' ? body.productId : '';
      if (!productId) {
        return res.status(400).json({ error: 'productId is required.' });
      }
      const existing = getProductById(db, productId);
      if (!existing) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      deleteCatalogProduct(db, productId);
      recordAuditLog(db, {
        officerEmail: actorEmail,
        action: 'PRODUCT_DELETED',
        targetId: productId,
        details: `Deleted catalog product "${existing.name}".`,
      });
      const meta = bumpAdminVersion(db, 'product_deleted', actorEmail, productId, sourceClientId);
      return res.status(200).json({ success: true, productId, metaVersion: meta.version });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: `Method ${method} not allowed.` });
  } catch (err: any) {
    if (err instanceof CartServiceError) {
      return res.status(err.statusCode).json({ error: err.message, code: err.code });
    }
    return res.status(400).json({ error: err?.message || 'Invalid product payload.' });
  }
}

