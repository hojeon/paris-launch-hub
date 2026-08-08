import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/paris_hub_main_${Date.now()}.js`,
        chunkFileNames: `assets/paris_hub_chunk_${Date.now()}.js`,
        assetFileNames: `assets/paris_hub_asset_${Date.now()}.[ext]`
      }
    }
  }
})
