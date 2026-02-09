/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aquí definimos tus colores personalizados "brand"
        brand: {
          50: '#eef2ff',  // Fondo muy claro (casi blanco)
          100: '#e0e7ff', // Fondo claro
          200: '#c7d2fe', // Bordes suaves / Fondos secundarios
          300: '#a5b4fc', // Bordes activos
          400: '#818cf8', // Iconos inactivos / Texto secundario
          500: '#6366f1', // Color principal suave
          600: '#dcdbf3', // COLOR PRINCIPAL (Botones, Links, Iconos activos)
          700: '#4338ca', // Hover de botones
          800: '#3730a3', // Texto oscuro / Encabezados
          900: '#312e81', // Fondos muy oscuros / Footer
          950: '#1e1b4b', // Casi negro
        },
        // Opcional: Si quieres asegurar grises neutros y limpios
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      // Animaciones personalizadas (que usamos en los modales)
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}