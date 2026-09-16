// RE Titulo: Register - Pagina de registro de nueva cuenta en CommerCity
//
// RE Implementacion React: useState para controlar visibilidad de contrasena
// RE y estado de aceptacion de terminos
//
// JS Codigo y componentes: formulario centrado en tarjeta con campos de nombre,
// JS correo y contrasena, checkbox personalizado para terminos y condiciones,
// JS boton de registro y enlace de navegacion a inicio de sesion
//
// TW Clases Tailwind: tokens personalizados como bg-surface-container-lowest,
// TW bg-input-bg, text-brand-orange, border-border-subtle. Layout centrado
// TW con max-w-[580px], sombra con shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)],
// TW checkbox personalizado con appearance-none y check overlay

// JS Importaciones de hooks, Link e iconos para el formulario de registro
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, EyeOff, Eye, Check } from "lucide-react";
import { request, setToken, setCurrentUser } from "../../api/client.js";

// JS Validacion local simple del formato de correo antes de enviar al backend
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const navigate = useNavigate();
  // RE Estado para alternar visibilidad del campo de contrasena
  const [showPassword, setShowPassword] = useState(false);
  // RE Estado para controlar la aceptacion de terminos y condiciones
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // RE Estados controlados del formulario: nombre, correo y contrasena
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // RE Estados de envio: carga y mensaje de error del backend
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // JS Registra la cuenta contra POST /api/usuarios/register y deja la sesion iniciada
  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombreLimpio = nombreCompleto.trim();
    const emailLimpio = email.trim();

    // JS Validaciones locales (el backend vuelve a validar)
    if (!nombreLimpio) {
      setError("El nombre completo es obligatorio");
      return;
    }
    if (!EMAIL_REGEX.test(emailLimpio)) {
      setError("Ingresa un correo electrónico válido");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await request("/api/usuarios/register", {
        method: "POST",
        body: {
          nombre_completo: nombreLimpio,
          email: emailLimpio,
          password,
        },
      });
      // JS Mismo patron de sesion que la pantalla de inicio de sesion
      setToken(res.data.token);
      if (res.data.user) setCurrentUser(res.data.user);
      navigate("/");
    } catch (err) {
      // JS El backend responde con el mensaje legible (ej: correo ya registrado)
      setError(err.message || "No se pudo completar el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-xl px-margin-mobile pb-sm bg-surface-container-lowest text-on-surface font-sans">
      <main className="w-full max-w-[580px] max-h-[650px] bg-surface rounded-[24px] p-xl md:p-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-border-subtle relative overflow-y-auto">
        <header className="text-center mb-[40px]">
          <h1 className="text-[30px] md:text-[36px] font-bold tracking-tight text-on-surface mb-xs leading-tight">
            Crear cuenta en CommerCity
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-md">
          {/* TW Nombre completo */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
              <User size={20} className="text-icon-gray-500" />
            </div>
            <input
              name="full-name"
              type="text"
              required
              placeholder="Nombre completo"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="block w-full bg-input-bg border border-border-subtle rounded-2xl py-md pl-3xl pr-md text-on-surface placeholder-placeholder-gray-600 transition-all focus:ring-1 focus:ring-brand-orange focus:border-brand-orange outline-none h-12 text-body-md"
            />
          </div>

          {/* TW Correo electronico */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
              <Mail size={20} className="text-icon-gray-500" />
            </div>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="block w-full bg-input-bg border border-border-subtle rounded-2xl py-md pl-3xl pr-md text-on-surface placeholder-placeholder-gray-600 transition-all focus:ring-1 focus:ring-brand-orange focus:border-brand-orange outline-none h-12 text-body-md"
            />
          </div>

          {/* TW Contrasena */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
              <Lock size={20} className="text-icon-gray-500" />
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full bg-input-bg border border-border-subtle rounded-2xl py-md pl-3xl pr-3xl text-on-surface placeholder-placeholder-gray-600 transition-all focus:ring-1 focus:ring-brand-orange focus:border-brand-orange outline-none h-12 text-body-md"
            />
            {/* JS Alterna visibilidad de la contrasena entre texto y password */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute inset-y-0 right-0 pr-md flex items-center transition-colors ${
                showPassword ? "text-brand-orange" : "text-icon-gray-500 hover:text-on-surface"
              }`}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* TW Terminos y condiciones */}
          <div className="flex items-center gap-sm pt-xs">
            <label className="flex items-center gap-sm cursor-pointer group relative">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  // JS Alterna el estado de aceptacion de terminos
                  checked={acceptedTerms}
                  onChange={() => setAcceptedTerms(!acceptedTerms)}
                  required
                  className="w-5 h-5 rounded-lg border-surface-variant bg-input-bg checked:bg-brand-orange checked:border-brand-orange focus:ring-brand-orange focus:ring-offset-0 focus:ring-offset-transparent transition-colors cursor-pointer appearance-none"
                />
                <Check
                  size={14}
                  className={`absolute text-brand-dark-text font-bold pointer-events-none transition-opacity ${
                    acceptedTerms ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
              <span className="text-body-sm text-brand-muted-text leading-tight">
                Acepto los <span className="text-brand-orange font-medium hover:underline cursor-pointer transition-colors">términos y condiciones</span> de privacidad
              </span>
            </label>
          </div>

          {/* TW Bloque de alerta con el error del registro */}
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-report-red-text/40 bg-report-red-bg px-md py-sm"
            >
              <p className="text-body-sm font-medium text-report-red-text">{error}</p>
            </div>
          )}

          {/* TW Boton Registrarse */}
          <div className="pt-lg pb-md">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[68px] bg-brand-orange rounded-[16px] text-brand-dark-text font-bold text-label-lg uppercase tracking-wider transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-button flex items-center justify-center hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </div>
        </form>

        {/* TW Enlace a inicio de sesion para usuarios existentes */}
        <footer className="mt-lg pt-lg border-t border-border-subtle text-center">
          <p className="text-brand-muted-text text-body-sm">
            ¿Ya tienes cuenta?
            <Link to="/login" className="text-brand-orange font-semibold hover:underline ml-xs transition-colors">
              Inicia sesión
            </Link>
          </p>
        </footer>
      </main>

      {/* TW Pie de pagina con copyright */}
      <div className="fixed bottom-0 left-0 w-full h-[50px] bg-surface border-t border-border-subtle z-fixed">
        <div className="h-full flex items-center justify-center px-margin-mobile">
          <p className="text-brand-muted-text opacity-60 text-label-sm text-center">
            Copyright © 2026 Registro MVP. Todos los derechos reservados. <span className="hover:text-brand-orange cursor-pointer transition-colors">Política de privacidad</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
