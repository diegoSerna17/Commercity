import { useState } from "react";
import {
  IconUser,
  IconProduct,
  IconTrash,
  IconImage,
  IconClose,
  IconTrashRed,
} from "./AdminIcons";
import { BadgeTipo, BadgeEstadoReporte } from "./AdminBadges";

export default function AdminModalReporte({
  reporte,
  modo,
  estaBaneado,
  usuarioEliminadoDesdeReporte,
  productoEliminadoDesdeReporte,
  onEnviarRespuesta,
  onCerrar,
  onToggleBanear,
  onPedirEliminarUsuario,
  onPedirEliminarProducto,
}) {
  const [textareaRespuesta, setTextareaRespuesta] = useState("");

  function handleEnviar() {
    const texto = textareaRespuesta.trim();
    if (!texto) {
      alert("Por favor escribe una respuesta.");
      return;
    }
    onEnviarRespuesta(texto);
  }

  if (!reporte) return null;

  const infoReportadoPor = (reporte.reportadoPorInfo || "").split("·")[0]?.trim() || "";
  const infoReportado = (reporte.reportadoInfo || "").split("·")[0]?.trim() || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="rounded-2xl w-full max-w-4xl flex flex-col overflow-hidden bg-[#12121A] border border-[#1C1C22] shadow-[0_16px_48px_rgba(0,0,0,0.5)] min-h-[500px] max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-[#1C1C22]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[rgba(239,68,68,0.15)]">
              <IconUser color="#ef4444" size={18} />
            </div>
            <h3 className="font-sans font-bold text-lg text-white">
              Detalle del Reporte
            </h3>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 transition-colors rounded-lg text-[#797998] hover:text-white"
          >
            <IconClose />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="rounded-xl p-4 flex flex-wrap gap-4 bg-[#1C1C22]">
            <div className="flex-1 min-w-[80px]">
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 font-sans text-[#797998]">
                Tipo
              </p>
              <BadgeTipo tipo={reporte.tipo} />
            </div>
            <div className="flex-1 min-w-[80px]">
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 font-sans text-[#797998]">
                Estado
              </p>
              <BadgeEstadoReporte estado={reporte.estado} />
            </div>
            <div className="flex-1 min-w-[120px]">
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5 font-sans text-[#797998]">
                Fecha
              </p>
              <p className="text-sm font-semibold font-sans text-white">
                {reporte.fecha}
              </p>
            </div>
          </div>

          <div className="rounded-xl p-4 bg-[#1C1C22]">
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-3 font-sans text-[#797998]">
              Reportado
            </p>
            <div className="flex items-center gap-3">
              {reporte.tipo === "usuario" ? (
                <>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#1f1f25]">
                    <IconUser size={18} />
                  </div>
                  <div>
                    <p className="font-bold font-sans text-sm text-white">
                      {reporte.reportado}
                    </p>
                    <p className="text-xs mt-0.5 font-sans text-[#797998]">
                      {infoReportado}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-[#12121A] border border-[#1C1C22]">
                    <IconProduct />
                  </div>
                  <div>
                    <p className="font-bold font-sans text-sm text-white">
                      {reporte.reportado}
                    </p>
                    <p className="text-xs font-bold mt-0.5 font-sans text-[#EF9918]">
                      {reporte.reportadoPrecio || ""}
                    </p>
                    {reporte.reportadoVendedor && (
                      <p className="text-xs font-sans text-[#797998]">
                        Vendedor: {reporte.reportadoVendedor}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl p-4 bg-[#1C1C22]">
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-3 font-sans text-[#797998]">
              Reportado por
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#1f1f25]">
                <IconUser size={18} />
              </div>
              <div>
                <p className="font-bold font-sans text-sm text-white">
                  {reporte.reportadoPor}
                </p>
                <p className="text-xs mt-0.5 font-sans text-[#797998]">
                  {infoReportadoPor}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 bg-[#1C1C22]">
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2 font-sans text-[#797998]">
              Motivo
            </p>
            <p className="text-xs leading-relaxed font-sans text-[#797998]">
              {reporte.descripcion}
            </p>
          </div>

          {reporte.evidencias > 0 && (
            <div className="rounded-xl p-4 bg-[#1C1C22]">
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-3 font-sans text-[#797998]">
                Evidencias
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: reporte.evidencias }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden aspect-square flex flex-col items-center justify-center gap-1 bg-[#1e293b] border border-[rgba(30,41,59,0.6)]"
                  >
                    <IconImage />
                    <span className="text-[10px] font-medium font-sans text-[#535B71]">
                      Foto {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reporte.estado === "resuelto" ? (
            <div className="rounded-xl p-4 bg-[#1C1C22]">
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2 font-sans text-[#797998]">
                Respuesta del Administrador
              </p>
              <p className="text-sm leading-relaxed font-sans text-white">
                {reporte.respuesta}
              </p>
            </div>
          ) : (
            modo === "responder" && (
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest font-sans text-[#797998]">
                  Tu Respuesta
                </p>
                <textarea
                  value={textareaRespuesta}
                  onChange={(e) => setTextareaRespuesta(e.target.value)}
                  placeholder="Escribe tu respuesta al reporte..."
                  className="w-full text-sm rounded-xl p-3 outline-none resize-none font-sans h-24 text-white bg-[#1C1C22] border border-[#1C1C22] focus:border-[#EF9918] focus:ring-1 focus:ring-[rgba(239,153,24,0.5)] transition-all"
                />
                <div className="flex gap-3">
                  <button
                    onClick={onCerrar}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors font-sans border border-[#797998] text-[#797998]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEnviar}
                    className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors font-sans bg-[#EF9918] text-[#12121A]"
                  >
                    Enviar Respuesta
                  </button>
                </div>
              </div>
            )
          )}

          {reporte.tipo === "usuario" ? (
            <div className="rounded-xl p-4 bg-[#1C1C22]">
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-3 font-sans text-[#797998]">
                Acciones sobre el Usuario
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onToggleBanear}
                  disabled={usuarioEliminadoDesdeReporte}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors border font-sans ${usuarioEliminadoDesdeReporte ? "opacity-50 cursor-not-allowed" : estaBaneado ? "border-[#EF9918] text-[#EF9918]" : "border-[#797998] text-[#797998]"}`}
                >
                  {estaBaneado ? "Activar" : "Banear"}
                </button>

                <button
                  onClick={onPedirEliminarUsuario}
                  disabled={usuarioEliminadoDesdeReporte}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors border font-sans flex items-center justify-center gap-2 ${usuarioEliminadoDesdeReporte ? "opacity-50 cursor-not-allowed border-[#797998] text-[#797998]" : "border-[rgba(127,29,29,0.6)] text-[#EF4444]"}`}
                >
                  {usuarioEliminadoDesdeReporte ? "Eliminado" : "Eliminar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-4 bg-[#1C1C22]">
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-3 font-sans text-[#797998]">
                Acciones sobre el Producto
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onPedirEliminarProducto}
                  disabled={productoEliminadoDesdeReporte}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors border font-sans flex items-center justify-center gap-2 ${productoEliminadoDesdeReporte ? "opacity-50 cursor-not-allowed" : "border-[rgba(127,29,29,0.6)] text-[#EF4444]"}`}
                >
                  {!productoEliminadoDesdeReporte && <IconTrash size={15} />}
                  {productoEliminadoDesdeReporte ? "Eliminado" : "Eliminar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}