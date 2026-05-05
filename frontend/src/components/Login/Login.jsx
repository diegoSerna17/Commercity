/**
 * página de inicio de sesión
 * @returns {JSX.Element} Componente de página de login
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Shield 
} from 'lucide-react';

/**
 * Componente principal de login
 * Maneja autenticación de usuarios con formulario
 */
const Login = () => {
  // Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  // Estado del formulario
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  /**
   * Maneja cambios en los campos del formulario
   * @param {React.ChangeEvent} e - Evento de cambio del input
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Maneja el envío del formulario
   * @param {React.FormEvent} e - Evento de submit
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', formData);
  };

  /**
   * Navega a la página principal
   */
  const handleBack = () => {
    navigate('/');
  };

  return (
    <main className="flex min-h-screen bg-black">
      {/* Panel izquierdo - Branding (solo desktop) */}
      <section className="hidden lg:flex w-1/2 bg-black relative overflow-hidden flex-col items-center p-12 justify-center">
        <div className="flex flex-col items-center justify-center w-full max-w-lg">
          {/* Logo + Nombre de marca */}
          <div className="text-center space-y-8 mb-6">
            <div className="flex items-center justify-center space-x-4 mb-12">
              <Link to="/">
              <img 
                alt="CommerCity Logo" 
                className="w-44 h-44 object-contain cursor-pointer" 
                src="/Logo_Black.png" 
              />
            </Link>
              <h1 className="font-sans text-6xl font-extrabold tracking-tight italic">
                <span className="text-secondary">Commer</span><span className="text-primary">City</span>
              </h1>
            </div>
            
            {/* Eslogan */}
            <div className="space-y-2">
              <p className="font-sans text-2xl font-bold text-white">
                Tu tienda. Tu ciudad.
              </p>
              <p className="font-sans text-3xl font-extrabold">
                <span className="text-accent-blue">Tu éxito</span>, 
                <span className="text-secondary ml-2">comienza aquí.</span>
              </p>
            </div>
          </div>

          {/* Imagen decorativa */}
          <div className="relative w-full">
            <div className="relative w-full flex justify-center items-center">
              <img 
                alt="City Illustration" 
                className="w-full max-w-md mx-auto h-auto object-contain" 
                src="/fondo_City_Black.jpeg" 
              />
              {/* Efecto de resplandor */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-32 bg-secondary opacity-20 blur-[80px] rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Panel derecho - Formulario */}
      <section className="w-full lg:w-1/2 flex items-stretch justify-start bg-gray-100 lg:bg-black p-6 sm:p-12 lg:p-0">
        {/* Contenedor del formulario */}
        <div className="w-full lg:m-12 lg:ml-0 bg-white rounded-[2rem] p-10 sm:p-16 lg:px-24 shadow-2xl flex flex-col justify-center">
          <div className="w-full max-w-lg mx-auto">
            {/* Título */}
            <div className="text-center mb-12">
              <h2 className="font-sans text-3xl font-bold text-text-main tracking-tight">
                Iniciar sesión en CommerCity
              </h2>
            </div>

            {/* Formulario */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Campo: Usuario */}
              <div className="space-y-1">
                <div className="relative">
                  {/* Icono de usuario */}
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-muted" />
                  </div>
                  {/* Input de usuario - usa clase .input-with-icon */}
                  <input
                    className="input-with-icon"
                    id="username"
                    name="username"
                    placeholder="Usuario"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    aria-label="Nombre de usuario"
                  />
                </div>
              </div>

              {/* Campo: Contraseña */}
              <div className="space-y-1">
                <div className="relative">
                  {/* Icono de candado */}
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-muted" />
                  </div>
                  {/* Input de contraseña - usa clase .input-password */}
                  <input
                    className="input-password"
                    id="password"
                    name="password"
                    placeholder="Contraseña"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    aria-label="Contraseña"
                  />
                  {/* Botón toggle mostrar/ocultar contraseña */}
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-text-muted" />
                    ) : (
                      <Eye className="h-5 w-5 text-text-muted" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón: Iniciar sesión - usa clase .btn-primary */}
              <button
                className="btn-primary"
                type="submit"
              >
                Iniciar sesión
              </button>

              {/* Enlace: ¿Olvidaste tu contraseña? - usa clase .btn-link */}
              <div className="text-center pt-4">
                <a className="btn-link" href="#" aria-label="Recuperar contraseña">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Separador visual */}
              <div className="relative py-6">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-gray"></div>
                </div>
              </div>

              {/* Botón: Entrar como invitado - usa clase .btn-secondary */}
              <button
                className="btn-secondary"
                type="button"
                aria-label="Entrar como invitado"
              >
                <UserPlus className="text-primary h-5 w-5" />
                <span>Entrar como invitado</span>
              </button>
            </form>

            {/* Footer: Seguridad */}
            <div className="mt-12 flex items-center justify-center space-x-2 text-text-muted">
              <Shield className="h-[18px] w-[18px]" />
              <span className="text-sm font-medium">Conexión segura y encriptada</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer fijo - Solo desktop */}
      <div className="fixed bottom-6 w-full text-center hidden lg:block pointer-events-none">
        <p className="text-[10px] text-text-muted uppercase tracking-widest">
          © 2026 CommerCity. Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
};

export default Login;