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
    // C-1: los tests de interaccion con userEvent tardan 1-4 s por caso y
    // superan los 5 s bajo instrumentacion de cobertura; 15 s evita
    // time-outs ambientales sin ocultar fallos reales.
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      // C-1: umbral de 70 % Lines (M-27); CI lo exige via `npm run test:coverage`.
      thresholds: {
        lines: 70,
      },
    },
  },
})