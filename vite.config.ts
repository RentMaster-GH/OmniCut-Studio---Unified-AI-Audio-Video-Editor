import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Stable configurations for web apps running on Vercel infrastructure
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  }
});
