import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Anchor Fitness OS',
        short_name: 'Anchor',
        description: 'The minimalist, local-first fitness OS designed for sub-15-second tracking.',
        theme_color: '#0D0D0D',
        background_color: '#0D0D0D',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt,woff2}']
      }
    })
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (
            normalized.includes('/node_modules/react/') ||
            normalized.includes('/node_modules/react-dom/') ||
            normalized.includes('/node_modules/react-router/') ||
            normalized.includes('/node_modules/react-router-dom/')
          ) {
            return 'react-vendor';
          }
          if (
            normalized.includes('/node_modules/zustand/') ||
            normalized.includes('/node_modules/idb-keyval/')
          ) {
            return 'state-vendor';
          }
        },
      },
    },
  }
})
