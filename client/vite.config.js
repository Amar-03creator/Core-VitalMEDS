import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // This tells Vite to map 'global' to 'window' so Cognito works
  define: {
    global: 'window',
  },
  build: {
    sourcemap: false, // This is the ONLY line actually needed to hide your code!
  }
})