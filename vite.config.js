import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// This root-level config allows Vercel to find the index.html inside the client folder
export default defineConfig({
  root: 'client',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: 'dist', // Result will be in client/dist
    emptyOutDir: true,
  }
})
