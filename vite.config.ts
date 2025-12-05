import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  base: './',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@': resolve(__dirname, 'src/renderer/FastTranslate'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
  esbuild: {
    target: 'es2022',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@arco-design/web-react'],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
