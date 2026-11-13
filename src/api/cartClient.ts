import type { CartItem, CustomDesign, HydratedCartPayload, Product } from '../types/store';

export interface CartApiResponse extends HydratedCartPayload {
  success?: boolean;
  error?: string;
  code?: string;
}

export interface GuestCartItemPayload {
  productId: string;
  colorName: string;
  colorHex?: string;
  size: string;
  quantity: number;
  customDesign?: CustomDesign;
}

// Per-tab instance identifier so SSE broadcasts can avoid redundant self-refetching
export const CLIENT_INSTANCE_ID: string =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function serializeGuestItemsForApi(items: CartItem[]): GuestCartItemPayload[] {
  return items.map((item) => ({
    productId: item.product.id,
    colorName: item.selectedColor.name,
    colorHex: item.selectedColor.hex,
    size: item.selectedSize,
    quantity: item.quantity,
    customDesign: item.customDesign,
  }));
}

async function cartFetch(
  url: string,
  options: RequestInit,
  token?: string | null
): Promise<{ ok: boolean; status: number; data: any }> {
  const headers: Record<string, string> = {
    'X-Client-Instance-Id': CLIENT_INSTANCE_ID,
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return {
      ok: false,
      status: res.status,
      data: {
        error: `Store API returned unexpected response (status ${res.status}).`,
      },
    };
  }

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function apiFetchAuthenticatedCart(token: string) {
  return cartFetch('/api/cart', { method: 'GET' }, token);
}

export async function apiMergeGuestCart(token: string, items: CartItem[]) {
  return cartFetch(
    '/api/cart/merge',
    {
      method: 'POST',
      body: JSON.stringify({ items: serializeGuestItemsForApi(items) }),
    },
    token
  );
}

export async function apiAddCartItem(
  token: string,
  payload: {
    productId: string;
    colorName: string;
    colorHex?: string;
    size: string;
    quantity: number;
    customDesign?: CustomDesign;
  }
) {
  return cartFetch(
    '/api/cart/items',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function apiUpdateCartItemQuantity(
  token: string,
  cartItemId: string,
  quantity: number
) {
  return cartFetch(
    '/api/cart/items',
    {
      method: 'PATCH',
      body: JSON.stringify({ cartItemId, quantity }),
    },
    token
  );
}

export async function apiRemoveCartItem(token: string, cartItemId: string) {
  return cartFetch(
    '/api/cart/items',
    {
      method: 'DELETE',
      body: JSON.stringify({ cartItemId }),
    },
    token
  );
}

export async function apiClearAuthenticatedCart(token: string) {
  return cartFetch('/api/cart', { method: 'DELETE' }, token);
}

export async function apiValidateGuestCart(items: CartItem[]) {
  return cartFetch(
    '/api/cart/validate',
    {
      method: 'POST',
      body: JSON.stringify({ items: serializeGuestItemsForApi(items) }),
    },
    null
  );
}

export async function apiFetchCatalogProducts(): Promise<{
  ok: boolean;
  products?: Product[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/products', { method: 'GET' });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        error: `Catalog endpoint returned unexpected response (status ${res.status}).`,
      };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: data?.error || `Catalog service returned status ${res.status}.`,
      };
    }
    if (Array.isArray(data?.products)) {
      return { ok: true, products: data.products };
    }
    return { ok: false, error: 'Catalog response payload was invalid.' };
  } catch {
    return { ok: false, error: 'Unable to reach store catalog service.' };
  }
}
