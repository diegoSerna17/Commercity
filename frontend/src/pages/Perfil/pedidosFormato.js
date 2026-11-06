import { formatPriceRounded } from "../../utils/formatPrice.js";
import { formatearFecha } from "../../utils/formatDate.js";

// Helpers y constantes de Pedidos (RF119/RF124). Extraidos de Pedidos.jsx.

export const FILTROS = [
  { label: "Todo", valor: null },
  { label: "Pendiente", valor: "Pendiente" },
  { label: "En Camino", valor: "En camino" },
  { label: "Entregado", valor: "Entregado" },
  { label: "Cancelado", valor: "Cancelado" },
];

// El backend entrega el estado por linea; la interfaz usa "En Camino".
export const ETIQUETA_ESTADO = { "En camino": "En Camino" };
export const ESTADO_API = { "En Camino": "En camino" };
// RF124: el backend solo acepta el avance de UN nivel.
export const SIGUIENTE_ESTADO = { Pendiente: "En camino", "En camino": "Entregado" };

export const estadoBadge = {
  Entregado: "bg-primary-fixed-dim/10 text-primary-fixed-dim border border-primary-fixed-dim/40",
  "En Camino": "bg-secondary-fixed-dim/10 text-secondary-fixed-dim border border-secondary-fixed-dim/40",
  Pendiente: "bg-error-container/20 text-error border border-error/40",
  Cancelado: "bg-surface-container/40 text-brand-muted-text border border-brand-muted-text/40",
};

export const fmt = formatPriceRounded;

export function iniciales(nombre) {
  return (nombre || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}

/** Traduce la linea de venta de la API a la forma que consumen la tabla y el detalle. */
export function mapearVenta(item) {
  const { corta, larga } = formatearFecha(item.fecha_pedido);

  return {
    id: item.id,
    pedidoId: item.pedido_id,
    referencia: item.referencia_pedido,
    cliente: item.nombre_comprador || "Comprador",
    email: item.email_comprador || "",
    avatarColor: "#32324d",
    avatarLetra: iniciales(item.nombre_comprador),
    productos: [
      {
        nombre: item.nombre_producto,
        cantidad: item.cantidad,
        precioUnitario: Number(item.valor_unitario || 0),
      },
    ],
    fecha: corta,
    fechaLarga: larga,
    estado: ETIQUETA_ESTADO[item.estado_envio] || item.estado_envio || "Pendiente",
    monto: Number(item.valor_subtotal || 0),
    neto: Number(item.monto_vendedor || 0),
    comision: Number(item.monto_comision || 0),
  };
}
