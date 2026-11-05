import { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "../../api/client.js";
import { AVATAR_COLOR, BIO_MAX_LENGTH } from "./perfilConstantes.js";
import {
  AVATAR_POR_DEFECTO,
  mapearProducto,
  resolverUrlArchivo,
} from "../../utils/mapearProducto.js";
import {
  actualizarProducto,
  crearProducto,
  listarMisProductos,
} from "../../services/productos.service.js";
import { listarSeguidores, listarSiguiendo } from "../../services/seguidores.service.js";

/**
 * Extrae la lista de productos de la respuesta de /api/productos/mis-productos,
 * que puede venir como array directo o envuelta en la propiedad productos.
 * @param {object|null|undefined} respuesta
 * @returns {Array<object>}
 */
function extraerListaProductos(respuesta) {
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  return respuesta?.data?.productos ?? [];
}

/**
 * Traduce un usuario de la API de seguidores al shape del SeguidoresModal.
 * @param {{id: number, nombre_completo: string, foto_perfil: string|null}} usuario
 */
function mapearUsuarioSocial(usuario) {
  const nombreCompleto = (usuario.nombre_completo || "").trim();
  const primerNombre = nombreCompleto.split(/\s+/)[0] || "";

  return {
    id: usuario.id,
    nombre: nombreCompleto || "Usuario",
    usuario: "@" + primerNombre.toLowerCase(),
    avatar: resolverUrlArchivo(usuario.foto_perfil),
    inicial: (nombreCompleto.charAt(0) || "U").toUpperCase(),
    color: AVATAR_COLOR,
  };
}

/**
 * Estado y acciones del perfil del vendedor autenticado: catalogo propio,
 * relaciones sociales, edicion de avatar y biografia (en memoria) y modales.
 */
export function usePerfilVendedor() {
  const currentUser = getCurrentUser();
  const nombrePerfil = currentUser?.nombre_completo || "Usuario";
  const [productos, setProductos] = useState([]);
  const [seguidores, setSeguidores] = useState([]);
  const [siguiendo, setSiguiendo] = useState([]);
  const [activeTab, setActiveTab] = useState("mis-productos");
  const [bioText, setBioText] = useState(
    'Me gusta encontrar productos de buena calidad y apoyar tiendas con excelente atención. Siempre busco compras con buenas recomendaciones."'
  );
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [avatarSrc, setAvatarSrc] = useState(
    () => resolverUrlArchivo(currentUser?.foto_perfil) ?? AVATAR_POR_DEFECTO
  );
  const [avatarError, setAvatarError] = useState(false);
  const [avisoAvatar, setAvisoAvatar] = useState("");
  const [avisoBio, setAvisoBio] = useState("");
  const [brokenImages, setBrokenImages] = useState({});
  const [mostrarAgregarProducto, setMostrarAgregarProducto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);
  const [mostrarSeguidores, setMostrarSeguidores] = useState(false);
  // Pestana con la que se abre el modal de seguidores: "seguidores" (quienes me
  // siguen) o "siguiendo" (a quienes sigo). Sin esto, los dos contadores abrian
  // siempre la misma pestana.
  const [tabInicialSeguidores, setTabInicialSeguidores] = useState("seguidores");

  const avatarInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    let activo = true;

    /**
     * Carga en paralelo los productos y las relaciones sociales del vendedor
     * autenticado. Si una peticion falla se registra el error y esa lista
     * queda vacia, de modo que el perfil siga visible.
     */
    const cargarDatosPerfil = async () => {
      const [resProductos, resSiguiendo, resSeguidores] = await Promise.all([
        listarMisProductos().catch(() => {
          // La lista queda vacia; el perfil sigue visible con el resto de datos.
          return null;
        }),
        listarSiguiendo().catch(() => {
          // La lista queda vacia; no se bloquea el perfil por una relacion social.
          return null;
        }),
        listarSeguidores().catch(() => {
          // La lista queda vacia; no se bloquea el perfil por una relacion social.
          return null;
        }),
      ]);

      if (!activo) return;

      const listaProductos = extraerListaProductos(resProductos);
      const listaSiguiendo = Array.isArray(resSiguiendo?.data)
        ? resSiguiendo.data
        : [];
      const listaSeguidores = Array.isArray(resSeguidores?.data)
        ? resSeguidores.data
        : [];

      setProductos(listaProductos.map(mapearProducto));
      setSiguiendo(listaSiguiendo.map(mapearUsuarioSocial));
      setSeguidores(listaSeguidores.map(mapearUsuarioSocial));
    };

    cargarDatosPerfil();

    return () => {
      activo = false;
    };
  }, []);

  const isMisProductos = activeTab === "mis-productos";

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setAvisoAvatar("Por favor selecciona un archivo de imagen.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarError(false);
      setAvatarSrc(ev.target.result);
      setAvisoAvatar("Vista previa: aún no se guarda en tu cuenta.");
    };
    reader.readAsDataURL(file);
  };

  const editBio = () => {
    setBioDraft(bioText);
    setIsEditingBio(true);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  const cancelEditBio = () => setIsEditingBio(false);

  const saveBio = () => {
    setBioText(bioDraft.trim().slice(0, BIO_MAX_LENGTH));
    setIsEditingBio(false);
    setAvisoBio("Vista previa: aún no se guarda en tu cuenta.");
  };

  /**
   * Abre el modal de seguidores en la pestana que corresponde al contador
   * pulsado: "seguidores" para quienes me siguen y "siguiendo" para los que sigo.
   * @param {"seguidores"|"siguiendo"} tab
   */
  const abrirSeguidores = (tab) => {
    setTabInicialSeguidores(tab);
    setMostrarSeguidores(true);
  };

  const recargarSeguidores = async () => {
    const [resSiguiendo, resSeguidores] = await Promise.all([
      listarSiguiendo(),
      listarSeguidores(),
    ]);

    setSiguiendo(
      (Array.isArray(resSiguiendo?.data) ? resSiguiendo.data : []).map(mapearUsuarioSocial)
    );
    setSeguidores(
      (Array.isArray(resSeguidores?.data) ? resSeguidores.data : []).map(mapearUsuarioSocial)
    );
  };

  /**
   * Recarga los productos propios del vendedor desde la API (RF54)
   * y actualiza la grilla con los datos reales del backend.
   */
  const recargarProductos = async () => {
    const respuesta = await listarMisProductos();
    setProductos(extraerListaProductos(respuesta).map(mapearProducto));
  };

  /**
   * Crea el producto en la API (POST /api/productos, RF45/RF46/RF48) y
   * recarga la lista real de productos propios.
   * @param {object} datos Campos del producto
   * @param {File} imagen Imagen seleccionada
   */
  const handleAgregarProducto = async (datos, imagen) => {
    const respuesta = await crearProducto(datos, imagen);
    await recargarProductos();
    return respuesta;
  };

  /**
   * Actualiza el producto en edicion (PUT /api/productos/:id, RF49) y
   * recarga la lista real de productos propios.
   * @param {object} datos Campos modificados
   * @param {File|null} imagen Nueva imagen (opcional)
   */
  const handleActualizarProducto = async (datos, imagen) => {
    const respuesta = await actualizarProducto(productoEnEdicion.id, datos, imagen);
    await recargarProductos();
    return respuesta;
  };

  return {
    nombrePerfil,
    productos,
    seguidores,
    siguiendo,
    activeTab,
    setActiveTab,
    isMisProductos,
    bioText,
    isEditingBio,
    bioDraft,
    setBioDraft,
    editBio,
    cancelEditBio,
    saveBio,
    avisoBio,
    avatarSrc,
    avatarError,
    setAvatarError,
    avisoAvatar,
    handleAvatarChange,
    avatarInputRef,
    textareaRef,
    brokenImages,
    setBrokenImages,
    mostrarAgregarProducto,
    setMostrarAgregarProducto,
    productoEnEdicion,
    setProductoEnEdicion,
    mostrarSeguidores,
    setMostrarSeguidores,
    tabInicialSeguidores,
    abrirSeguidores,
    recargarSeguidores,
    handleAgregarProducto,
    handleActualizarProducto,
  };
}
