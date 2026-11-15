import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: { port: 5210 },
  plugins: [react()],
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
});
