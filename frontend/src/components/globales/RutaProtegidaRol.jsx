import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  clearCurrentUser,
  getCurrentUser,
  setCurrentUser,
} from "../../api/client.js";
import { obtenerMiUsuario } from "../../services/usuarios.service.js";

/**
 * Guard de rutas por rol. Antes de renderizar confirma la sesion y los roles
 * contra GET /api/usuarios/me (la cookie httpOnly es la fuente de verdad) y
 * deja el usuario de la UI sincronizado. Exige que al menos uno de `roles`
 * coincida con los roles vigentes.
 * @param {{ roles: string[], children: import("react").ReactNode }} props
 */
export default function RutaProtegidaRol({ roles = [], children }) {
  const [verificacion, setVerificacion] = useState(() => ({
    estado: getCurrentUser() ? "verificando" : "anonimo",
    usuario: null,
  }));

  useEffect(() => {
    if (verificacion.estado !== "verificando") return undefined;
    let activo = true;

    const confirmar = async () => {
      try {
        const res = await obtenerMiUsuario();
        if (!activo) return;

        const usuario = res?.data ?? null;
        if (!usuario) {
          setVerificacion({ estado: "anonimo", usuario: null });
          return;
        }

        setCurrentUser(usuario);
        setVerificacion({ estado: "verificado", usuario });
      } catch (err) {
        if (!activo) return;

        if (err?.status === 401 || err?.status === 403) {
          clearCurrentUser();
          setVerificacion({ estado: "anonimo", usuario: null });
          return;
        }

        // Sin conexion con el backend se mantiene la sesion local para no
        // dejar inutil la interfaz; los datos reales se validan al consultarlos.
        setVerificacion({ estado: "verificado", usuario: getCurrentUser() });
      }
    };

    confirmar();

    return () => {
      activo = false;
    };
  }, [verificacion.estado]);

  if (verificacion.estado === "anonimo") {
    return <Navigate to="/login" replace />;
  }

  if (verificacion.estado === "verificando") {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-body-sm text-brand-muted-text">
        Verificando tu sesión...
      </div>
    );
  }

  const rolesUsuario = verificacion.usuario?.roles ?? [];
  const autorizado =
    roles.length === 0 || roles.some((rol) => rolesUsuario.includes(rol));

  if (!autorizado) {
    return <Navigate to="/" replace />;
  }

  return children;
}
