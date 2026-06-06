/**
 * Login — Página de inicio de sesión de CommerCity
 *
 * Panel izquierdo (60%): branding con imagen de fondo, nombre de la plataforma,
 * eslogan y estadísticas (vendedores, productos, compradores).
 * Panel derecho (40%): formulario de acceso con email, contraseña,
 * opción "Recordarme", enlace de recuperación y botones de acción.
 *
 * @component
 * @returns {JSX.Element} Pantalla de inicio de sesión
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, EyeOff, Check, ArrowRight } from "lucide-react";

const Login = () => {
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen flex bg-surface text-on-surface overflow-hidden font-sans">
      {/* PANEL IZQUIERDO — Branding e imagen decorativa (solo desktop) */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-surface-container-lowest overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBlaUwRP0OxB_25-Dg6sLDQlxwJ0DNLpVH4MYEwxc4i8varF1cRDF-Ji6lrpeK1GzL1uylWvhr5_PRd80GYnl1VRXeOuw3DTOoafkSZPLVn-tVIGoD5Pwzevlw_fTxwl55jk7xjjJMyCxLYisfNun7X002qrs11b3sSRZlYzPbbaGRdHGGUwWPqm9WAUaJvj1kfsmbgbXAXny4L60OCFxd8Da3YLgielLo1R53d5TcX7vOj-djd_GqcL0QTzcyXoueEaChYQ36kvw')",
          }}
        >
          {/* Capa de degradado oscuro sobre la imagen */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f]/80 to-[#1a1a26]/90 flex flex-col items-center justify-center p-2xl">
            {/* Nombre de la plataforma */}
            <h1 className="text-[50px] text-primary-container mb-md tracking-tighter leading-none font-semibold">
              CommerCity
            </h1>
            <p className="text-[20px] text-on-surface mb-xl text-center leading-tight font-semibold">
              Tu tienda, tu ciudad. Tu estilo, comienza aquí.
            </p>
            {/* Estadísticas: vendedores, productos y compradores */}
            <div className="flex gap-lg mt-2xl">
              <div className="flex flex-col items-center">
                <span className="text-headline-md text-primary-fixed">
                  12K+
                </span>
                <span className="text-label-sm text-on-surface-variant uppercase tracking-widest mt-xs">
                  Vendedores
                </span>
              </div>
              <div className="w-px bg-surface-variant h-8 self-center" />
              <div className="flex flex-col items-center">
                <span className="text-headline-md text-primary-fixed">
                  84K+
                </span>
                <span className="text-label-sm text-on-surface-variant uppercase tracking-widest mt-xs">
                  Productos
                </span>
              </div>
              <div className="w-px bg-surface-variant h-8 self-center" />
              <div className="flex flex-col items-center">
                <span className="text-headline-md text-primary-fixed">
                  230K+
                </span>
                <span className="text-label-sm text-on-surface-variant uppercase tracking-widest mt-xs">
                  Compradores
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO — Formulario de inicio de sesión */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-margin-mobile sm:px-2xl py-xl overflow-y-auto bg-surface">
        <div className="w-full max-w-[420px] mx-auto">
          {/* Título y subtítulo del formulario */}
          <div className="mb-xl">
            <h2 className="text-[32px] text-on-surface mb-xs font-bold">
              Iniciar sesión
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Bienvenido de vuelta a tu marketplace
            </p>
          </div>

          <form className="space-y-lg">
            {/* Campo: Correo electrónico */}
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
                  className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant ml-sm"
                />
                <input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  className="w-full bg-[#1a1a26] text-on-surface text-body-md rounded-lg pl-3xl pr-md py-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-12 outline-none placeholder:text-on-surface-variant/50 border border-border-subtle"
                />
              </div>
            </div>

            {/* Campo: Contraseña con toggle de visibilidad */}
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
                  className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant ml-sm"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-[#1a1a26] text-on-surface text-body-md rounded-lg pl-3xl pr-md py-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-12 outline-none placeholder:text-on-surface-variant/50 border border-border-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-sm transition-colors"
                >
                  <EyeOff size={20} />
                </button>
              </div>
            </div>

            {/* Opciones: Recordarme y recuperar contraseña */}
            <div className="flex items-center justify-between mt-md">
              <label className="flex items-center gap-sm cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember(!remember)}
                    className="w-4 h-4 rounded border-surface-variant bg-[#1a1a26] checked:bg-primary-container checked:border-primary-container focus:ring-primary focus:ring-offset-0 focus:ring-offset-transparent transition-colors cursor-pointer appearance-none"
                  />
                  <Check
                    size={12}
                    className={`absolute text-background font-bold pointer-events-none transition-opacity ${
                      remember ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
                <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors font-medium">
                  Recordarme
                </span>
              </label>
              <Link
                className="text-label-sm text-primary-container hover:text-primary transition-colors font-bold"
                to="/recover"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Botón principal: Entrar */}
            <button
              type="button"
              className="w-full bg-gradient-to-br from-[#F5A623] to-[#E8890A] text-[#000] text-label-md py-sm px-lg rounded-[10px] h-12 hover:brightness-120 active:scale-[0.98] transition-all flex items-center justify-center gap-sm mt-xl font-bold shadow-[0_4px_20px_rgba(245,166,35,0.3)]"
            >
              Entrar
              <ArrowRight size={20} />
            </button>

            {/* Separador decorativo entre botones */}
            <div className="relative flex items-center py-md">
              <div className="flex-grow border-t border-surface-variant" />
              <div className="mx-md bg-surface-variant w-2 h-2 rounded-full" />
              <div className="flex-grow border-t border-surface-variant" />
            </div>

            {/* Botón secundario: Crear cuenta nueva */}
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
