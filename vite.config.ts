import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Override with VITE_BASE_PATH when deploying under a subpath.
  base: process.env.VITE_BASE_PATH || '/',
})
