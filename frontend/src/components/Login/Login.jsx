/**
 * Login.jsx - Componente de página de inicio de sesión
 * 
 * Este componente renderiza la página de login con un diseño split-screen:
 * - Panel izquierdo (solo desktop): Marca, logo, eslogan e imagen de fondo
 * - Panel derecho: Formulario de autenticación
 * 
 * El diseño es completamente responsive:
 * - Móvil/Tablet: Solo muestra el panel del formulario
 * - Desktop (≥1024px): Muestra ambos paneles en split 50/50
 * 
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

const Login = () => {
  // Estado para mostrar/ocultar la contraseña
  const [showPassword, setShowPassword] = useState(false);
  // Estado para manejar el formulario
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const navigate = useNavigate();

  /**
   * Maneja el cambio en los campos del formulario
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
   * Maneja el envío del formulario de login
   * @param {React.FormEvent} e - Evento de submit del formulario
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', formData);
  };

  /**
   * Maneja el clic en el botón de usuario del navbar para volver al inicio
   */
  const handleBack = () => {
    navigate('/');
  };

  return (
    <main className="flex min-h-screen bg-black">
      {/* 
        PANEL IZQUIERDO (Solo desktop)
        Oculto en móvil/tablet, visible en pantallas grandes (≥1024px)
        Ancho del 50% del contenedor
        Fondo negro con imagen de ciudad y branding
      */}
      <section className="hidden lg:flex w-1/2 bg-black relative overflow-hidden flex-col items-center p-12 justify-center">
        <div className="flex flex-col items-center justify-center w-full max-w-lg">
          {/* 
            Contenedor de marca y eslogan
            Centrado verticalmente con espacio entre elementos
          */}
          <div className="text-center space-y-8 mb-6">
            {/* Logo + Nombre de la empresa */}
            <div className="flex items-center justify-center space-x-6 mb-12">
              {/* 
                Logo de CommerCity
                Tamaño: w-24 h-24 (96px)
                Ajuste de objeto: contain para mantener proporciones
              */}
              <img 
                alt="CommerCity Logo" 
                className="w-24 h-24 object-contain" 
                src="/Logo_Black.jpeg" 
              />
              {/* 
                Nombre de la marca
                Tipografía: Plus Jakarta Sans (headline)
                Tamaño: text-6xl (3.75rem)
                Peso: extrabold (800)
                Color: blanco
                Estilo: italic para énfasis
              */}
              <h1 className="font-sans text-6xl font-extrabold text-white tracking-tight italic">
                CommerCity
              </h1>
            </div>
            
            {/* Eslogan principal */}
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

          {/* 
            Área de ilustración
            Contenedor relativo para posicionar la imagen de fondo
          */}
          <div className="relative w-full">
            <div className="relative w-full flex justify-center items-center">
              {/* 
                Imagen de ciudad para el panel izquierdo
                Anchura máxima: max-w-md (28rem)
                Centrada horizontalmente
              */}
              <img 
                alt="City Illustration" 
                className="w-full max-w-md mx-auto h-auto object-contain" 
                src="/fondo_City_Black.jpeg" 
              />
              {/* 
                Efecto de resplandor/blur secundario
                Posicionado en la parte inferior de la imagen
                Color secundario con opacidad para efecto de luz
              */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-64 h-32 bg-secondary opacity-20 blur-[80px] rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        PANEL DERECHO (Formulario)
        Visible en todos los tamaños de pantalla
        Ancho completo en móvil/tablet, 50% en desktop
        Fondo gris claro en móvil, negro en desktop
      */}
      <section className="w-full lg:w-1/2 flex items-stretch justify-start bg-gray-100 lg:bg-black p-6 sm:p-12 lg:p-0">
        {/* 
          Contenedor del formulario
          Margen en móvil/tablet,sin margen en desktop para tocar la línea central
          Fondo blanco con border-radius grande
          Sombreado intenso (shadow-2xl)
        */}
        <div className="w-full lg:m-12 lg:ml-0 bg-white rounded-[2rem] p-10 sm:p-16 lg:px-24 shadow-2xl flex flex-col justify-center">
          <div className="w-full max-w-lg mx-auto">
            {/* 
              Título del formulario
              Centrado con margen inferior grande
            */}
            <div className="text-center mb-12">
              <h2 className="font-sans text-3xl font-bold text-[#1A1A2E] tracking-tight">
                Iniciar sesión en CommerCity
              </h2>
            </div>

            {/* 
              Formulario de autenticación
              Espaciado vertical entre campos
            */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* 
                CAMPO: USUARIO
                Input con icono de persona a la izquierda
              */}
              <div className="space-y-1">
                <div className="relative">
                  {/* 
                    Icono de persona
                    Posicionado absolutamente a la izquierda dentro del input
                    Color gris (#9E9E9E = text-muted)
                  */}
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-muted" />
                  </div>
                  {/* 
                    Input de usuario
                    Ancho completo con padding izquierdo para el icono
                    Borde gris, cambia a azul primary en focus
                    Texto oscuro (#1A1A2E)
                  */}
                  <input
                    className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-[#1A1A2E] placeholder-text-muted font-medium"
                    id="username"
                    name="username"
                    placeholder="Usuario"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* 
                CAMPO: CONTRASEÑA
                Input con icono de candado + botón para mostrar/ocultar contraseña
              */}
              <div className="space-y-1">
                <div className="relative">
                  {/* Icono de candado */}
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-muted" />
                  </div>
                  {/* Input de contraseña */}
                  <input
                    className="block w-full pl-12 pr-12 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-[#1A1A2E] placeholder-text-muted font-medium"
                    id="password"
                    name="password"
                    placeholder="Contraseña"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {/* 
                    Botón para mostrar/ocultar contraseña
                    Icono de ojo posicionado a la derecha
                    Cursor pointer para interacción
                  */}
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-text-muted" />
                    ) : (
                      <Eye className="h-5 w-5 text-text-muted" />
                    )}
                  </button>
                </div>
              </div>

              {/* 
                BOTÓN: INICIAR SESIÓN
                Gradiente de colores primarios (primary a secondary)
                Texto blanco, fuente bold
                Sombra y efecto hover
              */}
              <button
                className="w-full py-4 px-6 text-white font-sans font-bold rounded-xl shadow-lg hover:opacity-90 transition-all text-lg mt-4 bg-gradient-to-r from-primary to-secondary"
                type="submit"
              >
                Iniciar sesión
              </button>

              {/* 
                Enlace: ¿Olvidaste tu contraseña?
                Color azul primario, subrayado en hover
              */}
              <div className="text-center pt-4">
                <a className="text-base font-medium text-primary hover:underline transition-colors" href="#">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* 
                Separador visual (línea horizontal)
                Usando pseudo-elemento con aria-hidden para accesibilidad
              */}
              <div className="relative py-6">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
              </div>

              {/* 
                BOTÓN: ENTRAR COMO INVITADO
                Fondo blanco con borde gris
                Icono de persona a la izquierda del texto
              */}
              <button
                className="w-full py-4 px-6 bg-white border border-gray-300 text-[#1A1A2E] font-sans font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center space-x-3"
                type="button"
              >
                <UserPlus className="text-primary h-5 w-5" />
                <span>Entrar como invitado</span>
              </button>
            </form>

            {/* 
              FOOTER: SEGURIDAD
              Icono de candado + texto de conexión segura
              Texto gris muted
            */}
            <div className="mt-12 flex items-center justify-center space-x-2 text-text-muted">
              <Shield className="h-[18px] w-[18px]" />
              <span className="text-sm font-medium">Conexión segura y encriptada</span>
            </div>
          </div>
        </div>
      </section>

      {/* 
        FOOTER FIJO (Solo desktop)
        Copyright en la parte inferior de la pantalla
        Solo visible en pantallas grandes (≥1024px)
        Posición fixed, texto pequeño ygris
      */}
      <div className="fixed bottom-6 w-full text-center hidden lg:block pointer-events-none">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
          © 2024 CommerCity. Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
};

export default Login;