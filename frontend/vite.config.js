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
      // Medición real del 2026-10-31 (TASK-4.1): Lines 95,58 %, Statements
      // 94,13 %, Functions 91,87 %, Branches 84,85 %. Los umbrales quedan en
      // el valor medido menos 2 puntos, para no congelar ruido de medición.
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.*', 'src/test/**', 'src/main.jsx'],
      thresholds: {
        lines: 93,
        statements: 92,
        functions: 89,
        branches: 82,
      },
    },
  },
})