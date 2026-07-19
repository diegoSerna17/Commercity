import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import IniciarSesion from './pages/IniciarSesion/IniciarSesion';
import Registro from './pages/IniciarSesion/Registro';
import Recuperar from './pages/IniciarSesion/Recuperar';
import Restablecer from './pages/IniciarSesion/Restablecer';
import PerfilVendedor from './pages/Perfil/PerfilVendedor';
import Pedidos from './pages/Perfil/Pedidos';
import Mensajes from './pages/Perfil/Mensajes';
import Chats from './pages/Perfil/Chats';
import Carrito from './pages/Carrito/Carrito';
import HistorialDeCompras from './pages/Perfil/HistorialDeCompras';
import Ajustes from './pages/Perfil/Ajustes';
import Tienda from './pages/Tienda/Tienda';
import PanelAdministrador from './pages/Administrador/PanelControl';

function AppContent() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const rutasSinNavbar = ['/login', '/register', '/recover', '/restore', '/admin', '/admin/dashboard'];
  const ocultarNavbar = rutasSinNavbar.some(ruta => location.pathname.toLowerCase().startsWith(ruta));

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-dvh bg-surface-container-lowest overflow-hidden">
      {!ocultarNavbar && (
        <>
          <button
            className="fixed left-3 top-3 z-30 lg:hidden rounded-card border border-surface-container bg-auth-card-bg p-2 text-on-surface shadow-lg hover:bg-surface-container transition-colors"
            aria-label="Abrir menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div
            className={`fixed inset-0 z-30 bg-black/60 lg:hidden transition-opacity ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          <Navbar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<IniciarSesion />} />
          <Route path="/register" element={<Registro />} />
          <Route path="/recover" element={<Recuperar />} />
          <Route path="/restore" element={<Restablecer />} />
          <Route path="/profile" element={<PerfilVendedor />} />
          <Route path="/PerfilVendedor" element={<PerfilVendedor />} />
          <Route path="/orders" element={<Pedidos />} />
          <Route path="/messages" element={<Mensajes />} />
          <Route path="/messages/chat" element={<Chats />} />
          <Route path="/cart" element={<Carrito />} />
          <Route path="/history" element={<HistorialDeCompras />} />
          <Route path="/settings" element={<Ajustes />} />
          <Route path="/store" element={<Tienda />} />
          <Route path="/admin/dashboard" element={<PanelAdministrador />} />
          <Route path="/admin" element={<PanelAdministrador />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;