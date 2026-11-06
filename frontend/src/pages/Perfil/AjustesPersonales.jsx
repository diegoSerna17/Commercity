import { useRef, useState } from "react";
import { actualizarPerfil } from "../../services/usuarios.service.js";
import { cardClass, inputClass, labelClass } from "./ajustesEstilos.js";
import AjustesToast from "./AjustesToast.jsx";

/**
 * Seccion "Informacion personal": nombre, descripcion y foto de perfil
 * (RF14-RF17, RF38). El correo es de solo lectura.
 */
export default function AjustesPersonales({
  perfilInicial,
  email,
  toast,
  showToast,
  onPerfilActualizado,
}) {
  const [usuario, setUsuario] = useState(perfilInicial?.nombre_completo || "");
  const [descripcion, setDescripcion] = useState(perfilInicial?.descripcion_personal || "");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(perfilInicial?.foto_perfil || "");
  const [guardando, setGuardando] = useState(false);
  const inputAvatarRef = useRef(null);

  function handleAvatarChange(event) {
    const archivo = event.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      showToast("Solo se permiten archivos de imagen.", true);
      event.target.value = "";
      return;
    }
    setAvatar(archivo);
    setAvatarPreview(URL.createObjectURL(archivo));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!usuario.trim()) {
      showToast("El nombre de perfil no puede estar vacio.", true);
      return;
    }

    setGuardando(true);
    try {
      const res = await actualizarPerfil(
        {
          nombre_completo: usuario.trim(),
          descripcion_personal: descripcion.trim(),
        },
        avatar
      );
      if (res.data) onPerfilActualizado(res.data);
      setAvatar(null);
      if (inputAvatarRef.current) inputAvatarRef.current.value = "";
      showToast("Perfil actualizado correctamente.");
    } catch (err) {
      showToast(err.message || "No se pudo actualizar el perfil.", true);
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
          Actualiza tu foto, tu nombre y tu descripcion.
        </p>
      </div>

      <AjustesToast toast={toast} />

      <div className={cardClass}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5 flex items-center gap-4">
            <img
              src={avatarPreview || "https://via.placeholder.com/80"}
              alt="Foto de perfil"
              className="h-20 w-20 rounded-full object-cover"
            />
            <div>
              <label className={labelClass} htmlFor="input-avatar">
                Foto de perfil
              </label>
              <input
                ref={inputAvatarRef}
                id="input-avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="text-body-sm text-brand-muted-text"
              />
            </div>
          </div>

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

          <div className="mb-5">
            <label className={labelClass} htmlFor="input-descripcion">
              Descripcion
            </label>
            <textarea
              id="input-descripcion"
              rows={3}
              maxLength={2000}
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Cuentanos un poco sobre ti"
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
