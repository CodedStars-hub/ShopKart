import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/customers': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/products': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/wishlist': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
