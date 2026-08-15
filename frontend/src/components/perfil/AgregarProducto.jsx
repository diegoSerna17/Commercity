import { useState, useRef } from "react";

function formatearPrecio(numero) {
  return numero.toLocaleString("es-CO");
}

function limpiarPrecio(valor) {
  const soloNumeros = (valor || "").replace(/\./g, "").replace(/[^0-9]/g, "");
  return soloNumeros === "" ? NaN : parseInt(soloNumeros, 10);
}

export default function AgregarProducto({ onCancel, onSubmit, producto = null } = {}) {
  const esEdicion = Boolean(producto);

  const [nombre, setNombre] = useState(producto?.name || "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion || "");
  const [precioTexto, setPrecioTexto] = useState(() => {
    if (!producto?.price) return "";
    const numero = limpiarPrecio(String(producto.price));
    return isNaN(numero) ? "" : formatearPrecio(numero);
  });
  const [stock, setStock] = useState(producto?.stock != null ? String(producto.stock) : "");
  const [estado, setEstado] = useState(producto?.estado || "disponible");
  const [descuento, setDescuento] = useState(() => {
    if (producto?.discount == null) return "";
    const numero = parseInt(String(producto.discount).replace(/[^0-9]/g, ""), 10);
    return isNaN(numero) ? "" : String(numero);
  });
  const [categoria, setCategoria] = useState(producto?.categoria || "");
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [imagenExistente, setImagenExistente] = useState(producto?.image || null);
  const inputImagenRef = useRef(null);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

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

    const imagenInvalida =
      !imagenExistente &&
      (!imagenArchivo || !imagenArchivo.type.startsWith("image/"));
    if (imagenInvalida) nuevosErrores.imagen = true;

    if (!descripcion.trim()) nuevosErrores.descripcion = true;

    const precio = limpiarPrecio(precioTexto);
    if (isNaN(precio) || precio < 0) nuevosErrores.precio = true;

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) nuevosErrores.stock = true;

    if (!categoria.trim()) nuevosErrores.categoria = true;

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validarFormulario()) return;

    const formData = new FormData();
    if (producto?.id != null) formData.append("id", String(producto.id));
    formData.append("nombre", nombre.trim());
    formData.append("descripcion", descripcion.trim());
    formData.append("precio", String(limpiarPrecio(precioTexto)));
    formData.append("stock", String(parseInt(stock, 10)));
    formData.append("estado", estado);
    formData.append("descuento", String(descuento !== "" ? parseFloat(descuento) : 0));
    formData.append("categoria", categoria.trim());
    if (imagenArchivo) formData.append("imagen", imagenArchivo);

    try {
      setEnviando(true);
      if (onSubmit) {
        await onSubmit(formData);
      }
      resetForm();
    } finally {
      setEnviando(false);
    }
  }

  function resetForm() {
    setNombre("");
    setDescripcion("");
    setPrecioTexto("");
    setStock("");
    setEstado("disponible");
    setDescuento("");
    setCategoria("");
    setImagenArchivo(null);
    setImagenExistente(null);
    if (inputImagenRef.current) inputImagenRef.current.value = "";
    setErrores({});
  }

  function handleCancelar() {
    if (onCancel) onCancel();
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm drawer-backdrop"
        onClick={handleCancelar}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-[480px] bg-surface-container-lowest shadow-2xl border-l border-border-subtle overflow-y-auto drawer-panel">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 p-padding-md bg-surface-container-lowest border-b border-border-subtle">
          <h1 className="text-headline-sm font-bold text-on-surface">
            {esEdicion ? "Editar Producto" : "Agregar Producto"}
          </h1>
          <button
            type="button"
            onClick={handleCancelar}
            title="Cerrar"
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4l-6.3 6.3-1.42-1.41L9.17 12 2.87 5.71 4.29 4.29l6.3 6.3 6.3-6.3 1.41 1.42Z" />
            </svg>
          </button>
        </div>

        <div className="p-padding-md">
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
                      : imagenExistente
                      ? "✓ Imagen actual"
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
                <input
                  type="text"
                  placeholder="EJ: Ropa"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-input-bg border border-input-bg rounded-xl px-4 py-3 text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-border-focus transition-colors placeholder:text-brand-muted-text"
                />
                {errores.categoria && (
                  <p className="text-error text-body-xs mt-1">Campo requerido</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-padding-md">
              <button
                type="button"
                onClick={handleCancelar}
                className="flex-1 h-[44px] bg-surface-container-high border border-border-subtle rounded-button text-body-sm font-bold text-brand-muted-text hover:bg-surface-container-highest transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 h-[44px] bg-gradient-to-r from-brand-orange to-tertiary-container rounded-button text-body-sm font-bold text-brand-dark-text hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {enviando ? "Guardando..." : esEdicion ? "Guardar Cambios" : "Agregar Producto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}