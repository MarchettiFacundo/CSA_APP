import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo.png', 'desktop-icon.png'],
      manifest: {
        name: 'Centro Servicio Automotor',
        short_name: 'CSA APP',
        description: 'Aplicación de gestión para Centro de Servicio Automotor',
        theme_color: '#dc2626',
        icons: [
          {
            src: '/desktop-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/desktop-icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
