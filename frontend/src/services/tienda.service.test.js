import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "../api/client.js";
import {
  avanzarEstadoPedido,
  guardarMiCuentaBancaria,
  listarIngresos,
  listarVentas,
  obtenerEstadisticasTienda,
  obtenerMiCuentaBancaria,
  validarMiTienda,
} from "./tienda.service.js";

vi.mock("../api/client.js", () => ({
  request: vi.fn(),
}));

describe("tienda.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    request.mockResolvedValue({ success: true, data: {} });
  });

  it("listarVentas envia pagina, tamaño y estado solo cuando existe", async () => {
    await listarVentas();
    expect(request).toHaveBeenCalledWith("/api/tienda/ventas?pagina=1&por_pagina=20");

    await listarVentas({ estado: "Pendiente", pagina: 2, porPagina: 10 });
    expect(request).toHaveBeenLastCalledWith(
      "/api/tienda/ventas?pagina=2&por_pagina=10&estado=Pendiente"
    );
  });

  it("avanzarEstadoPedido envia PATCH con el estado destino (RF122/RF124)", async () => {
    await avanzarEstadoPedido(50, "En camino");
    expect(request).toHaveBeenCalledWith("/api/pedidos/50/estado", {
      method: "PATCH",
      body: { estado: "En camino" },
    });
  });

  it("listarIngresos envia la paginacion y el agrupamiento", async () => {
    await listarIngresos({ pagina: 3, porPagina: 5, agruparPor: "dia" });
    expect(request).toHaveBeenCalledWith(
      "/api/tienda/ingresos?pagina=3&por_pagina=5&agrupar_por=dia"
    );
  });

  it("expone stats, validacion y cuenta bancaria de la tienda", async () => {
    await obtenerEstadisticasTienda();
    expect(request).toHaveBeenCalledWith("/api/tienda/dashboard/stats");

    await validarMiTienda();
    expect(request).toHaveBeenCalledWith("/api/tienda/validacion");

    await obtenerMiCuentaBancaria();
    expect(request).toHaveBeenCalledWith("/api/tienda/mi-cuenta-bancaria");
  });

  it("guardarMiCuentaBancaria hace upsert con POST", async () => {
    const datos = {
      titular_nombre: "Ana",
      banco: "Bancolombia",
      tipo_cuenta: "ahorros",
      numero_cuenta: "123456",
    };
    await guardarMiCuentaBancaria(datos);
    expect(request).toHaveBeenCalledWith("/api/tienda/mi-cuenta-bancaria", {
      method: "POST",
      body: datos,
    });
  });
});
