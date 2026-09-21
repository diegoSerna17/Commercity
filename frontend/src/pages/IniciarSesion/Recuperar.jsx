
// JS Importaciones de hooks, Link e iconos para recuperacion de contrasena
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { solicitarRecuperacion } from "../../services/usuarios.service.js";

const Recover = () => {
  // JS Estados del formulario: correo, envio en curso, mensaje del backend y error
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // JS Envia la solicitud a POST /api/usuarios/recover (RF4)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setEnviando(true);
    try {
      const res = await solicitarRecuperacion(email.trim());
      // JS Respuesta uniforme del backend: no revela si el correo existe
      setMensaje(
        res?.message ||
          "Si el correo existe, recibirás un enlace para restablecer tu contraseña."
      );
    } catch (err) {
      setError(err.message || "No se pudo enviar el enlace de recuperación.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-container-lowest font-sans">
      <main className="w-full max-w-[648px] bg-surface rounded-[24px] p-10 md:p-16 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-border-subtle">
        {/* TW Encabezado con titulo y descripcion */}
        <div className="mb-10">
          <h1 className="text-on-surface text-[32px] leading-tight font-bold mb-4">
            Recuperar contraseña
          </h1>
          <p className="text-brand-muted-text text-[14px] leading-relaxed max-w-none">
            Ingresa el correo electrónico asociado a tu cuenta para recibir un código de recuperación.
          </p>
        </div>

        {/* TW Formulario de recuperacion de contrasena */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* TW Campo de Correo Electronico */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-brand-muted-text"
              htmlFor="email"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={20} className="text-icon-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={enviando}
                className="block w-full h-[56px] pl-12 pr-4 bg-input-bg border border-border-subtle rounded-xl text-on-surface placeholder-placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange transition-all disabled:opacity-60"
              />
            </div>
          </div>

          {/* JS Mensaje de exito o error devuelto por la API */}
          {mensaje && (
            <p className="rounded-xl border border-success bg-success/15 px-4 py-3 text-sm text-green-200">
              {mensaje}
            </p>
          )}
          {error && (
            <p className="rounded-xl border border-error-container bg-error-container/20 px-4 py-3 text-sm text-error">
              {error}
            </p>
          )}

          {/* TW Boton de Accion */}
          <button
            type="submit"
            disabled={enviando}
            className="w-full h-[60px] bg-brand-orange hover:brightness-110 active:scale-[0.99] transition-all text-brand-dark-text font-bold rounded-xl text-lg flex items-center justify-center shadow-button disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviando ? "Enviando..." : "Enviar enlace"}
          </button>

          {/* TW Separador Decorativo */}
          <div className="border-t border-border-subtle pt-8"></div>

          {/* TW Enlace de navegacion de retorno al inicio de sesion */}
          <div className="flex justify-center">
            <Link
              to="/login"
              className="flex items-center gap-3 text-brand-orange font-medium hover:underline group transition-colors"
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

      {/* TW Pie de pagina con copyright */}
      <footer className="fixed bottom-8 w-full text-center">
        <p className="text-brand-muted-text text-xs opacity-50">
          © 2026 Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Recover;
