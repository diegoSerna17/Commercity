import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// jsdom no implementa las URLs de objeto que usan las vistas previas de imagen.
// Se sobreescribe siempre: la implementacion nativa espera un Blob de jsdom y
// falla con los File del entorno de pruebas.
URL.createObjectURL = () => 'blob:preview'
URL.revokeObjectURL = () => {}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})
