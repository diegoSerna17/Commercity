import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import {
  cambiarEstadoUsuarioAdmin,
  eliminarProductoAdmin,
  eliminarReporteAdmin,
  eliminarUsuarioAdmin,
  guardarMiCuentaBancaria,
  listarProductosAdmin,
  listarReportesAdmin,
  listarUsuariosAdmin,
  obtenerMiCuentaBancaria,
  obtenerStatsAdmin,
  restaurarProductoAdmin,
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
    // B-9: pagina completa por defecto (max 100)
    expect(request).toHaveBeenCalledWith("/api/historial/compras?por_pagina=100");

    await listarHistorialCompras("Entregado");
    expect(request).toHaveBeenLastCalledWith("/api/historial/compras?por_pagina=100&estado=Entregado");

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
    // B-7: el default va enmascarado; la vista completa exige revelar explicito.
    expect(request).toHaveBeenLastCalledWith("/api/admin/mi-cuenta-bancaria");

    await obtenerMiCuentaBancaria({ revelar: true });
    expect(request).toHaveBeenLastCalledWith(
      "/api/admin/mi-cuenta-bancaria?revelar=completa"
    );
  });

  it("M-28: confirmarPago envia solo los ultimos 4 digitos, nunca el PAN", async () => {
    const datos = {
      direccion_envio: "Calle 1",
      metodo_pago: "tarjeta",
      ultimos4_tarjeta: "4242",
      marca_tarjeta: "Visa",
      nombre_tarjeta: "Ana Perez",
    };

    await confirmarPago(datos);

    expect(request).toHaveBeenLastCalledWith("/api/pedidos/confirmar-pago", {
      method: "POST",
      body: datos,
    });
    expect(JSON.stringify(request.mock.calls)).not.toContain("4242424242424242");
  });

  it("admin.service lista usuarios con la pagina completa y los productos (RF67/RF68)", async () => {
    await listarUsuariosAdmin();
    expect(request).toHaveBeenLastCalledWith("/api/admin/usuarios?por_pagina=100");

    await listarProductosAdmin();
    expect(request).toHaveBeenLastCalledWith("/api/admin/productos");
  });

  it("admin.service cambia el estado, elimina y restaura (RF72-RF74)", async () => {
    await cambiarEstadoUsuarioAdmin(8, "baneado");
    expect(request).toHaveBeenLastCalledWith("/api/admin/usuarios/8/estado", {
      method: "PATCH",
      body: { estado: "baneado" },
    });

    await eliminarUsuarioAdmin(8);
    expect(request).toHaveBeenLastCalledWith("/api/admin/usuarios/8", {
      method: "DELETE",
    });

    await restaurarProductoAdmin(6);
    expect(request).toHaveBeenLastCalledWith("/api/admin/productos/6/restaurar", {
      method: "PATCH",
    });

    await eliminarReporteAdmin(4);
    expect(request).toHaveBeenLastCalledWith("/api/admin/reportes/4", {
      method: "DELETE",
    });
  });

  it("guardarMiCuentaBancaria usa POST al crear y PUT al actualizar (RF75/RF76)", async () => {
    const datos = {
      titular_nombre: "CommerCity SAS",
      banco: "Bancolombia",
      tipo_cuenta: "ahorros",
      numero_cuenta: "1234567890",
    };

    await guardarMiCuentaBancaria(datos);
    expect(request).toHaveBeenLastCalledWith("/api/admin/mi-cuenta-bancaria", {
      method: "POST",
      body: datos,
    });

    await guardarMiCuentaBancaria(datos, { actualizar: true });
    expect(request).toHaveBeenLastCalledWith("/api/admin/mi-cuenta-bancaria", {
      method: "PUT",
      body: datos,
    });
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
