import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.png', 'logo.png', 'desktop-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'finanzas-192x192.png', 'finanzas-512x512.png', 'finanzas.webmanifest'],
      manifest: {
        name: 'Centro Servicio Automotor',
        short_name: 'CSA APP',
        description: 'Aplicación de gestión para Centro de Servicio Automotor',
        theme_color: '#dc2626',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})
