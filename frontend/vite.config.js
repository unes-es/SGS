import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      // Logo uploads (Sprint 6) are served as root-relative paths
      // (/uploads/logos/...) so the same <img src> works unchanged in
      // production, where nginx serves /uploads/ directly from the same
      // origin as the frontend - this proxy is what makes that true in
      // local dev too, where there's no nginx in front.
      '/uploads': 'http://localhost:3000'
    }
  }
})