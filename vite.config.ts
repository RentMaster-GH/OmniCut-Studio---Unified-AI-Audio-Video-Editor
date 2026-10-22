import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false, // disable HMR for custom server
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    }
  }
});
