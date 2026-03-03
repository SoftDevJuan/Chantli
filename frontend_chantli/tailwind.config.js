/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- NUEVA PALETA: Atardecer en la Ciudad ---
        brand: {
          50: '#fdf8f6',  // Fondo ultra claro con toque terracotta
          100: '#fbeee9', // Fondo claro terracotta
          200: '#f9ddd3', // Bordes suaves
          300: '#f6c5b5', // Bordes activos terracotta
          400: '#f19c83', // Iconos inactivos / Texto secundario
          500: '#e16f4f', // Color principal suave terracotta
          600: '#d9532d', // COLOR PRINCIPAL (Botones, Links, Iconos activos)
          700: '#b64223', // Hover de botones terracotta
          800: '#92341d', // Texto terracotta oscuro / Encabezados
          900: '#762d1a', // Fondos terracotta muy oscuros
          950: '#401509', // Terracotta casi negro
        },
        // Grises Neutros y Limpios
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
      fontFamily: {
        // Mantenemos DM Sans por ahora, ya que es elegante
        sans: ['"DM Sans"', 'sans-serif'], 
      },
      // Animaciones personalizadas
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