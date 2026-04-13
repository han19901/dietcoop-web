import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    'process': {
      env: {},
      version: '',
      versions: {},
      platform: 'browser',
      browser: true,
    },
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['firebase-admin'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase'i ayrı chunk'a ayır
          'firebase-core': ['firebase/app', 'firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          // React ve UI kütüphanelerini ayır
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          // Date kütüphanesini ayır
          'date-vendor': ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})








