// RE Titulo: Navbar - Barra lateral de navegacion principal de CommerCity
//
// RE Implementacion React: useNavigate y useLocation de react-router-dom para
// RE navegacion programatica y deteccion de ruta activa
//
// JS Codigo y componentes: estructura de navegacion definida en NAV_SECTIONS
// JS con secciones Principal y Cuenta, cada una con items que incluyen nombre,
// JS icono de lucide-react y ruta. El componente recibe props isOpen y onClose
// JS para controlar visibilidad en mobile
//
// TW Clases Tailwind: usa tokens personalizados como bg-auth-card-bg,
// TW text-brand-orange, text-brand-muted-text, border-surface-container,
// TW p-padding-xl, rounded-card. Layout con w-[250px] fijo, transicion CSS
// TW para sidebar mobile. Estado activo con bg-surface-container-low
// TW y border-border-subtle

// JS Importaciones de React Router para navegacion y deteccion de ruta activa
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  ShoppingCart,
  User,
  Store,
  ClipboardList,
  History,
  Settings,
  LogOut,
} from "lucide-react";

// JS Configuracion de secciones de navegacion con nombre, icono y ruta
const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { name: "Inicio", icon: Home, path: "/" },
      { name: "Carrito", icon: ShoppingCart, path: "/cart" },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { name: "Perfil", icon: User, path: "/profile" },
      { name: "Tienda", icon: Store, path: "/store" },
      { name: "Pedidos", icon: ClipboardList, path: "/orders" },
      { name: "Historial de compras", icon: History, path: "/history" },
      { name: "Ajustes", icon: Settings, path: "/settings" },
    ],
  },
];

const Navbar = ({ isOpen = false, onClose = () => {} }) => {
  // RE Hook para navegacion programatica entre rutas
  const navigate = useNavigate();
  // RE Hook para obtener la ruta actual y determinar item activo
  const location = useLocation();

  // JS Verifica si la ruta del item coincide con la ubicacion actual
  const isActive = (path) => location.pathname === path;

  // JS Navega a la ruta seleccionada y cierra el sidebar en mobile
  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <aside
      className={`w-[250px] bg-auth-card-bg flex flex-col border-r border-surface-container h-dvh overflow-y-auto overscroll-contain font-sans fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:relative lg:translate-x-0 lg:flex-shrink-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* TW Logo de la plataforma */}
      <div className="p-padding-xl shrink-0">
        <div className="flex items-center gap-sm">
          <span className="text-headline-sm font-bold tracking-tight text-brand-orange">
            CommerCity
          </span>
        </div>
      </div>

      {/* TW Navegacion principal y de cuenta */}
      <nav className="flex-grow px-padding-md mt-md space-y-lg">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* TW Titulo de seccion */}
            <h3 className="px-padding-md text-xs font-semibold text-brand-muted-text uppercase tracking-wider mb-sm">
              {section.label}
            </h3>

            <div className="space-y-xs">
              {section.items.map((item) => {
                // RE Determina si el item esta activo y asigna el icono correspondiente
                const active = isActive(item.path);
                const Icon = item.icon;

                return (
                  <button
                    key={item.name}
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center gap-md px-padding-md py-3 rounded-card transition-all group text-left ${
                      active
                        ? "text-on-surface bg-surface-container-low border border-border-subtle"
                        : "text-brand-muted-text hover:text-on-surface border border-transparent"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={`shrink-0 ${
                        active
                          ? "text-brand-orange"
                          : "group-hover:text-brand-orange transition-colors"
                      }`}
                    />
                    <span className={active ? "font-medium" : ""}>
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* TW Footer con perfil de usuario y boton de cerrar sesion */}
      <div className="p-padding-lg border-t border-surface-container space-y-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-variant shrink-0 overflow-hidden">
            <img
              alt="Usuario"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqMhoV6Qxd6R46I1ZtAFlf5n_DO_I13Qm9yS5Vf_rKjen_gSD4D1eGs_IGsY9mYZicvUnBWImsdYyPEJJxxwSAuS694ltHi4ESaDFRk1CRgTTI3vp68l_W_dEJa-EVHsN3rm41cm3nqymh-KPqn_UMthgkmjFf1_p430Ewa8M_OCwbYgz_0Z7Dayu6Afj_13iTxnn1B7NKHy-nPa3ssguZioMGoR67bc1IE8JHHoPgwBwaaDagvUGxDojSh8e0QMhlC_nzp3n8og"
            />
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-body-sm font-medium truncate text-on-surface">
              Juan Cabrera
            </p>
            <p className="text-xs text-brand-muted-text truncate">
              Admin Pro
            </p>
          </div>
        </div>

        <button
          onClick={() => handleNav("/login")}
          className="w-full flex items-center gap-md px-padding-md py-padding-xs text-accent-red hover:opacity-80 transition-opacity group"
        >
          <LogOut size={20} className="shrink-0" />
          <span className="text-body-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

// RE Exportacion del componente Navbar
export default Navbar;
