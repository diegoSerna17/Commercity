# Guia de Documentacion de Codigo - CommerCity

## 1. Idioma

- Todo en espanol
- Sin emojis, sin simbolos especiales (=, @, *, #, `)
- Sin markdown dentro de los comentarios

## 2. Estructura de cabecera de cada componente

Bloque de lineas con prefijos al inicio del archivo:

```
RE Titulo: [Nombre] - [funcionalidad del componente]
RE Implementacion React: [hooks utilizados, librerias importadas]
JS Codigo y componentes: [logica interna, datos estaticos, estructura]
TW Clases Tailwind: [tokens de diseno personalizados, layout, patrones de estilos]
```

## 3. Prefijos obligatorios en cada comentario

RE  Usar para: hooks (useState, useEffect, useNavigate, useLocation),
    props del componente, export/import del componente, createPortal,
    useEffect y eventos del ciclo de vida, comentarios de seccion JSX
    que describen la estructura del componente en React

JS  Usar para: importaciones de librerias, constantes y datos estaticos
    (arrays, objetos), funciones manejadoras (handleSubmit, handleNav),
    logica de estado y condicionales, console.log placeholder,
    configuracion de datos (PLANS, MESSAGES, ORDERS, PRODUCTS, etc.)

TW  Usar para: cualquier comentario sobre clases de Tailwind, estilos
    visuales, colores, layout, variantes responsive, efectos visuales,
    tokens de diseno personalizados. Incluso si esta dentro de codigo
    React o JSX, si describe estilos lleva TW

## 4. Formatos de comentarios segun contexto

Comentarios de seccion dentro de JSX:
  {/* RE descripcion de la seccion */}

Comentarios inline sobre codigo JavaScript:
  // RE descripcion del hook o componente
  // JS descripcion de la funcion o dato
  // TW descripcion de la clase o estilo

Comentarios de bloque al inicio del archivo:
  // RE Titulo: ...
  // RE Implementacion React: ...
  // JS Codigo y componentes: ...
  // TW Clases Tailwind: ...

## 5. Reglas generales

- Reemplazar cualquier documentacion existente en ingles por la nueva
- Reemplazar bloques JSDoc (/** */) por comentarios planos //
- Reemplazar separadores visuales como ===== o --- por texto plano
- NO usar caracteres especiales en el texto: sin acentos en palabras
  clave, sin dieresis, sin markdown
- Archivos vacios o pendientes: prefijo JS indicando el proposito
  y que esta pendiente de implementacion
- Priorizar claridad y brevedad en cada comentario

## 6. Ejemplos practicos

Ejemplo de cabecera de componente:

```
// RE Titulo: Login - Pagina de inicio de sesion de CommerCity
//
// RE Implementacion React: useState para estado del checkbox Recordarme
// RE y toggle de visibilidad de contrasena
//
// JS Codigo y componentes: layout de dos paneles, panel izquierdo con branding
// JS y estadisticas, panel derecho con formulario de acceso que incluye campos
// JS de email y contrasena, checkbox personalizado, enlace de recuperacion
//
// TW Clases Tailwind: tokens personalizados como bg-surface, bg-input-bg,
// TW text-brand-orange, border-border-subtle. Layout con lg:w-[60%] y
// TW lg:w-[40%] para los dos paneles
```

Ejemplo de documentacion inline:

```javascript
// RE Hook para navegacion programatica entre rutas
const navigate = useNavigate();

// JS Manejador de envio del formulario con prevencion de recarga
const handleSubmit = (e) => {
  e.preventDefault();
};

// TW Estilos de fondo y texto para cada estado del pedido
const STATUS_STYLES = {
  Entregado: "bg-primary/20 text-primary",
  Pendiente: "bg-accent-red/20 text-accent-red",
};
```

Ejemplo de secciones JSX:

```jsx
{/* RE Encabezado del perfil con avatar y acciones */}
{/* RE Grilla de productos con imagenes y precios */}
{/* RE Boton principal de envio del formulario */}
```
