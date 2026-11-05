import { sectionDivider } from "./ajustesEstilos.js";

/**
 * Seccion "Rol": invita a vendedor o advierte la perdida de permisos si ya lo
 * es. El cambio se confirma en el modal del contenedor.
 */
export default function AjustesRol({ esVendedor, enviandoRol, onAbrirModal }) {
  return (
    <>
      <div className={sectionDivider} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-card border border-brand-orange bg-brand-orange/5 p-padding-lg mb-padding-xl shadow-lg">
        <div className="flex-1">
          <h3 className="text-headline-sm font-bold text-on-surface mb-2">
            {esVendedor
              ? "Administra tu rol en CommerCity"
              : "¿Quieres vender en CommerCity?"}
          </h3>
          <p className="text-brand-muted-text text-body-sm font-medium leading-6">
            {esVendedor
              ? "Si cambias a comprador perderas los permisos para publicar y gestionar tus productos."
              : "Crea tu tienda y construye tu futuro en CommerCity, llega a mas compradores en esta comunidad."}
          </p>
        </div>
        <button
          id="btn-vendedor"
          type="button"
          onClick={onAbrirModal}
          disabled={enviandoRol}
          className="shrink-0 rounded-button bg-gradient-to-r from-brand-orange to-tertiary-container px-6 py-3 text-body-sm font-bold text-brand-dark-text transition hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {esVendedor ? "Cambiar a comprador" : "Cambiar a vendedor"}
        </button>
      </div>
    </>
  );
}
