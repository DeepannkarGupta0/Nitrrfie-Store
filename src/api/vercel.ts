import { handleHealthCheck } from './health.ts';
import { handleOrderProcessing } from './orders.ts';
import { handleAdminOperations } from './admin.ts';
import { handleCartOperations } from './cart.ts';
import { handleProductsApi } from './products.ts';
import { handleNewsletterOperations } from './newsletter.ts';
import { handleSupportApi } from './support.ts';
import { handleGeminiProxy } from './gemini.ts';
import { getStoreDatabase } from '../server/db.ts';
import type { ApiRequest, ApiResponse } from './types.ts';

function normalizeVercelRequest(req: any): ApiRequest {
  const rawQuery = { ...(req.query || {}) } as Record<string, string | string[]>;
  const pathParam = rawQuery.__path;
  delete rawQuery.__path;

  const subPath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam || '';
  const cleanSubPath = String(subPath).replace(/^\/+/, '');

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawQuery)) {
    if (Array.isArray(value)) {
      for (const v of value) searchParams.append(key, v);
    } else if (typeof value === 'string') {
      searchParams.set(key, value);
    }
  }
  const qs = searchParams.toString();

  const normalizedPath = cleanSubPath ? `/api/${cleanSubPath}` : '/api';
  const normalizedUrl = qs ? `${normalizedPath}?${qs}` : normalizedPath;

  req.query = rawQuery;
  req.originalUrl = normalizedUrl;
  req.url = normalizedUrl;
  return req as ApiRequest;
}

export default async function handler(req: any, res: any) {
  if (req.method?.toUpperCase() === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Client-Instance-Id, X-Admin-Key'
    );
    return res.status(204).end();
  }

  const apiReq = normalizeVercelRequest(req);
  const apiRes = res as ApiResponse;
  const cleanPath = (apiReq.originalUrl || apiReq.url || '').split('?')[0].replace(/\/+$/, '');

  try {
    if (cleanPath === '/api/health') {
      return await handleHealthCheck(apiReq, apiRes);
    }

    getStoreDatabase();

    if (cleanPath === '/api/orders') {
      return await handleOrderProcessing(apiReq, apiRes);
    }
    if (cleanPath === '/api/admin' || cleanPath.startsWith('/api/admin/')) {
      return await handleAdminOperations(apiReq, apiRes);
    }
    if (cleanPath === '/api/products' || cleanPath.startsWith('/api/products/')) {
      return await handleProductsApi(apiReq, apiRes);
    }
    if (cleanPath === '/api/cart' || cleanPath.startsWith('/api/cart/')) {
      return await handleCartOperations(apiReq, apiRes);
    }
    if (cleanPath === '/api/newsletter' || cleanPath.startsWith('/api/newsletter/')) {
      return await handleNewsletterOperations(apiReq, apiRes);
    }
    if (cleanPath === '/api/support') {
      return await handleSupportApi(apiReq, apiRes);
    }
    if (cleanPath === '/api/gemini') {
      return await handleGeminiProxy(apiReq, apiRes);
    }

    return apiRes.status(404).json({ error: 'API endpoint not found.' });
  } catch (err: any) {
    console.error('[Vercel API] Unhandled error:', err);
    return apiRes.status(500).json({
      error: typeof err?.message === 'string' && err.message ? err.message : 'Internal server error processing API request.',
    });
  }
}
