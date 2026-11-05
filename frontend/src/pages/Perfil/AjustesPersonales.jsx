import { useState } from "react";
import { actualizarPerfil } from "../../services/usuarios.service.js";
import {
  cardClass,
  inputClass,
  labelClass,
} from "./ajustesEstilos.js";
import AjustesToast from "./AjustesToast.jsx";

/**
 * Seccion "Informacion personal": nombre de perfil editable y correo de solo
 * lectura. Conserva los ids que usan las pruebas y el resto de la app.
 */
export default function AjustesPersonales({
  nombreInicial,
  email,
  toast,
  showToast,
  onNombreActualizado,
}) {
  const [usuario, setUsuario] = useState(nombreInicial || "");
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!usuario.trim()) {
      showToast("El nombre de perfil no puede estar vacio.", true);
      return;
    }

    setGuardando(true);
    try {
      const res = await actualizarPerfil(usuario.trim());
      if (res.data?.nombre_completo) {
        onNombreActualizado(res.data.nombre_completo);
      }
      showToast("Nombre actualizado correctamente.");
    } catch (err) {
      showToast(err.message || "No se pudo actualizar el nombre.", true);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <div className="mb-padding-lg">
        <h2 className="text-headline-sm font-bold text-on-surface">
          Informacion personal
        </h2>
        <p className="text-brand-muted-text text-body-sm font-medium mt-1">
          Actualiza tu usuario y correo electronico.
        </p>
      </div>

      <AjustesToast toast={toast} />

      <div className={cardClass}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label className={labelClass} htmlFor="input-usuario">
              Nombre de perfil
            </label>
            <input
              id="input-usuario"
              type="text"
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="mb-6">
            <label className={labelClass} htmlFor="input-email">
              Correo electronico
            </label>
            <input
              id="input-email"
              type="email"
              value={email}
              disabled
              className={`${inputClass} opacity-60 cursor-not-allowed`}
            />
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-button bg-gradient-to-r from-brand-orange to-tertiary-container px-6 py-3 text-body-sm font-bold text-brand-dark-text transition hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </div>
    </>
  );
}
