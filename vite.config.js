import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensure assets are loaded correctly on GitHub Pages
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  server: {
    port: 8081,
  }
});