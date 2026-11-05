import { IconTrashRed } from "./AdminIcons";
import Modal from "../globales/Modal.jsx";

// Sustantivo de cada entidad para el mensaje de confirmacion.
const NOMBRES_TIPO = {
  Usuario: "al usuario",
  Producto: "el producto",
  Reporte: "el reporte",
};

export default function AdminModalConfirmarEliminar({
  tipo = "Usuario",
  nombre,
  onConfirmar,
  onCancelar,
  abierto = true,
}) {
  return (
    <Modal
      abierto={abierto}
      onClose={onCancelar}
      tituloId="admin-eliminar-titulo"
      panelClassName="rounded-2xl p-6 w-80 flex flex-col gap-4 bg-auth-card-bg border border-figma-divider shadow-glass"
    >
      {/* RE Cabecera con icono de advertencia y titulo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-accent-red/10">
          <IconTrashRed />
        </div>
        <h3 id="admin-eliminar-titulo" className="font-sans font-bold text-lg text-white">
          Eliminar {tipo}
        </h3>
      </div>

      {/* RE Mensaje de confirmacion con nombre resaltado */}
      <p className="text-sm font-sans leading-relaxed text-brand-muted-text">
        Seguro que quieres eliminar {NOMBRES_TIPO[tipo] || "el registro"}{" "}
        <span className="font-bold text-white">{nombre}</span>? Esta accion no se
        puede deshacer.
      </p>

      {/* RE Botones de accion: Cancelar y Eliminar */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors font-sans border border-brand-muted-text text-brand-muted-text hover:bg-figma-input-bg"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors font-sans bg-accent-red text-white hover:brightness-110"
        >
          Eliminar
        </button>
      </div>
    </Modal>
  );
}
