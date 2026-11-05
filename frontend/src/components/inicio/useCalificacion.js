import { useState } from "react";
import { getCurrentUser } from "../../api/client.js";
import { calificarVendedor } from "../../services/calificaciones.service.js";
import { listarHistorialCompras } from "../../services/historial.service.js";

/**
 * Busca en el historial de compras del comprador el pedido mas reciente con una
 * linea no cancelada hacia el vendedor indicado. RF107 exige calificar despues
 * de una compra: el endpoint POST /api/calificaciones/vendedor recibe pedido_id
 * y vendedor_id, y el historial expone el nombre del vendedor por linea (no su
 * id), por lo que el emparejamiento se hace por nombre.
 * @param {string} nombreVendedor
 * @returns {Promise<number|null>} pedido_id o null si el comprador no le ha comprado
 */
export async function buscarPedidoDelVendedor(nombreVendedor) {
  const res = await listarHistorialCompras();
  const pedidos = res?.data || [];

  for (const pedido of pedidos) {
    const linea = (pedido.items || []).find(
      (item) => item.vendedor === nombreVendedor && item.estado !== "Cancelado"
    );
    if (linea) return pedido.pedido_id;
  }

  return null;
}

/**
 * Estado y acciones de la calificacion del vendedor (RF107) dentro de la ficha
 * del producto: motivo de bloqueo, estrellas, comentario y envio.
 * @param {{ product?: object, vendedorId?: number|null }} opciones
 */
export function useCalificacion({ product, vendedorId }) {
  const [abierta, setAbierta] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const usuarioActual = getCurrentUser();
  const esVendedorPropio = Boolean(vendedorId) && usuarioActual?.id === vendedorId;

  // Motivo por el que la calificacion no esta disponible (vacio = disponible).
  const motivoDeshabilitada = !vendedorId
    ? "No se pudo identificar al vendedor de este producto."
    : !usuarioActual
      ? "Inicia sesion para calificar a este vendedor."
      : esVendedorPropio
        ? "No puedes calificarte a ti mismo."
        : "";

  const alternar = () => setAbierta((actual) => !actual);

  async function enviar() {
    if (enviando || motivoDeshabilitada) return;

    if (estrellas < 1 || estrellas > 5) {
      setError("Selecciona una puntuacion de 1 a 5 estrellas.");
      return;
    }

    setEnviando(true);
    setError("");
    setExito("");

    try {
      const pedidoId = await buscarPedidoDelVendedor(product?.vendedorNombre);
      if (!pedidoId) {
        setError("Solo puedes calificar a un vendedor despues de comprarle.");
        return;
      }

      await calificarVendedor({
        pedido_id: pedidoId,
        vendedor_id: vendedorId,
        estrellas,
        comentario: comentario.trim() || undefined,
      });

      setExito("Calificacion registrada. Gracias por tu opinion.");
      setEstrellas(0);
      setComentario("");
    } catch (err) {
      setError(err.message || "No se pudo registrar la calificacion.");
    } finally {
      setEnviando(false);
    }
  }

  return {
    abierta,
    alternar,
    estrellas,
    setEstrellas,
    comentario,
    setComentario,
    enviando,
    error,
    exito,
    motivoDeshabilitada,
    enviar,
  };
}
