import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PanelAdministrador from "./PanelControl.jsx";
import {
  cambiarEstadoUsuarioAdmin,
  eliminarProductoAdmin,
  eliminarReporteAdmin,
  eliminarUsuarioAdmin,
  listarProductosAdmin,
  listarReportesAdmin,
  listarUsuariosAdmin,
  obtenerStatsAdmin,
  restaurarProductoAdmin,
  resolverReporteAdmin,
} from "../../services/admin.service.js";
import { reporteFalso } from "../../test/utils.jsx";

vi.mock("../../components/admin/AdminModalConfirmarEliminar", () => ({
  default: ({ tipo, nombre, onConfirmar, onCancelar }) => (
    <div>
      <p>{`Confirmar ${tipo}: ${nombre}`}</p>
      <button type="button" onClick={onConfirmar}>
        Confirmar
      </button>
      <button type="button" onClick={onCancelar}>
        Cancelar
      </button>
    </div>
  ),
}));

vi.mock("../../components/admin/AdminModalReporte", () => ({
  default: ({
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
  }) => (
    <div>
      <p>{`Reporte ${reporte.reportado}: modo ${modo}; baneado ${estaBaneado}; usuario eliminado ${usuarioEliminadoDesdeReporte}; producto eliminado ${productoEliminadoDesdeReporte}`}</p>
      <button type="button" onClick={() => onEnviarRespuesta("Respuesta de prueba")}>
        Enviar respuesta
      </button>
      <button type="button" onClick={onToggleBanear}>
        Banear reportado
      </button>
      <button type="button" onClick={onPedirEliminarUsuario}>
        Eliminar usuario reportado
      </button>
      <button type="button" onClick={onPedirEliminarProducto}>
        Eliminar producto reportado
      </button>
      <button type="button" onClick={onCerrar}>
        Cerrar reporte
      </button>
    </div>
  ),
}));

vi.mock("./AjustesAdministrador", () => ({
  default: ({ onClose }) => (
    <div>
      <p>Ajustes administrador</p>
      <button type="button" onClick={onClose}>
        Cerrar ajustes
      </button>
    </div>
  ),
}));

vi.mock("../../services/admin.service.js", () => ({
  obtenerStatsAdmin: vi.fn(),
  listarUsuariosAdmin: vi.fn(),
  listarProductosAdmin: vi.fn(),
  listarReportesAdmin: vi.fn(),
  cambiarEstadoUsuarioAdmin: vi.fn(),
  eliminarUsuarioAdmin: vi.fn(),
  eliminarProductoAdmin: vi.fn(),
  restaurarProductoAdmin: vi.fn(),
  eliminarReporteAdmin: vi.fn(),
  resolverReporteAdmin: vi.fn(),
}));

function usuariosApi() {
  return [
    {
      id: 1,
      nombre: "Ana Perez",
      email: "ana@example.com",
      rol: "Vendedor",
      estado: "activo",
    },
    {
      id: 2,
      nombre: "Beto Diaz",
      email: "beto@example.com",
      rol: "Comprador",
      estado: "baneado",
    },
  ];
}

function productosApi() {
  return [
    {
      id: 5,
      nombre: "Teclado mecanico",
      precio: 150000,
      vendedor: "Ana Perez",
      suspendido: false,
    },
    {
      id: 6,
      nombre: "Mouse gamer",
      precio: 80000,
      vendedor: "Carla Ruiz",
      suspendido: true,
    },
  ];
}

function reportesApi() {
  return [
    reporteFalso({
      id: 1,
      tipo: "usuario",
      estado: "pendiente",
      reportado: "Ana Perez",
      reportadoPor: "Carla Ruiz",
      reportadoId: 1,
    }),
    reporteFalso({
      id: 2,
      tipo: "producto",
      estado: "resuelto",
      reportado: "Mouse gamer",
      reportadoPor: "Beto Diaz",
      reportadoId: 5,
      respuesta: "Caso resuelto",
    }),
  ];
}

const statsApi = {
  totalVendedores: 12,
  totalCompradores: 34,
  totalProductos: 56,
  totalComisiones: 2500000,
};

function prepararCarga({
  stats = statsApi,
  usuarios = usuariosApi(),
  productos = productosApi(),
  reportes = reportesApi(),
} = {}) {
  obtenerStatsAdmin.mockResolvedValue({ data: stats });
  listarUsuariosAdmin.mockResolvedValue({ data: usuarios });
  listarProductosAdmin.mockResolvedValue({ data: productos });
  listarReportesAdmin.mockResolvedValue({ data: reportes });
}

function tablas() {
  const [usuarios, productos, reportes] = screen.getAllByRole("table");
  return { usuarios, productos, reportes };
}

async function cargarPanel() {
  render(<PanelAdministrador />);
  await screen.findByText("12");
}

describe("PanelAdministrador", () => {
  beforeEach(() => {
    obtenerStatsAdmin.mockReset();
    listarUsuariosAdmin.mockReset();
    listarProductosAdmin.mockReset();
    listarReportesAdmin.mockReset();
    cambiarEstadoUsuarioAdmin.mockReset();
    eliminarUsuarioAdmin.mockReset();
    eliminarProductoAdmin.mockReset();
    restaurarProductoAdmin.mockReset();
    eliminarReporteAdmin.mockReset();
    resolverReporteAdmin.mockReset();
  });

  it("muestra el estado de carga y luego los datos del panel", async () => {
    // Arrange
    prepararCarga();

    // Act
    render(<PanelAdministrador />);

    // Assert
    expect(screen.getByText("Cargando usuarios...")).toBeInTheDocument();
    expect(screen.getByText("Cargando productos...")).toBeInTheDocument();
    expect(screen.getByText("Cargando reportes...")).toBeInTheDocument();

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("56")).toBeInTheDocument();
    expect(screen.getByText("$2.500.000")).toBeInTheDocument();

    const { usuarios, productos, reportes } = tablas();
    expect(within(usuarios).getByText("Ana Perez")).toBeInTheDocument();
    expect(within(usuarios).getByText("ana@example.com")).toBeInTheDocument();
    expect(within(usuarios).getByText("Vendedor")).toBeInTheDocument();
    expect(within(usuarios).getByText("Activo")).toBeInTheDocument();
    expect(within(usuarios).getByText("Baneado")).toBeInTheDocument();

    expect(within(productos).getByText("Teclado mecanico")).toBeInTheDocument();
    expect(within(productos).getByText("$150.000")).toBeInTheDocument();
    expect(within(productos).getByText("$80.000")).toBeInTheDocument();
    expect(within(productos).getByText("Suspendido")).toBeInTheDocument();
    expect(
      within(productos).getByRole("button", { name: "Restaurar" })
    ).toBeInTheDocument();

    expect(within(reportes).getByText("Usuario")).toBeInTheDocument();
    expect(within(reportes).getByText("Producto")).toBeInTheDocument();
    expect(within(reportes).getByText("Pendiente")).toBeInTheDocument();
    expect(within(reportes).getByText("Resuelto")).toBeInTheDocument();
    expect(
      within(reportes).getByRole("button", { name: "Responder" })
    ).toBeInTheDocument();
    expect(
      within(reportes).getByRole("button", { name: "Ver" })
    ).toBeInTheDocument();
  });

  it("muestra el error del backend y permite reintentar", async () => {
    // Arrange
    const usuario = userEvent.setup();
    obtenerStatsAdmin
      .mockRejectedValueOnce(new Error("Servidor caido"))
      .mockResolvedValueOnce({ data: statsApi });
    listarUsuariosAdmin.mockResolvedValue({ data: usuariosApi() });
    listarProductosAdmin.mockResolvedValue({ data: productosApi() });
    listarReportesAdmin.mockResolvedValue({ data: reportesApi() });
    render(<PanelAdministrador />);

    // Act
    expect(await screen.findByText("Servidor caido")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Reintentar" }));

    // Assert
    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.queryByText("Servidor caido")).not.toBeInTheDocument();
  });

  it("usa el mensaje de error por defecto al cargar el panel", async () => {
    // Arrange
    obtenerStatsAdmin.mockRejectedValue({});
    listarUsuariosAdmin.mockResolvedValue({ data: [] });
    listarProductosAdmin.mockResolvedValue({ data: [] });
    listarReportesAdmin.mockResolvedValue({ data: [] });

    // Act
    render(<PanelAdministrador />);

    // Assert
    expect(
      await screen.findByText("No se pudieron cargar los datos del panel.")
    ).toBeInTheDocument();
  });

  it("muestra guiones y listas vacias sin estadisticas", async () => {
    // Arrange
    prepararCarga({ stats: null, usuarios: [], productos: [], reportes: [] });

    // Act
    render(<PanelAdministrador />);

    // Assert
    expect(await screen.findAllByText("Sin resultados")).toHaveLength(3);
    expect(screen.getAllByText("—")).toHaveLength(4);
  });

  it("filtra usuarios, productos y reportes por busqueda y estado", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    await cargarPanel();

    // Act
    await usuario.type(
      screen.getByPlaceholderText("Buscar usuarios"),
      "comprador"
    );

    // Assert
    expect(
      within(tablas().usuarios).queryByText("Ana Perez")
    ).not.toBeInTheDocument();
    expect(within(tablas().usuarios).getByText("Beto Diaz")).toBeInTheDocument();

    // Act
    await usuario.type(
      screen.getByPlaceholderText("Buscar Productos"),
      "carla"
    );

    // Assert
    expect(
      within(tablas().productos).queryByText("Teclado mecanico")
    ).not.toBeInTheDocument();
    expect(
      within(tablas().productos).getByText("Mouse gamer")
    ).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Pendiente" }));
    await usuario.type(
      screen.getByPlaceholderText("Buscar Reportes"),
      "carla"
    );

    // Assert
    expect(
      within(tablas().reportes).queryByText("Mouse gamer")
    ).not.toBeInTheDocument();
    expect(within(tablas().reportes).getByText("Ana Perez")).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Resuelto" }));

    // Assert
    expect(
      within(tablas().reportes).getByText("Sin resultados")
    ).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Todo" }));

    // Assert
    expect(within(tablas().reportes).getByText("Ana Perez")).toBeInTheDocument();
  });

  it("banea y reactiva usuarios y recarga los listados", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    await cargarPanel();
    const { usuarios } = tablas();

    // Act
    await usuario.click(
      within(usuarios).getByRole("button", { name: "Banear" })
    );

    // Assert
    await waitFor(() =>
      expect(cambiarEstadoUsuarioAdmin).toHaveBeenCalledWith(1, "baneado")
    );
    await waitFor(() => expect(listarUsuariosAdmin).toHaveBeenCalledTimes(2));

    // Act
    await usuario.click(
      within(tablas().usuarios).getByRole("button", { name: "Activar" })
    );

    // Assert
    await waitFor(() =>
      expect(cambiarEstadoUsuarioAdmin).toHaveBeenCalledWith(2, "activo")
    );
  });

  it("elimina un usuario tras confirmar y respeta la cancelacion", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    await cargarPanel();

    // Act
    await usuario.click(
      screen.getAllByRole("button", { name: "Eliminar" })[0]
    );
    expect(screen.getByText("Confirmar Usuario: Ana Perez")).toBeInTheDocument();

    // Assert
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText(/^Confirmar Usuario/)).not.toBeInTheDocument();
    expect(eliminarUsuarioAdmin).not.toHaveBeenCalled();

    // Act
    await usuario.click(
      screen.getAllByRole("button", { name: "Eliminar" })[0]
    );
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    // Assert
    await waitFor(() =>
      expect(eliminarUsuarioAdmin).toHaveBeenCalledWith(1)
    );
    await waitFor(() => expect(listarUsuariosAdmin).toHaveBeenCalledTimes(2));
  });

  it("suspende y restaura productos", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    await cargarPanel();

    // Act
    await usuario.click(screen.getByTitle("Eliminar producto"));

    // Assert
    expect(
      screen.getByText("Confirmar Producto: Teclado mecanico")
    ).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    // Assert
    await waitFor(() =>
      expect(eliminarProductoAdmin).toHaveBeenCalledWith(5)
    );

    // Act
    await usuario.click(screen.getByRole("button", { name: "Restaurar" }));

    // Assert
    await waitFor(() =>
      expect(restaurarProductoAdmin).toHaveBeenCalledWith(6)
    );
  });

  it("abre el reporte pendiente para responder y el resuelto para ver", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    await cargarPanel();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Responder" }));

    // Assert
    expect(
      screen.getByText(
        "Reporte Ana Perez: modo responder; baneado false; usuario eliminado false; producto eliminado false"
      )
    ).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Cerrar reporte" }));
    await usuario.click(screen.getByRole("button", { name: "Ver" }));

    // Assert
    expect(
      screen.getByText(
        "Reporte Mouse gamer: modo ver; baneado false; usuario eliminado false; producto eliminado false"
      )
    ).toBeInTheDocument();
  });

  it("resuelve el reporte con la respuesta del administrador", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    resolverReporteAdmin.mockResolvedValue({ success: true });
    await cargarPanel();
    await usuario.click(screen.getByRole("button", { name: "Responder" }));

    // Act
    await usuario.click(screen.getByRole("button", { name: "Enviar respuesta" }));

    // Assert
    await waitFor(() =>
      expect(resolverReporteAdmin).toHaveBeenCalledWith(1, "Respuesta de prueba")
    );
    expect(
      await screen.findByText(/Reporte Ana Perez: modo ver/)
    ).toBeInTheDocument();
  });

  it("archiva un reporte tras confirmar y respeta la cancelacion", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    await cargarPanel();

    // Act
    await usuario.click(
      screen.getAllByRole("button", { name: "Eliminar" })[2]
    );
    expect(screen.getByText("Confirmar Reporte: Ana Perez")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    // Assert
    expect(eliminarReporteAdmin).not.toHaveBeenCalled();

    // Act
    await usuario.click(
      screen.getAllByRole("button", { name: "Eliminar" })[2]
    );
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    // Assert
    await waitFor(() =>
      expect(eliminarReporteAdmin).toHaveBeenCalledWith(1)
    );
  });

  it("banea al usuario reportado desde el modal", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    const anaBaneada = usuariosApi().map((u) =>
      u.id === 1 ? { ...u, estado: "baneado" } : u
    );
    listarUsuariosAdmin
      .mockResolvedValueOnce({ data: usuariosApi() })
      .mockResolvedValueOnce({ data: anaBaneada });
    await cargarPanel();
    await usuario.click(screen.getByRole("button", { name: "Responder" }));

    // Act
    await usuario.click(screen.getByRole("button", { name: "Banear reportado" }));

    // Assert
    await waitFor(() =>
      expect(cambiarEstadoUsuarioAdmin).toHaveBeenCalledWith(1, "baneado")
    );
    expect(await screen.findByText(/baneado true/)).toBeInTheDocument();
  });

  it("elimina al usuario reportado y bloquea repetir la accion", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    await cargarPanel();
    await usuario.click(screen.getByRole("button", { name: "Responder" }));

    // Act
    await usuario.click(
      screen.getByRole("button", { name: "Eliminar usuario reportado" })
    );

    // Assert
    expect(screen.getByText("Confirmar Usuario: Ana Perez")).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    // Assert
    await waitFor(() =>
      expect(eliminarUsuarioAdmin).toHaveBeenCalledWith(1)
    );
    expect(
      await screen.findByText(/usuario eliminado true/)
    ).toBeInTheDocument();

    // Act
    await usuario.click(
      screen.getByRole("button", { name: "Eliminar usuario reportado" })
    );

    // Assert
    expect(screen.queryByText(/^Confirmar Usuario/)).not.toBeInTheDocument();
    expect(eliminarUsuarioAdmin).toHaveBeenCalledTimes(1);
  });

  it("elimina el producto reportado desde el modal", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    await cargarPanel();
    await usuario.click(screen.getByRole("button", { name: "Ver" }));

    // Act
    await usuario.click(
      screen.getByRole("button", { name: "Eliminar producto reportado" })
    );

    // Assert
    expect(
      screen.getByText("Confirmar Producto: Teclado mecanico")
    ).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    // Assert
    await waitFor(() =>
      expect(eliminarProductoAdmin).toHaveBeenCalledWith(5)
    );
    expect(
      await screen.findByText(/producto eliminado true/)
    ).toBeInTheDocument();
  });

  it("ignora acciones de reporte sin destinatario valido", async () => {
    // Arrange
    const usuario = userEvent.setup();
    const sinId = reporteFalso({
      id: 1,
      estado: "pendiente",
      reportado: "Sin identificador",
      reportadoId: null,
    });
    const usuarioInexistente = reporteFalso({
      id: 2,
      estado: "pendiente",
      reportado: "Fantasma",
      reportadoId: 999,
    });
    prepararCarga({ reportes: [sinId, usuarioInexistente] });
    await cargarPanel();

    // Act
    await usuario.click(
      screen.getAllByRole("button", { name: "Responder" })[0]
    );
    await usuario.click(screen.getByRole("button", { name: "Banear reportado" }));
    await usuario.click(
      screen.getByRole("button", { name: "Eliminar usuario reportado" })
    );

    // Assert
    expect(cambiarEstadoUsuarioAdmin).not.toHaveBeenCalled();
    expect(eliminarUsuarioAdmin).not.toHaveBeenCalled();
    expect(screen.queryByText(/^Confirmar Usuario/)).not.toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Cerrar reporte" }));
    await usuario.click(
      screen.getAllByRole("button", { name: "Responder" })[1]
    );
    await usuario.click(screen.getByRole("button", { name: "Banear reportado" }));

    // Assert
    expect(cambiarEstadoUsuarioAdmin).not.toHaveBeenCalled();
  });

  it("muestra el mensaje del backend al fallar una accion", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    cambiarEstadoUsuarioAdmin.mockRejectedValue(new Error("No autorizado"));
    await cargarPanel();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Banear" }));

    // Assert
    expect(await screen.findByText("No autorizado")).toBeInTheDocument();
    expect(listarUsuariosAdmin).toHaveBeenCalledTimes(1);
  });

  it("usa el mensaje por defecto al fallar una accion", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    cambiarEstadoUsuarioAdmin.mockRejectedValue({});
    await cargarPanel();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Banear" }));

    // Assert
    expect(
      await screen.findByText("No se pudo cambiar el estado del usuario.")
    ).toBeInTheDocument();
  });

  it("abre y cierra los ajustes administrativos", async () => {
    // Arrange
    const usuario = userEvent.setup();
    prepararCarga();
    const { container } = render(<PanelAdministrador />);
    await screen.findByText("12");
    const botonAjustes = container.querySelector("header button");

    // Act
    await usuario.click(botonAjustes);

    // Assert
    expect(screen.getByText("Ajustes administrador")).toBeInTheDocument();

    // Act
    await usuario.click(screen.getByRole("button", { name: "Cerrar ajustes" }));

    // Assert
    expect(screen.queryByText("Ajustes administrador")).not.toBeInTheDocument();
  });
});
