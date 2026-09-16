import { Navigate } from "react-router-dom";
import { getToken, getCurrentUser } from "../../api/client.js";

/**
 * Guard de las rutas del panel de administracion.
 * Exige token guardado y el rol "administrador" en el usuario de la sesion;
 * si no se cumple, redirige al inicio de sesion.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function RutaProtegidaAdmin({ children }) {
  const token = getToken();
  const usuario = getCurrentUser();
  const esAdministrador =
    Array.isArray(usuario?.roles) && usuario.roles.includes("administrador");

  if (!token || !esAdministrador) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
