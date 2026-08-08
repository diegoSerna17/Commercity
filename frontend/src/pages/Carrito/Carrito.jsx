import { useState } from "react";
import Header from "../../components/globales/Header";
import PasarelaPago from "./PasarelaPago";

function IconoEliminar() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 4.5h16M6 4.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5M7.5 9v6M10.5 9v6M2.5 4.5l1 12a1 1 0 0 0 1 .9h9a1 1 0 0 0 1-.9l1-12"
        stroke="var(--color-brand-muted-text)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoZapato() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-muted-text)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18h1.4c.5 0 .9-.3 1.1-.8L7 9h10l2.6 7.6c.2.5.6.4 1.1.4H22" />
      <path d="M7 9V6a2 2 0 0 1 2-2h2" />
      <circle cx="16" cy="9" r="1" fill="var(--color-brand-muted-text)" stroke="none" />
    </svg>
  );
}

function IconoAuriculares() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-muted-text)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a7 7 0 0 1 14 0v7a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

const iconosPorTipo = {
  zapato: { Icono: IconoZapato, colorFondo: "#eef0ff" },
  auricular: { Icono: IconoAuriculares, colorFondo: "var(--color-input-bg)" },
};

const productosIniciales = [
  {
    id: 1,
    nombre: "Zapatos Deportivos",
    categoria: "Calzado",
    precioUnitario: 79000,
    precioOriginal: 83000,
    cantidad: 1,
    tipo: "zapato",
  },
  {
    id: 2,
    nombre: "Auriculares Studio Pro",
    categoria: "Tecnología",
    precioUnitario: 299000,
    precioOriginal: null,
    cantidad: 2,
    tipo: "auricular",
  },
];

function formatPeso(valor) {
  return "$" + Math.round(valor).toLocaleString("es-CO");
}

export default function Carrito() {
  const [productos, setProductos] = useState(productosIniciales);
  const [mostrarPago, setMostrarPago] = useState(false);

  function sumar(id) {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p))
    );
  }

  function restar(id) {
    setProductos((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p))
        .filter((p) => p.cantidad > 0)
    );
  }

  function eliminar(id) {
    setProductos((prev) => prev.filter((p) => p.id !== id));
  }

  function finalizarCompra() {
    setProductos([]);
    setMostrarPago(false);
  }

  const totalArticulos = productos.reduce(
    (acc, p) => acc + (p.precioOriginal ?? p.precioUnitario) * p.cantidad,
    0
  );

  const descuentos = productos.reduce(
    (acc, p) =>
      p.precioOriginal
        ? acc + (p.precioOriginal - p.precioUnitario) * p.cantidad
        : acc,
    0
  );

  const total = productos.reduce(
    (acc, p) => acc + p.precioUnitario * p.cantidad,
    0
  );

  const carritoVacio = productos.length === 0;

  const productosParaPago = productos.map((p) => ({
    nombre: p.nombre,
    cantidad: p.cantidad,
    precioUnitario: p.precioUnitario,
  }));

  return (
    <div className="flex h-dvh bg-surface-container-lowest overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header showSearch={false} />

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-6 md:py-8">
          <div className="w-[450px] sm:w-[600px] lg:w-[700px] xl:w-[800px] max-w-[1000px] mx-auto">

            <h1 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-brand-orange mb-7">
              Carrito de Compras
            </h1>

            {carritoVacio ? (
              <div className="flex flex-col items-center py-20 text-brand-muted-text gap-4">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-muted-text)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <p className="text-lg font-semibold">Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mb-8">
                {productos.map((producto) => {
                  const { Icono, colorFondo } = iconosPorTipo[producto.tipo] ?? iconosPorTipo.zapato;
                  const precioLinea = producto.precioUnitario * producto.cantidad;
                  const precioOriginalLinea = producto.precioOriginal
                    ? producto.precioOriginal * producto.cantidad
                    : null;

                  return (
                    <div
                      key={producto.id}
                      className="bg-auth-card-bg rounded-card-lg relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-4"
                    >
                      <button
                        onClick={() => eliminar(producto.id)}
                        className="absolute top-3 right-4 text-brand-muted-text hover:text-error transition-colors flex items-center justify-center"
                        aria-label="Eliminar producto"
                      >
                        <IconoEliminar />
                      </button>

                      <div className="flex items-center gap-4 pr-8 sm:pr-0 sm:flex-1 min-w-0">
                        <div
                          className="flex-shrink-0 w-[70px] h-[70px] flex items-center justify-center rounded-card"
                          style={{ backgroundColor: colorFondo }}
                        >
                          <Icono />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-on-surface text-base sm:text-lg leading-snug">
                            {producto.nombre}
                          </p>
                          <p className="text-brand-muted-text font-extrabold text-sm mb-1">
                            {producto.categoria}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-brand-orange font-medium text-lg">
                              {formatPeso(precioLinea)}
                            </span>
                            {precioOriginalLinea && (
                              <span className="text-figma-accent-blue text-sm line-through">
                                {formatPeso(precioOriginalLinea)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-figma-divider sm:hidden" />

                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 sm:ml-auto">
                        <span className="text-brand-muted-text text-xs font-extrabold tracking-widest uppercase whitespace-nowrap">
                          CANTIDAD
                        </span>
                        <div className="flex items-center">
                          <button
                            onClick={() => restar(producto.id)}
                            className="w-9 h-9 sm:w-8 sm:h-8 bg-input-bg border-2 border-figma-divider text-on-surface font-medium text-xl flex items-center justify-center hover:bg-surface-container-highest active:scale-95 transition-all"
                          >
                            −
                          </button>
                          <div className="w-9 h-9 sm:w-8 sm:h-8 bg-auth-card-bg border-2 border-figma-divider text-on-surface font-medium text-base flex items-center justify-center">
                            {producto.cantidad}
                          </div>
                          <button
                            onClick={() => sumar(producto.id)}
                            className="w-9 h-9 sm:w-8 sm:h-8 bg-input-bg border-2 border-figma-divider text-on-surface font-medium text-xl flex items-center justify-center hover:bg-surface-container-highest active:scale-95 transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!carritoVacio && (
              <>
                <div className="h-px bg-figma-divider mb-5" />

                <div className="flex flex-col gap-1 mb-8">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-brand-muted-text font-extrabold text-lg sm:text-xl">
                      Total de artículos
                    </span>
                    <span className="text-brand-muted-text font-extrabold text-lg sm:text-xl">
                      {formatPeso(totalArticulos)}
                    </span>
                  </div>

                  {descuentos > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-brand-muted-text font-extrabold text-lg sm:text-xl">
                        Descuentos aplicados
                      </span>
                      <span className="text-figma-accent-blue font-extrabold text-lg sm:text-xl">
                        − {formatPeso(descuentos)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1">
                    <span className="text-on-surface font-extrabold text-xl sm:text-2xl">
                      Total
                    </span>
                    <span className="text-brand-orange font-extrabold text-xl sm:text-2xl">
                      {formatPeso(total)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMostrarPago(true)}
                  className="w-full bg-brand-orange text-brand-dark-text font-bold text-xl sm:text-2xl py-4 rounded-hero shadow-lg hover:bg-primary-container active:scale-95 transition-all duration-150"
                >
                  Comprar
                </button>
              </>
            )}

          </div>
        </div>
      </main>

      {mostrarPago && (
        <PasarelaPago
          productos={productosParaPago}
          onCancelar={() => setMostrarPago(false)}
          onPagoExitoso={finalizarCompra}
        />
      )}
    </div>
  );
}