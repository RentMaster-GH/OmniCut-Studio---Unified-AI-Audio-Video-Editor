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
    const targets = [
      'src/main.tsx',
      '/src/main.tsx',
      './src/main.tsx',
      'main.tsx',
      '/main.tsx',
      './main.tsx'
    ];
    
    if (targets.includes(id)) {
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
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      minify: 'esbuild',
      sourcemap: false
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
