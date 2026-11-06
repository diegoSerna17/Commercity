import { useEffect, useRef, useState } from "react";
import { listarCategorias } from "../../services/productos.service.js";
import { formatNumber } from "../../utils/formatPrice.js";
import {
  limpiarPrecio,
  valoresInicialesProducto,
} from "../../utils/precioProducto.js";

/**
 * Estado y acciones del formulario de producto del vendedor (crear o editar):
 * campos, categorias reales, validacion, envio y reset.
 * @param {{ onSubmit?: Function, producto?: object|null }} opciones
 */
export function useFormularioProducto({ onSubmit, producto = null } = {}) {
  const esEdicion = Boolean(producto);
  const inicial = valoresInicialesProducto(producto);

  const [nombre, setNombre] = useState(inicial.nombre);
  const [descripcion, setDescripcion] = useState(inicial.descripcion);
  const [precioTexto, setPrecioTexto] = useState(inicial.precioTexto);
  const [stock, setStock] = useState(inicial.stock);
  const [estado, setEstado] = useState("disponible");
  const [descuento, setDescuento] = useState(inicial.descuento);
  const [categoria, setCategoria] = useState(inicial.categoria);
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [errorCategorias, setErrorCategorias] = useState(false);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const inputImagenRef = useRef(null);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  // Categorias reales del backend para el selector (GET /api/categorias).
  useEffect(() => {
    let activo = true;

    listarCategorias()
      .then((respuesta) => {
        if (!activo) return;
        setCategorias(Array.isArray(respuesta?.data) ? respuesta.data : []);
      })
      .catch(() => {
        if (activo) setErrorCategorias(true);
      })
      .finally(() => {
        if (activo) setCargandoCategorias(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  // Si el producto se edita y su categoria no esta en la lista activa, se agrega.
  const opcionesCategoria =
    categoria && !categorias.some((c) => c.nombre === categoria)
      ? [{ id: "actual", nombre: categoria }, ...categorias]
      : categorias;

  function mostrarError(campo, mostrar) {
    setErrores((prev) => ({ ...prev, [campo]: mostrar }));
  }

  function handlePrecioChange(event) {
    const cursorAlFinal = event.target.selectionEnd === event.target.value.length;
    const numero = limpiarPrecio(event.target.value);

    if (Number.isNaN(numero)) {
      setPrecioTexto("");
      return;
    }

    setPrecioTexto(formatNumber(numero));

    if (cursorAlFinal) {
      requestAnimationFrame(() => {
        const input = event.target;
        input.setSelectionRange(input.value.length, input.value.length);
      });
    }
  }

  function handleImagenChange(event) {
    const archivo = event.target.files[0];

    if (!archivo) {
      setImagenArchivo(null);
      mostrarError("imagen", false);
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      event.target.value = "";
      setImagenArchivo(null);
      mostrarError("imagen", true);
      return;
    }

    setImagenArchivo(archivo);
    mostrarError("imagen", false);
  }

  function validarFormulario() {
    const nuevosErrores = {};

    if (!nombre.trim()) nuevosErrores.nombre = true;

    // Al crear la imagen es obligatoria; al editar se conserva la actual.
    const imagenInvalida = imagenArchivo
      ? !imagenArchivo.type.startsWith("image/")
      : !esEdicion;
    if (imagenInvalida) nuevosErrores.imagen = true;

    if (!descripcion.trim()) nuevosErrores.descripcion = true;

    const precio = limpiarPrecio(precioTexto);
    if (Number.isNaN(precio) || precio <= 0) nuevosErrores.precio = true;

    const stockNum = parseInt(stock, 10);
    if (Number.isNaN(stockNum) || stockNum < 0) nuevosErrores.stock = true;

    if (!categoria.trim()) nuevosErrores.categoria = true;

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  function resetForm() {
    const base = valoresInicialesProducto(producto);
    setNombre(base.nombre);
    setDescripcion(base.descripcion);
    setPrecioTexto(base.precioTexto);
    setStock(base.stock);
    setEstado("disponible");
    setDescuento(base.descuento);
    setCategoria(base.categoria);
    setImagenArchivo(null);
    if (inputImagenRef.current) inputImagenRef.current.value = "";
    setErrores({});
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMensajeError("");
    setMensajeExito("");
    if (!validarFormulario()) return;

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: limpiarPrecio(precioTexto),
      stock: parseInt(stock, 10),
      categoria: categoria.trim(),
      descuento: descuento !== "" ? parseFloat(descuento) : 0,
    };

    try {
      setEnviando(true);
      const respuesta = await onSubmit?.(datos, imagenArchivo);
      setMensajeExito(
        respuesta?.data?.mensaje ||
          (esEdicion
            ? "Producto actualizado exitosamente"
            : "Producto creado exitosamente")
      );
      resetForm();
    } catch (error) {
      setMensajeError(error?.message || "No se pudo guardar el producto");
    } finally {
      setEnviando(false);
    }
  }

  return {
    esEdicion,
    nombre,
    setNombre,
    descripcion,
    setDescripcion,
    precioTexto,
    handlePrecioChange,
    stock,
    setStock,
    estado,
    setEstado,
    descuento,
    setDescuento,
    categoria,
    setCategoria,
    opcionesCategoria,
    cargandoCategorias,
    errorCategorias,
    inputImagenRef,
    handleImagenChange,
    imagenArchivo,
    errores,
    enviando,
    mensajeError,
    mensajeExito,
    handleSubmit,
  };
}
