import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../../api/client.js";

/**
 * Guard de las rutas del panel de administracion.
 * Exige sesion con el rol "administrador" en el usuario guardado; si no se
 * cumple, redirige al inicio de sesion.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function RutaProtegidaAdmin({ children }) {
  const usuario = getCurrentUser();
  const esAdministrador =
    Array.isArray(usuario?.roles) && usuario.roles.includes("administrador");

  if (!usuario || !esAdministrador) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
