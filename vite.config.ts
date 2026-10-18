import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveEntryPlugin: Plugin = {
  name: 'resolve-entry-plugin',
  resolveId(id) {
    if (
      id.endsWith('main.tsx') ||
      id.endsWith('main.ts') ||
      id === '/src/main.tsx' ||
      id === './src/main.tsx' ||
      id === 'src/main.tsx' ||
      id === '/main.tsx' ||
      id === './main.tsx' ||
      id === 'main.tsx'
    ) {
      const srcPath = path.resolve(__dirname, 'src/main.tsx');
      if (fs.existsSync(srcPath)) {
        return srcPath;
      }
      const rootPath = path.resolve(__dirname, 'main.tsx');
      if (fs.existsSync(rootPath)) {
        return rootPath;
      }
    }
    return null;
  },
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), resolveEntryPlugin],
    resolve: {
      alias: [
        { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
        { find: '@', replacement: path.resolve(__dirname, 'src') },
        { find: '@root', replacement: path.resolve(__dirname, '.') },
      ],
    },
    build: {
      target: 'esnext',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
