// RE Titulo: Restore - Pagina de restablecimiento de contrasena
//
// RE Implementacion React: useState para controlar visibilidad de los dos
// RE campos de contrasena (nueva y confirmacion)
//
// JS Codigo y componentes: formulario con dos campos de contrasena con toggle
// JS de visibilidad, boton de restablecimiento y enlace de retorno al inicio
// JS de sesion
//
// TW Clases Tailwind: tokens personalizados como bg-surface-container-lowest,
// TW bg-auth-card-bg, bg-input-bg, text-brand-orange, border-border-subtle.
// TW Layout centrado con max-w-[580px], bordes redondeados con rounded-[32px],
// TW efecto focus-within en los campos de contrasena

// JS Importaciones de hooks, Link e iconos para restablecer contrasena
import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, EyeOff, Eye, ArrowLeft } from "lucide-react";

const Restore = () => {
  // RE Estado para alternar visibilidad del campo nueva contrasena
  const [showNewPassword, setShowNewPassword] = useState(false);
  // RE Estado para alternar visibilidad del campo confirmar contrasena
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // JS Manejador de envio del formulario de restablecimiento
  const handleSubmit = (e) => {
    e.preventDefault();
    // JS Logica de restablecimiento de contrasena pendiente de implementar
    console.log("Resetting password...");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-container-lowest font-sans text-on-surface">
      <main className="w-full max-w-[580px]">
        <section className="bg-auth-card-bg shadow-[0_8px_10px_-6px_rgba(0,0,0,0.1),0_20px_25px_-5px_rgba(0,0,0,0.1)] border border-border-subtle rounded-[32px] p-8 md:p-16 flex flex-col items-center">
          {/* TW Encabezado con titulo y descripcion */}
          <div className="text-center mb-10 w-full">
            <h1 className="text-[32px] font-bold leading-tight mb-2 tracking-tight">
              Restablecer contraseña
            </h1>
            <p className="text-brand-muted-text text-sm">
              Crea una nueva contraseña para tu cuenta.
            </p>
          </div>

          {/* TW Formulario */}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* TW Campo de nueva contrasena con toggle de visibilidad */}
            <div className="space-y-2">
              <label
                htmlFor="new_password"
                className="block text-brand-muted-text text-xs uppercase tracking-wider font-medium"
              >
                Nueva contraseña
              </label>
              <div className="relative bg-input-bg border border-input-bg focus-within:border-brand-orange rounded-2xl transition-all duration-200">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-icon-gray-500" />
                </div>
                <input
                  id="new_password"
                  name="new_password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Ingresa tu nueva contraseña"
                  className="block w-full bg-transparent border-none text-on-surface text-sm py-4 pl-12 pr-12 focus:outline-none focus:ring-0 rounded-2xl placeholder-placeholder-gray-600"
                  required
                />
                {/* JS Alterna visibilidad del campo nueva contrasena */}
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${
                    showNewPassword ? "text-brand-orange" : "text-icon-gray-500"
                  }`}
                >
                  {showNewPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            {/* TW Campo de confirmacion de contrasena con toggle de visibilidad */}
            <div className="space-y-2">
              <label
                htmlFor="confirm_password"
                className="block text-brand-muted-text text-xs uppercase tracking-wider font-medium"
              >
                Confirmar contraseña
              </label>
              <div className="relative bg-input-bg border border-input-bg focus-within:border-brand-orange rounded-2xl transition-all duration-200">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-icon-gray-500" />
                </div>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma tu contraseña"
                  className="block w-full bg-transparent border-none text-on-surface text-sm py-4 pl-12 pr-12 focus:outline-none focus:ring-0 rounded-2xl placeholder-placeholder-gray-600"
                  required
                />
                {/* JS Alterna visibilidad del campo confirmar contrasena */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${
                    showConfirmPassword ? "text-brand-orange" : "text-icon-gray-500"
                  }`}
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            {/* TW Boton de Envio */}
            <div className="pt-4">
              <button
                type="submit"
                className="bg-brand-orange w-full text-brand-dark-text font-bold py-4 rounded-[20px] transition-transform active:scale-[0.98] flex items-center justify-center"
              >
                Restablecer contraseña
              </button>
            </div>
          </form>

          {/* TW Enlace para volver al inicio de sesion */}
          <div className="mt-8">
            <Link
              to="/login"
              className="flex items-center text-brand-orange text-sm font-medium hover:opacity-80 transition-opacity"
            >
              <ArrowLeft size={16} strokeWidth={2.5} className="mr-2" />
              Volver al inicio de sesión
            </Link>
          </div>
        </section>

        {/* TW Pie de pagina con copyright */}
        <footer className="mt-8 text-center">
          <p className="text-brand-muted-text text-[11px] tracking-wide">
            © 2026 Todos los derechos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Restore;
