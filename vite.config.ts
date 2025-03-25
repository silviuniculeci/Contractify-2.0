import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs',  // Point to your CJS config
  },
  server: {
    port: 3001,
    strictPort: false, // Allow fallback to another port if 3001 is not available
    host: true         // Listen on all addresses
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});