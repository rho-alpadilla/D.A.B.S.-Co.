import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';  // Built-in Node.js module for paths

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Keep every import on the same React runtime after dependency updates.
    dedupe: ['react', 'react-dom'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
