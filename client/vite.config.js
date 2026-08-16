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
  // Hides your source code in the Inspect tab
  build: {
    sourcemap: false,
    minify: 'esbuild',
  }
})