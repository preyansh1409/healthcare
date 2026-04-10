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
    outDir: '../dist', // This puts the build in the project root/dist
    emptyOutDir: true,
  }
})
