import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remove-crossorigin',
      transformIndexHtml(html: string) {
        return html.replace(/ crossorigin(=["']?[^"'\s>]*["']?)?/g, '');
      }
    }
  ],
  base: './',
  server: {
    port: 3000,
    host: true,
    open: false
  },
  build: {
    modulePreload: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-icons': ['lucide-react'],
          'vendor-capacitor': ['@capacitor/core', '@capacitor/camera']
        }
      }
    }
  }
});

