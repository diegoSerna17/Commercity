import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Flag, Minus, Plus, X } from "lucide-react";

const PRODUCT_IMAGE_SRC =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop";

function formatearPrecio(numero) {
  return `$${Math.round(numero).toLocaleString("es-CO")}`;
}

export default function FichaProducto({ product, onClose, onReportar, onIrPerfilVendedor, onAgregarCarrito }) {
  const [quantity, setQuantity] = useState(1);
  const [zoomAbierto, setZoomAbierto] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const stock = product?.stock ?? 0;
  const descuento = product?.descuento ?? 0;
  const precioBase = product?.precioBase ?? product?.price ?? 0;
  const agotado = stock === 0;
  const tieneDescuento = descuento > 0;
  const precioFinal = tieneDescuento
    ? precioBase - (precioBase * descuento) / 100
    : product?.price ?? precioBase;
  const imagenUrl = product?.image || PRODUCT_IMAGE_SRC;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!toastMsg) return undefined;
    const timer = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        if (zoomAbierto) setZoomAbierto(false);
        else onClose?.();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [zoomAbierto, onClose]);

  if (!product) return null;

  function handleCart() {
    if (agotado) return;

    const added = quantity;
    setQuantity(1);
    onAgregarCarrito?.(product, added);
    setToastMsg(`${added} ${added === 1 ? "unidad agregada" : "unidades agregadas"} al carrito`);
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm">
        <section
          className="flex max-h-[96vh] w-full max-w-[760px] flex-col overflow-hidden rounded-card-lg border border-figma-divider bg-auth-card-bg font-sans shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ficha-producto-title"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-figma-divider px-padding-lg py-3">
            <span className="text-headline-sm font-bold tracking-tight text-brand-orange">
              CommerCity
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onReportar?.(product)}
                className="flex h-9 items-center gap-2 rounded-card border border-report-red-text/70 bg-transparent px-3 text-body-sm font-bold text-report-red-text transition hover:bg-report-red-bg"
              >
                <Flag className="h-4 w-4" />
                Reportar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 items-center gap-2 rounded-card border border-figma-divider bg-transparent px-3 text-body-sm font-bold text-on-surface transition hover:bg-surface-container"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-padding-lg md:flex-row">
            <button
              type="button"
              aria-label="Ampliar imagen del producto"
              onClick={() => setZoomAbierto(true)}
              className="relative h-[260px] w-full shrink-0 overflow-hidden rounded-card bg-surface-container-high md:h-auto md:w-[230px] cursor-zoom-in"
            >
              <img
                src={imagenUrl}
                alt=""
                aria-hidden="true"
                className="absolute -inset-4 h-[calc(100%+32px)] w-[calc(100%+32px)] scale-110 object-cover opacity-70 blur-lg"
              />
              <img
                src={imagenUrl}
                alt={product.imageAlt || product.name}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </button>

            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-xs font-extrabold uppercase tracking-wide text-brand-muted-text">Nombre</p>
              <h2 id="ficha-producto-title" className="mb-3 text-headline-md font-bold text-on-surface">
                {product.name}
              </h2>

              <p className="text-xs font-extrabold uppercase tracking-wide text-brand-muted-text">Categoria</p>
              <p className="mb-3 text-body-md font-semibold text-on-surface">
                {product.category || "General"}
              </p>

              <p className="text-xs font-extrabold uppercase tracking-wide text-brand-muted-text">Estado</p>
              <span
                className={`mb-3 inline-flex w-fit rounded-button border px-4 py-1.5 text-body-sm font-bold ${
                  agotado
                    ? "border-error-container bg-error-container/30 text-error"
                    : "border-success/40 bg-success/15 text-success"
                }`}
              >
                {agotado ? "Agotado" : "Disponible"}
              </span>

              <p className="text-xs font-extrabold uppercase tracking-wide text-brand-muted-text">Precio</p>
              {tieneDescuento && (
                <p className="text-body-sm font-medium text-figma-accent-blue/70 line-through">
                  {formatearPrecio(precioBase)}
                </p>
              )}
              <p className="mb-3 text-headline-sm font-bold text-brand-orange">
                {formatearPrecio(precioFinal)}
              </p>

              <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-card bg-input-bg px-4 py-3 shadow-lg">
                  <p className="text-xs font-bold uppercase text-brand-muted-text">Stock</p>
                  <p className="text-body-md font-semibold text-on-surface">{stock} unidades</p>
                </div>
                {tieneDescuento && (
                  <div className="rounded-card bg-input-bg px-4 py-3 shadow-lg">
                    <p className="text-xs font-bold uppercase text-brand-muted-text">Descuento</p>
                    <p className="text-body-md font-semibold text-figma-accent-blue">{descuento}%</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mx-padding-lg mb-3 rounded-card bg-input-bg px-4 py-3">
            <p className="mb-1 text-xs font-bold uppercase text-brand-muted-text">Descripcion del producto</p>
            <p className="max-h-24 overflow-y-auto pr-2 text-body-sm font-medium leading-6 text-on-surface">
              {product.description}
            </p>
          </div>

          <div className="mx-padding-lg h-px shrink-0 bg-figma-divider" />

          <footer className="flex shrink-0 flex-col gap-4 px-padding-lg py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase text-brand-muted-text">Vendedor</p>
              <button
                type="button"
                onClick={() => onIrPerfilVendedor?.(product.vendedorId)}
                className="-ml-1 mt-1 flex w-fit items-center gap-2 rounded-card p-1 transition hover:bg-input-bg"
              >
                <img
                  src={product.vendedorAvatar}
                  alt={product.vendedorNombre}
                  className="h-9 w-9 rounded-full bg-input-bg object-cover"
                />
                <span className="text-body-sm font-bold text-on-surface transition group-hover:text-brand-orange">
                  {product.vendedorNombre}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="text-center">
                <p className="mb-1 text-xs font-extrabold uppercase text-brand-muted-text">Cantidad</p>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    disabled={quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center border-2 border-figma-divider bg-input-bg text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex h-8 w-9 items-center justify-center border-y-2 border-figma-divider bg-auth-card-bg text-body-sm font-bold text-on-surface">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.min(stock, current + 1))}
                    disabled={agotado || quantity >= stock}
                    className="flex h-8 w-8 items-center justify-center border-2 border-figma-divider bg-input-bg text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCart}
                disabled={agotado}
                className="h-11 rounded-button bg-brand-orange px-6 text-body-sm font-bold text-brand-dark-text transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Agregar al carrito
              </button>
            </div>
          </footer>
        </section>
      </div>

      {zoomAbierto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada del producto"
          onClick={(event) => {
            if (event.target === event.currentTarget) setZoomAbierto(false);
          }}
        >
          <button
            type="button"
            aria-label="Cerrar vista ampliada"
            onClick={() => setZoomAbierto(false)}
            className="absolute right-4 top-4 z-[61] flex h-10 w-10 items-center justify-center rounded-full border border-figma-divider bg-input-bg text-on-surface transition hover:bg-surface-container"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={imagenUrl}
            alt={product.imageAlt || product.name}
            className="max-h-[90vh] max-w-full select-none object-contain"
          />
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-card-lg bg-brand-orange px-5 py-2 text-body-sm font-bold text-brand-dark-text shadow-2xl">
          {toastMsg}
        </div>
      )}
    </>,
    document.body
  );
}
