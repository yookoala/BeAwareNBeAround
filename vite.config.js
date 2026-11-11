import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { lingui } from '@lingui/vite-plugin';
import babel from '@rolldown/plugin-babel';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

const STATIC_ROUTES = [
  'diary',
  // M18 replaced /diary/event-log with this menu + sub-routes; the legacy
  // entry stays so saved links load and App.jsx redirects them.
  'diary/event',
  'diary/event/seizure',
  'diary/event/headache',
  'diary/event/medication',
  'diary/event/side-effects',
  'diary/event/health',
  'diary/event-log',
  'diary/profile',
  'diary/report/level-a',
  'diary/report/level-b',
  'resource',
];

function staticRouteHtmlPlugin() {
  let outDir = 'dist';
  return {
    name: 'static-route-html',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const indexHtmlPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) return;
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      fs.writeFileSync(path.join(outDir, '404.html'), html);
      for (const route of STATIC_ROUTES) {
        const routeDir = path.join(outDir, route);
        fs.mkdirSync(routeDir, { recursive: true });
        fs.writeFileSync(path.join(routeDir, 'index.html'), html);
      }
    },
  };
}

function normalizeBasePath(rawBase = process.env.VITE_BASE_PATH) {
  const trimmed = rawBase ? String(rawBase).trim() : '';
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  if (trimmed === './' || trimmed === '.') {
    return './';
  }
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

export default defineConfig({
  base: normalizeBasePath(),
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    lingui(),
    react(),
    babel({ plugins: ['@lingui/babel-plugin-lingui-macro'] }),
    VitePWA({
      registerType: 'autoUpdate',
      // Default globPatterns omit audio: precache the action recordings
      // (placeholder until the real recordings arrive) so Education Mode
      // keeps working offline.
      includeAssets: ['resources/*.mp3'],
      manifest: {
        name: "香港腦癇基金會 - 守望相助 (EFHK Be Aware n' Be Around)",
        short_name: 'EFHK 守望相助',
        description: '處理急性腦癇發作的口訣 / Acute Seizure Management Slogan',
        display: 'standalone',
        background_color: '#fff9f5',
        theme_color: '#f57c00',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
    staticRouteHtmlPlugin(),
  ],
  define: {
    'import.meta.env.VITE_VISIT_COUNTER_URL': JSON.stringify(
      'https://epilepsy.org.hk/counter/',
    ),
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/testSetup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
