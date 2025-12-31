import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // React + router
          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/')
          ) {
            return 'react-vendor'
          }

          // Query/cache
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor'
          }

          // i18n
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n-vendor'
          }

          // Charts
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts-vendor'
          }

          // Date utils
          if (id.includes('date-fns')) {
            return 'date-vendor'
          }

          // HTTP
          if (id.includes('axios')) {
            return 'http-vendor'
          }

          // UI libs
          if (
            id.includes('@radix-ui') ||
            id.includes('lucide-react') ||
            id.includes('sonner') ||
            id.includes('class-variance-authority') ||
            id.includes('clsx') ||
            id.includes('tailwind-merge')
          ) {
            return 'ui-vendor'
          }

          // State + schema
          if (id.includes('zustand') || id.includes('zod') || id.includes('react-hook-form')) {
            return 'state-vendor'
          }

          // Fallback: group any other node_modules into generic vendor.
          return 'vendor'
        },
      },
    },
  },
})
