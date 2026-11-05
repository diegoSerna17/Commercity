import {
  ETIQUETA_ESTADO,
  SIGUIENTE_ESTADO,
  estadoBadge,
  fmt,
} from "./pedidosFormato.js";

const COLUMNAS = [
  { label: "CLIENTE", align: "left" },
  { label: "PRODUCTOS", align: "left" },
  { label: "FECHA", align: "left" },
  { label: "ESTADO", align: "left" },
  { label: "ACCION", align: "left" },
  { label: "MONTO", align: "right" },
];

/**
 * Tabla de ventas del vendedor con el selector de estado (RF124: solo el
 * siguiente nivel) y el acceso al detalle.
 */
export default function PedidosTabla({
  ventas,
  cargando,
  cambiandoId,
  onCambiarEstado,
  onVerDetalle,
}) {
  return (
    <div
      className="w-full overflow-x-auto rounded-card"
      style={{
        backgroundColor: "var(--color-auth-card-bg)",
        border: "1px solid var(--color-border-subtle)",
      }}
    >
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr className="bg-surface-variant2/50" style={{ borderBottom: "1px solid rgba(50,50,77,0.2)" }}>
            {COLUMNAS.map((col) => (
              <th
                key={col.label}
                className={`px-[24px] py-[16px] text-[12px] tracking-[1.2px] uppercase whitespace-nowrap text-brand-muted-text font-semibold ${col.align === "right" ? "text-right" : "text-left"}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando && ventas.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-brand-muted-text text-[14px]">
                Cargando tus pedidos...
              </td>
            </tr>
          ) : ventas.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-brand-muted-text text-[14px]">
                No hay pedidos para este filtro.
              </td>
            </tr>
          ) : (
            ventas.map((pedido) => (
              <tr key={pedido.id} style={{ borderTop: "1px solid rgba(50,50,77,0.1)" }}>
                <td className="px-[24px] py-[20px] whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-primary-fixed-dim text-[16px] shrink-0"
                      style={{
                        backgroundColor: pedido.avatarColor ?? "#32324d",
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                      }}
                    >
                      {pedido.avatarLetra}
                    </div>
                    <span className="text-on-surface text-[16px]">{pedido.cliente}</span>
                  </div>
                </td>

                <td className="px-[24px] py-[20px] whitespace-nowrap">
                  <span className="text-on-surface text-[16px] font-medium">
                    {pedido.productos.length === 1
                      ? "1 producto"
                      : `${pedido.productos.length} productos`}
                  </span>
                </td>

                <td className="px-[24px] py-[20px] whitespace-nowrap">
                  <span className="text-brand-muted-text text-[14px]">{pedido.fecha}</span>
                </td>

                <td className="px-[24px] py-[20px] whitespace-nowrap">
                  {/* RF124: solo se ofrece el siguiente nivel de estado */}
                  <select
                    value={pedido.estado}
                    onChange={(event) => onCambiarEstado(pedido, event.target.value)}
                    disabled={!SIGUIENTE_ESTADO[pedido.estado] || cambiandoId === pedido.id}
                    aria-label={`Estado del pedido ${pedido.id}`}
                    className={`h-[23px] pl-[12px] pr-[8px] rounded-full text-[12px] font-medium cursor-pointer outline-none disabled:cursor-not-allowed disabled:opacity-70 ${estadoBadge[pedido.estado] ?? "bg-surface-variant2 text-on-surface-variant"}`}
                  >
                    <option value={pedido.estado} className="bg-auth-card-bg text-on-surface">
                      {pedido.estado}
                    </option>
                    {SIGUIENTE_ESTADO[pedido.estado] && (
                      <option
                        value={ETIQUETA_ESTADO[SIGUIENTE_ESTADO[pedido.estado]] ?? SIGUIENTE_ESTADO[pedido.estado]}
                        className="bg-auth-card-bg text-on-surface"
                      >
                        {ETIQUETA_ESTADO[SIGUIENTE_ESTADO[pedido.estado]] ?? SIGUIENTE_ESTADO[pedido.estado]}
                      </option>
                    )}
                  </select>
                </td>

                <td className="px-[24px] py-[20px] whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onVerDetalle(pedido.id)}
                    className="bg-auth-card-bg border border-[#8e8e93] text-on-surface text-[12px] h-[23px] px-[14px] rounded-full hover:bg-input-bg transition-colors"
                  >
                    Ver detalle
                  </button>
                </td>

                <td className="px-[24px] py-[20px] whitespace-nowrap text-right">
                  <span className="text-on-surface text-[16px]">{fmt(pedido.monto)}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
