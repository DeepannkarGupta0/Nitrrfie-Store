import type { ApiRequest, ApiResponse } from './types.ts';
import { setSecurityHeaders } from './middleware.ts';
import { getStoreDatabase } from '../server/db.ts';

export function handleHealthCheck(req: ApiRequest, res: ApiResponse) {
  setSecurityHeaders(res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let dbReady = false;
  try {
    const db = getStoreDatabase();
    db.prepare('SELECT 1').get();
    dbReady = true;
  } catch {
    dbReady = false;
  }

  return res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'healthy' : 'degraded',
    database: dbReady ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
    service: 'NIT Raipur Merchandise & Operations Engine',
    uptime: process.uptime(),
  });
}
