import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // Importar

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Chantli - Rentas ZMG',
        short_name: 'Chantli',
        description: 'Encuentra tu cuarto ideal en Guadalajara',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png', // Tendrás que poner estos iconos en la carpeta public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173, 
  }
})