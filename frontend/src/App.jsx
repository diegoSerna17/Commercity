import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Navbar from './components/globales/Navbar';
import NotificacionesEnVivo from './components/globales/NotificacionesEnVivo';
import RutaProtegida from './components/globales/RutaProtegida';
import RutaProtegidaRol from './components/globales/RutaProtegidaRol';
import { getCurrentUser } from './api/client.js';

// Code-splitting: cada pagina se carga bajo demanda para reducir el chunk inicial.
const Home = lazy(() => import('./pages/Home'));
const IniciarSesion = lazy(() => import('./pages/IniciarSesion/IniciarSesion'));
const Registro = lazy(() => import('./pages/IniciarSesion/Registro'));
const Recuperar = lazy(() => import('./pages/IniciarSesion/Recuperar'));
const Restablecer = lazy(() => import('./pages/IniciarSesion/Restablecer'));
const PerfilVendedor = lazy(() => import('./pages/Perfil/PerfilVendedor'));
const PerfilPublico = lazy(() => import('./pages/Perfil/PerfilPublico'));
const Pedidos = lazy(() => import('./pages/Perfil/Pedidos'));
const Mensajes = lazy(() => import('./pages/Perfil/Mensajes'));
const Chats = lazy(() => import('./pages/Perfil/Chats'));
const Carrito = lazy(() => import('./pages/Carrito/Carrito'));
const HistorialDeCompras = lazy(() => import('./pages/Perfil/HistorialDeCompras'));
const Ajustes = lazy(() => import('./pages/Perfil/Ajustes'));
const Tienda = lazy(() => import('./pages/Tienda/Tienda'));
const PanelAdministrador = lazy(() => import('./pages/Administrador/PanelControl'));

// Roles con acceso a las paginas de vendedor (RF20/RF21).
const ROLES_VENDEDOR = ['vendedor', 'administrador'];

function CargandoPagina() {
  return (
    <div
      className="flex flex-1 items-center justify-center p-8 text-body-sm text-brand-muted-text"
      role="status"
    >
      Cargando...
    </div>
  );
}

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
        <Suspense fallback={<CargandoPagina />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<IniciarSesion />} />
            <Route path="/register" element={<Registro />} />
            <Route path="/recover" element={<Recuperar />} />
            <Route path="/restore" element={<Restablecer />} />
            <Route path="/vendedor/:id" element={<PerfilPublico />} />

            {/* M-22: rutas de vendedor, confirmadas por rol contra /api/usuarios/me */}
            <Route
              path="/profile"
              element={
                <RutaProtegidaRol roles={ROLES_VENDEDOR}>
                  <PerfilVendedor />
                </RutaProtegidaRol>
              }
            />
            <Route
              path="/PerfilVendedor"
              element={
                <RutaProtegidaRol roles={ROLES_VENDEDOR}>
                  <PerfilVendedor />
                </RutaProtegidaRol>
              }
            />
            <Route
              path="/orders"
              element={
                <RutaProtegidaRol roles={ROLES_VENDEDOR}>
                  <Pedidos />
                </RutaProtegidaRol>
              }
            />
            <Route
              path="/store"
              element={
                <RutaProtegidaRol roles={ROLES_VENDEDOR}>
                  <Tienda />
                </RutaProtegidaRol>
              }
            />

            {/* M-22: rutas que exigen sesion */}
            <Route
              path="/messages"
              element={
                <RutaProtegida>
                  <Mensajes />
                </RutaProtegida>
              }
            />
            <Route
              path="/messages/chat"
              element={
                <RutaProtegida>
                  <Chats />
                </RutaProtegida>
              }
            />
            <Route
              path="/cart"
              element={
                <RutaProtegida>
                  <Carrito />
                </RutaProtegida>
              }
            />
            <Route
              path="/history"
              element={
                <RutaProtegida>
                  <HistorialDeCompras />
                </RutaProtegida>
              }
            />
            <Route
              path="/settings"
              element={
                <RutaProtegida>
                  <Ajustes />
                </RutaProtegida>
              }
            />

            {/* M-22: panel de administracion, confirmado por rol */}
            <Route
              path="/admin/dashboard"
              element={
                <RutaProtegidaRol roles={['administrador']}>
                  <PanelAdministrador />
                </RutaProtegidaRol>
              }
            />
            <Route
              path="/admin"
              element={
                <RutaProtegidaRol roles={['administrador']}>
                  <PanelAdministrador />
                </RutaProtegidaRol>
              }
            />
          </Routes>
        </Suspense>
      </main>

      {/* A-5: las notificaciones en vivo solo se montan con sesion iniciada. */}
      {getCurrentUser() && <NotificacionesEnVivo />}
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
