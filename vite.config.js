import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';  // Built-in Node.js module for paths

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});