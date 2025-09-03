import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index-htmx.ts'),
      formats: ['es'],
      fileName: () => '_worker.js',
    },
    rollupOptions: {
      external: ['node:*', 'cloudflare:*'],
    },
    target: 'esnext',
    minify: false,
    outDir: 'dist',
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});