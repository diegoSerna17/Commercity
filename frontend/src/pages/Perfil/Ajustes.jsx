import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/globales/Header";
import { getCurrentUser, setCurrentUser, clearCurrentUser } from "../../api/client.js";
import { cambiarRol, eliminarCuenta } from "../../services/usuarios.service.js";
import { obtenerTemaGuardado, guardarTema } from "../../utils/tema.js";
import { useToast } from "../../hooks/useToast.js";
import AjustesPersonales from "./AjustesPersonales.jsx";
import AjustesTema from "./AjustesTema.jsx";
import AjustesDireccion from "./AjustesDireccion.jsx";
import AjustesRol from "./AjustesRol.jsx";
import AjustesCuenta from "./AjustesCuenta.jsx";
import { sectionDivider } from "./ajustesEstilos.js";
import Modal from "../../components/globales/Modal.jsx";

/**
 * Pagina de Ajustes: contenedor de las cinco secciones (personal, tema,
 * direccion, rol y cuenta) y de los dos modales de confirmacion.
 */
export default function Ajustes() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [roles, setRoles] = useState(currentUser?.roles || []);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalRol, setModalRol] = useState(false);
  const [enviandoRol, setEnviandoRol] = useState(false);
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);
  const [tema, setTema] = useState(() => obtenerTemaGuardado());

  // RE Avisos de las acciones que se confirman en los modales.
  const { toast: toastPersonal, showToast: showToastPersonal } = useToast(3500);

  // JS Rol actual y rol destino del cambio (el backend solo acepta comprador/vendedor)
  const esVendedor = roles.includes("vendedor");
  const rolDestino = esVendedor ? "comprador" : "vendedor";

  useEffect(() => {
    const modalAbierto = modalEliminar || modalRol;
    document.body.style.overflow = modalAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalEliminar, modalRol]);

  // JS Guarda y aplica la preferencia de tema elegida en Ajustes.
  function seleccionarTema(nuevoTema) {
    setTema(guardarTema(nuevoTema));
  }

  function handleNombreActualizado(nombre) {
    const actual = getCurrentUser();
    if (actual) setCurrentUser({ ...actual, nombre_completo: nombre });
  }

  // JS Cambia el rol del usuario (RF20/RF21) y actualiza la sesion local
  async function confirmarCambioRol() {
    setEnviandoRol(true);
    try {
      const res = await cambiarRol(rolDestino);
      const nuevosRoles = res.data?.roles || [rolDestino];
      setRoles(nuevosRoles);

      const usuarioActual = getCurrentUser();
      if (usuarioActual) {
        setCurrentUser({ ...usuarioActual, roles: nuevosRoles });
      }

      setModalRol(false);
      showToastPersonal("Rol actualizado correctamente.");
    } catch (err) {
      // JS El backend responde 403/409 si es administrador o tiene compromisos
      setModalRol(false);
      showToastPersonal(err.message || "No se pudo cambiar el rol.", true);
    } finally {
      setEnviandoRol(false);
    }
  }

  // JS Elimina la cuenta del comprador (RF40) y cierra la sesion local
  async function confirmarEliminar() {
    setEliminandoCuenta(true);
    try {
      await eliminarCuenta();
      clearCurrentUser();
      navigate("/login");
    } catch (err) {
      setEliminandoCuenta(false);
      setModalEliminar(false);
      showToastPersonal(err.message || "No se pudo eliminar la cuenta.", true);
    }
  }

  return (
    <div className="flex h-screen bg-surface-container-lowest overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title="Ajustes" />

        <section className="flex-1 overflow-y-auto px-padding-lg sm:px-padding-xl py-padding-xl">
          <div className="max-w-4xl w-full mx-auto">
            <div className="mb-padding-lg">
              <h1 className="text-headline-md sm:text-[30px] font-extrabold tracking-tight text-on-surface">
                Ajustes
              </h1>
              <p className="text-brand-muted-text text-body-sm font-medium mt-1">
                Administra tu informacion personal y preferencias sobre la cuenta.
              </p>
            </div>

            <div className={sectionDivider} />

            <AjustesPersonales
              nombreInicial={currentUser?.nombre_completo || ""}
              email={currentUser?.email || ""}
              toast={toastPersonal}
              showToast={showToastPersonal}
              onNombreActualizado={handleNombreActualizado}
            />

            <AjustesTema tema={tema} onSeleccionar={seleccionarTema} />

            <AjustesDireccion />

            <AjustesRol
              esVendedor={esVendedor}
              enviandoRol={enviandoRol}
              onAbrirModal={() => setModalRol(true)}
            />

            <AjustesCuenta
              eliminandoCuenta={eliminandoCuenta}
              onAbrirModal={() => setModalEliminar(true)}
            />
          </div>
        </section>
      </main>

      <Modal
        abierto={modalRol}
        onClose={() => setModalRol(false)}
        tituloId="ajuste-rol-titulo"
        panelClassName="max-w-lg rounded-hero border border-brand-orange bg-auth-card-bg p-6 sm:p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <h4 id="ajuste-rol-titulo" className="text-headline-sm sm:text-headline-md font-bold text-on-surface mb-4">
          {rolDestino === "vendedor" ? "¿Cambiar a vendedor?" : "¿Cambiar a comprador?"}
        </h4>
        <p className="text-brand-muted-text text-body-sm sm:text-body-md leading-6 mb-8">
          {rolDestino === "vendedor"
            ? "Podras publicar productos y gestionar tu tienda en CommerCity."
            : "Dejaras de tener los permisos de vendedor para publicar y gestionar productos."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => setModalRol(false)}
            className="flex-1 rounded-card border border-figma-divider bg-transparent px-4 py-3 sm:px-6 sm:py-4 text-body-sm sm:text-body-md font-bold text-brand-muted-text transition hover:bg-input-bg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmarCambioRol}
            disabled={enviandoRol}
            className="flex-1 rounded-card bg-gradient-to-r from-brand-orange to-tertiary-container px-4 py-3 sm:px-6 sm:py-4 text-body-sm sm:text-body-md font-bold text-brand-dark-text transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviandoRol ? "Cambiando..." : "Si, cambiar rol"}
          </button>
        </div>
      </Modal>

      <Modal
        abierto={modalEliminar}
        onClose={() => setModalEliminar(false)}
        tituloId="ajuste-eliminar-titulo"
        panelClassName="max-w-lg sm:max-w-2xl md:max-w-4xl rounded-hero border border-report-red-bg bg-auth-card-bg p-6 sm:p-10 md:p-14 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full bg-report-red-bg text-report-red-text">
            <span className="text-3xl sm:text-4xl font-bold">!</span>
          </div>
          <div className="flex-1">
            <h4 id="ajuste-eliminar-titulo" className="text-headline-sm sm:text-headline-md md:text-headline-lg font-bold text-report-red-text mb-2 sm:mb-4">
              ¿Eliminar cuenta?
            </h4>
            <p className="text-brand-muted-text text-body-sm sm:text-body-md md:text-body-lg leading-6">
              Esta accion es permanente e irreversible. Todos tus datos, compras, mensajes y configuraciones seran borrados de forma definitiva. No podras recuperar tu cuenta.
            </p>
          </div>
        </div>

        <div className="rounded-card border border-report-red-bg bg-report-red-bg/30 px-4 py-4 sm:px-8 sm:py-6 mb-6 sm:mb-10">
          <p className="text-body-sm sm:text-body-md font-medium text-report-red-text">
            ⚠️ Antes de continuar, confirma que entiendes que no podremos recuperar tu cuenta despues de eliminarla. Esta accion es definitiva.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => setModalEliminar(false)}
            className="flex-1 rounded-card border border-figma-divider bg-transparent px-4 py-3 sm:px-6 sm:py-4 text-body-sm sm:text-body-md font-bold text-brand-muted-text transition hover:bg-input-bg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmarEliminar}
            disabled={eliminandoCuenta}
            className="flex-1 rounded-card bg-report-red-text px-4 py-3 sm:px-6 sm:py-4 text-body-sm sm:text-body-md font-bold text-white transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {eliminandoCuenta ? "Eliminando..." : "Si, eliminar cuenta"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
