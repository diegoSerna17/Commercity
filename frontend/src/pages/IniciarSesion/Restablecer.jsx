
// JS Importaciones de hooks, Link e iconos para restablecer contrasena
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, EyeOff, Eye, ArrowLeft } from "lucide-react";
import { restablecerPassword } from "../../services/usuarios.service.js";

// JS Minimo de caracteres exigido a la nueva contrasena en el cliente
const MIN_PASSWORD_LENGTH = 8;

const Restore = () => {
  // RE Hook para leer el token del enlace de recuperacion (?token=...)
  const location = useLocation();
  // JS Token de un solo uso que el backend envia en la URL del correo (RF4)
  const token = new URLSearchParams(location.search).get("token") || "";

  // RE Estado para alternar visibilidad del campo nueva contrasena
  const [showNewPassword, setShowNewPassword] = useState(false);
  // RE Estado para alternar visibilidad del campo confirmar contrasena
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // JS Estados del formulario: contrasenas, envio, exito y error
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");

  // JS Valida en cliente y llama a POST /api/usuarios/reset-password (RF4)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (!token) {
      setError("El enlace no es válido: falta el token de recuperación.");
      return;
    }
    if (nuevaPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      const res = await restablecerPassword(token, nuevaPassword);
      setExito(
        res?.message ||
          "Contraseña restablecida correctamente. Ya puedes iniciar sesión."
      );
    } catch (err) {
      // JS El backend responde aqui si el enlace expiro (5 minutos) o ya fue usado
      setError(err.message || "No se pudo restablecer la contraseña.");
    } finally {
      setEnviando(false);
    }
  };

  // JS El token es de un solo uso: tras el exito se bloquea el formulario
  const formularioBloqueado = enviando || Boolean(exito);

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
            {/* JS Mensajes de exito o error devueltos por la API */}
            {exito && (
              <p className="rounded-2xl border border-success bg-success/15 px-4 py-3 text-sm text-green-200">
                {exito}
              </p>
            )}
            {error && (
              <p className="rounded-2xl border border-error-container bg-error-container/20 px-4 py-3 text-sm text-error">
                {error}
              </p>
            )}

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
                  minLength={MIN_PASSWORD_LENGTH}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  disabled={formularioBloqueado}
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
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  disabled={formularioBloqueado}
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
                disabled={formularioBloqueado}
                className="bg-brand-orange w-full text-brand-dark-text font-bold py-4 rounded-[20px] transition-transform active:scale-[0.98] flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviando ? "Restableciendo..." : "Restablecer contraseña"}
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
