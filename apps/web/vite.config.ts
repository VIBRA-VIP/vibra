import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8')) as {
  version: string;
};

const shortSha = (
  process.env.COMMIT_REF ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  ''
).slice(0, 7);
const appVersion =
  process.env.VITE_APP_VERSION ?? (shortSha ? `${pkg.version}+${shortSha}` : pkg.version);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@vibra/shared': path.resolve(rootDir, '../../packages/shared/src/index.ts'),
      '@vibra/types': path.resolve(rootDir, '../../packages/types/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
