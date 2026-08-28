import { useState, useMemo } from "react";
import AdminModalConfirmarEliminar from "../../components/admin/AdminModalConfirmarEliminar";
import AdminModalReporte from "../../components/admin/AdminModalReporte";
import AjustesAdministrador from "./AjustesAdministrador";

// JS Datos iniciales de usuarios mock
const USUARIOS_INICIALES = [
  { id: 1, nombre: "Carlos Martinez", rol: "Vendedor", estado: "activo" },
  { id: 2, nombre: "Lucia Fernandez", rol: "Comprador", estado: "baneado" },
  { id: 3, nombre: "Cristiano Ronaldo", rol: "Vendedor", estado: "activo" },
  { id: 4, nombre: "Multigangas", rol: "Vendedor", estado: "activo" },
  { id: 5, nombre: "Andres Torres", rol: "Comprador", estado: "activo" },
  { id: 6, nombre: "Sara Rios", rol: "Vendedor", estado: "baneado" },
];

// JS Datos iniciales de productos mock
const PRODUCTOS_INICIALES = [
  { id: 1, nombre: "Teclado Gamer Pro", precio: "$55.000", vendedor: "Carlos Martinez" },
  { id: 2, nombre: "Balon Trionda", precio: "$150.000", vendedor: "Natural Sport" },
  { id: 3, nombre: "Zapatillas Converse", precio: "$250.000", vendedor: "Calzado Bucaramanga" },
  { id: 4, nombre: "Buso Oversize", precio: "$70.000", vendedor: "La locura de los precios bajos" },
  { id: 5, nombre: "Camiseta Colombia", precio: "$85.000", vendedor: "Multigangas" },
  { id: 6, nombre: "Zapatillas NIKE F1", precio: "$320.000", vendedor: "SportZone" },
];

// JS Datos iniciales de reportes mock
const REPORTES_INICIALES = [
  {
    id: 1, tipo: "usuario", reportado: "Julian Guerrero",
    reportadoInfo: "Comprador Â· julian@mail.com",
    reportadoPor: "Maria Lopez", reportadoPorInfo: "Vendedora Â· maria@mail.com",
    fecha: "24 Oct, 2026", estado: "pendiente",
    motivo: "Comportamiento inapropiado",
    descripcion: "El usuario ha estado enviando mensajes ofensivos y amenazantes a varios vendedores de la plataforma durante los ultimos dias.",
    evidencias: 3, respuesta: "",
  },
  {
    id: 2, tipo: "producto", reportado: "Teclado Gamer Pro",
    reportadoPrecio: "$55.000", reportadoVendedor: "Carlos Martinez",
    reportadoPor: "Luis Perez", reportadoPorInfo: "Comprador Â· luis@mail.com",
    fecha: "22 Oct, 2026", estado: "resuelto",
    motivo: "Producto no corresponde a la descripcion",
    descripcion: "El teclado recibido no tiene retroiluminacion como se anuncia en las fotos. Las especificaciones son incorrectas.",
    evidencias: 2,
    respuesta: "Se ha contactado al vendedor y se ha procedido a retirar el producto. Se emitio un reembolso al comprador.",
  },
  {
    id: 3, tipo: "producto", reportado: "Camiseta Seleccion Colombia",
    reportadoPrecio: "$85.000", reportadoVendedor: "Multigangas",
    reportadoPor: "Pedro Gomez", reportadoPorInfo: "Comprador Â· pedro@mail.com",
    fecha: "22 Oct, 2026", estado: "pendiente",
    motivo: "Producto falsificado",
    descripcion: "La camiseta recibida tiene costuras de mala calidad y la numeracion es incorrecta. Se sospecha que es una replica no autorizada.",
    evidencias: 4, respuesta: "",
  },
  {
    id: 4, tipo: "usuario", reportado: "Mario Alberto",
    reportadoInfo: "Vendedor Â· mario@mail.com",
    reportadoPor: "Clara Soto", reportadoPorInfo: "Compradora Â· clara@mail.com",
    fecha: "20 Oct, 2026", estado: "pendiente",
    motivo: "Fraude / Estafa",
    descripcion: "El vendedor recibio el pago pero nunca despacho el producto. No responde mensajes y ha bloqueado al comprador.",
    evidencias: 2, respuesta: "",
  },
  {
    id: 5, tipo: "producto", reportado: "Zapatillas NIKE F1",
    reportadoPrecio: "$320.000", reportadoVendedor: "SportZone",
    reportadoPor: "Dominick Toreto", reportadoPorInfo: "Comprador Â· dom@mail.com",
    fecha: "19 Oct, 2026", estado: "resuelto",
    motivo: "Precio abusivo",
    descripcion: "El precio del producto fue modificado despues de que el comprador realizo el pago, cobrando $120.000 adicionales.",
    evidencias: 1,
    respuesta: "Se ha bloqueado temporalmente al vendedor y se ha revertido el cobro adicional. El caso esta cerrado.",
  },
  {
    id: 6, tipo: "usuario", reportado: "Dominick Toreto",
    reportadoInfo: "Comprador Â· dom@mail.com",
    reportadoPor: "Santiago Vega", reportadoPorInfo: "Vendedor Â· santi@mail.com",
    fecha: "16 Oct, 2026", estado: "resuelto",
    motivo: "Acoso al vendedor",
    descripcion: "El comprador ha estado dejando resenas falsas y negativas repetidamente en todos los productos del vendedor.",
    evidencias: 3,
    respuesta: "Se han eliminado las resenas abusivas y se ha enviado una advertencia formal al usuario.",
  },
];

export default function PanelAdministrador() {
  // RE Estados principales: usuarios, productos, reportes
  const [usuarios, setUsuarios] = useState(USUARIOS_INICIALES);
  const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
  const [reportes, setReportes] = useState(REPORTES_INICIALES);

  // RE Estados de busqueda y filtros
  const [buscarUsuarios, setBuscarUsuarios] = useState("");
  const [buscarProductos, setBuscarProductos] = useState("");
  const [buscarReportes, setBuscarReportes] = useState("");
  const [filtroReporte, setFiltroReporte] = useState("todo");

  // RE Estado del modal de confirmacion para eliminar usuario
  const [modalEliminarUsuario, setModalEliminarUsuario] = useState({
    abierto: false,
    id: null,
    nombreDesdeReporte: null,
  });

  // RE Estado del modal de confirmacion para eliminar producto
  const [modalEliminarProducto, setModalEliminarProducto] = useState({
    abierto: false,
    id: null,
    nombreDesdeReporte: null,
  });

  // RE Estado del modal de detalle de reporte
  const [modalReporte, setModalReporte] = useState({
    abierto: false,
    reporteId: null,
    modo: "ver",
  });

  // RE Estado de baneos para usuarios reportados que no estan en la tabla de Usuarios
  const [baneosExternos, setBaneosExternos] = useState({});

  // RE Registro de usuarios y productos ya eliminados desde el modal de reporte
  const [usuariosEliminadosDesdeReporte, setUsuariosEliminadosDesdeReporte] = useState(new Set());
  const [productosEliminadosDesdeReporte, setProductosEliminadosDesdeReporte] = useState(new Set());
  const [mostrarAjustes, setMostrarAjustes] = useState(false);

  // RE Derivado: reporte actualmente abierto en el modal
  const reporteActual = useMemo(
    () => reportes.find((r) => r.id === modalReporte.reporteId) || null,
    [reportes, modalReporte.reporteId]
  );

  // RE Derivado: listas filtradas para busquedas
  const usuariosFiltrados = useMemo(() => {
    const q = buscarUsuarios.toLowerCase();
    return usuarios.filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.rol.toLowerCase().includes(q)
    );
  }, [usuarios, buscarUsuarios]);

  const productosFiltrados = useMemo(() => {
    const q = buscarProductos.toLowerCase();
    return productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.vendedor.toLowerCase().includes(q)
    );
  }, [productos, buscarProductos]);

  const reportesFiltrados = useMemo(() => {
    const q = buscarReportes.toLowerCase();
    return reportes.filter((r) => {
      const matchFiltro = filtroReporte === "todo" || r.estado === filtroReporte;
      const matchQ =
        r.reportado.toLowerCase().includes(q) ||
        r.reportadoPor.toLowerCase().includes(q) ||
        r.tipo.toLowerCase().includes(q);
      return matchFiltro && matchQ;
    });
  }, [reportes, buscarReportes, filtroReporte]);

  // â”€â”€â”€ ACCIONES USUARIOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // JS Cambia el estado de un usuario a baneado
  function banearUsuario(id) {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, estado: "baneado" } : u)));
  }

  // JS Cambia el estado de un usuario a activo
  function activarUsuario(id) {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, estado: "activo" } : u)));
  }

  // JS Abre el modal de confirmacion para eliminar desde la tabla de usuarios
  function pedirEliminarUsuario(id) {
    const u = usuarios.find((u) => u.id === id);
    if (!u) return;
    setModalEliminarUsuario({ abierto: true, id, nombreDesdeReporte: null });
  }

  // JS Abre el modal de confirmacion para eliminar desde el modal de reporte
  function pedirEliminarUsuarioDesdeReporte() {
    if (!reporteActual) return;
    if (usuariosEliminadosDesdeReporte.has(reporteActual.reportado)) return;
    setModalEliminarUsuario({
      abierto: true,
      id: null,
      nombreDesdeReporte: reporteActual.reportado,
    });
  }

  // JS Confirma eliminacion de usuario y actualiza el registro de eliminados
  function confirmarEliminarUsuario() {
    if (modalEliminarUsuario.nombreDesdeReporte) {
      const nombre = modalEliminarUsuario.nombreDesdeReporte;
      setUsuarios((prev) => prev.filter((u) => u.nombre !== nombre));
      setUsuariosEliminadosDesdeReporte((prev) => new Set(prev).add(nombre));
    } else {
      setUsuarios((prev) => prev.filter((u) => u.id !== modalEliminarUsuario.id));
    }
    setModalEliminarUsuario({ abierto: false, id: null, nombreDesdeReporte: null });
  }

  // JS Cierra el modal de confirmacion sin ejecutar la eliminacion
  function cancelarEliminarUsuario() {
    setModalEliminarUsuario({ abierto: false, id: null, nombreDesdeReporte: null });
  }

  // â”€â”€â”€ ACCIONES PRODUCTOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // JS Abre el modal de confirmacion para eliminar desde la tabla de productos
  function pedirEliminarProducto(id) {
    const p = productos.find((p) => p.id === id);
    if (!p) return;
    setModalEliminarProducto({ abierto: true, id, nombreDesdeReporte: null });
  }

  // JS Abre el modal de confirmacion para eliminar desde el modal de reporte
  function pedirEliminarProductoDesdeReporte() {
    if (!reporteActual) return;
    if (productosEliminadosDesdeReporte.has(reporteActual.reportado)) return;
    setModalEliminarProducto({
      abierto: true,
      id: null,
      nombreDesdeReporte: reporteActual.reportado,
    });
  }

  // JS Confirma eliminacion de producto y actualiza el registro de eliminados
  function confirmarEliminarProducto() {
    if (modalEliminarProducto.nombreDesdeReporte) {
      const nombre = modalEliminarProducto.nombreDesdeReporte;
      setProductos((prev) => prev.filter((p) => p.nombre !== nombre));
      setProductosEliminadosDesdeReporte((prev) => new Set(prev).add(nombre));
    } else {
      setProductos((prev) => prev.filter((p) => p.id !== modalEliminarProducto.id));
    }
    setModalEliminarProducto({ abierto: false, id: null, nombreDesdeReporte: null });
  }

  // JS Cierra el modal de confirmacion sin ejecutar la eliminacion
  function cancelarEliminarProducto() {
    setModalEliminarProducto({ abierto: false, id: null, nombreDesdeReporte: null });
  }

  // â”€â”€â”€ ACCIONES REPORTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // JS Abre el modal de detalle de reporte en modo ver o responder
  function abrirModalReporte(id, modo) {
    setModalReporte({ abierto: true, reporteId: id, modo });
  }

  // JS Cierra el modal de detalle de reporte
  function cerrarModalReporte() {
    setModalReporte({ abierto: false, reporteId: null, modo: "ver" });
  }

  // JS Envia la respuesta del admin, cambia el estado del reporte a resuelto
  function enviarRespuesta(texto) {
    setReportes((prev) =>
      prev.map((r) =>
        r.id === modalReporte.reporteId
          ? { ...r, estado: "resuelto", respuesta: texto }
          : r
      )
    );
    setModalReporte((prev) => ({ ...prev, modo: "ver" }));
  }

  // â”€â”€â”€ ACCIONES BANEO DESDE REPORTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // JS Verifica si un usuario por nombre esta baneado
  function estaBaneado(nombre) {
    const u = usuarios.find((u) => u.nombre === nombre);
    if (u) return u.estado === "baneado";
    return !!baneosExternos[nombre];
  }

  // JS Alterna el estado de baneo de un usuario reportado
  function toggleBanearDesdeReporte() {
    if (!reporteActual) return;
    if (usuariosEliminadosDesdeReporte.has(reporteActual.reportado)) return;

    const nombre = reporteActual.reportado;
    const u = usuarios.find((u) => u.nombre === nombre);
    if (u) {
      setUsuarios((prev) =>
        prev.map((usr) =>
          usr.nombre === nombre
            ? { ...usr, estado: usr.estado === "baneado" ? "activo" : "baneado" }
            : usr
        )
      );
    } else {
      setBaneosExternos((prev) => ({ ...prev, [nombre]: !prev[nombre] }));
    }
  }

  // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // JS Nombre de la entidad a mostrar en el modal de confirmacion
  const nombreParaConfirmarUsuario =
    modalEliminarUsuario.nombreDesdeReporte ||
    (modalEliminarUsuario.id !== null
      ? usuarios.find((u) => u.id === modalEliminarUsuario.id)?.nombre
      : "");

  const nombreParaConfirmarProducto =
    modalEliminarProducto.nombreDesdeReporte ||
    (modalEliminarProducto.id !== null
      ? productos.find((p) => p.id === modalEliminarProducto.id)?.nombre
      : "");

  return (
    <div className="bg-[#0a0a0f] text-white min-h-screen font-inter h-screen overflow-y-auto">
      <style>{`
        .panel-admin ::-webkit-scrollbar { width: 4px; height: 4px; }
        .panel-admin ::-webkit-scrollbar-track { background: #12121a; }
        .panel-admin ::-webkit-scrollbar-thumb { background: #32324d; border-radius: 99px; }
        .panel-admin ::-webkit-scrollbar-thumb:hover { background: #797998; }
      `}</style>

      <div className="panel-admin">
        {/* TOP BAR */}
        <header className="bg-[#12121a] border-b border-[rgba(30,41,59,0.5)] h-14 flex items-center px-4 fixed top-0 left-0 right-0 z-30">
          <span className="font-jakarta font-bold text-[#ef9918] text-2xl tracking-tight">CommerCity</span>
          <div className="ml-auto">
            <button
              onClick={() => setMostrarAjustes(true)}
              className="text-[#797998] hover:text-white transition-colors p-1"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </header>

        <main className="pt-20 pb-12 px-4 sm:px-6 md:px-8 max-w-[1320px] mx-auto">
          <h1 className="font-inter font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-6">Panel De Control</h1>

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#12121a] rounded-xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
              <div className="bg-[#1a1a26] w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <svg width="22" height="22" fill="none" stroke="#ef9918" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="text-[#797998] text-xs font-bold uppercase tracking-widest mb-1">TOTAL VENDEDORES</p>
              <p className="text-[#f0f0f8] text-3xl font-bold">1,248</p>
            </div>
            <div className="bg-[#12121a] rounded-xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
              <div className="bg-[#1a1a26] w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <svg width="22" height="22" fill="none" stroke="#ef9918" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <p className="text-[#797998] text-xs font-bold uppercase tracking-widest mb-1">TOTAL COMPRADORES</p>
              <p className="text-[#f0f0f8] text-3xl font-bold">8,902</p>
            </div>
            <div className="bg-[#12121a] rounded-xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
              <div className="bg-[#1a1a26] w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <svg width="22" height="22" fill="none" stroke="#ef9918" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" x2="21" y1="6" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <p className="text-[#797998] text-xs font-bold uppercase tracking-widest mb-1">PRODUCTOS PUBLICADOS</p>
              <p className="text-[#f0f0f8] text-3xl font-bold">15,670</p>
            </div>
            <div className="bg-[#12121a] rounded-xl p-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
              <div className="bg-[#1a1a26] w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                <svg width="22" height="22" fill="none" stroke="#ef9918" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <line x1="12" x2="12" y1="1" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-[#797998] text-xs font-bold uppercase tracking-widest">COMISIONES TOTALES</p>
                <span className="bg-[rgba(239,153,24,0.2)] text-[#ef9918] text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">ComisiÃ³n %10</span>
              </div>
              <p className="text-[#f0f0f8] text-3xl font-bold">$45,280.50</p>
            </div>
          </div>

          {/* USERS + PRODUCTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* GESTIÃ“N DE USUARIOS */}
            <div className="bg-[#12121a] rounded-xl shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] overflow-hidden flex flex-col">
              <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-jakarta font-bold text-xl text-white">Gestión de Usuarios</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar usuarios"
                    value={buscarUsuarios}
                    onChange={(e) => setBuscarUsuarios(e.target.value)}
                    className="bg-[#1a1a26] text-[#6b7280] text-sm rounded-full pl-8 pr-4 py-1.5 outline-none focus:ring-1 focus:ring-[#ef9918] w-36 sm:w-48"
                  />
                  <svg className="absolute left-2.5 top-2 text-[#535B71] pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <table className="w-full min-w-[520px]">
                  <thead className="sticky top-0 z-10 bg-[#12121a]">
                    <tr className="bg-[rgba(26,26,38,1)] border-b border-[rgba(50,50,77,0.3)]">
                      <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Usuario</th>
                      <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Rol</th>
                      <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Estado</th>
                      <th className="text-right px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.length === 0 ? (
                      <tr><td colSpan={4} className="text-[#797998] text-sm text-center py-8">Sin resultados</td></tr>
                    ) : (
                      usuariosFiltrados.map((u) => (
                        <tr key={u.id} className="border-t border-[rgba(50,50,77,0.15)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="bg-[#1e293b] w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                                <svg width="20" height="20" fill="none" stroke="#797998" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              </div>
                              <span className="text-white text-sm font-bold font-jakarta truncate">{u.nombre}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-[#797998] text-sm font-semibold font-jakarta">{u.rol}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {u.estado === "activo" ? (
                              <span className="bg-[rgba(34,197,94,0.1)] text-[#4ade80] text-[11px] font-bold px-2 py-0.5 rounded-md font-jakarta">Activo</span>
                            ) : (
                              <span className="bg-[rgba(239,68,68,0.1)] text-[#f87171] text-[11px] font-bold px-2 py-0.5 rounded-md font-jakarta">Baneado</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {u.estado === "activo" ? (
                                <button
                                  onClick={() => banearUsuario(u.id)}
                                  className="border border-[#797998] text-[#797998] text-[11px] font-bold px-2.5 py-1 rounded font-jakarta hover:bg-[#32324d] transition-colors"
                                >
                                  Banear
                                </button>
                              ) : (
                                <button
                                  onClick={() => activarUsuario(u.id)}
                                  className="border border-[#ef9918] text-[#ef9918] text-[11px] font-bold px-2.5 py-1 rounded font-jakarta hover:bg-[rgba(239,153,24,0.1)] transition-colors"
                                >
                                  Activar
                                </button>
                              )}
                              <button
                                onClick={() => pedirEliminarUsuario(u.id)}
                                className="border border-[rgba(127,29,29,0.5)] text-[#ef4444] text-[11px] font-bold px-2.5 py-1 rounded font-jakarta hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GESTIÃ“N DE PRODUCTOS */}
            <div className="bg-[#12121a] rounded-xl shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] overflow-hidden flex flex-col">
              <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-jakarta font-bold text-xl text-white">Gestión de Productos</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar Productos"
                    value={buscarProductos}
                    onChange={(e) => setBuscarProductos(e.target.value)}
                    className="bg-[#1a1a26] text-[#6b7280] text-sm rounded-full pl-8 pr-4 py-1.5 outline-none focus:ring-1 focus:ring-[#ef9918] w-36 sm:w-48"
                  />
                  <svg className="absolute left-2.5 top-2 text-[#535B71] pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                <table className="w-full min-w-[480px]">
                  <thead className="sticky top-0 z-10 bg-[#12121a]">
                    <tr className="bg-[rgba(26,26,38,1)] border-b border-[rgba(50,50,77,0.3)]">
                      <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Producto</th>
                      <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Vendedor</th>
                      <th className="text-right px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.length === 0 ? (
                      <tr><td colSpan={3} className="text-[#797998] text-sm text-center py-8">Sin resultados</td></tr>
                    ) : (
                      productosFiltrados.map((p) => (
                        <tr key={p.id} className="border-t border-[rgba(50,50,77,0.15)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="bg-[#1a1a26] border border-[rgba(30,41,59,0.5)] w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                                <svg width="22" height="22" fill="none" stroke="#797998" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24">
                                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" x2="21" y1="6" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-white text-sm font-bold font-jakarta truncate">{p.nombre}</p>
                                <p className="text-[#797998] text-xs">{p.precio}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-[#797998] text-sm font-semibold font-jakarta">{p.vendedor}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <button
                              onClick={() => pedirEliminarProducto(p.id)}
                              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[rgba(239,68,68,0.08)] transition-colors ml-auto"
                              title="Eliminar producto"
                            >
                              <svg width="18" height="18" fill="none" stroke="#7F1D1D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 20 20">
                                <polyline points="2.5 5 4.17 5 17.5 5" />
                                <path d="M15.83 5v11.67a1.67 1.67 0 0 1-1.66 1.66H5.83a1.67 1.67 0 0 1-1.66-1.66V5m2.5 0V3.33a1.67 1.67 0 0 1 1.66-1.66h3.34a1.67 1.67 0 0 1 1.66 1.66V5" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* GESTIÃ“N DE REPORTES */}
          <div className="bg-[#12121a] rounded-xl shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="p-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-jakarta font-bold text-xl text-white">Gestión de Reportes</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-2">
                  {["todo", "pendiente", "resuelto"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFiltroReporte(f)}
                      className={
                        "text-xs font-semibold px-4 py-1.5 rounded-full transition-all " +
                        (filtroReporte === f ? "bg-[#ef9918] text-[#12121a]" : "bg-[#32324d] text-[#c7c5d5]")
                      }
                    >
                      {f === "todo" ? "Todo" : f === "pendiente" ? "Pendiente" : "Resuelto"}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar Reportes"
                    value={buscarReportes}
                    onChange={(e) => setBuscarReportes(e.target.value)}
                    className="bg-[#1a1a26] text-[#6b7280] text-sm rounded-full pl-8 pr-4 py-1.5 outline-none focus:ring-1 focus:ring-[#ef9918] w-40 sm:w-52"
                  />
                  <svg className="absolute left-2.5 top-2 text-[#535B71] pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full min-w-[700px]">
                <thead className="sticky top-0 z-10 bg-[#12121a]">
                  <tr className="bg-[rgba(26,26,38,1)] border-b border-[rgba(50,50,77,0.3)]">
                    <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Tipo</th>
                    <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Reportado</th>
                    <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Reportado por</th>
                    <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Fecha</th>
                    <th className="text-left px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Estado</th>
                    <th className="text-right px-4 py-2.5 font-jakarta font-extrabold text-[#797998] text-xs tracking-widest uppercase whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reportesFiltrados.length === 0 ? (
                    <tr><td colSpan={6} className="text-[#797998] text-sm text-center py-8">Sin resultados</td></tr>
                  ) : (
                    reportesFiltrados.map((r) => (
                      <tr key={r.id} className="border-t border-[rgba(50,50,77,0.15)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.tipo === "usuario" ? (
                            <span className="border border-[rgba(127,29,29,0.5)] text-[#ef4444] text-[11px] font-bold px-2 py-0.5 rounded font-jakarta">Usuario</span>
                          ) : (
                            <span className="border border-[#5b5dff] text-[#5165f5] text-[11px] font-bold px-2 py-0.5 rounded font-jakarta">Producto</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-white text-sm font-bold font-jakarta">{r.reportado}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[#797998] text-sm font-semibold font-jakarta">{r.reportadoPor}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[#797998] text-sm">{r.fecha}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.estado === "resuelto" ? (
                            <span className="bg-[rgba(34,197,94,0.1)] text-[#4ade80] text-[11px] font-bold px-2.5 py-1 rounded-md font-jakarta">Resuelto</span>
                          ) : (
                            <span className="bg-[rgba(239,68,68,0.1)] text-[#f87171] text-[11px] font-bold px-2.5 py-1 rounded-md font-jakarta">Pendiente</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => abrirModalReporte(r.id, r.estado === "pendiente" ? "responder" : "ver")}
                            className="border border-[#797998] text-[#797998] text-[11px] font-bold px-3 py-1.5 rounded font-jakarta hover:bg-[#32324d] transition-colors"
                          >
                            {r.estado === "pendiente" ? "Responder" : "Ver"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* RE Modal de confirmacion para eliminar usuario */}
      {modalEliminarUsuario.abierto && (
        <AdminModalConfirmarEliminar
          tipo="Usuario"
          nombre={nombreParaConfirmarUsuario}
          onConfirmar={confirmarEliminarUsuario}
          onCancelar={cancelarEliminarUsuario}
        />
      )}

      {/* RE Modal de confirmacion para eliminar producto */}
      {modalEliminarProducto.abierto && (
        <AdminModalConfirmarEliminar
          tipo="Producto"
          nombre={nombreParaConfirmarProducto}
          onConfirmar={confirmarEliminarProducto}
          onCancelar={cancelarEliminarProducto}
        />
      )}

      {/* RE Modal de detalle de reporte */}
      {modalReporte.abierto && reporteActual && (
        <AdminModalReporte
          reporte={reporteActual}
          modo={modalReporte.modo}
          estaBaneado={estaBaneado(reporteActual.reportado)}
          usuarioEliminadoDesdeReporte={usuariosEliminadosDesdeReporte.has(reporteActual.reportado)}
          productoEliminadoDesdeReporte={productosEliminadosDesdeReporte.has(reporteActual.reportado)}
          onEnviarRespuesta={enviarRespuesta}
          onCerrar={cerrarModalReporte}
          onToggleBanear={toggleBanearDesdeReporte}
          onPedirEliminarUsuario={pedirEliminarUsuarioDesdeReporte}
          onPedirEliminarProducto={pedirEliminarProductoDesdeReporte}
        />
      )}
      {mostrarAjustes && <AjustesAdministrador onClose={() => setMostrarAjustes(false)} />}
    </div>
  );
}