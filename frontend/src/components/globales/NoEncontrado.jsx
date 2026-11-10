import { Link } from "react-router-dom";

/**
 * Pagina 404 de la SPA. Se monta con `path="*"` en App.jsx para que una URL
 * desconocida muestre un mensaje claro en lugar de una pantalla vacia.
 */
export default function NoEncontrado() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-md p-2xl text-center">
      <p className="text-label-sm uppercase tracking-widest text-brand-muted-text">
        Error 404
      </p>
      <h1 className="text-headline-md font-semibold text-on-surface">
        Página no encontrada
      </h1>
      <p className="max-w-md text-body-sm text-brand-muted-text">
        La dirección que abriste no existe o cambió de lugar.
      </p>
      <Link
        to="/"
        className="rounded-[10px] bg-brand-orange px-lg py-sm text-label-md font-bold text-brand-dark-text transition-all hover:brightness-110"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
