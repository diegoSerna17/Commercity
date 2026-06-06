import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, EyeOff, Eye, Check } from "lucide-react";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle registration
    console.log("Registering...");
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
          {/* Nombre completo */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
              <User size={20} className="text-on-surface-variant opacity-60" />
            </div>
            <input
              name="full-name"
              type="text"
              required
              placeholder="Nombre completo"
              className="block w-full bg-[#1a1a26] border border-border-subtle rounded-2xl py-md pl-3xl pr-md text-on-surface placeholder-on-surface-variant/50 transition-all focus:ring-1 focus:ring-primary focus:border-primary outline-none h-12 text-body-md"
            />
          </div>

          {/* Correo electrónico */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
              <Mail size={20} className="text-on-surface-variant opacity-60" />
            </div>
            <input
              name="email"
              type="email"
              required
              placeholder="Correo electrónico"
              className="block w-full bg-[#1a1a26] border border-border-subtle rounded-2xl py-md pl-3xl pr-md text-on-surface placeholder-on-surface-variant/50 transition-all focus:ring-1 focus:ring-primary focus:border-primary outline-none h-12 text-body-md"
            />
          </div>

          {/* Contraseña */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
              <Lock size={20} className="text-on-surface-variant opacity-60" />
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="Contraseña"
              className="block w-full bg-[#1a1a26] border border-border-subtle rounded-2xl py-md pl-3xl pr-3xl text-on-surface placeholder-on-surface-variant/50 transition-all focus:ring-1 focus:ring-primary focus:border-primary outline-none h-12 text-body-md"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-md flex items-center text-on-surface-variant opacity-60 hover:text-primary transition-colors"
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* Términos y condiciones */}
          <div className="flex items-center gap-sm pt-xs">
            <label className="flex items-center gap-sm cursor-pointer group relative">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={() => setAcceptedTerms(!acceptedTerms)}
                  required
                  className="w-5 h-5 rounded-lg border-surface-variant bg-[#1a1a26] checked:bg-primary-container checked:border-primary-container focus:ring-primary focus:ring-offset-0 focus:ring-offset-transparent transition-colors cursor-pointer appearance-none"
                />
                <Check
                  size={14}
                  className={`absolute text-background font-bold pointer-events-none transition-opacity ${
                    acceptedTerms ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
              <span className="text-body-sm text-on-surface-variant leading-tight">
                Acepto los <span className="text-primary-container font-medium hover:underline cursor-pointer transition-colors">términos y condiciones</span> de privacidad
              </span>
            </label>
          </div>

          {/* Botón Registrarse */}
          <div className="pt-lg pb-md">
            <button
              type="submit"
              className="w-full h-[68px] bg-primary-container rounded-[16px] text-background font-bold text-label-lg uppercase tracking-wider transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)] flex items-center justify-center hover:brightness-110"
            >
              Registrarse
            </button>
          </div>
        </form>

        {/* Links de pie de página del form */}
        <footer className="mt-lg pt-lg border-t border-border-subtle text-center">
          <p className="text-on-surface-variant text-body-sm">
            ¿Ya tienes cuenta?
            <Link to="/login" className="text-primary-container font-semibold hover:underline ml-xs transition-colors">
              Inicia sesión
            </Link>
          </p>
        </footer>
      </main>

      {/* Footer Nav simulado */}
      <div className="fixed bottom-0 left-0 w-full h-[50px] bg-surface border-t border-border-subtle z-fixed">
        <div className="h-full flex items-center justify-center px-margin-mobile">
          <p className="text-on-surface-variant opacity-60 text-label-sm text-center">
            Copyright © 2024 Registro MVP. Todos los derechos reservados. <span className="hover:text-primary-container cursor-pointer transition-colors">Política de privacidad</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
