import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../../api/client.js";

/**
 * Guard de rutas que exigen sesion (cualquier rol).
 * La cookie httpOnly es la que autentica; aqui solo se comprueba que la UI
 * tenga datos de usuario guardados.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function RutaProtegida({ children }) {
  if (!getCurrentUser()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
