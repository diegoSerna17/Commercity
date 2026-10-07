/**
 * Reglas de reembolso compartidas por los caminos de cancelacion del
 * comprador (RF135, compras.controllers) y del pedido (RF35, pedidos.controllers).
 * Basado en la migracion 013 (pagos_simulados.monto_reembolsado) y RF140.
 */
import { IVA_RATE, round2 } from "./finanzas.js";

/**
 * Importe que el comprador pago por una linea y que se devuelve al cancelarla.
 * subtotal se guarda SIN IVA (RF140); el reembolso al comprador incluye el IVA
 * (mig 008: "reembolsa el valor pagado (incluye IVA)", RF121).
 * @param {number|string} subtotal subtotal SIN IVA de la linea (detalle_pedidos)
 * @returns {number} importe con IVA redondeado a 2 decimales
 */
export function importeReembolsoLinea(subtotal) {
  return round2(Number(subtotal) * (1 + IVA_RATE));
}

/**
 * Mapea el estado de pago al vendedor tras cancelar la linea.
 * detalle_pedidos.estado_pago_vendedor es ENUM('Pendiente','Desembolsado') en la
 * BD real: NO existe un valor 'Reembolsado' para el vendedor. Si ya fue
 * desembolsado se conserva 'Desembolsado' (el dinero ya salio); en caso
 * contrario la linea vuelve a 'Pendiente'. Perdida semantica asumida y
 * documentada en informes/PROPUESTA_MIGRACION_ENUM_ESTADOS.md (Opcion A).
 * @param {string} estadoActual valor actual de estado_pago_vendedor
 * @returns {"Pendiente"|"Desembolsado"} valor valido dentro del ENUM real
 */
export function estadoPagoVendedorTrasCancelacion(estadoActual) {
  return estadoActual === "Desembolsado" ? "Desembolsado" : "Pendiente";
}
