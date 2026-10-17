import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

/** Where smplr streams the comping samples from. */
const SAMPLE_HOSTS = ['gleitz.github.io', 'smpldsnds.github.io', 'goldst.dev'];

export default defineConfig({
  plugins: [
    svelte(),
    // The service worker keeps the whole app, and any samples comping has
    // played, so it opens and runs with the Pi out of reach. Settings are kept
    // on the device by the trainer itself, not here.
    VitePWA({
      registerType: 'autoUpdate',
      // public/manifest.webmanifest is the manifest; index.html links it.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => SAMPLE_HOSTS.includes(url.hostname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'samples',
              expiration: { maxEntries: 600 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    // Fail loudly rather than drifting to 5174; the backend's CORS allowlist
    // and these notes both name 5173.
    strictPort: true,
    proxy: {
      '/api': 'http://127.0.0.1:8000'
    }
  }
});
