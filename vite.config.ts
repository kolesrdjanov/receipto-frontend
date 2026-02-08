import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Read version from package.json
import packageJson from './package.json'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    allowedHosts: ['.loca.lt', '.trycloudflare.com', '.ngrok-free.dev', '.ngrok.io'],
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version),
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1500, // heic2any is ~1.3MB, recharts ~400kB
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-recharts': ['recharts'],
          'vendor-heic': ['heic2any'],
        },
      },
    },
  },
})
