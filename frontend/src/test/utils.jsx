/**
 * Utilidades compartidas por las pruebas del frontend (CON-002).
 *
 * Stubs que jsdom no implementa y que se instalan SOLO en los archivos que los
 * necesitan (TASK-0.4); si mas de un archivo los requiere, se mueven a
 * `src/test/setup.js`:
 * - `vi.mock("swiper/react", ...)` y `vi.mock("swiper/modules", ...)`:
 *   `Inicio.jsx` usa Swiper (ESM y CSS); sin el mock la prueba falla o tarda
 *   (RISK-001). Mock minimo: `Swiper`/`SwiperSlide` como divs y
 *   `Autoplay`/`Pagination`/`Navigation` como objetos vacios.
 * - `mockIntersectionObserver()`: jsdom no trae IntersectionObserver.
 * - `mockMatchMedia(matches)`: jsdom no trae matchMedia (`tema.js`).
 * - `mockCreateObjectURL(url)`: jsdom no crea object URLs para previews.
 *
 * Todas las fabricas usan datos ficticios (RISK-009): nunca datos reales.
 */
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

/**
 * Renderiza `ui` dentro de un MemoryRouter.
 * @param {React.ReactNode} ui Contenido a montar.
 * @param {{ruta?: string, rutas?: Array<{path: string, element: React.ReactNode}>}} [opciones]
 *   `ruta`: entrada inicial. `rutas`: si se indica, arma la tabla de rutas y
 *   `ui` se ignora.
 * @returns {import("@testing-library/react").RenderResult}
 */
export function renderConRutas(ui, { ruta = "/", rutas } = {}) {
  const contenido = rutas ? (
    <Routes>
      {rutas.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Routes>
  ) : (
    ui
  );

  return render(<MemoryRouter initialEntries={[ruta]}>{contenido}</MemoryRouter>);
}

/**
 * Usuario ficticio de la sesion.
 * @param {"comprador"|"vendedor"|"administrador"} [rol]
 * @param {object} [sobreescribir]
 */
export const usuarioFalso = (rol = "comprador", sobreescribir = {}) => ({
  id: 10,
  nombre_completo: "Ana Perez",
  correo: "ana.perez@example.com",
  roles: [rol],
  ...sobreescribir,
});

/**
 * Producto ficticio con la forma que consumen `FichaProducto`, `Inicio` y el
 * catalogo (`mapearProducto` y los componentes de tienda).
 */
export const productoFalso = (sobreescribir = {}) => ({
  id: 1,
  name: "Teclado mecanico",
  price: 150000,
  precioBase: 150000,
  descuento: 0,
  stock: 10,
  category: "Tecnologia",
  description: "Teclado de prueba con switches azules.",
  image: "https://example.com/teclado.png",
  imageAlt: "Teclado mecanico",
  vendedorId: 7,
  vendedorNombre: "Ana Perez",
  vendedorAvatar: "https://example.com/ana.png",
  ...sobreescribir,
});

/**
 * Pedido ficticio con la forma de `DetalleCompras` (comprador) y de
 * `DetallePedidos` (vendedor), para reutilizar una sola fabrica.
 */
export const pedidoFalso = (sobreescribir = {}) => ({
  pedido_id: 501,
  fechaLarga: "12 de octubre de 2026",
  estado: "Pendiente",
  vendedor: "Ana Perez",
  direccion: "Calle 1 # 2-3",
  ciudad: "Bogota",
  email: "ana.perez@example.com",
  referencia: "REF-2026-501",
  initials: "AP",
  initialsTextClass: "text-primary-fixed-dim",
  avatarColor: "#32324d",
  cliente: "Ana Perez",
  avatarLetra: "A",
  neto: 81000,
  comision: 9000,
  resumen: { subtotal: 100000, iva: 19000, total: 119000 },
  items: [
    { pedido_id: 501, vendedor: "Ana Perez", estado: "Pendiente" },
  ],
  productos: [
    {
      detalleId: 1,
      nombre: "Teclado mecanico",
      cantidad: 2,
      precioUnit: 50000,
      precioUnitario: 50000,
      estado: "Pendiente",
    },
  ],
  ...sobreescribir,
});

/** Reporte ficticio con la forma que consume el panel de administrador. */
export const reporteFalso = (sobreescribir = {}) => ({
  id: 1,
  tipo: "usuario",
  estado: "pendiente",
  fecha: "2026-10-12",
  reportado: "Carlos Ruiz",
  reportadoInfo: "carlos.ruiz@example.com · Comprador",
  reportadoPor: "Ana Perez",
  reportadoPorInfo: "ana.perez@example.com · Vendedor",
  descripcion: "Lenguaje ofensivo en los mensajes.",
  evidencias: 1,
  respuesta: "",
  reportadoPrecio: null,
  reportadoVendedor: "",
  ...sobreescribir,
});

/** Notificacion ficticia con la forma que consume `NotificacionesDropdown`. */
export const notificacionFalsa = (sobreescribir = {}) => ({
  id: 1,
  leida: false,
  tipo: "pedidos",
  descripcion: "Tu pedido fue confirmado.",
  fecha_hora: "2026-10-12T10:00:00.000Z",
  url_redireccion: "/perfil/pedidos",
  ...sobreescribir,
});

/**
 * Archivo de imagen ficticio para los formularios con carga de avatar o foto.
 * @param {{nombre?: string, tipo?: string, contenido?: string}} [opciones]
 */
export function crearArchivoImagen({
  nombre = "foto.png",
  tipo = "image/png",
  contenido = "imagen-de-prueba",
} = {}) {
  return new File([contenido], nombre, { type: tipo });
}

/**
 * Sustituye `FileReader` por uno sincronico que entrega `resultado` a `onload`
 * y `onloadend`. Devuelve la funcion para restaurar el original.
 * @param {string} [resultado]
 */
export function mockFileReader(resultado = "data:image/png;base64,QUJD") {
  const original = globalThis.FileReader;

  class FileReaderFalso {
    constructor() {
      this.result = null;
      this.onload = null;
      this.onloadend = null;
      this.onerror = null;
    }

    readAsDataURL() {
      this.result = resultado;
      const evento = { target: this };
      if (typeof this.onload === "function") this.onload(evento);
      if (typeof this.onloadend === "function") this.onloadend(evento);
    }
  }

  globalThis.FileReader = FileReaderFalso;
  return () => {
    globalThis.FileReader = original;
  };
}

/**
 * Instala un `matchMedia` falso. Devuelve la funcion para restaurar.
 * @param {boolean} [matches]
 */
export function mockMatchMedia(matches = false) {
  const original = window.matchMedia;
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  return () => {
    window.matchMedia = original;
  };
}

/**
 * Instala un `IntersectionObserver` falso (jsdom no lo implementa).
 * Devuelve la funcion para restaurar.
 */
export function mockIntersectionObserver() {
  const original = globalThis.IntersectionObserver;
  class IntersectionObserverFalso {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver = IntersectionObserverFalso;
  return () => {
    globalThis.IntersectionObserver = original;
  };
}

/**
 * Instala `URL.createObjectURL`/`revokeObjectURL` falsos para vistas previas.
 * Devuelve la funcion para restaurar.
 * @param {string} [url]
 */
export function mockCreateObjectURL(url = "blob:preview") {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => url);
  URL.revokeObjectURL = vi.fn();
  return () => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  };
}
