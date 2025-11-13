import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'development' ? '/' : '/CmsGaleriq/',
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
}));
