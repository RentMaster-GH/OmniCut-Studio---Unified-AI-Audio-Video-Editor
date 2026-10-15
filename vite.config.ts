import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Stable configurations for web apps running on Vercel infrastructure
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
