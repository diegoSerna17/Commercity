/**
 * Reglas de reembolso compartidas por los caminos de cancelacion del
 * comprador (RF135, compras.controllers), del pedido (RF35, pedidos.controllers)
 * y del baneo/eliminacion de vendedor (RF74, admin/pedidos.controllers).
 * Basado en la migracion 013 (pagos_simulados.monto_reembolsado) y RF140.
 */
import { IVA_RATE, round2 } from "./finanzas.js";

/**
 * Tolerancia de redondeo (B-10): un acumulado que cubre el monto pagado dentro
 * de +/- 0.01 se considera reembolso total (los subtotales/IVA se redondean por
 * linea y la suma puede quedar a un centavo del monto persistido).
 */
export const TOLERANCIA_REEMBOLSO = 0.01;

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
 * Suma el importe de reembolso (IVA incluido) de un conjunto de lineas.
 * @param {Array<{subtotal: number|string}>} lineas
 * @returns {number} importe acumulado redondeado a 2 decimales
 */
export function importeReembolsoLineas(lineas) {
  return round2(lineas.reduce((acc, l) => acc + importeReembolsoLinea(l.subtotal), 0));
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

/**
 * Acumula en pagos_simulados el reembolso de las lineas canceladas y deriva el
 * estado por MONTO (regla unica A-2, auditoria 2026-10-11).
 *
 * Reglas:
 *  - El pago se lee con FOR UPDATE: solo los pagos 'Aprobado'/'Reembolsado'
 *    acumulan importe y mutan; un pago 'Pendiente'/'Rechazado' se reporta tal
 *    cual sin tocar la fila (H2).
 *  - El estado se evalua ANTES de incrementar el acumulado (MySQL evalua las
 *    asignaciones del SET de izquierda a derecha, asi `monto_reembolsado` en el
 *    IF es el valor viejo) y con la tolerancia de redondeo de +/- 0.01 (B-10).
 *  - El acumulado se acota al monto pagado con LEAST: nunca se registra un
 *    reembolso mayor al dinero recibido.
 *  - No hay early-return por estado 'Reembolsado' (A-2): la guarda es por estado
 *    del pago y la acumulacion sigue siendo valida sobre pagos ya marcados
 *    'Reembolsado' por un error previo.
 *
 * @param {import("mysql2/promise").PoolConnection} conn conexion en transaccion
 * @param {number} pedidoId
 * @param {number} importe importe a acumular (ya redondeado a 2 decimales)
 * @returns {Promise<{actualizado: boolean, estado: string|null, monto_reembolsado: number}>}
 *   actualizado: la BD registro el reembolso; estado: estado resultante del
 *   pago; monto_reembolsado: importe registrado en ESTA llamada (0 si no muto).
 */
export async function reembolsarPago(conn, pedidoId, importe) {
  const [pagos] = await conn.query(
    "SELECT estado, monto, monto_reembolsado FROM pagos_simulados WHERE pedido_id = ? FOR UPDATE",
    [pedidoId]
  );
  const pago = pagos[0];
  if (!pago) {
    return { actualizado: false, estado: null, monto_reembolsado: 0 };
  }
  if (pago.estado !== "Aprobado" && pago.estado !== "Reembolsado") {
    return { actualizado: false, estado: pago.estado, monto_reembolsado: 0 };
  }

  const [resultado] = await conn.query(
    `UPDATE pagos_simulados
        SET estado = IF(monto_reembolsado + ? >= monto - ${TOLERANCIA_REEMBOLSO}, 'Reembolsado', 'Aprobado'),
            monto_reembolsado = LEAST(monto_reembolsado + ?, monto)
      WHERE pedido_id = ? AND estado IN ('Aprobado', 'Reembolsado')`,
    [importe, importe, pedidoId]
  );
  const actualizado = Number(resultado.affectedRows) > 0;

  // El estado resultante se deriva de los montos leidos bajo el mismo bloqueo
  // FOR UPDATE (nadie mas puede mutar la fila hasta el commit): mismo resultado
  // que el IF del UPDATE, sin una segunda lectura.
  const cubreMonto =
    Number(pago.monto_reembolsado || 0) + Number(importe) >=
    Number(pago.monto) - TOLERANCIA_REEMBOLSO;
  const estado = cubreMonto ? "Reembolsado" : "Aprobado";

  return {
    actualizado,
    estado,
    monto_reembolsado: actualizado ? importe : 0,
  };
}
