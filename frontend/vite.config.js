import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config para CMS frontend: puerto fijo y sin cambios automáticos
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
});