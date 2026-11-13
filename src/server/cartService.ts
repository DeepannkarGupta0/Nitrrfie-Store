import type { DatabaseSync } from 'node:sqlite';
import { runInTransaction } from './db.ts';
import { broadcastUserCartEvent } from './cartEvents.ts';
import { broadcastCatalogEvent } from './productEvents.ts';
import type {
  CartItem,
  Colorway,
  CustomDesign,
  HydratedCartPayload,
  Product,
} from '../types/store.ts';

export interface CartMutationInput {
  productId: string;
  colorName: string;
  colorHex?: string;
  size: string;
  quantity: number;
  customDesign?: CustomDesign;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  price: number;
  original_price: number;
  stock: number;
  in_stock: number;
  version?: number;
  data_json: string;
  updated_at: string;
}

interface CartRow {
  user_id: string;
  version: number;
  created_at: string;
  updated_at: string;
}

interface CartItemRow {
  id: string;
  user_id: string;
  product_id: string;
  variant_key: string;
  color_name: string;
  color_hex: string;
  size: string;
  custom_design_json: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export class CartServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = 'CART_ERROR') {
    super(message);
    this.name = 'CartServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function normalizeCustomDesign(design?: CustomDesign | null): CustomDesign | undefined {
  if (!design || typeof design !== 'object') return undefined;
  const text = typeof design.text === 'string' ? design.text.trim().slice(0, 40) : '';
  if (!text) return undefined;
  const placement =
    design.placement === 'chest_crest' || design.placement === 'sleeve_batch'
      ? design.placement
      : 'back_embroidery';
  const color = typeof design.color === 'string' && design.color.trim() ? design.color.trim() : '#ffffff';
  const fontSize =
    typeof design.fontSize === 'number' && Number.isFinite(design.fontSize)
      ? Math.min(48, Math.max(8, Math.round(design.fontSize)))
      : 18;
  return { text, placement, color, fontSize };
}

export function buildVariantKey(
  colorName: string,
  size: string,
  customDesign?: CustomDesign | null
): string {
  const cleanColor = colorName.trim() || 'Standard';
  const cleanSize = size.trim() || 'Free Size';
  const normalized = normalizeCustomDesign(customDesign);
  const customPart = normalized
    ? `${normalized.text.toUpperCase()}::${normalized.placement}::${normalized.color}`
    : '';
  return `${cleanColor}::${cleanSize}::${customPart}`;
}

export function buildCanonicalCartItemId(
  productId: string,
  colorName: string,
  size: string,
  customDesign?: CustomDesign | null
): string {
  const cleanColor = colorName.trim() || 'Standard';
  const cleanSize = size.trim() || 'Free Size';
  const normalized = normalizeCustomDesign(customDesign);
  const customKey = normalized ? `-${normalized.text}-${normalized.placement}` : '';
  return `${productId}-${cleanColor}-${cleanSize}${customKey}`;
}

function parseProductRow(row: ProductRow): Product {
  const parsed = JSON.parse(row.data_json) as Product;
  const version = typeof row.version === 'number' ? row.version : parsed.version ?? 1;
  return {
    ...parsed,
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    originalPrice: row.original_price,
    stock: row.stock,
    inStock: row.in_stock === 1 && row.stock > 0,
    version,
  };
}

export function getProductById(db: DatabaseSync, productId: string): Product | null {
  const row = db
    .prepare(
      `SELECT id, slug, name, price, original_price, stock, in_stock, version, data_json, updated_at
       FROM products WHERE id = ?`
    )
    .get(productId) as ProductRow | undefined;

  if (!row) return null;
  return parseProductRow(row);
}

export function getAllCatalogProducts(db: DatabaseSync): Product[] {
  const rows = db
    .prepare(
      `SELECT id, slug, name, price, original_price, stock, in_stock, version, data_json, updated_at
       FROM products ORDER BY rowid ASC`
    )
    .all() as unknown as ProductRow[];

  return rows.map(parseProductRow);
}

const DEFAULT_PRODUCT_IMAGE = '/assets/aistudio/nitrr_new_logo_new_155e66c7.png';
const MAX_PRODUCT_IMAGE_DATA_URL_LENGTH = 1_500_000;

function sanitizeProductImageUri(
  raw: unknown,
  fallback?: string,
  fieldLabel = 'Product image'
): string | undefined {
  if (raw === undefined || raw === null) return fallback;
  if (typeof raw !== 'string') {
    throw new CartServiceError(`${fieldLabel} must be a valid URL or uploaded image.`, 400, 'INVALID_IMAGE');
  }
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    if (trimmed.length > MAX_PRODUCT_IMAGE_DATA_URL_LENGTH) {
      throw new CartServiceError(
        `${fieldLabel} exceeds the 1MB uploaded image size limit. Please upload a smaller file or use an HTTPS URL.`,
        400,
        'IMAGE_TOO_LARGE'
      );
    }
    return trimmed;
  }
  throw new CartServiceError(
    `${fieldLabel} format is invalid. Use an HTTPS URL, local asset path, or PNG/JPG/WebP image up to 1MB.`,
    400,
    'INVALID_IMAGE'
  );
}

export function upsertCatalogProduct(
  db: DatabaseSync,
  product: Product,
  options: { expectedVersion?: number } = {}
): Product {
  const saved = runInTransaction(db, () => {
    const existingRow = db
      .prepare(`SELECT id, version FROM products WHERE id = ? LIMIT 1`)
      .get(product.id) as { id: string; version: number } | undefined;

    if (
      existingRow &&
      typeof options.expectedVersion === 'number' &&
      existingRow.version !== options.expectedVersion
    ) {
      throw new CartServiceError(
        `Product "${product.name}" was updated by another administrator. Refreshing latest catalog state.`,
        409,
        'VERSION_CONFLICT'
      );
    }

    const now = new Date().toISOString();
    const stock = typeof product.stock === 'number' ? Math.max(0, Math.floor(product.stock)) : 50;
    const inStock = product.inStock === false || stock <= 0 ? 0 : 1;
    const nextVersion = existingRow ? existingRow.version + 1 : 1;

    const normalized: Product = {
      ...product,
      image: sanitizeProductImageUri(product.image, DEFAULT_PRODUCT_IMAGE, 'Primary product image')!,
      secondaryImage: sanitizeProductImageUri(product.secondaryImage, undefined, 'Secondary product image'),
      price: Math.max(0, Math.round(product.price)),
      originalPrice: Math.max(0, Math.round(product.originalPrice)),
      stock,
      inStock: inStock === 1,
      version: nextVersion,
    };

    db.prepare(`
      INSERT INTO products (id, slug, name, price, original_price, stock, in_stock, version, data_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        price = excluded.price,
        original_price = excluded.original_price,
        stock = excluded.stock,
        in_stock = excluded.in_stock,
        version = products.version + 1,
        data_json = excluded.data_json,
        updated_at = excluded.updated_at
    `).run(
      normalized.id,
      normalized.slug,
      normalized.name,
      normalized.price,
      normalized.originalPrice,
      stock,
      inStock,
      nextVersion,
      JSON.stringify(normalized),
      now
    );

    return normalized;
  });

  broadcastCatalogEvent({
    type: 'catalog_updated',
    reason: 'product_upserted',
    productId: saved.id,
    updatedAt: new Date().toISOString(),
  });

  return saved;
}

export function deleteCatalogProduct(db: DatabaseSync, productId: string) {
  const info = db.prepare(`DELETE FROM products WHERE id = ?`).run(productId);
  if (info.changes > 0) {
    broadcastCatalogEvent({
      type: 'catalog_updated',
      reason: 'product_deleted',
      productId,
      updatedAt: new Date().toISOString(),
    });
  }
}

export function adjustCatalogProductStock(
  db: DatabaseSync,
  productId: string,
  delta: number
): Product | null {
  const updated = runInTransaction(db, () => {
    const existing = getProductById(db, productId);
    if (!existing) return null;
    const current = existing.stock ?? 50;
    const nextStock = Math.max(0, current + Math.trunc(delta));
    const nextVersion = (existing.version ?? 1) + 1;
    const now = new Date().toISOString();
    const nextProduct: Product = {
      ...existing,
      stock: nextStock,
      inStock: nextStock > 0,
      version: nextVersion,
    };
    db.prepare(`
      UPDATE products
      SET stock = ?, in_stock = ?, version = ?, data_json = ?, updated_at = ?
      WHERE id = ?
    `).run(nextStock, nextStock > 0 ? 1 : 0, nextVersion, JSON.stringify(nextProduct), now, productId);
    return nextProduct;
  });

  if (updated) {
    broadcastCatalogEvent({
      type: 'catalog_updated',
      reason: 'stock_adjusted',
      productId: updated.id,
      updatedAt: new Date().toISOString(),
    });
  }

  return updated;
}

function ensureUserCartRow(db: DatabaseSync, userId: string, now: string): CartRow {
  db.prepare(`
    INSERT OR IGNORE INTO carts (user_id, version, created_at, updated_at)
    VALUES (?, 1, ?, ?)
  `).run(userId, now, now);

  return db
    .prepare(`SELECT user_id, version, created_at, updated_at FROM carts WHERE user_id = ?`)
    .get(userId) as unknown as CartRow;
}

function touchUserCartVersion(db: DatabaseSync, userId: string, now: string): number {
  db.prepare(`
    UPDATE carts
    SET version = version + 1, updated_at = ?
    WHERE user_id = ?
  `).run(now, userId);

  const row = db
    .prepare(`SELECT version FROM carts WHERE user_id = ?`)
    .get(userId) as { version: number } | undefined;

  return row?.version ?? 1;
}

function resolveColorway(product: Product, colorName: string, colorHex?: string): Colorway {
  const match = product.colorways.find(
    (c) => c.name.toLowerCase() === colorName.trim().toLowerCase()
  );
  if (match) return match;
  if (product.colorways.length > 0) {
    return {
      name: colorName.trim() || product.colorways[0].name,
      hex: colorHex || product.colorways[0].hex,
    };
  }
  return { name: colorName.trim() || 'Standard', hex: colorHex || '#18181b' };
}

function resolveSize(product: Product, requestedSize: string): string {
  const clean = requestedSize.trim();
  const exact = product.sizes.find((s) => s.toLowerCase() === clean.toLowerCase());
  if (exact) return exact;
  if (clean) return clean;
  return product.sizes[0] || 'Free Size';
}

function buildFallbackUnavailableProduct(productId: string): Product {
  return {
    id: productId,
    slug: productId,
    name: 'Unavailable Archive Item',
    club: 'NIT Raipur Store',
    clubShort: 'Unavailable',
    category: 'Archive',
    price: 0,
    originalPrice: 0,
    tagline: 'This product is no longer listed in the active catalog.',
    description: 'Product removed or unavailable.',
    image: '/assets/aistudio/ecell-varsity-jacket_daef387e.png',
    badge: 'Unavailable',
    colorways: [{ name: 'Standard', hex: '#18181b' }],
    sizes: ['Free Size'],
    features: [],
    stock: 0,
    inStock: false,
  };
}

export function hydrateCartRows(
  db: DatabaseSync,
  userId: string,
  extraWarnings: string[] = []
): HydratedCartPayload {
  const cartRow = db
    .prepare(`SELECT user_id, version, created_at, updated_at FROM carts WHERE user_id = ?`)
    .get(userId) as CartRow | undefined;

  const rows = db
    .prepare(`
      SELECT id, user_id, product_id, variant_key, color_name, color_hex, size,
             custom_design_json, quantity, created_at, updated_at
      FROM cart_items
      WHERE user_id = ?
      ORDER BY created_at ASC, rowid ASC
    `)
    .all(userId) as unknown as CartItemRow[];

  const warnings: string[] = [...extraWarnings];
  let hasStockIssues = false;

  const items: CartItem[] = rows.map((row) => {
    const trustedProduct = getProductById(db, row.product_id);
    const customDesign = row.custom_design_json
      ? (JSON.parse(row.custom_design_json) as CustomDesign)
      : undefined;

    if (!trustedProduct) {
      hasStockIssues = true;
      warnings.push(
        `An item (${row.product_id}, ${row.size}) is no longer available in the catalog. Remove it before checkout.`
      );
      return {
        cartItemId: row.id,
        product: buildFallbackUnavailableProduct(row.product_id),
        selectedColor: { name: row.color_name, hex: row.color_hex },
        selectedSize: row.size,
        quantity: row.quantity,
        customDesign,
        availableStock: 0,
        availabilityStatus: 'unavailable',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    const availableStock = Math.max(0, trustedProduct.stock ?? 50);
    const isAvailable = trustedProduct.inStock !== false && availableStock > 0;
    let availabilityStatus: CartItem['availabilityStatus'] = 'available';

    if (!isAvailable) {
      availabilityStatus = 'out_of_stock';
      hasStockIssues = true;
      warnings.push(
        `"${trustedProduct.name}" (${row.color_name}, ${row.size}) is currently out of stock.`
      );
    } else if (row.quantity > availableStock) {
      hasStockIssues = true;
      warnings.push(
        `Only ${availableStock} unit(s) of "${trustedProduct.name}" are currently in stock (you have ${row.quantity} in your bag).`
      );
    }

    return {
      cartItemId: row.id,
      product: trustedProduct,
      selectedColor: resolveColorway(trustedProduct, row.color_name, row.color_hex),
      selectedSize: row.size,
      quantity: row.quantity,
      customDesign,
      availableStock,
      availabilityStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  return {
    items,
    version: cartRow?.version ?? 1,
    updatedAt: cartRow?.updated_at ?? new Date().toISOString(),
    warnings: Array.from(new Set(warnings)),
    hasStockIssues,
  };
}

export function getUserCart(db: DatabaseSync, userId: string): HydratedCartPayload {
  return hydrateCartRows(db, userId);
}

export function mergeGuestCart(
  db: DatabaseSync,
  userId: string,
  guestItems: CartMutationInput[],
  sourceClientId?: string
): HydratedCartPayload {
  const warnings: string[] = [];

  const result = runInTransaction(db, () => {
    const now = new Date().toISOString();
    ensureUserCartRow(db, userId, now);

    // Aggregate incoming guest items by canonical variant key so duplicates in guest payload combine cleanly
    const groupedGuest = new Map<string, CartMutationInput & { variantKey: string }>();

    for (const raw of guestItems) {
      if (!raw || typeof raw.productId !== 'string' || !raw.productId.trim()) continue;
      const qty = Math.max(1, Math.floor(Number(raw.quantity) || 1));
      const customDesign = normalizeCustomDesign(raw.customDesign);
      const variantKey = buildVariantKey(raw.colorName || 'Standard', raw.size || 'Free Size', customDesign);
      const mapKey = `${raw.productId.trim()}::${variantKey}`;
      const existing = groupedGuest.get(mapKey);
      if (existing) {
        existing.quantity += qty;
      } else {
        groupedGuest.set(mapKey, {
          productId: raw.productId.trim(),
          colorName: raw.colorName || 'Standard',
          colorHex: raw.colorHex,
          size: raw.size || 'Free Size',
          quantity: qty,
          customDesign,
          variantKey,
        });
      }
    }

    const selectExistingItem = db.prepare(`
      SELECT id, quantity FROM cart_items
      WHERE user_id = ? AND product_id = ? AND variant_key = ?
    `);

    const insertItem = db.prepare(`
      INSERT INTO cart_items (
        id, user_id, product_id, variant_key, color_name, color_hex, size,
        custom_design_json, quantity, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateItemQty = db.prepare(`
      UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?
    `);

    for (const entry of groupedGuest.values()) {
      const trustedProduct = getProductById(db, entry.productId);
      if (!trustedProduct) {
        // Keep unavailable guest items visible with explicit warning rather than silently discarding
        const canonicalColor = entry.colorName.trim() || 'Standard';
        const canonicalSize = entry.size.trim() || 'Free Size';
        const variantKey = buildVariantKey(canonicalColor, canonicalSize, entry.customDesign);
        const existingRow = selectExistingItem.get(userId, entry.productId, variantKey) as
          | { id: string; quantity: number }
          | undefined;

        if (!existingRow) {
          const itemId = buildCanonicalCartItemId(
            entry.productId,
            canonicalColor,
            canonicalSize,
            entry.customDesign
          );
          insertItem.run(
            itemId,
            userId,
            entry.productId,
            variantKey,
            canonicalColor,
            entry.colorHex || '#18181b',
            canonicalSize,
            entry.customDesign ? JSON.stringify(entry.customDesign) : null,
            entry.quantity,
            now,
            now
          );
        }
        warnings.push(
          `Item "${entry.productId}" from your guest bag is no longer in the store catalog and needs removal before checkout.`
        );
        continue;
      }

      const resolvedColor = resolveColorway(trustedProduct, entry.colorName, entry.colorHex);
      const resolvedSize = resolveSize(trustedProduct, entry.size);
      const variantKey = buildVariantKey(resolvedColor.name, resolvedSize, entry.customDesign);
      const availableStock = Math.max(0, trustedProduct.stock ?? 50);
      const existingRow = selectExistingItem.get(userId, trustedProduct.id, variantKey) as
        | { id: string; quantity: number }
        | undefined;

      if (trustedProduct.inStock === false || availableStock <= 0) {
        // Keep record cleanly so customer isn't left wondering where their item went
        if (!existingRow) {
          const itemId = buildCanonicalCartItemId(
            trustedProduct.id,
            resolvedColor.name,
            resolvedSize,
            entry.customDesign
          );
          insertItem.run(
            itemId,
            userId,
            trustedProduct.id,
            variantKey,
            resolvedColor.name,
            resolvedColor.hex,
            resolvedSize,
            entry.customDesign ? JSON.stringify(entry.customDesign) : null,
            entry.quantity,
            now,
            now
          );
        }
        warnings.push(
          `"${trustedProduct.name}" (${resolvedColor.name}, ${resolvedSize}) is currently out of stock.`
        );
        continue;
      }

      if (existingRow) {
        const combinedRaw = existingRow.quantity + entry.quantity;
        const cappedQty = Math.min(availableStock, combinedRaw);
        if (combinedRaw > availableStock) {
          warnings.push(
            `Combined quantity for "${trustedProduct.name}" (${resolvedColor.name}, ${resolvedSize}) was capped at available stock (${availableStock}).`
          );
        }
        updateItemQty.run(cappedQty, now, existingRow.id, userId);
      } else {
        const cappedQty = Math.min(availableStock, entry.quantity);
        if (entry.quantity > availableStock) {
          warnings.push(
            `Quantity for "${trustedProduct.name}" (${resolvedColor.name}, ${resolvedSize}) was adjusted to available stock (${availableStock}).`
          );
        }
        const itemId = buildCanonicalCartItemId(
          trustedProduct.id,
          resolvedColor.name,
          resolvedSize,
          entry.customDesign
        );
        insertItem.run(
          itemId,
          userId,
          trustedProduct.id,
          variantKey,
          resolvedColor.name,
          resolvedColor.hex,
          resolvedSize,
          entry.customDesign ? JSON.stringify(entry.customDesign) : null,
          cappedQty,
          now,
          now
        );
      }
    }

    if (groupedGuest.size > 0) {
      touchUserCartVersion(db, userId, now);
    }

    return hydrateCartRows(db, userId, warnings);
  });

  if (guestItems.length > 0) {
    broadcastUserCartEvent({
      type: 'cart_updated',
      userId,
      version: result.version,
      updatedAt: result.updatedAt,
      sourceClientId,
    });
  }

  return result;
}

export function addOrIncrementCartItem(
  db: DatabaseSync,
  userId: string,
  input: CartMutationInput,
  sourceClientId?: string
): HydratedCartPayload {
  const warnings: string[] = [];

  const result = runInTransaction(db, () => {
    const trustedProduct = getProductById(db, input.productId);
    if (!trustedProduct) {
      throw new CartServiceError('Selected product does not exist in store catalog.', 404, 'PRODUCT_NOT_FOUND');
    }

    const availableStock = Math.max(0, trustedProduct.stock ?? 50);
    if (trustedProduct.inStock === false || availableStock <= 0) {
      throw new CartServiceError(`"${trustedProduct.name}" is currently out of stock.`, 409, 'OUT_OF_STOCK');
    }

    const addQty = Math.max(1, Math.floor(Number(input.quantity) || 1));
    const customDesign = normalizeCustomDesign(input.customDesign);
    const resolvedColor = resolveColorway(trustedProduct, input.colorName, input.colorHex);
    const resolvedSize = resolveSize(trustedProduct, input.size);
    const variantKey = buildVariantKey(resolvedColor.name, resolvedSize, customDesign);
    const itemId = buildCanonicalCartItemId(
      trustedProduct.id,
      resolvedColor.name,
      resolvedSize,
      customDesign
    );
    const now = new Date().toISOString();

    ensureUserCartRow(db, userId, now);

    const existing = db
      .prepare(`
        SELECT id, quantity FROM cart_items
        WHERE user_id = ? AND product_id = ? AND variant_key = ?
      `)
      .get(userId, trustedProduct.id, variantKey) as { id: string; quantity: number } | undefined;

    if (existing) {
      const requestedTotal = existing.quantity + addQty;
      if (existing.quantity >= availableStock) {
        throw new CartServiceError(
          `Maximum available stock (${availableStock}) for "${trustedProduct.name}" is already in your bag.`,
          409,
          'STOCK_LIMIT_REACHED'
        );
      }
      const nextQty = Math.min(availableStock, requestedTotal);
      if (requestedTotal > availableStock) {
        warnings.push(
          `Quantity for "${trustedProduct.name}" (${resolvedSize}) capped at available stock (${availableStock}).`
        );
      }
      db.prepare(`UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?`).run(
        nextQty,
        now,
        existing.id,
        userId
      );
    } else {
      const nextQty = Math.min(availableStock, addQty);
      if (addQty > availableStock) {
        warnings.push(
          `Only ${availableStock} unit(s) of "${trustedProduct.name}" available; added ${nextQty}.`
        );
      }
      db.prepare(`
        INSERT INTO cart_items (
          id, user_id, product_id, variant_key, color_name, color_hex, size,
          custom_design_json, quantity, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        itemId,
        userId,
        trustedProduct.id,
        variantKey,
        resolvedColor.name,
        resolvedColor.hex,
        resolvedSize,
        customDesign ? JSON.stringify(customDesign) : null,
        nextQty,
        now,
        now
      );
    }

    touchUserCartVersion(db, userId, now);
    return hydrateCartRows(db, userId, warnings);
  });

  broadcastUserCartEvent({
    type: 'cart_updated',
    userId,
    version: result.version,
    updatedAt: result.updatedAt,
    sourceClientId,
  });

  return result;
}

export function setCartItemQuantity(
  db: DatabaseSync,
  userId: string,
  cartItemId: string,
  quantity: number,
  sourceClientId?: string
): HydratedCartPayload {
  const cleanQty = Math.floor(Number(quantity) || 0);

  if (cleanQty <= 0) {
    return removeCartItem(db, userId, cartItemId, sourceClientId);
  }

  const result = runInTransaction(db, () => {
    const row = db
      .prepare(`SELECT id, product_id FROM cart_items WHERE id = ? AND user_id = ?`)
      .get(cartItemId, userId) as { id: string; product_id: string } | undefined;

    if (!row) {
      throw new CartServiceError('Cart item not found for this account.', 404, 'CART_ITEM_NOT_FOUND');
    }

    const trustedProduct = getProductById(db, row.product_id);
    if (!trustedProduct || trustedProduct.inStock === false || (trustedProduct.stock ?? 50) <= 0) {
      throw new CartServiceError(
        'This item is currently out of stock or unavailable. Remove it from your bag.',
        409,
        'OUT_OF_STOCK'
      );
    }

    const availableStock = Math.max(0, trustedProduct.stock ?? 50);
    if (cleanQty > availableStock) {
      throw new CartServiceError(
        `Only ${availableStock} unit(s) of "${trustedProduct.name}" are available in stock.`,
        409,
        'STOCK_LIMIT_REACHED'
      );
    }

    const now = new Date().toISOString();
    db.prepare(`UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?`).run(
      cleanQty,
      now,
      cartItemId,
      userId
    );
    touchUserCartVersion(db, userId, now);

    return hydrateCartRows(db, userId);
  });

  broadcastUserCartEvent({
    type: 'cart_updated',
    userId,
    version: result.version,
    updatedAt: result.updatedAt,
    sourceClientId,
  });

  return result;
}

export function removeCartItem(
  db: DatabaseSync,
  userId: string,
  cartItemId: string,
  sourceClientId?: string
): HydratedCartPayload {
  const result = runInTransaction(db, () => {
    const now = new Date().toISOString();
    ensureUserCartRow(db, userId, now);
    const info = db
      .prepare(`DELETE FROM cart_items WHERE id = ? AND user_id = ?`)
      .run(cartItemId, userId);

    if (info.changes > 0) {
      touchUserCartVersion(db, userId, now);
    }
    return hydrateCartRows(db, userId);
  });

  broadcastUserCartEvent({
    type: 'cart_updated',
    userId,
    version: result.version,
    updatedAt: result.updatedAt,
    sourceClientId,
  });

  return result;
}

export function clearUserCart(
  db: DatabaseSync,
  userId: string,
  sourceClientId?: string
): HydratedCartPayload {
  const result = runInTransaction(db, () => {
    const now = new Date().toISOString();
    ensureUserCartRow(db, userId, now);
    db.prepare(`DELETE FROM cart_items WHERE user_id = ?`).run(userId);
    touchUserCartVersion(db, userId, now);
    return hydrateCartRows(db, userId);
  });

  broadcastUserCartEvent({
    type: 'cart_updated',
    userId,
    version: result.version,
    updatedAt: result.updatedAt,
    sourceClientId,
  });

  return result;
}

export function validateGuestCartItems(
  db: DatabaseSync,
  guestItems: CartMutationInput[]
): HydratedCartPayload {
  const warnings: string[] = [];
  let hasStockIssues = false;
  const validatedItems: CartItem[] = [];

  for (const raw of guestItems) {
    if (!raw || typeof raw.productId !== 'string') continue;
    const qty = Math.max(1, Math.floor(Number(raw.quantity) || 1));
    const customDesign = normalizeCustomDesign(raw.customDesign);
    const trustedProduct = getProductById(db, raw.productId.trim());

    if (!trustedProduct) {
      hasStockIssues = true;
      warnings.push(`Product "${raw.productId}" is no longer available in the store catalog.`);
      validatedItems.push({
        cartItemId: buildCanonicalCartItemId(raw.productId, raw.colorName || 'Standard', raw.size || 'Free Size', customDesign),
        product: buildFallbackUnavailableProduct(raw.productId),
        selectedColor: { name: raw.colorName || 'Standard', hex: raw.colorHex || '#18181b' },
        selectedSize: raw.size || 'Free Size',
        quantity: qty,
        customDesign,
        availableStock: 0,
        availabilityStatus: 'unavailable',
      });
      continue;
    }

    const availableStock = Math.max(0, trustedProduct.stock ?? 50);
    const resolvedColor = resolveColorway(trustedProduct, raw.colorName || 'Standard', raw.colorHex);
    const resolvedSize = resolveSize(trustedProduct, raw.size || 'Free Size');
    let availabilityStatus: CartItem['availabilityStatus'] = 'available';

    if (trustedProduct.inStock === false || availableStock <= 0) {
      availabilityStatus = 'out_of_stock';
      hasStockIssues = true;
      warnings.push(`"${trustedProduct.name}" (${resolvedColor.name}, ${resolvedSize}) is out of stock.`);
    } else if (qty > availableStock) {
      hasStockIssues = true;
      warnings.push(`Only ${availableStock} unit(s) of "${trustedProduct.name}" are currently in stock.`);
    }

    validatedItems.push({
      cartItemId: buildCanonicalCartItemId(trustedProduct.id, resolvedColor.name, resolvedSize, customDesign),
      product: trustedProduct,
      selectedColor: resolvedColor,
      selectedSize: resolvedSize,
      quantity: qty,
      customDesign,
      availableStock,
      availabilityStatus,
    });
  }

  return {
    items: validatedItems,
    version: 1,
    updatedAt: new Date().toISOString(),
    warnings: Array.from(new Set(warnings)),
    hasStockIssues,
  };
}
