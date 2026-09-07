import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
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
