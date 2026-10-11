import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import {
  eliminarProductoAdmin,
  listarReportesAdmin,
  obtenerMiCuentaBancaria,
  obtenerStatsAdmin,
  resolverReporteAdmin,
} from "./admin.service.js";
import { confirmarPago, obtenerResumenPedido } from "./pedidos.service.js";
import { cancelarCompra, listarHistorialCompras } from "./historial.service.js";
import { calificarVendedor } from "./calificaciones.service.js";
import { obtenerPerfilPublico } from "./perfil.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("servicios de pedidos, historial, admin y perfil", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    request.mockResolvedValue({ success: true, data: {} });
  });

  it("pedidos.service expone resumen y confirmacion de pago (RF113/RF134)", async () => {
    await obtenerResumenPedido();
    expect(request).toHaveBeenCalledWith("/api/pedidos/resumen");

    await confirmarPago({ direccion_envio: "Calle 1", metodo_pago: "tarjeta" });
    expect(request).toHaveBeenLastCalledWith("/api/pedidos/confirmar-pago", {
      method: "POST",
      body: { direccion_envio: "Calle 1", metodo_pago: "tarjeta" },
    });
  });

  it("historial.service lista compras con filtro opcional y cancela lineas (RF135)", async () => {
    await listarHistorialCompras();
    expect(request).toHaveBeenCalledWith("/api/historial/compras");

    await listarHistorialCompras("Entregado");
    expect(request).toHaveBeenLastCalledWith("/api/historial/compras?estado=Entregado");

    await cancelarCompra(11);
    expect(request).toHaveBeenLastCalledWith("/api/historial/compras/11/cancelar", {
      method: "POST",
    });
  });

  it("admin.service cubre stats, reportes y cuenta bancaria", async () => {
    await obtenerStatsAdmin();
    expect(request).toHaveBeenCalledWith("/api/admin/stats");

    await listarReportesAdmin();
    expect(request).toHaveBeenLastCalledWith("/api/admin/reportes");

    await resolverReporteAdmin(4, "Resuelto");
    expect(request).toHaveBeenLastCalledWith("/api/admin/reportes/4/resolver", {
      method: "PATCH",
      body: { respuesta: "Resuelto" },
    });

    await eliminarProductoAdmin(6);
    expect(request).toHaveBeenLastCalledWith("/api/admin/productos/6", {
      method: "DELETE",
    });

    await obtenerMiCuentaBancaria();
    expect(request).toHaveBeenLastCalledWith("/api/admin/mi-cuenta-bancaria");
  });

  it("calificaciones.service envia la calificacion del vendedor (RF107)", async () => {
    await calificarVendedor({ pedido_id: 5, vendedor_id: 3, estrellas: 5 });
    expect(request).toHaveBeenCalledWith("/api/calificaciones/vendedor", {
      method: "POST",
      body: { pedido_id: 5, vendedor_id: 3, estrellas: 5 },
    });
  });

  it("perfil.service consulta el perfil publico (RF110)", async () => {
    await obtenerPerfilPublico(5);
    expect(request).toHaveBeenCalledWith("/api/usuarios/perfil-publico/5");
  });
});
