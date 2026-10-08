import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' 
import App from './App.jsx'
import { inicializarTema } from './utils/tema.js'
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Aplica el tema guardado (o "system" por defecto) antes del primer render
// para evitar un destello del tema incorrecto.
inicializarTema();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

