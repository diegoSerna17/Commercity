import { useEffect, useRef, useState } from "react";
import { listarCategorias } from "../../services/productos.service.js";

function formatearPrecio(numero) {
  return numero.toLocaleString("es-CO");
}

function limpiarPrecio(valor) {
  const soloNumeros = (valor || "").replace(/\./g, "").replace(/[^0-9]/g, "");
  return soloNumeros === "" ? NaN : parseInt(soloNumeros, 10);
}

/**
 * Valores iniciales del formulario.
 * @param {object|null} producto Producto a editar (null al crear)
 * @returns {{nombre: string, descripcion: string, precioTexto: string, stock: string, descuento: string, categoria: string}}
 */
function valoresIniciales(producto) {
  return {
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    precioTexto:
      producto?.precio != null
        ? formatearPrecio(Math.round(Number(producto.precio)))
        : "",
    stock: producto?.stock != null ? String(producto.stock) : "",
    descuento: producto?.descuento_porcentaje
      ? String(producto.descuento_porcentaje)
      : "",
    categoria: producto?.categoria_nombre ?? "",
  };
}

/**
 * Formulario de producto del vendedor (crear o editar).
 * Carga las categorias reales, valida los campos que exige el backend y
 * muestra el estado de envio, el error del backend y el mensaje de exito.
 * @param {object} props
 * @param {Function} props.onCancel Cierra el formulario
 * @param {Function} props.onSubmit Recibe (datos, imagen) y llama a la API
 * @param {object|null} props.producto Producto a editar; null para crear
 */
export default function AgregarProducto({ onCancel, onSubmit, producto = null } = {}) {
  const esEdicion = Boolean(producto);
  const inicial = valoresIniciales(producto);

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

  function handlePrecioChange(e) {
    const cursorAlFinal = e.target.selectionEnd === e.target.value.length;
    const numero = limpiarPrecio(e.target.value);

    if (isNaN(numero)) {
      setPrecioTexto("");
      return;
    }

    setPrecioTexto(formatearPrecio(numero));

    if (cursorAlFinal) {
      requestAnimationFrame(() => {
        const input = e.target;
        input.setSelectionRange(input.value.length, input.value.length);
      });
    }
  }

  function handleImagenChange(e) {
    const archivo = e.target.files[0];

    if (!archivo) {
      setImagenArchivo(null);
      mostrarError("imagen", false);
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      e.target.value = "";
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
    if (isNaN(precio) || precio <= 0) nuevosErrores.precio = true;

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) nuevosErrores.stock = true;

    if (!categoria.trim()) nuevosErrores.categoria = true;

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
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

  function resetForm() {
    const base = valoresIniciales(producto);
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

  function handleCancelar() {
    if (onCancel) onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-hero shadow-2xl w-full max-w-[620px] max-h-[90vh] overflow-y-auto">
        <div className="p-padding-xl">
          <h1 className="text-headline-sm font-bold text-on-surface mb-padding-md">
            {esEdicion ? "Editar Producto" : "Agregar Producto"}
          </h1>

          <form onSubmit={handleSubmit} noValidate className="space-y-padding-md">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-input-bg border border-input-bg rounded-xl px-4 py-3 text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-border-focus transition-colors"
                />
                {errores.nombre && (
                  <p className="text-error text-body-xs mt-1">Campo requerido</p>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1">
                  Imagen
                </label>
                <label
                  htmlFor="imagen"
                  className="flex items-center justify-center w-full h-[44px] bg-surface-container border border-border-subtle rounded-xl cursor-pointer text-body-sm text-brand-muted-text hover:border-brand-orange transition select-none px-2 text-center"
                >
                  <span>
                    {imagenArchivo
                      ? "✓ Imagen cargada"
                      : esEdicion
                        ? "+ Cambiar imagen"
                        : "+ Cargar imagen"}
                  </span>
                </label>
                <input
                  ref={inputImagenRef}
                  id="imagen"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagenChange}
                />
                {errores.imagen && (
                  <p className="text-error text-body-xs mt-1">
                    {imagenArchivo
                      ? "Solo se permiten archivos de imagen"
                      : "Selecciona una imagen"}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-body-xs font-bold text-brand-muted-text mb-1">
                Descripcion completa
              </label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full bg-input-bg border border-input-bg rounded-xl px-4 py-3 text-body-sm text-on-surface outline-none resize-none focus:ring-2 focus:ring-border-focus transition-colors"
              />
              {errores.descripcion && (
                <p className="text-error text-body-xs mt-1">Campo requerido</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1">
                  Precio $
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={precioTexto}
                  onChange={handlePrecioChange}
                  placeholder="0"
                  className="w-full bg-input-bg border border-input-bg rounded-xl px-4 py-3 text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-border-focus transition-colors"
                />
                {errores.precio && (
                  <p className="text-error text-body-xs mt-1">Ingresa un precio válido</p>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="w-full bg-input-bg border border-input-bg rounded-xl px-4 py-3 text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-border-focus transition-colors"
                />
                {errores.stock && (
                  <p className="text-error text-body-xs mt-1">Ingresa un stock válido</p>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1">
                  Estado
                </label>
                {/* El estado Disponible/Agotado lo calcula la base de datos segun el stock. */}
                <div className="relative">
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full bg-input-bg border border-input-bg rounded-xl px-4 py-3 pr-10 text-body-sm text-on-surface outline-none appearance-none focus:ring-2 focus:ring-border-focus transition-colors cursor-pointer"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="agotado">Agotado</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted-text text-lg">
                    ˅
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1">
                  Descuento %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                  placeholder="0"
                  className="w-full bg-input-bg border border-input-bg rounded-xl px-4 py-3 text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-border-focus transition-colors"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1">
                  Categoria
                </label>
                {errorCategorias ? (
                  <input
                    type="text"
                    placeholder="EJ: Ropa"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-input-bg border border-input-bg rounded-xl px-4 py-3 text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-border-focus transition-colors placeholder:text-brand-muted-text"
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      disabled={cargandoCategorias}
                      className="w-full bg-input-bg border border-input-bg rounded-xl px-4 py-3 pr-10 text-body-sm text-on-surface outline-none appearance-none focus:ring-2 focus:ring-border-focus transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <option value="">
                        {cargandoCategorias ? "Cargando..." : "Selecciona una categoria"}
                      </option>
                      {opcionesCategoria.map((c) => (
                        <option key={c.id} value={c.nombre}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted-text text-lg">
                      ˅
                    </span>
                  </div>
                )}
                {errores.categoria && (
                  <p className="text-error text-body-xs mt-1">Campo requerido</p>
                )}
              </div>
            </div>

            {mensajeError && (
              <div className="rounded-xl border border-error/40 px-4 py-3">
                <p className="text-error text-body-xs">{mensajeError}</p>
              </div>
            )}

            {mensajeExito && (
              <div className="rounded-xl border border-border-subtle px-4 py-3">
                <p
                  className="text-body-xs font-bold"
                  style={{ color: "var(--color-brand-orange)" }}
                >
                  {mensajeExito}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-padding-md">
              <button
                type="button"
                onClick={handleCancelar}
                className="flex-1 h-[44px] bg-surface-container-high border border-border-subtle rounded-button text-body-sm font-bold text-brand-muted-text hover:bg-surface-container-highest transition-colors"
              >
                {mensajeExito ? "Cerrar" : "Cancelar"}
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 h-[44px] bg-gradient-to-r from-brand-orange to-tertiary-container rounded-button text-body-sm font-bold text-brand-dark-text hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {enviando
                  ? "Guardando..."
                  : esEdicion
                    ? "Guardar Cambios"
                    : "Agregar Producto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
