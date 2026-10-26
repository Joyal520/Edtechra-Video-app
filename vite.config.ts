import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { apiRouterMiddleware } from './server/apiRouter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiPlugin = () => ({
  name: 'api-server-middleware',
  configureServer(server: any) {
    server.middlewares.use(apiRouterMiddleware());
  },
  configurePreviewServer(server: any) {
    server.middlewares.use(apiRouterMiddleware());
  },
});

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
