import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { spinsightApi } from './server/vitePlugin.js';

export default defineConfig({
  plugins: [react(), tailwindcss(), spinsightApi()],
  optimizeDeps: {
    include: ['pdfjs-dist', 'mammoth/mammoth.browser.js'],
  },
  server: {
    port: 3000,
    open: false
  }
});
