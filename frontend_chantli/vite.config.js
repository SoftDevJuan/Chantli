import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // <--- IMPORTANTE

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Chantli - Rentas Seguras',
        short_name: 'Chantli',
        description: 'Encuentra tu próximo hogar de forma segura y sin aval.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // <--- ESTO OCULTA LA BARRA DEL NAVEGADOR
        orientation: 'portrait', // Bloquea la app en vertical (opcional)
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // Necesitas crear esta imagen
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Necesitas crear esta imagen
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Para iconos adaptables de Android
          }
          
        ]
      }
    })
  ],
  server: {
    host: true
  }
})