/**
 * Página de registro de usuario
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff 
} from 'lucide-react';

/**
 * Componente de registro
 * Permite crear una nueva cuenta de usuario
 */
const Register = () => {
  // Estado para mostrar u ocultar la contraseña
  const [showPassword, setShowPassword] = useState(false);
  // Datos del formulario
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  // Navegación
  const navigate = useNavigate();

  // Guardar lo que el usuario escribe
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registro:', formData);
  };

  // Ir a login
  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4" 
          style={{ background: 'linear-gradient(to bottom, var(--color-primary) 30%, var(--color-bg-secondary) 30%)' }}>
      
      {/* Tarjeta de registro */}
      <div className="w-full max-w-[550px] bg-white rounded-[1rem] shadow-2xl overflow-hidden p-12">
        
        {/* Título */}
        <header className="text-center mb-10">
          <h1 className="text-text-main text-3xl font-bold tracking-tight">
            Crear cuenta en CommerCity
          </h1>
        </header>

        {/* Campos del formulario */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* Nombre de usuario */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-text-muted" />
            </div>
            <input
              className="input-with-icon"
              id="username"
              name="username"
              placeholder="Nombre de usuario"
              type="text"
              value={formData.username}
              onChange={handleChange}
              aria-label="Nombre de usuario"
            />
          </div>

          {/* Correo electrónico */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-text-muted" />
            </div>
            <input
              className="input-with-icon"
              id="email"
              name="email"
              placeholder="Correo electrónico"
              type="email"
              value={formData.email}
              onChange={handleChange}
              aria-label="Correo electrónico"
            />
          </div>

          {/* Contraseña */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-text-muted" />
            </div>
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
            {/* Botón para ver/ocultar contraseña */}
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

          {/* Confirmar contraseña */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-text-muted" />
            </div>
            <input
              className="input-password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirmar contraseña"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              aria-label="Confirmar contraseña"
            />
          </div>

          {/* Botón de registrar */}
          <div className="pt-6">
            <button
              className="btn-primary"
              type="submit"
            >
              Registrarse
            </button>
          </div>
        </form>

        {/* Enlace a login */}
        <footer className="mt-12 border-t border-border-light pt-8 text-center">
          <p className="text-sm text-text-muted font-medium">
            ¿Ya tienes cuenta? 
            <button 
              className="text-primary hover:text-primary font-semibold ml-1 transition-colors underline-offset-4 hover:underline"
              onClick={handleLogin}
            >
              Iniciar sesión
            </button>
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Register;