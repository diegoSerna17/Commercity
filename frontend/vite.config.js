import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    env: { NODE_ENV: 'test' },
    setupFiles: ['./src/test/setup.js'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
    },
  },
})