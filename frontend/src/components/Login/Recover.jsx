/**
 * Página de recuperación de contraseña
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

/**
 * Componente de recuperación
 * Permite recuperar la contraseña mediante correo o teléfono
 */
const Recover = () => {
  // Datos del formulario
  const [formData, setFormData] = useState({
    identifier: ''
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
    console.log('Recuperar:', formData);
  };

  // Ir a login
  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4" 
          style={{ background: 'linear-gradient(to bottom, var(--color-primary) 30%, var(--color-bg-secondary) 30%)' }}>
      
      {/* Tarjeta de recuperación */}
      <div className="w-full max-w-[550px] bg-white rounded-[2rem] shadow-2xl overflow-hidden p-12">
        
        {/* Título */}
        <header className="text-center mb-6">
          <h1 className="text-text-main text-3xl font-bold tracking-tight">
            Recuperar contraseña
          </h1>
        </header>

        {/* Descripción */}
        <div className="text-center mb-8">
          <p className="text-text-muted text-sm">
            Ingresa tu correo o teléfono
            <br />
            asociado a tu cuenta
            <br />
            para enviarte un código de verificación
          </p>
        </div>

        {/* Formulario */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* Correo o teléfono */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-text-muted" />
            </div>
            <input
              className="input-with-icon"
              id="identifier"
              name="identifier"
              placeholder="Correo o teléfono"
              type="text"
              value={formData.identifier}
              onChange={handleChange}
              aria-label="Correo o teléfono"
            />
          </div>

          {/* Botón de continuar */}
          <div className="pt-6">
            <button
              className="btn-primary"
              type="submit"
            >
              Continuar
            </button>
          </div>
        </form>

        {/* Enlace a login */}
        <footer className="mt-12 border-t border-border-light pt-8 text-center">
          <p className="text-sm text-text-muted font-medium">
            ¿Recordaste tu contraseña? 
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

export default Recover;