import { cardClass } from "./ajustesEstilos.js";

/**
 * Seccion "Eliminar cuenta": accion irreversible (RF40), confirmada en el
 * modal del contenedor.
 */
export default function AjustesCuenta({
  eliminandoCuenta,
  onAbrirModal,
  onAbrirCerrarSesiones,
}) {
  return (
    <>
      <div className="border-t-2 border-report-red-bg mb-padding-lg" />

      <div className={`${cardClass} mb-padding-2xl`}>
        <h3 className="text-headline-sm font-bold text-on-surface mb-3">
          Sesiones activas
        </h3>
        <p className="text-brand-muted-text text-body-sm font-medium leading-6 mb-6">
          Cierra la sesion en todos los dispositivos donde hayas iniciado sesion. Los
          enlaces de acceso ya emitidos dejaran de funcionar.
        </p>
        <button
          type="button"
          onClick={onAbrirCerrarSesiones}
          className="mb-8 rounded-card border border-brand-muted-text bg-transparent px-6 py-3 text-body-sm font-bold text-brand-muted-text transition hover:bg-input-bg"
        >
          Cerrar sesion en todos los dispositivos
        </button>

        <h3 className="text-headline-sm font-bold text-report-red-text mb-3">
          Elimina tu cuenta
        </h3>
        <p className="text-brand-muted-text text-body-sm font-medium leading-6 mb-6">
          Una vez que elimines tu cuenta, todos tus datos seran borrados permanentemente. Esta accion no se puede deshacer.
        </p>
        <button
          type="button"
          onClick={onAbrirModal}
          disabled={eliminandoCuenta}
          className="rounded-card border border-report-red-text bg-report-red-bg px-6 py-3 text-body-sm font-bold text-report-red-text transition hover:bg-report-red-text hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {eliminandoCuenta ? "Eliminando..." : "Eliminar Cuenta"}
        </button>
      </div>
    </>
  );
}
