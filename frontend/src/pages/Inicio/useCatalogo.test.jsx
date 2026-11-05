import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listarProductos } from "../../services/productos.service.js";
import { mapearProducto } from "../../utils/mapearProducto.js";
import { useCatalogo } from "./useCatalogo.js";

vi.mock("../../services/productos.service.js", () => ({
  listarProductos: vi.fn(),
}));

// El mapeo real se prueba en utils/mapearProducto.test.js; aqui solo interesa
// el estado del hook.
vi.mock("../../utils/mapearProducto.js", () => ({
  mapearProducto: vi.fn((p) => p),
}));

function wrapper({ children }) {
  return <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>;
}

const pagina = (ids, extra = {}) => ({
  data: {
    productos: ids.map((id) => ({ id, nombre: `Producto ${id}` })),
    pagina: 1,
    totalPaginas: 1,
    totalProductos: ids.length,
    hayPaginaSiguiente: false,
    ...extra,
  },
});

describe("useCatalogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga la primera pagina y expone el resumen del catalogo", async () => {
    listarProductos.mockResolvedValue(
      pagina([1, 2], { totalProductos: 25, totalPaginas: 3, hayPaginaSiguiente: true })
    );

    const { result } = renderHook(() => useCatalogo(), { wrapper });

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.productos).toHaveLength(2);
    expect(result.current.pagina).toBe(1);
    expect(result.current.totalProductos).toBe(25);
    expect(result.current.hayPaginaSiguiente).toBe(true);
    expect(listarProductos).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, nombre: "", categoria: "" })
    );
  });

  it("acumula la siguiente pagina al cargar mas", async () => {
    listarProductos
      .mockResolvedValueOnce(pagina([1, 2], { hayPaginaSiguiente: true, totalProductos: 3 }))
      .mockResolvedValueOnce({
        data: {
          productos: [{ id: 3 }],
          pagina: 2,
          totalPaginas: 2,
          totalProductos: 3,
          hayPaginaSiguiente: false,
        },
      });

    const { result } = renderHook(() => useCatalogo(), { wrapper });
    await waitFor(() => expect(result.current.cargando).toBe(false));

    await act(async () => {
      result.current.cargarMasProductos();
    });

    await waitFor(() => expect(result.current.cargandoMas).toBe(false));
    expect(result.current.productos.map((p) => p.id)).toEqual([1, 2, 3]);
    expect(result.current.pagina).toBe(2);
    expect(result.current.hayPaginaSiguiente).toBe(false);
    expect(mapearProducto).toHaveBeenCalledTimes(3);
  });

  it("descarta la respuesta vieja si el filtro cambia mientras carga", async () => {
    let resolverVieja;
    const vieja = new Promise((resolve) => {
      resolverVieja = resolve;
    });
    listarProductos
      .mockReturnValueOnce(vieja)
      .mockResolvedValueOnce(pagina([9], { totalProductos: 1 }));

    const { result } = renderHook(
      () => ({ catalogo: useCatalogo(), setParams: useSearchParams()[1] }),
      { wrapper }
    );

    act(() => {
      result.current.setParams({ busqueda: "nuevo" });
    });

    await waitFor(() => expect(result.current.catalogo.cargando).toBe(false));
    expect(result.current.catalogo.productos.map((p) => p.id)).toEqual([9]);

    // La respuesta antigua llega despues: no debe pisar la nueva.
    await act(async () => {
      resolverVieja(pagina([1, 2]));
    });
    expect(result.current.catalogo.productos.map((p) => p.id)).toEqual([9]);
  });

  it("usa el mensaje del backend cuando el error trae status", async () => {
    listarProductos.mockRejectedValue({ status: 500, message: "Fallo del servidor" });

    const { result } = renderHook(() => useCatalogo(), { wrapper });

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toBe("Fallo del servidor");
    expect(result.current.productos).toEqual([]);
  });

  it("muestra un mensaje de conexion cuando el error no trae status", async () => {
    listarProductos.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useCatalogo(), { wrapper });

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toContain("No se pudo conectar con el servidor");
  });
});
