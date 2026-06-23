// RE Titulo: DetallePedidos - Modal de detalle de pedido individual
//
// RE Implementacion React: useEffect para escuchar tecla Escape y cerrar
// RE el modal, recibe props selectedOrder y onClose
//
// JS Codigo y componentes: modal overlay con informacion del pedido incluyendo
// JS encabezado con estado, datos del comprador, direccion de envio, producto
// JS solicitado y precio total. MODAL_STATUS_STYLES define colores segun
// JS estado del pedido
//
// TW Clases Tailwind: tokens personalizados como bg-surface-container-low,
// TW bg-surface-container, text-on-surface, text-brand-muted-text. Modal
// TW centrado con max-w-[550px], overlay con bg-black/70, badges de estado
// TW con border y rounded-full

// RE Importacion de useEffect para manejar tecla Escape
import { useEffect } from "react";

// TW Estilos de borde y texto segun el estado del pedido
const MODAL_STATUS_STYLES = {
  Entregado: "border-primary/50 text-primary",
  "En Camino": "border-accent-blue/50 text-accent-blue",
  Pendiente: "border-accent-red/50 text-accent-red",
};

// RE Props: datos del pedido seleccionado y funcion para cerrar modal
const DetallePedidos = ({ selectedOrder, onClose }) => {
  // RE Efecto que cierra el modal al presionar la tecla Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-low w-[90vw] sm:w-full max-w-[550px] rounded-hero shadow-2xl border border-surface-container p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TW Encabezado con titulo, fecha y badge de estado */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-on-surface mb-1">
              Detalle del pedido
            </h3>
            <p className="text-brand-muted-text text-sm">
              Fecha: {selectedOrder.fecha}
            </p>
          </div>
          <div
            className={`px-4 py-1.5 border rounded-full ${MODAL_STATUS_STYLES[selectedOrder.estado] || "border-surface-container text-brand-muted-text"}`}
          >
            <span className="text-xs font-semibold">
              {selectedOrder.estado}
            </span>
          </div>
        </div>

        {/* TW Informacion del comprador con avatar */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-brand-muted-text">Comprador</h4>
          <div className="bg-surface-container/40 rounded-xl p-3 flex items-center gap-3 border border-surface-container/50">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              {/* TW Renderizado condicional: avatar imagen o iniciales del comprador */}
              {selectedOrder.avatar ? (
                <img
                  alt={selectedOrder.cliente}
                  className="w-full h-full object-cover"
                  src={selectedOrder.avatar}
                />
              ) : (
                <div className="w-full h-full bg-accent-blue/50 flex items-center justify-center text-xs font-bold text-accent-blue">
                  {selectedOrder.iniciales}
                </div>
              )}
            </div>
            <span className="font-semibold text-sm text-on-surface">
              {selectedOrder.cliente}
            </span>
          </div>
        </div>

        {/* TW Direccion de envio del pedido */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-brand-muted-text">Direccion de envio</h4>
          <div className="bg-surface-container/40 rounded-xl p-3 border border-surface-container/50">
            <p className="font-semibold text-sm text-on-surface">
              {selectedOrder.direccion}
            </p>
            <p className="text-brand-muted-text text-xs">{selectedOrder.ciudad}</p>
          </div>
        </div>

        {/* TW Producto solicitado con cantidad */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-brand-muted-text">
            Producto solicitado
          </h4>
          <div className="bg-surface-container/40 rounded-xl p-3 border border-surface-container/50 divide-y divide-surface-container/50">
            <div className="pb-3">
              <p className="font-semibold text-sm text-on-surface">
                {selectedOrder.producto}
              </p>
            </div>
            <div className="pt-3">
              <p className="text-brand-muted-text text-sm">
                Cantidad: {selectedOrder.cantidad} unidades
              </p>
            </div>
          </div>
        </div>

        {/* TW Precio total del pedido destacado */}
        <div className="bg-surface-container rounded-xl p-4 border border-primary-container/30 flex justify-between items-center mt-1">
          <span className="text-brand-muted-text font-medium">
            Precio total del pedido
          </span>
          <span className="text-primary-container font-bold text-xl">
            {selectedOrder.monto}
          </span>
        </div>

        {/* TW Boton para cerrar el modal */}
        <button
          onClick={onClose}
          className="w-full py-3 mt-2 rounded-xl border border-surface-container text-on-surface text-lg font-semibold hover:bg-surface-container transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default DetallePedidos;
