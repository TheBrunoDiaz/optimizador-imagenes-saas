/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Cambia a '/optimizador-imagenes-saas/' si despliegas en GitHub Pages de proyecto.
  // Vercel / Netlify / Cloudflare Pages usan la raíz '/'.
  base: '/',
  plugins: [react()],
  worker: {
    // Los workers se emiten como módulos ES (import() dinámico del wasm de jSquash).
    format: 'es',
  },
  optimizeDeps: {
    // jSquash resuelve su .wasm con import.meta.url; el pre-bundler de Vite rompe
    // esa resolución. Excluir estos paquetes evita que dev y build diverjan.
    exclude: ['@jsquash/resize', '@jsquash/webp', '@jsquash/jpeg', '@jsquash/avif', '@jsquash/oxipng'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
