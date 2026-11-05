import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Flag, Star, X } from "lucide-react";

import {
  aplicarFallbackImagenProducto,
  replaceInvalidProductImage,
  resolverImagenRespaldoProducto,
} from "../../utils/productImageFallback.js";
import { formatPriceRounded } from "../../utils/formatPrice.js";
import { useToast } from "../../hooks/useToast.js";
import { useCalificacion } from "./useCalificacion.js";
import SelectorCantidad from "./SelectorCantidad.jsx";

export default function FichaProducto({ product, onClose, onReportar, onIrPerfilVendedor, onAgregarCarrito }) {
  const [quantity, setQuantity] = useState(1);
  const [zoomAbierto, setZoomAbierto] = useState(false);
  const { toast, showToast } = useToast(2600);
  const vendedorId = product?.vendedorId ?? null;
  const {
    abierta: calificacionAbierta,
    alternar: alternarCalificacion,
    estrellas,
    setEstrellas,
    comentario,
    setComentario,
    enviando: enviandoCalificacion,
    error: errorCalificacion,
    exito: exitoCalificacion,
    motivoDeshabilitada: motivoCalificacionDeshabilitada,
    enviar: enviarCalificacion,
  } = useCalificacion({ product, vendedorId });

  const stock = product?.stock ?? 0;
  const descuento = product?.descuento ?? 0;
  const precioBase = product?.precioBase ?? product?.price ?? 0;
  const agotado = stock === 0;
  const tieneDescuento = descuento > 0;
  const precioFinal = tieneDescuento
    ? precioBase - (precioBase * descuento) / 100
    : product?.price ?? precioBase;
  const imagenUrl = product?.image || resolverImagenRespaldoProducto(product?.category, product?.id);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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

  async function handleCart() {
    if (agotado) return;

    const added = quantity;
    try {
      await onAgregarCarrito?.(product, added);
      setQuantity(1);
      showToast(`${added} ${added === 1 ? "unidad agregada" : "unidades agregadas"} al carrito`);
    } catch (err) {
      showToast(err.message || "No se pudo agregar el producto al carrito");
    }
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
                data-categoria={product.category}
                data-product-id={product.id}
                className="absolute -inset-4 h-[calc(100%+32px)] w-[calc(100%+32px)] scale-110 object-cover opacity-70 blur-lg"
                onError={aplicarFallbackImagenProducto}
                onLoad={replaceInvalidProductImage}
              />
              <img
                src={imagenUrl}
                alt={product.imageAlt || product.name}
                data-categoria={product.category}
                data-product-id={product.id}
                className="absolute inset-0 h-full w-full object-contain"
                onError={aplicarFallbackImagenProducto}
                onLoad={replaceInvalidProductImage}
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
                  {formatPriceRounded(precioBase)}
                </p>
              )}
              <p className="mb-3 text-headline-sm font-bold text-brand-orange">
                {formatPriceRounded(precioFinal)}
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

          <div className="mx-padding-lg mb-3 rounded-card bg-input-bg px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-bold uppercase text-brand-muted-text">Calificar vendedor</p>
                <p className="text-body-sm font-semibold text-on-surface">{product.vendedorNombre}</p>
              </div>
              <button
                type="button"
                onClick={alternarCalificacion}
                disabled={Boolean(motivoCalificacionDeshabilitada)}
                className="h-9 rounded-card border border-brand-orange bg-transparent px-4 text-body-sm font-bold text-brand-orange transition hover:bg-brand-orange/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {calificacionAbierta ? "Cancelar" : "Calificar"}
              </button>
            </div>

            {motivoCalificacionDeshabilitada && (
              <p className="mt-2 text-body-sm text-brand-muted-text">{motivoCalificacionDeshabilitada}</p>
            )}

            {calificacionAbierta && !motivoCalificacionDeshabilitada && (
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex items-center gap-1" role="group" aria-label="Puntuacion del vendedor">
                  {[1, 2, 3, 4, 5].map((valor) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setEstrellas(valor)}
                      aria-label={`${valor} ${valor === 1 ? "estrella" : "estrellas"}`}
                      aria-pressed={estrellas === valor}
                      className="rounded-full p-0.5 transition hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          valor <= estrellas
                            ? "fill-brand-orange text-brand-orange"
                            : "text-brand-muted-text"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comentario}
                  onChange={(event) => setComentario(event.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Comentario (opcional)"
                  className="w-full resize-none rounded-card border border-figma-divider bg-surface-container/70 px-3 py-2 text-body-sm text-on-surface outline-none placeholder:text-brand-muted-text focus:border-border-focus focus:ring-1 focus:ring-border-focus"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={enviarCalificacion}
                    disabled={enviandoCalificacion || estrellas === 0}
                    className="h-9 rounded-button bg-brand-orange px-5 text-body-sm font-bold text-brand-dark-text transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {enviandoCalificacion ? "Enviando..." : "Enviar calificacion"}
                  </button>

                  {errorCalificacion && (
                    <p className="text-body-sm font-semibold text-error">{errorCalificacion}</p>
                  )}
                  {exitoCalificacion && (
                    <p className="text-body-sm font-semibold text-success">{exitoCalificacion}</p>
                  )}
                </div>
              </div>
            )}
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
              <SelectorCantidad
                cantidad={quantity}
                stock={stock}
                agotado={agotado}
                onChange={setQuantity}
              />

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          {/* Fondo clicable para cerrar la vista ampliada */}
          <div
            className="absolute inset-0"
            role="presentation"
            onClick={() => setZoomAbierto(false)}
          />
          <div
            className="relative flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada del producto"
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
              data-categoria={product.category}
              data-product-id={product.id}
              className="max-h-[90vh] max-w-full select-none object-contain"
              onError={aplicarFallbackImagenProducto}
              onLoad={replaceInvalidProductImage}
            />
          </div>
        </div>
      )}

      {toast.visible && (
        <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-card-lg bg-brand-orange px-5 py-2 text-body-sm font-bold text-brand-dark-text shadow-2xl">
          {toast.msg}
        </div>
      )}
    </>,
    document.body
  );
}
