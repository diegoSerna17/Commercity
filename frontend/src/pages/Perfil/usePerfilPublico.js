import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../api/client.js";
import { obtenerPerfilPublico } from "../../services/perfil.service.js";
import { listarProductos, listarVendedores } from "../../services/productos.service.js";
import {
  contarSeguidores,
  dejarDeSeguir,
  listarSiguiendo,
  seguirUsuario,
} from "../../services/seguidores.service.js";
import { mapearProducto, resolverAvatar } from "../../utils/mapearProducto.js";

/**
 * Datos y acciones del perfil publico de un vendedor (RF110/RF106):
 * perfil, productos, contadores, estado de seguimiento y reporte.
 * @param {number|string} id id del vendedor en la URL
 * @param {{nombre?: string, avatar?: string}} state state de navegacion
 */
export function usePerfilPublico(id, state = {}) {
  const navigate = useNavigate();
  const [vendedor, setVendedor] = useState({
    id: Number(id),
    nombre: state.nombre || "",
    avatar: resolverAvatar(state.avatar),
  });
  const [productos, setProductos] = useState([]);
  const [contadores, setContadores] = useState({ seguidores: 0, siguiendo: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [siguiendo, setSiguiendo] = useState(false);
  const [cargandoSeguimiento, setCargandoSeguimiento] = useState(false);
  const [reportarAbierto, setReportarAbierto] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        // Perfil publico real (RF110). El state de navegacion solo acelera el
        // primer render; la fuente de verdad es GET /api/usuarios/perfil-publico/:id.
        let nombre = state.nombre || "";
        let avatar = resolverAvatar(state.avatar);

        try {
          const perfil = await obtenerPerfilPublico(id);
          nombre = perfil?.data?.nombre || nombre || "Vendedor";
          avatar = resolverAvatar(perfil?.data?.avatar || state.avatar);
        } catch (err) {
          // Compatibilidad: si la ruta publica falla, se intenta el listado.
          if (!nombre) {
            const res = await listarVendedores({ limit: 100 });
            const lista = Array.isArray(res?.data) ? res.data : [];
            const encontrado = lista.find((v) => Number(v.id) === Number(id));
            nombre = encontrado?.nombre || "Vendedor";
          }
          if (err?.status === 404 && !state.nombre) {
            throw new Error("Vendedor no encontrado");
          }
        }

        if (!activo) return;
        setVendedor({ id: Number(id), nombre, avatar });

        // Lista los productos en venta del vendedor (M-20: filtro exacto por vendedor_id).
        const resProductos = await listarProductos({ vendedorId: id, limit: 100 });
        const data = resProductos?.data || {};
        if (!activo) return;
        setProductos((data.productos || []).map(mapearProducto));
      } catch (err) {
        if (!activo) return;
        setError(err.message || "No se pudo cargar el perfil del vendedor");
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();

    // Contadores de seguidores/seguidos (no bloquean la carga de productos).
    contarSeguidores(Number(id))
      .then((res) => {
        if (!activo) return;
        setContadores({
          seguidores: res?.data?.seguidores ?? 0,
          siguiendo: res?.data?.siguiendo ?? 0,
        });
      })
      .catch(() => {
        // silencio: si falla, los contadores quedan en 0
      });

    // M-21: el estado de seguimiento es del usuario autenticado; sin sesion
    // no se consulta la API (evita el 401 anonimo).
    if (getCurrentUser()) {
      listarSiguiendo()
        .then((res) => {
          if (!activo) return;
          const lista = Array.isArray(res?.data) ? res.data : [];
          setSiguiendo(lista.some((u) => Number(u.id) === Number(id)));
        })
        .catch(() => {
          // silencio: error de red, se muestra como no seguido
        });
    }

    return () => {
      activo = false;
    };
  }, [id, state.nombre, state.avatar]);

  // Abre la conversacion con el vendedor (mismo flujo que Mensajes.jsx).
  const enviarMensaje = () => {
    const usuarioActual = getCurrentUser();
    if (!usuarioActual) {
      navigate("/login");
      return;
    }
    sessionStorage.setItem(
      "activeChat",
      JSON.stringify({
        id: vendedor.id,
        name: vendedor.nombre,
        avatar: vendedor.avatar || "",
      })
    );
    navigate("/messages/chat");
  };

  // Alterna entre seguir y dejar de seguir al vendedor (RF106).
  const alternarSeguimiento = async () => {
    const usuarioActual = getCurrentUser();
    if (!usuarioActual) {
      navigate("/login");
      return;
    }
    if (cargandoSeguimiento) return;

    setCargandoSeguimiento(true);
    try {
      if (siguiendo) {
        try {
          await dejarDeSeguir(vendedor.id);
        } catch (err) {
          if (err.status !== 404) throw err;
        }
        setSiguiendo(false);
        setContadores((prev) => ({
          ...prev,
          seguidores: Math.max(0, prev.seguidores - 1),
        }));
      } else {
        try {
          await seguirUsuario(vendedor.id);
        } catch (err) {
          if (err.status !== 409) throw err;
        }
        setSiguiendo(true);
        setContadores((prev) => ({
          ...prev,
          seguidores: prev.seguidores + 1,
        }));
      }
    } catch {
      // silencio: el boton conserva su estado previo
    } finally {
      setCargandoSeguimiento(false);
    }
  };

  const usuarioActual = getCurrentUser();
  const esPerfilPropio =
    Boolean(usuarioActual) && Number(usuarioActual.id) === vendedor.id;

  return {
    vendedor,
    productos,
    contadores,
    cargando,
    error,
    siguiendo,
    cargandoSeguimiento,
    reportarAbierto,
    setReportarAbierto,
    esPerfilPropio,
    enviarMensaje,
    alternarSeguimiento,
  };
}
