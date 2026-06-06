import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";

const Recover = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Manejar lógica de recuperación de contraseña
    console.log("Sending recovery email...");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-container-lowest font-sans">
      <main className="w-full max-w-[648px] bg-surface rounded-[24px] p-10 md:p-16 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-border-subtle">
        {/* Sección de Encabezado */}
        <div className="mb-10">
          <h1 className="text-on-surface text-[32px] leading-tight font-bold mb-4">
            Recuperar contraseña
          </h1>
          <p className="text-on-surface-variant text-[14px] leading-relaxed max-w-none">
            Ingresa el correo electrónico asociado a tu cuenta para recibir un código de recuperación.
          </p>
        </div>

        {/* Sección de Formulario */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Campo de Correo Electrónico */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-on-surface-variant"
              htmlFor="email"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={20} className="text-on-surface-variant opacity-60" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="ejemplo@correo.com"
                className="block w-full h-[56px] pl-12 pr-4 bg-[#1a1a26] border border-border-subtle rounded-xl text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Botón de Acción */}
          <button
            type="submit"
            className="w-full h-[60px] bg-primary-container hover:brightness-110 active:scale-[0.99] transition-all text-background font-bold rounded-xl text-lg flex items-center justify-center shadow-button"
          >
            Enviar enlace
          </button>

          {/* Separador Decorativo */}
          <div className="border-t border-border-subtle pt-8"></div>

          {/* Enlace de Navegación */}
          <div className="flex justify-center">
            <Link
              to="/login"
              className="flex items-center gap-3 text-primary-container font-medium hover:underline group transition-colors"
            >
              <ArrowLeft
                size={24}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </main>

      {/* Información del Pie de Página */}
      <footer className="fixed bottom-8 w-full text-center">
        <p className="text-on-surface-variant text-xs opacity-50">
          © 2026 Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Recover;
