import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { handleHealthCheck } from './src/api/health.ts';
import { handleOrderProcessing } from './src/api/orders.ts';
import { handleAdminOperations } from './src/api/admin.ts';
import { handleCartOperations } from './src/api/cart.ts';
import { handleProductsApi } from './src/api/products.ts';
import { handleNewsletterOperations } from './src/api/newsletter.ts';
import { handleSupportApi } from './src/api/support.ts';
import { handleGeminiProxy } from './src/api/gemini.ts';
import { getStoreDatabase } from './src/server/db.ts';

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  // Initialize SQLite database & seed products on boot
  getStoreDatabase();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Baseline HTTP security headers across all responses
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(express.json({ limit: '4mb' }));

  // Mount API routes cleanly before Vite / static SPA fallback
  app.all('/api/health', (req, res) => handleHealthCheck(req as any, res as any));
  app.all('/api/orders', (req, res) => handleOrderProcessing(req as any, res as any));
  app.all('/api/admin', (req, res) => handleAdminOperations(req as any, res as any));
  app.all('/api/admin/*', (req, res) => handleAdminOperations(req as any, res as any));
  app.all('/api/products', (req, res) => handleProductsApi(req as any, res as any));
  app.all('/api/products/*', (req, res) => handleProductsApi(req as any, res as any));
  app.all('/api/cart', (req, res) => handleCartOperations(req as any, res as any));
  app.all('/api/cart/*', (req, res) => handleCartOperations(req as any, res as any));
  app.all('/api/newsletter', (req, res) => handleNewsletterOperations(req as any, res as any));
  app.all('/api/newsletter/*', (req, res) => handleNewsletterOperations(req as any, res as any));
  app.all('/api/support', (req, res) => handleSupportApi(req as any, res as any));
  app.all('/api/gemini', (req, res) => handleGeminiProxy(req as any, res as any));
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(
      express.static(distDir, {
        maxAge: '1h',
        setHeaders(res, filePath) {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NIT Raipur Store] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
