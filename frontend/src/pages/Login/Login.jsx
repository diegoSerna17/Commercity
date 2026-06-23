// RE Titulo: Login - Pagina de inicio de sesion de CommerCity
//
// RE Implementacion React: useState para estado del checkbox Recordarme
// RE y toggle de visibilidad de contrasena
//
// JS Codigo y componentes: layout de dos paneles, panel izquierdo con branding
// JS y estadisticas, panel derecho con formulario de acceso que incluye campos
// JS de email y contrasena, checkbox personalizado, enlace de recuperacion,
// JS boton principal Entrar y enlace a registro
//
// TW Clases Tailwind: tokens personalizados como bg-surface, bg-input-bg,
// TW text-brand-orange, text-brand-muted-text, border-border-subtle,
// TW placeholder-placeholder-gray-600. Layout con lg:w-[60%] y lg:w-[40%]
// TW para los dos paneles. Gradient overlay con bg-gradient-to-br

// JS Importaciones de hooks, Link e iconos para el formulario de login
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, EyeOff, Check, ArrowRight } from "lucide-react";

const Login = () => {
  // RE Estado para controlar el checkbox Recordarme
  const [remember, setRemember] = useState(false);
  // RE Estado para alternar visibilidad de la contrasena
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen flex bg-surface text-on-surface overflow-hidden font-sans">
      {/* TW Panel izquierdo con branding de la plataforma y estadisticas */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-surface-container-lowest overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            // JS Imagen de fondo del panel izquierdo con estilo inline
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBlaUwRP0OxB_25-Dg6sLDQlxwJ0DNLpVH4MYEwxc4i8varF1cRDF-Ji6lrpeK1GzL1uylWvhr5_PRd80GYnl1VRXeOuw3DTOoafkSZPLVn-tVIGoD5Pwzevlw_fTxwl55jk7xjjJMyCxLYisfNun7X002qrs11b3sSRZlYzPbbaGRdHGGUwWPqm9WAUaJvj1kfsmbgbXAXny4L60OCFxd8Da3YLgielLo1R53d5TcX7vOj-djd_GqcL0QTzcyXoueEaChYQ36kvw')",
          }}
        >
          {/* TW Capa de degradado oscuro sobre la imagen de fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f]/80 to-[#1a1a26]/90 flex flex-col items-center justify-center p-2xl">
            {/* TW Nombre de la plataforma */}
            <h1 className="text-[50px] text-brand-orange mb-md tracking-tighter leading-none font-semibold">
              CommerCity
            </h1>
            <p className="text-[20px] text-on-surface mb-xl text-center leading-tight font-semibold">
              Tu tienda, tu ciudad. Tu estilo, comienza aquí.
            </p>
            {/* TW Estadisticas: vendedores, productos y compradores */}
            <div className="flex gap-lg mt-2xl">
              <div className="flex flex-col items-center">
                <span className="text-headline-md text-primary-fixed">
                  12K+
                </span>
                <span className="text-label-sm text-brand-muted-text uppercase tracking-widest mt-xs">
                  Vendedores
                </span>
              </div>
              <div className="w-px bg-surface-variant h-8 self-center" />
              <div className="flex flex-col items-center">
                <span className="text-headline-md text-primary-fixed">
                  84K+
                </span>
                <span className="text-label-sm text-brand-muted-text uppercase tracking-widest mt-xs">
                  Productos
                </span>
              </div>
              <div className="w-px bg-surface-variant h-8 self-center" />
              <div className="flex flex-col items-center">
                <span className="text-headline-md text-primary-fixed">
                  230K+
                </span>
                <span className="text-label-sm text-brand-muted-text uppercase tracking-widest mt-xs">
                  Compradores
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TW Panel derecho con formulario de inicio de sesion */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-margin-mobile sm:px-2xl py-xl overflow-y-auto bg-surface">
        <div className="w-full max-w-[420px] mx-auto">
          {/* TW Titulo y subtitulo del formulario */}
          <div className="mb-xl">
            <h2 className="text-[32px] text-on-surface mb-xs font-bold">
              Iniciar sesión
            </h2>
            <p className="text-body-md text-brand-muted-text">
              Bienvenido de vuelta a tu marketplace
            </p>
          </div>

          <form className="space-y-lg">
            {/* TW Campo: Correo electronico */}
            <div>
              <label
                className="block text-label-sm text-on-surface mb-sm font-medium"
                htmlFor="email"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-sm top-1/2 -translate-y-1/2 text-icon-gray-500 ml-sm"
                />
                <input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  className="w-full bg-input-bg text-on-surface text-body-md rounded-lg pl-3xl pr-md py-sm focus:ring-1 focus:ring-brand-orange focus:border-brand-orange transition-colors h-12 outline-none placeholder-placeholder-gray-600 border border-border-subtle"
                />
              </div>
            </div>

            {/* TW Campo: Contrasena con toggle de visibilidad */}
            <div>
              <label
                className="block text-label-sm text-on-surface mb-sm font-medium"
                htmlFor="password"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-sm top-1/2 -translate-y-1/2 text-icon-gray-500 ml-sm"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-input-bg text-on-surface text-body-md rounded-lg pl-3xl pr-md py-sm focus:ring-1 focus:ring-brand-orange focus:border-brand-orange transition-colors h-12 outline-none placeholder-placeholder-gray-600 border border-border-subtle"
                />
                {/* JS Alterna entre tipo password y text para mostrar/ocultar contrasena */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-sm top-1/2 -translate-y-1/2 p-sm transition-colors ${
                    showPassword ? "text-brand-orange" : "text-icon-gray-500 hover:text-on-surface"
                  }`}
                >
                  <EyeOff size={20} />
                </button>
              </div>
            </div>

            {/* TW Opciones: Recordarme y recuperar contrasena */}
            <div className="flex items-center justify-between mt-md">
              <label className="flex items-center gap-sm cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    // JS Alterna el estado del checkbox Recordarme
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                    className="w-4 h-4 rounded border-surface-variant bg-input-bg checked:bg-brand-orange checked:border-brand-orange focus:ring-brand-orange focus:ring-offset-0 focus:ring-offset-transparent transition-colors cursor-pointer appearance-none"
                  />
                  <Check
                    size={12}
                    className={`absolute text-brand-dark-text font-bold pointer-events-none transition-opacity ${
                      remember ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
                <span className="text-body-sm text-brand-muted-text group-hover:text-on-surface transition-colors font-medium">
                  Recordarme
                </span>
              </label>
              <Link
                className="text-label-sm text-brand-orange hover:opacity-80 transition-opacity font-bold"
                to="/recover"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* TW Boton principal: Entrar */}
            <button
              type="button"
              className="w-full bg-brand-orange text-brand-dark-text text-label-md py-sm px-lg rounded-[10px] h-12 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-sm mt-xl font-bold shadow-button"
            >
              Entrar
              <ArrowRight size={20} />
            </button>

            {/* TW Separador decorativo entre botones */}
            <div className="relative flex items-center py-md">
              <div className="flex-grow border-t border-surface-variant" />
              <div className="mx-md bg-surface-variant w-2 h-2 rounded-full" />
              <div className="flex-grow border-t border-surface-variant" />
            </div>

            {/* TW Boton secundario: Crear cuenta nueva */}
            <Link
              to="/register"
              className="w-full bg-transparent border border-border-subtle text-on-surface text-label-md py-sm px-lg rounded-[10px] h-12 hover:bg-surface-variant/30 active:scale-[0.98] transition-all flex items-center justify-center font-bold"
            >
              Crear cuenta nueva
            </Link>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Login;
