import { useFormularioProducto } from "./useFormularioProducto.js";

/**
 * Formulario de producto del vendedor (crear o editar). La logica de estado y
 * validacion vive en useFormularioProducto; este componente solo pinta.
 * @param {object} props
 * @param {Function} props.onCancel Cierra el formulario
 * @param {Function} props.onSubmit Recibe (datos, imagen) y llama a la API
 * @param {object|null} props.producto Producto a editar; null para crear
 */
export default function AgregarProducto({ onCancel, onSubmit, producto = null } = {}) {
  const {
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
  } = useFormularioProducto({ onSubmit, producto });

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
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1" htmlFor="producto-nombre">
                  Nombre del producto
                </label>
                <input
                  id="producto-nombre"
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
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1" htmlFor="imagen">
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
              <label className="block text-body-xs font-bold text-brand-muted-text mb-1" htmlFor="producto-descripcion">
                Descripcion completa
              </label>
              <textarea
                id="producto-descripcion"
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
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1" htmlFor="producto-precio">
                  Precio $
                </label>
                <input
                  id="producto-precio"
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
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1" htmlFor="producto-stock">
                  Stock
                </label>
                <input
                  id="producto-stock"
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
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1" htmlFor="producto-estado">
                  Estado
                </label>
                {/* El estado Disponible/Agotado lo calcula la base de datos segun el stock. */}
                <div className="relative">
                  <select
                    id="producto-estado"
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
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1" htmlFor="producto-descuento">
                  Descuento %
                </label>
                <input
                  id="producto-descuento"
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
                <label className="block text-body-xs font-bold text-brand-muted-text mb-1" htmlFor="producto-categoria">
                  Categoria
                </label>
                {errorCategorias ? (
                  <input
                    id="producto-categoria"
                    type="text"
                    placeholder="EJ: Ropa"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-input-bg border border-input-bg rounded-xl px-4 py-3 text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-border-focus transition-colors placeholder:text-brand-muted-text"
                  />
                ) : (
                  <div className="relative">
                    <select
                      id="producto-categoria"
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
                onClick={onCancel}
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
