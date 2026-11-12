import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // En GitHub Pages el sitio vive en /next-legal/; en local, en la raíz.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
