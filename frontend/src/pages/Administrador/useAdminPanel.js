import { useCallback, useEffect, useMemo, useState } from "react";
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

/**
 * Estado y acciones del panel de administracion (/api/admin/*).
 * Concentra la carga de datos, los filtros locales y los cuatro modales.
 */
export function useAdminPanel() {
  // Datos del panel cargados desde /api/admin/*
  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Estados de busqueda y filtros
  const [buscarUsuarios, setBuscarUsuarios] = useState("");
  const [buscarProductos, setBuscarProductos] = useState("");
  const [buscarReportes, setBuscarReportes] = useState("");
  const [filtroReporte, setFiltroReporte] = useState("todo");

  // Modales de confirmacion y de detalle de reporte
  const [modalEliminarUsuario, setModalEliminarUsuario] = useState({
    abierto: false,
    id: null,
    desdeReporte: false,
  });
  const [modalEliminarProducto, setModalEliminarProducto] = useState({
    abierto: false,
    id: null,
    desdeReporte: false,
  });
  const [modalEliminarReporte, setModalEliminarReporte] = useState({
    abierto: false,
    id: null,
  });
  const [modalReporte, setModalReporte] = useState({
    abierto: false,
    reporteId: null,
    modo: "ver",
  });

  // Entidades sobre las que ya se actuo desde el modal de reporte, para
  // reflejar la accion mientras se recargan los listados.
  const [usuariosEliminadosDesdeReporte, setUsuariosEliminadosDesdeReporte] = useState(new Set());
  const [productosEliminadosDesdeReporte, setProductosEliminadosDesdeReporte] = useState(new Set());

  const [mostrarAjustes, setMostrarAjustes] = useState(false);

  /**
   * Carga estadisticas y los tres listados del panel en paralelo.
   * @param {{silencioso?: boolean}} [opciones] true evita el estado de carga
   */
  const cargarDatos = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true);
    try {
      const [statsRes, usuariosRes, productosRes, reportesRes] = await Promise.all([
        obtenerStatsAdmin(),
        listarUsuariosAdmin(),
        listarProductosAdmin(),
        listarReportesAdmin(),
      ]);
      setStats(statsRes?.data ?? null);
      setUsuarios(usuariosRes?.data ?? []);
      setProductos(productosRes?.data ?? []);
      setReportes(reportesRes?.data ?? []);
      setError("");
    } catch (err) {
      setError(err?.message || "No se pudieron cargar los datos del panel.");
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  /** Ejecuta una accion contra la API y recarga los listados. */
  async function ejecutarAccion(accion, mensajeError) {
    try {
      await accion();
      await cargarDatos({ silencioso: true });
      return true;
    } catch (err) {
      setError(err?.message || mensajeError);
      return false;
    }
  }

  // Derivado: reporte actualmente abierto en el modal
  const reporteActual = useMemo(
    () => reportes.find((r) => r.id === modalReporte.reporteId) || null,
    [reportes, modalReporte.reporteId]
  );

  // Derivado: listas filtradas para busquedas
  const usuariosFiltrados = useMemo(() => {
    const q = buscarUsuarios.toLowerCase();
    return usuarios.filter(
      (u) =>
        (u.nombre || "").toLowerCase().includes(q) ||
        (u.rol || "").toLowerCase().includes(q)
    );
  }, [usuarios, buscarUsuarios]);

  const productosFiltrados = useMemo(() => {
    const q = buscarProductos.toLowerCase();
    return productos.filter(
      (p) =>
        (p.nombre || "").toLowerCase().includes(q) ||
        (p.vendedor || "").toLowerCase().includes(q)
    );
  }, [productos, buscarProductos]);

  const reportesFiltrados = useMemo(() => {
    const q = buscarReportes.toLowerCase();
    return reportes.filter((r) => {
      const matchFiltro = filtroReporte === "todo" || r.estado === filtroReporte;
      const matchQ =
        (r.reportado || "").toLowerCase().includes(q) ||
        (r.reportadoPor || "").toLowerCase().includes(q) ||
        (r.tipo || "").toLowerCase().includes(q);
      return matchFiltro && matchQ;
    });
  }, [reportes, buscarReportes, filtroReporte]);

  // --- ACCIONES USUARIOS ---

  /** Banea o reactiva un usuario (RF74). */
  function cambiarEstadoUsuario(id, estado) {
    ejecutarAccion(
      () => cambiarEstadoUsuarioAdmin(id, estado),
      "No se pudo cambiar el estado del usuario."
    );
  }

  /** Abre el modal de confirmacion para eliminar desde la tabla de usuarios */
  function pedirEliminarUsuario(id) {
    setModalEliminarUsuario({ abierto: true, id, desdeReporte: false });
  }

  /** Abre el modal de confirmacion para eliminar desde el modal de reporte */
  function pedirEliminarUsuarioDesdeReporte() {
    if (!reporteActual || reporteActual.reportadoId == null) return;
    if (usuariosEliminadosDesdeReporte.has(reporteActual.reportadoId)) return;
    setModalEliminarUsuario({
      abierto: true,
      id: reporteActual.reportadoId,
      desdeReporte: true,
    });
  }

  /** Confirma la desactivacion del usuario y recarga los listados */
  async function confirmarEliminarUsuario() {
    const { id, desdeReporte } = modalEliminarUsuario;
    setModalEliminarUsuario({ abierto: false, id: null, desdeReporte: false });
    if (id == null) return;
    const exito = await ejecutarAccion(
      () => eliminarUsuarioAdmin(id),
      "No se pudo eliminar el usuario."
    );
    if (exito && desdeReporte) {
      setUsuariosEliminadosDesdeReporte((prev) => new Set(prev).add(id));
    }
  }

  /** Cierra el modal de confirmacion sin ejecutar la eliminacion */
  function cancelarEliminarUsuario() {
    setModalEliminarUsuario({ abierto: false, id: null, desdeReporte: false });
  }

  // --- ACCIONES PRODUCTOS ---

  /** Abre el modal de confirmacion para eliminar desde la tabla de productos */
  function pedirEliminarProducto(id) {
    setModalEliminarProducto({ abierto: true, id, desdeReporte: false });
  }

  /** Abre el modal de confirmacion para eliminar desde el modal de reporte */
  function pedirEliminarProductoDesdeReporte() {
    if (!reporteActual || reporteActual.reportadoId == null) return;
    if (productosEliminadosDesdeReporte.has(reporteActual.reportadoId)) return;
    setModalEliminarProducto({
      abierto: true,
      id: reporteActual.reportadoId,
      desdeReporte: true,
    });
  }

  /** Confirma la suspension del producto y recarga los listados */
  async function confirmarEliminarProducto() {
    const { id, desdeReporte } = modalEliminarProducto;
    setModalEliminarProducto({ abierto: false, id: null, desdeReporte: false });
    if (id == null) return;
    const exito = await ejecutarAccion(
      () => eliminarProductoAdmin(id),
      "No se pudo eliminar el producto."
    );
    if (exito && desdeReporte) {
      setProductosEliminadosDesdeReporte((prev) => new Set(prev).add(id));
    }
  }

  /** Cierra el modal de confirmacion sin ejecutar la eliminacion */
  function cancelarEliminarProducto() {
    setModalEliminarProducto({ abierto: false, id: null, desdeReporte: false });
  }

  /** Restaura un producto suspendido por error (RF68) */
  function restaurarProducto(id) {
    ejecutarAccion(
      () => restaurarProductoAdmin(id),
      "No se pudo restaurar el producto."
    );
  }

  // --- ACCIONES REPORTES ---

  /** Abre el modal de detalle de reporte en modo ver o responder */
  function abrirModalReporte(id, modo) {
    setModalReporte({ abierto: true, reporteId: id, modo });
  }

  /** Cierra el modal de detalle de reporte */
  function cerrarModalReporte() {
    setModalReporte({ abierto: false, reporteId: null, modo: "ver" });
  }

  /** Abre el modal de confirmacion para archivar un reporte */
  function pedirEliminarReporte(id) {
    setModalEliminarReporte({ abierto: true, id });
  }

  /** Archiva el reporte en el backend y recarga los listados */
  async function confirmarEliminarReporte() {
    const { id } = modalEliminarReporte;
    setModalEliminarReporte({ abierto: false, id: null });
    if (id == null) return;
    await ejecutarAccion(
      () => eliminarReporteAdmin(id),
      "No se pudo eliminar el reporte."
    );
  }

  /** Cancela el archivado del reporte */
  function cancelarEliminarReporte() {
    setModalEliminarReporte({ abierto: false, id: null });
  }

  /** Envia la respuesta del admin y resuelve el reporte (RF66) */
  async function enviarRespuesta(texto) {
    const id = modalReporte.reporteId;
    if (id == null) return;
    const exito = await ejecutarAccion(
      () => resolverReporteAdmin(id, texto),
      "No se pudo resolver el reporte."
    );
    if (exito) setModalReporte((prev) => ({ ...prev, modo: "ver" }));
  }

  // --- ACCIONES DE ESTADO DESDE EL REPORTE ---

  /** Indica si el usuario reportado esta baneado */
  function estaBaneado(reporte) {
    if (!reporte || reporte.reportadoId == null) return false;
    const u = usuarios.find((usr) => usr.id === reporte.reportadoId);
    return u?.estado === "baneado";
  }

  /** Alterna el baneo del usuario reportado (RF74) */
  function toggleBanearDesdeReporte() {
    if (!reporteActual || reporteActual.reportadoId == null) return;
    if (usuariosEliminadosDesdeReporte.has(reporteActual.reportadoId)) return;

    const u = usuarios.find((usr) => usr.id === reporteActual.reportadoId);
    if (!u) return;
    cambiarEstadoUsuario(u.id, u.estado === "baneado" ? "activo" : "baneado");
  }

  return {
    stats,
    cargando,
    error,
    cargarDatos,

    buscarUsuarios,
    setBuscarUsuarios,
    usuariosFiltrados,
    cambiarEstadoUsuario,
    pedirEliminarUsuario,

    buscarProductos,
    setBuscarProductos,
    productosFiltrados,
    pedirEliminarProducto,
    restaurarProducto,

    buscarReportes,
    setBuscarReportes,
    filtroReporte,
    setFiltroReporte,
    reportesFiltrados,
    abrirModalReporte,
    pedirEliminarReporte,

    modalEliminarUsuario,
    confirmarEliminarUsuario,
    cancelarEliminarUsuario,
    nombreParaConfirmarUsuario:
      usuarios.find((u) => u.id === modalEliminarUsuario.id)?.nombre || "",

    modalEliminarProducto,
    confirmarEliminarProducto,
    cancelarEliminarProducto,
    nombreParaConfirmarProducto:
      productos.find((p) => p.id === modalEliminarProducto.id)?.nombre || "",

    modalEliminarReporte,
    confirmarEliminarReporte,
    cancelarEliminarReporte,
    nombreParaConfirmarReporte:
      reportes.find((r) => r.id === modalEliminarReporte.id)?.reportado || "",

    modalReporte,
    reporteActual,
    enviarRespuesta,
    cerrarModalReporte,
    estaBaneado,
    toggleBanearDesdeReporte,
    usuariosEliminadosDesdeReporte,
    productosEliminadosDesdeReporte,
    pedirEliminarUsuarioDesdeReporte,
    pedirEliminarProductoDesdeReporte,

    mostrarAjustes,
    setMostrarAjustes,
  };
}
