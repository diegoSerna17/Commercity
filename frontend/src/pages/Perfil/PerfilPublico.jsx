import Header from "../../components/globales/Header";
import ReportarUsuario from "../../components/perfil/ReportarUsuario.jsx";
import { useParams, useLocation } from "react-router-dom";
import { usePerfilPublico } from "./usePerfilPublico.js";
import PerfilPublicoHeader from "./PerfilPublicoHeader.jsx";
import PerfilPublicoProductos from "./PerfilPublicoProductos.jsx";

/**
 * Perfil publico de un vendedor (accesible desde el producto).
 * Misma estructura visual que PerfilVendedor, pero sin edicion: en lugar del
 * boton "Agregar Producto" muestra "Enviar mensaje" y lista los productos en
 * venta del vendedor con el mismo diseño/animaciones de la pagina principal.
 */
export default function PerfilPublico() {
  const { id } = useParams();
  const location = useLocation();
  const state = location.state || {};
  const {
    vendedor,
    productos,
    contadores,
    cargando,
    error,
    siguiendo,
    cargandoSeguimiento,
    reportarAbierto,
    setReportarAbierto,
    esPerfilPropio,
    enviarMensaje,
    alternarSeguimiento,
  } = usePerfilPublico(id, state);

  return (
    <div
      className="flex-1 flex flex-col min-w-0 overflow-y-auto"
      style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
    >
      <Header title="Vendedor" showSearch={false} />

      <main
        className="flex-1 px-4 sm:px-6 lg:px-10 py-6 md:py-10 mx-auto w-full overflow-y-auto"
        style={{ maxWidth: "1200px" }}
      >
        <PerfilPublicoHeader
          vendedor={vendedor}
          contadores={contadores}
          productos={productos}
          siguiendo={siguiendo}
          cargandoSeguimiento={cargandoSeguimiento}
          esPerfilPropio={esPerfilPropio}
          onAlternarSeguimiento={alternarSeguimiento}
          onEnviarMensaje={enviarMensaje}
          onReportar={() => setReportarAbierto(true)}
        />

        <PerfilPublicoProductos
          cargando={cargando}
          error={error}
          productos={productos}
        />
      </main>

      {reportarAbierto && (
        <ReportarUsuario
          usuario={{ id: vendedor.id, nombre: vendedor.nombre }}
          onClose={() => setReportarAbierto(false)}
        />
      )}
    </div>
  );
}
