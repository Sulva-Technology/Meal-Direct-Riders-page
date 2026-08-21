import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';

/**
 * Dev-only BFF: `vite dev` does not run the Vercel serverless functions under
 * `api/`, so `/api/auth/*` and `/api/proxy/*` 404 locally. This plugin mounts
 * those Node (req,res) handlers as dev middleware, mirroring Vercel's routing,
 * so login + the authenticated proxy work against a local backend.
 */
function bffDev(): Plugin {
  const routes: Record<string, string> = {
    '/api/auth/login': './api/auth/login.ts',
    '/api/auth/signup': './api/auth/signup.ts',
    '/api/auth/logout': './api/auth/logout.ts',
    '/api/auth/session': './api/auth/session.ts',
    '/api/auth/callback': './api/auth/callback.ts',
  };
  return {
    name: 'rider-bff-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url ?? '';
        const pathname = url.split('?')[0];
        if (!pathname.startsWith('/api/')) return next();
        const modPath = pathname.startsWith('/api/proxy/')
          ? './api/proxy/[...path].ts'
          : routes[pathname];
        if (!modPath) return next();
        try {
          const mod = await server.ssrLoadModule(modPath);
          await (mod.default as (r: IncomingMessage, s: ServerResponse) => Promise<void>)(req, res);
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          // eslint-disable-next-line no-console
          console.error(`[rider-bff-dev] ${pathname} failed:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ error: { code: 'BFF_DEV_ERROR', message: String(err) } }));
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // The Vercel handlers read the backend base from process.env; surface the
  // Vite env var so local dev targets the local backend, not the hosted one.
  if (env.VITE_API_BASE_URL) process.env.API_BASE_URL = env.VITE_API_BASE_URL;

  return {
    plugins: [react(), tailwindcss(), bffDev()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: false,
      watch: null,
    },
  };
});
