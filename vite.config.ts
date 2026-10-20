import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveEntryPlugin: Plugin = {
  name: 'resolve-entry-plugin',
  enforce: 'pre',
  resolveId(id, importer) {
    // Only handle main.tsx requests from index.html
    const isMainRequest = 
      id === '/src/main.tsx' || 
      id === 'src/main.tsx' || 
      id.endsWith('/src/main.tsx');

    if (isMainRequest) {
      const candidates = [
        path.resolve(__dirname, 'src/main.tsx'),
        path.resolve(__dirname, 'main.tsx'),
        path.resolve(__dirname, 'src/main.ts'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          console.log(`[resolve-entry] Resolved ${id} -> ${p}`);
          return p;
        }
      }
      // Fallback: if src/main.tsx doesn't exist, try root main.tsx
      const rootMain = path.resolve(__dirname, 'main.tsx');
      if (fs.existsSync(rootMain)) return rootMain;
    }
    return null;
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), resolveEntryPlugin],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@root': path.resolve(__dirname, '.'),
    },
  },
  build: {
    target: 'esnext',
    sourcemap: false,
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
